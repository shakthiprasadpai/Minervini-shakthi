import type { Response } from 'express';
import { FivePaisaMarketFeed, type FivePaisaInstrument } from '../engine/marketData/providers/fivePaisaWebSocket';
import type { MarketTick } from '../engine/marketData/realtimeTypes';
import { fivePaisaScripMaster } from './scripMasterScheduler';
import { fivePaisaAuth } from './fivePaisaAuthService';
import { createBigulProvider, createXtsProvider, runMinerviniEngine, buildTradeSetup } from '../engine';
import type { PricePoint } from '../types';

function configuredSymbols(): Array<{ exchange: 'NSE' | 'BSE'; symbol: string }> {
  return (process.env.SCREENER_SYMBOLS || '').split(',').map(x => x.trim()).filter(Boolean).map(spec => {
    const parts = spec.split(':');
    const exchange = (/^(NSE|BSE)$/i.test(parts[0]) ? parts[0] : 'NSE').toUpperCase() as 'NSE' | 'BSE';
    return { exchange, symbol: (/^(NSE|BSE)$/i.test(parts[0]) ? parts.slice(1).join(':') : spec).trim() };
  }).filter(x => x.symbol);
}

export class RealtimeMarketFeedService {
  private feed: FivePaisaMarketFeed | null = null;
  private clients = new Set<Response>();
  private latest = new Map<string, MarketTick>();
  private connected = false;
  private instrumentCount = 0;
  private histories = new Map<string, PricePoint[]>();
  private benchmark: PricePoint[] | undefined;

  async start() {
    const accessToken = fivePaisaAuth.getAccessToken() || process.env.FIVEPAISA_ACCESS_TOKEN;
    const clientCode = fivePaisaAuth.getClientCode() || process.env.FIVEPAISA_CLIENT_CODE;
    if (!accessToken || !clientCode) return false;
    let instruments: FivePaisaInstrument[] = [];
    const raw = process.env.FIVEPAISA_INSTRUMENTS_JSON;
    if (raw && raw !== '[]') {
      try { instruments = JSON.parse(raw); } catch { throw new Error('FIVEPAISA_INSTRUMENTS_JSON must be valid JSON'); }
    } else {
      const mapped = fivePaisaScripMaster.findMany(configuredSymbols());
      instruments = mapped.map(x => ({ exchange: x.exchange, exchangeType: x.exchangeType, scripCode: x.scripCode, symbol: x.symbol }));
    }
    if (!instruments.length) return false;
    this.instrumentCount = instruments.length;
    // Warm the same Minervini engine with the latest daily history so every tick can
    // re-evaluate the affected instrument without inventing a separate signal path.
    try {
      const provider = process.env.MARKET_DATA_PROVIDER === 'xts' ? createXtsProvider() : createBigulProvider();
      for (const instrument of instruments) {
        const history = await provider.getDailyCandles(instrument.symbol, instrument.exchange);
        if (history.length >= 200) this.histories.set(instrument.exchange + ':' + instrument.symbol, history);
      }
      const benchmarkSpec = (process.env.RS_BENCHMARK_SYMBOL || '').trim();
      if (benchmarkSpec) {
        const parts = benchmarkSpec.split(':');
        const exchange = (/^(NSE|BSE)$/i.test(parts[0]) ? parts[0] : 'NSE').toUpperCase() as 'NSE' | 'BSE';
        const symbol = (/^(NSE|BSE)$/i.test(parts[0]) ? parts.slice(1).join(':') : benchmarkSpec).trim();
        this.benchmark = await provider.getDailyCandles(symbol, exchange);
      }
    } catch (error) { console.error('Minervini realtime history warm-up failed:', error); }
    this.feed = new FivePaisaMarketFeed({ accessToken, clientCode, websocketUrl: process.env.FIVEPAISA_WEBSOCKET_URL, instruments, reconnectMs: Number(process.env.FIVEPAISA_RECONNECT_MS || 3000) }, tick => {
      this.connected = true;
      this.latest.set(tick.exchange + ':' + tick.symbol, tick);
      const key = tick.exchange + ':' + tick.symbol;
      const history = this.histories.get(key);
      let screenerResult: any = undefined;
      if (history?.length) {
        const next = history.map(x => ({ ...x }));
        const last = next[next.length - 1];
        last.close = tick.price; last.high = Math.max(last.high, tick.price); last.low = Math.min(last.low, tick.price); last.volume = Math.max(last.volume, tick.volume);
        const analysis = runMinerviniEngine({ ticker: tick.symbol, currentPrice: tick.price, priceHistory: next }, this.benchmark);
        screenerResult = buildTradeSetup(tick.symbol, tick.symbol, tick.exchange, next, analysis);
        this.histories.set(key, next);
      }
      const payload = 'data: ' + JSON.stringify({ ...tick, screenerResult }) + '\\n\\n';
      for (const response of this.clients) response.write(payload);
    });
    this.feed.connect();
    return true;
  }

  stop() {
    this.feed?.disconnect(); this.feed = null; this.connected = false;
    for (const response of this.clients) response.end(); this.clients.clear();
  }

  status() {
    return { configured: Boolean(fivePaisaAuth.getAccessToken() || (process.env.FIVEPAISA_ACCESS_TOKEN && process.env.FIVEPAISA_CLIENT_CODE)), auth: fivePaisaAuth.status(), connected: this.connected, instruments: this.instrumentCount, liveTicks: this.latest.size, scripMaster: fivePaisaScripMaster.status() };
  }

  addClient(response: Response) {
    response.setHeader('Content-Type', 'text/event-stream'); response.setHeader('Cache-Control', 'no-cache'); response.setHeader('Connection', 'keep-alive'); response.flushHeaders?.();
    for (const tick of this.latest.values()) response.write('data: ' + JSON.stringify(tick) + '\\n\\n');
    this.clients.add(response); response.on('close', () => this.clients.delete(response));
  }
}