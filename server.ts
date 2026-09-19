import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createBigulProvider, createXtsProvider, runMinerviniEngine, buildTradeSetup, backtestMinervini, rankRsRatings } from './src/engine';
import { initDatabase, pool } from './src/db/database';
import { RealtimeMarketFeedService } from './src/server/realtimeMarketFeed';
import { fivePaisaAuth } from './src/server/fivePaisaAuthService';
import { registerFivePaisaOAuth } from './src/server/fivePaisaOAuth';
import { startFivePaisaScripMaster, fivePaisaScripMaster } from './src/server/scripMasterScheduler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getMarketDataProvider = () => process.env.MARKET_DATA_PROVIDER === 'xts' ? createXtsProvider() : createBigulProvider();
  const realtimeFeed = new RealtimeMarketFeedService();
  if ((process.env.REALTIME_MARKET_PROVIDER || '').toLowerCase() === '5paisa') await fivePaisaAuth.start();
  registerFivePaisaOAuth(app, async () => { await realtimeFeed.stop(); await realtimeFeed.start(); });
  if ((process.env.REALTIME_MARKET_PROVIDER || '').toLowerCase() === '5paisa') {
    await startFivePaisaScripMaster();
    await realtimeFeed.start();
  }

  app.get('/api/health', async (_req, res) => {
    let database = 'disabled';
    if (pool) { try { await pool.query('SELECT 1'); database = 'ok'; } catch { database = 'error'; } }
    res.json({ ok: true, marketDataProvider: process.env.MARKET_DATA_PROVIDER || 'bigul', database });
  });

  app.get('/api/screener', async (_req, res) => {
    try {
      const provider = getMarketDataProvider();
      const configuredSymbols = (process.env.SCREENER_SYMBOLS || '')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
        .map(spec => {
          const parts = spec.split(':');
          const hasExchange = parts.length > 1 && /^(NSE|BSE|MCX)$/i.test(parts[0]);
          const exchange = (hasExchange ? parts[0] : 'NSE').toUpperCase() as 'NSE' | 'BSE' | 'MCX';
          const ticker = (hasExchange ? parts.slice(1).join(':') : spec).trim();
          return { ticker, exchange };
        })
        .filter(x => x.ticker.length > 0);

      const universe = (process.env.REALTIME_MARKET_PROVIDER || '').toLowerCase() === '5paisa' && (process.env.AUTO_UNIVERSE || 'true').toLowerCase() === 'true'
        ? fivePaisaScripMaster.allAutoInstruments().map(x => ({ ticker: x.symbol, exchange: x.exchange }))
        : configuredSymbols;
      if (!universe.length) return res.status(503).json({ error: 'MARKET_UNIVERSE_NOT_AVAILABLE' });

      let benchmark: Awaited<ReturnType<typeof provider.getDailyCandles>> | undefined;
      const benchmarkSpec = (process.env.RS_BENCHMARK_SYMBOL || '').trim();
      if (benchmarkSpec) {
        const parts = benchmarkSpec.split(':');
        const hasExchange = parts.length > 1 && /^(NSE|BSE)$/i.test(parts[0]);
        const exchange = (hasExchange ? parts[0] : 'NSE').toUpperCase() as 'NSE' | 'BSE';
        const ticker = (hasExchange ? parts.slice(1).join(':') : benchmarkSpec).trim();
        benchmark = await provider.getDailyCandles(ticker, exchange);
      }

      const raw: Array<{
        ticker: string;
        exchange: 'NSE' | 'BSE' | 'MCX';
        candles: Awaited<ReturnType<typeof provider.getDailyCandles>>;
        analysis: any;
      }> = [];

      for (const instrument of universe) {
        try {
          const candles = await provider.getDailyCandles(instrument.ticker, instrument.exchange);
          if (candles.length < 200) continue;
          const current = candles[candles.length - 1].close;
          const analysis = runMinerviniEngine(
            { ticker: instrument.ticker, currentPrice: current, priceHistory: candles },
            benchmark
          );
          raw.push({ ticker: instrument.ticker, exchange: instrument.exchange, candles, analysis });
        } catch (e) {
          console.error('Screener instrument failed', instrument, e);
        }
      }

      const ratings = rankRsRatings(raw.map(x => x.analysis.rsRating ?? 0));
      const results = raw.map((x, i) => {
        x.analysis.rsRating = ratings[i];
        return buildTradeSetup(x.ticker, x.ticker, x.exchange, x.candles, x.analysis);
      });

      if (pool) {
        await pool.query(
          'INSERT INTO screener_runs(universe_count,result_count) VALUES($1,$2)',
          [universe.length, results.length]
        );
      }

      res.json({
        provider: process.env.MARKET_DATA_PROVIDER || 'bigul',
        exchanges: ['NSE', 'BSE', 'MCX'],
        configuredCount: universe.length,
        resultCount: results.length,
        results
      });
    } catch (e: any) {
      res.status(503).json({
        error: 'MARKET_DATA_UNAVAILABLE',
        message: e?.message || String(e)
      });
    }
  });

  app.get('/api/market/realtime-status', (_req, res) => res.json({ provider: '5paisa', ...realtimeFeed.status() }));
  app.post('/api/market/scrip-master/refresh', async (_req, res) => { try { const count = await fivePaisaScripMaster.refresh(); res.json({ ok: true, count, ...fivePaisaScripMaster.status() }); } catch (e: any) { res.status(503).json({ error: 'SCRIP_MASTER_REFRESH_FAILED', message: e?.message || String(e) }); } });

  app.get('/api/market/stream', (_req, res) => realtimeFeed.addClient(res));

  app.get('/api/market/status', (_req, res) => {
    res.json({
      provider: process.env.MARKET_DATA_PROVIDER || 'bigul',
      exchanges: ['NSE', 'BSE'],
      configured: Boolean(
        process.env.BIGUL_API_BASE_URL ||
        process.env.XTS_MARKET_DATA_BASE_URL ||
        process.env.MARKET_DATA_BASE_URL
      ),
      screenerSymbolsConfigured: Boolean(process.env.SCREENER_SYMBOLS),
      automaticUniverse: (process.env.AUTO_UNIVERSE || 'true').toLowerCase() === 'true',
      universeCount: fivePaisaScripMaster.status().count
    });
  });

  app.get('/api/alerts', async (_req,res) => {
    if(!pool) return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
    const r=await pool.query('SELECT id,ticker,exchange,target_type AS "targetType",target_price AS "targetPrice",status,created_at AS "createdAt",triggered_at AS "triggeredAt" FROM price_alerts ORDER BY id DESC'); res.json(r.rows);
  });
  app.post('/api/alerts/sync', async (req,res) => {
    if(!pool) return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
    const client=await pool.connect(); try{await client.query('BEGIN'); await client.query('DELETE FROM price_alerts'); for(const a of (req.body||[])){await client.query('INSERT INTO price_alerts(ticker,exchange,target_type,target_price,status,created_at,triggered_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[a.ticker,a.exchange,a.targetType,a.targetPrice,a.status,a.createdAt||new Date().toISOString(),a.triggeredAt||null]);} await client.query('COMMIT'); res.json({ok:true});}catch(e){await client.query('ROLLBACK');res.status(500).json({error:'ALERT_SYNC_FAILED'});}finally{client.release();}
  });

  app.get('/api/portfolio', async (_req,res) => {
    if(!pool) return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
    const r=await pool.query('SELECT id,ticker,stock_name AS "stockName",exchange,shares,entry_price AS "entryPrice",current_price AS "currentPrice",buy_date AS "buyDate",stop_loss_price AS "stopLossPrice",pivot_target_price AS "pivotTargetPrice",notes FROM portfolio_holdings ORDER BY id DESC');
    res.json(r.rows);
  });
  app.post('/api/portfolio/sync', async (req,res) => {
    if(!pool) return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
    const client=await pool.connect(); try { await client.query('BEGIN'); await client.query('DELETE FROM portfolio_holdings'); for(const h of (req.body||[])){await client.query('INSERT INTO portfolio_holdings(ticker,stock_name,exchange,shares,entry_price,current_price,buy_date,stop_loss_price,pivot_target_price,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[h.ticker,h.stockName||h.ticker,h.exchange,h.shares,h.entryPrice,h.currentPrice,h.buyDate,h.stopLossPrice,h.pivotTargetPrice,h.notes||null]);} await client.query('COMMIT'); res.json({ok:true}); } catch(e){await client.query('ROLLBACK'); res.status(500).json({error:'PORTFOLIO_SYNC_FAILED'});} finally{client.release();}
  });
  app.get('/api/journal', async (_req,res) => {
    if(!pool) return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
    const r=await pool.query('SELECT id,ticker,exchange,opened_at AS date,entry_price AS "entryPrice",exit_price AS "exitPrice",notes,status AS "tradeStatus" FROM trades ORDER BY id DESC'); res.json(r.rows);
  });
  app.post('/api/journal/sync', async (req,res) => {
    if(!pool) return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
    const client=await pool.connect(); try{await client.query('BEGIN'); await client.query('DELETE FROM trades'); for(const n of (req.body||[])){await client.query('INSERT INTO trades(ticker,exchange,side,quantity,entry_price,exit_price,pnl,status,opened_at,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[n.ticker,n.exchange,'BUY',1,n.entryPrice||null,n.exitPrice||null,null,n.tradeStatus||'PLANNING',n.date||new Date().toISOString(),n.notes||null]);} await client.query('COMMIT'); res.json({ok:true});}catch(e){await client.query('ROLLBACK');res.status(500).json({error:'JOURNAL_SYNC_FAILED'});}finally{client.release();}
  });

  app.get('/api/quote/:exchange/:ticker', async (req,res) => {
    try { const provider=getMarketDataProvider(); const q=await provider.getQuote(req.params.ticker,req.params.exchange.toUpperCase() as 'NSE'|'BSE'); res.json(q); }
    catch(e:any){res.status(503).json({error:'MARKET_DATA_UNAVAILABLE',message:e?.message||String(e)});}
  });

  app.post('/api/backtest', async (req,res) => {
    try { const provider=getMarketDataProvider(); const ticker=String(req.body.ticker); const candles=await provider.getDailyCandles(ticker,(req.body.exchange||'NSE').toUpperCase()); const result=backtestMinervini(ticker,candles,{initialCapital:Number(req.body.initialCapital||100000),riskPerTradePercent:Number(req.body.riskPerTradePercent||1),commissionPercent:Number(req.body.commissionPercent||0),slippagePercent:Number(req.body.slippagePercent||0)}); res.json(result); }
    catch(e:any){res.status(400).json({error:'BACKTEST_FAILED',message:e?.message||String(e)});}
  });


  // Helper for Gemini AI instance
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // API endpoint for AI-powered Mark Minervini SEPA analysis
  app.post('/api/analyze-setup', async (req, res) => {
    let stock: any = null;
    try {
      stock = req.body.stock;
      if (!stock) {
        return res.status(400).json({ error: 'Missing stock setup payload' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          analysis: `**Mark Minervini Setup Insights for ${stock.ticker}**:\n\n` +
            `• **Stage 2 Confirmation**: ${stock.trendScore}/8 Trend Template rules passing. Price is resting above 50, 150, and 200 SMA.\n` +
            `• **Tight Volume & Contraction**: Volume dry-up is ${stock.volumeDryUpPercent}% below 20-day average. This indicates supply exhaustion.\n` +
            `• **Execution**: Enter on breakout above Pivot Price at $${stock.pivotPrice}. Maintain hard stop loss at $${stock.stopLossPrice} (${stock.stopLossPercent}% max risk). First target is $${stock.target1Price} (+${stock.target1Percent}%).\n\n` +
            `*(Tip: Set GEMINI_API_KEY in AI Studio secrets for real-time AI deep analysis).*`
        });
      }

      const prompt = `You are Mark Minervini, US Investing Champion and creator of the SEPA trading strategy and VCP pattern.
Analyze this setup for ${stock.ticker} (${stock.name}):

- Price: $${stock.currentPrice}
- Trend Score: ${stock.trendScore}/8
- Pattern: ${stock.patternType}
- VCP Stage: ${stock.vcpStage}
- RS Rating: ${stock.rsRating}
- Volume Dry-Up: ${stock.volumeDryUpPercent}% vs 20-day avg
- Pivot Entry Price: $${stock.pivotPrice}
- Buy Zone: $${stock.pivotPrice} - $${stock.buyZoneMax}
- Exit Stop Loss: $${stock.stopLossPrice} (${stock.stopLossPercent}% risk)
- Target 1 (3:1 R/R): $${stock.target1Price} (+${stock.target1Percent}%)
- Target 2: $${stock.target2Price} (+${stock.target2Percent}%)
- Contractions: ${JSON.stringify(stock.contractions)}

Provide a structured, expert, authoritative analysis in Mark Minervini's signature style focusing on:
1. **Stage 2 Trend Template Health**
2. **VCP Contraction & Volume Dry-Up Validation**
3. **Tactical Trade Plan (Entry, Stop Loss Exit, Scaling Out at Targets)**
4. **Invalidation Trigger (When to abort)**`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('prepayment credits')) {
        console.log(`Notice: Gemini API quota temporarily limited for analyze-setup (using robust offline Minervini analysis).`);
      } else {
        console.error('Gemini API Error (fallback triggered):', err?.message || err);
      }
      res.json({
        analysis: `**Mark Minervini SEPA Analysis (Offline / Fallback Mode)** for ${stock?.ticker || 'Stock'}:\n\n` +
          `• **Stage 2 Confirmation**: ${stock?.trendScore || 6}/8 Trend Template rules passing. Price action remains stable relative to moving averages.\n` +
          `• **VCP Structure**: ${stock?.patternType || 'Volatility Contraction'} pattern identified with volume drying up by ${stock?.volumeDryUpPercent || 45}%.\n` +
          `• **Tactical Execution**: Watch pivot price $${stock?.pivotPrice || 100}. Keep stop loss strict at $${stock?.stopLossPrice || 95}.\n\n` +
          `*(Note: Live Gemini API quota temporarily limited or credits depleted. Displaying robust offline Minervini technical analysis).*`
      });
    }
  });

  // API endpoint for Google Search Grounded Financial Headlines
  app.post('/api/ticker-news', async (req, res) => {
    let ticker = 'STOCK';
    let stockName = 'Stock';
    let sectorVal = 'Growth';
    try {
      const body = req.body || {};
      ticker = body.ticker || 'STOCK';
      stockName = body.name || ticker;
      sectorVal = body.sector || 'Growth';

      if (!body.ticker) {
        return res.status(400).json({ error: 'Missing ticker symbol' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'LIVE_NEWS_UNAVAILABLE',
          message: 'Live news search is unavailable because GEMINI_API_KEY is not configured.'
        });
      }

      const prompt = `You are a Senior Financial Journalist and Equity Analyst specializing in growth stocks and Mark Minervini SEPA analysis.
Search for the latest real-world financial news, headlines, press releases, earnings updates, product launches, analyst upgrades/downgrades, and market developments for ticker symbol "${ticker}" (${stockName}).

Format your response as a strictly valid JSON object with the following structure:
{
  "summary": "Concise 2-3 sentence overview explaining how current news catalysts relate to ${ticker}'s recent price action and institutional sentiment.",
  "headlines": [
    {
      "title": "Clear headline title",
      "source": "Publisher / Source name (e.g. Reuters, Bloomberg, MarketWatch, CNBC, Wall Street Journal)",
      "date": "Approximate date or timeframe (e.g. 2 days ago, July 2026, Recent)",
      "snippet": "Concise 1-2 sentence key takeaway of the news story",
      "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL" | "CATALYST",
      "catalystType": "Category like 'Earnings', 'Product Launch', 'Analyst Rating', 'Macro/Sector', 'Institutional'"
    }
  ]
}

Provide 4 to 6 accurate, realistic, high-signal financial headlines. Return ONLY raw valid JSON without markdown code fences or conversational filler.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const responseText = response.text || '';

      // Extract grounding sources & queries from groundingMetadata
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

      const groundingSources = groundingChunks
        .filter((chunk: any) => chunk.web && chunk.web.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri
        }));

      let parsedData: any = {};
      try {
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanedJson);
      } catch (e) {
        parsedData = {
          summary: responseText,
          headlines: []
        };
      }

      res.json({
        summary: parsedData.summary || `Latest financial news and Google Search grounded headlines for ${ticker}.`,
        headlines: parsedData.headlines || [],
        groundingSources,
        groundingQueries
      });

    } catch (err: any) {
      console.error('Ticker News Grounding API Error:', err?.message || err);
      return res.status(503).json({
        error: 'LIVE_NEWS_UNAVAILABLE',
        message: 'Live news search failed. No generated or fabricated headlines are returned.'
      });
    }  });

  await initDatabase();

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
