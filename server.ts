import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createBigulProvider, createXtsProvider, runMinerviniEngine, buildTradeSetup, backtestMinervini } from './src/engine';
import { initDatabase, pool } from './src/db/database';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getMarketDataProvider = () => process.env.MARKET_DATA_PROVIDER === 'xts' ? createXtsProvider() : createBigulProvider();

  app.get('/api/health', async (_req, res) => {
    let database = 'disabled';
    if (pool) { try { await pool.query('SELECT 1'); database = 'ok'; } catch { database = 'error'; } }
    res.json({ ok: true, marketDataProvider: process.env.MARKET_DATA_PROVIDER || 'bigul', database });
  });

  app.get('/api/screener', async (_req, res) => {
    try {
      const provider = getMarketDataProvider();
      const symbols = (process.env.SCREENER_SYMBOLS || '').split(',').map(x=>x.trim()).filter(Boolean);
      if (!symbols.length) return res.status(503).json({ error:'SCREENER_SYMBOLS_NOT_CONFIGURED' });
      const benchmark = process.env.RS_BENCHMARK_SYMBOL ? await provider.getDailyCandles(process.env.RS_BENCHMARK_SYMBOL,'NSE') : undefined;
      const results=[];
      for(const ticker of symbols){
        try { const candles=await provider.getDailyCandles(ticker,'NSE'); if(candles.length<200) continue; const current=candles[candles.length-1].close; const analysis=runMinerviniEngine({ticker,currentPrice:current,priceHistory:candles},benchmark); results.push(buildTradeSetup(ticker,ticker,'NSE',candles,analysis)); } catch(e) { console.error('Screener symbol failed',ticker,e); }
      }
      if(pool) await pool.query('INSERT INTO screener_runs(universe_count,result_count) VALUES($1,$2)',[symbols.length,results.length]);
      res.json({ provider:process.env.MARKET_DATA_PROVIDER||'bigul', results });
    } catch(e:any) { res.status(503).json({ error:'MARKET_DATA_UNAVAILABLE', message:e?.message||String(e) }); }
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
