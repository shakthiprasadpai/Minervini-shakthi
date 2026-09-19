import type { Response } from 'express';
import type { FivePaisaInstrument } from '../engine/marketData/providers/fivePaisaWebSocket';
import { FivePaisaWebSocketPool } from '../engine/marketData/providers/fivePaisaWebSocketPool';
import type { MarketTick } from '../engine/marketData/realtimeTypes';
import { fivePaisaScripMaster } from './scripMasterScheduler';
import { fivePaisaAuth } from './fivePaisaAuthService';
import { createBigulProvider, createXtsProvider, runMinerviniEngine, buildTradeSetup } from '../engine';
import type { PricePoint } from '../types';


function adaptivePriorityScore(tick: MarketTick, history: PricePoint[], analysis: any): number {
  const current = tick.price;
  const pivot = Number(analysis?.pivotPrice || 0);
  const entryZone = Number(analysis?.buyZoneMax || 0);
  const pivotDistance = pivot > 0 ? Math.abs(current - pivot) / pivot * 100 : 999;
  // 0-35: price approaching/inside the Minervini pivot buy zone.
  const pivotScore = pivot > 0
    ? current >= pivot && current <= (entryZone || pivot * 1.05)
      ? 35
      : pivotDistance <= 2 ? 32
      : pivotDistance <= 4 ? 24
      : pivotDistance <= 7 ? 12
      : 0
    : 0;

  // 0-25: VCP contraction quality.
  const vcpScore = Math.min(25, Math.max(0, Number(analysis?.vcpScore || 0) * 0.25));

  // 0-20: unusual volume / accumulation.
  const recent = history.slice(-5);
  const baseline = history.slice(-25, -5);
  const avgRecent = recent.length ? recent.reduce((s, x) => s + x.volume, 0) / recent.length : 0;
  const avgBaseline = baseline.length ? baseline.reduce((s, x) => s + x.volume, 0) / baseline.length : avgRecent;
  const volumeRatio = avgBaseline > 0 ? avgRecent / avgBaseline : 1;
  const volumeScore = Math.min(20, Math.max(0, (volumeRatio - 1) * 50));

  // 0-20: breakout proximity / actual breakout confirmation.
  const breakoutScore = analysis?.breakoutStatus === 'ABOVE_PIVOT'
    ? 20
    : analysis?.breakoutStatus === 'IN_BUY_ZONE'
      ? 17
      : pivotDistance <= 3 ? 14
      : pivotDistance <= 5 ? 8
      : 0;

  return Math.round(Math.min(100, pivotScore + vcpScore + volumeScore + breakoutScore));
}

function configuredSymbols(): Array<{ exchange: 'NSE' | 'BSE' | 'MCX'; symbol: string }> {
  return (process.env.SCREENER_SYMBOLS || '').split(',').map(x => x.trim()).filter(Boolean).map(spec => {
    const parts = spec.split(':');
    const exchange = (/^(NSE|BSE|MCX)$/i.test(parts[0]) ? parts[0] : 'NSE').toUpperCase() as 'NSE' | 'BSE' | 'MCX';
    return { exchange, symbol: (/^(NSE|BSE)$/i.test(parts[0]) ? parts.slice(1).join(':') : spec).trim() };
  }).filter(x => x.symbol);
}

export class RealtimeMarketFeedService {
  private feed: FivePaisaWebSocketPool | null = null;
  private clients = new Set<Response>();
  private latest = new Map<string, MarketTick>();
  private connected = false;
  private instrumentCount = 0;
  private histories = new Map<string, PricePoint[]>();
  private benchmark: PricePoint[] | undefined;
  private loadingHistories = new Set<string>();
  private universeCandidates = new Map<string, { exchange: 'NSE' | 'BSE' | 'MCX'; symbol: string }>();
  private qualifying = new Map<string, any>();
  private static readonly MIN_PRICE = Number(process.env.MIN_UNIVERSE_PRICE || 20);
  private static readonly MIN_LIQUIDITY = Number(process.env.MIN_UNIVERSE_MIN_LIQUIDITY || 1000000);

  async start() {
    const accessToken = fivePaisaAuth.getAccessToken() || process.env.FIVEPAISA_ACCESS_TOKEN;
    const clientCode = fivePaisaAuth.getClientCode() || process.env.FIVEPAISA_CLIENT_CODE;
    if (!accessToken || !clientCode) return false;
    let instruments: FivePaisaInstrument[] = [];
    const raw = process.env.FIVEPAISA_INSTRUMENTS_JSON;
    if (raw && raw !== '[]') {
      try { instruments = JSON.parse(raw); } catch { throw new Error('FIVEPAISA_INSTRUMENTS_JSON must be valid JSON'); }
    } else if ((process.env.AUTO_UNIVERSE || 'true').toLowerCase() === 'true') {
      const mapped = fivePaisaScripMaster.allAutoInstruments();
      instruments = mapped.map(x => ({ exchange: x.exchange, exchangeType: x.exchangeType, scripCode: x.scripCode, symbol: x.symbol }));
    } else {
      const mapped = fivePaisaScripMaster.findMany(configuredSymbols());
      instruments = mapped.map(x => ({ exchange: x.exchange, exchangeType: x.exchangeType, scripCode: x.scripCode, symbol: x.symbol }));
    }
    if (!instruments.length) return false;
    this.instrumentCount = instruments.length;
    this.universeCandidates = new Map(instruments.map(x => [x.exchange + ':' + x.symbol, { exchange: x.exchange, symbol: x.symbol }]));
    // Warm the same Minervini engine with the latest daily history so every tick can
    // re-evaluate the affected instrument without inventing a separate signal path.
    try {
      const provider = process.env.MARKET_DATA_PROVIDER === 'xts' ? createXtsProvider() : createBigulProvider();
      if ((process.env.MINERVINI_PRELOAD_HISTORY || 'false').toLowerCase() === 'true') {
        for (const instrument of instruments) {
          const history = await provider.getDailyCandles(instrument.symbol, instrument.exchange);
          if (history.length >= 200) this.histories.set(instrument.exchange + ':' + instrument.symbol, history);
        }
      }
      const benchmarkSpec = (process.env.RS_BENCHMARK_SYMBOL || '').trim();
      if (benchmarkSpec) {
        const parts = benchmarkSpec.split(':');
        const exchange = (/^(NSE|BSE)$/i.test(parts[0]) ? parts[0] : 'NSE').toUpperCase() as 'NSE' | 'BSE';
        const symbol = (/^(NSE|BSE)$/i.test(parts[0]) ? parts.slice(1).join(':') : benchmarkSpec).trim();
        this.benchmark = await provider.getDailyCandles(symbol, exchange);
      }
    } catch (error) { console.error('Minervini realtime history warm-up failed:', error); }
    const prioritySymbols = [
      ...configuredSymbols().map(x => `${x.exchange}:${x.symbol}`),
      ...(process.env.FIVEPAISA_PRIORITY_SYMBOLS || '').split(',').map(x => x.trim()).filter(Boolean)
    ];

    this.feed = new FivePaisaWebSocketPool({
      accessToken,
      clientCode,
      websocketUrl: process.env.FIVEPAISA_WEBSOCKET_URL,
      shardSize: Number(process.env.FIVEPAISA_WS_SHARD_SIZE || 180),
      maxConnections: Number(process.env.FIVEPAISA_WS_MAX_CONNECTIONS || 4),
      prioritySymbols,
      rotationIntervalMs: Number(process.env.FIVEPAISA_WS_ROTATION_MS || 60000),
      connectionStaggerMs: Number(process.env.FIVEPAISA_WS_CONNECTION_STAGGER_MS || 350),
      reconnectMs: Number(process.env.FIVEPAISA_RECONNECT_MS || 3000)
    }, tick => {
      this.connected = true;
      this.latest.set(tick.exchange + ':' + tick.symbol, tick);
      const key = tick.exchange + ':' + tick.symbol;
      let history = this.histories.get(key);
      let screenerResult: any = undefined;
      const liquidity = tick.price * Math.max(0, tick.volume);
      // Stage 1: cheap live universe filter. Expensive Minervini analysis is only run
      // after price/liquidity sanity checks and after daily history is available.
      const passesUniverseFilter = tick.price >= RealtimeMarketFeedService.MIN_PRICE && liquidity >= RealtimeMarketFeedService.MIN_LIQUIDITY;
      if (passesUniverseFilter && !history && !this.loadingHistories.has(key)) {
        this.loadingHistories.add(key);
        void (async () => {
          try {
            const provider = process.env.MARKET_DATA_PROVIDER === 'xts' ? createXtsProvider() : createBigulProvider();
            const loaded = await provider.getDailyCandles(tick.symbol, tick.exchange);
            if (loaded.length >= 200) this.histories.set(key, loaded);
          } catch (error) { console.error('Live Minervini history load failed:', key, error); }
          finally { this.loadingHistories.delete(key); }
        })();
      }
      if (passesUniverseFilter && history?.length) {
        const next = history.map(x => ({ ...x }));
        const last = next[next.length - 1];
        last.close = tick.price; last.high = Math.max(last.high, tick.price); last.low = Math.min(last.low, tick.price); last.volume = Math.max(last.volume, tick.volume);
        const analysis = runMinerviniEngine({ ticker: tick.symbol, currentPrice: tick.price, priceHistory: next }, this.benchmark);
        screenerResult = buildTradeSetup(tick.symbol, tick.symbol, tick.exchange, next, analysis);
        const adaptiveScore = adaptivePriorityScore(tick, next, analysis);
        this.feed?.updatePriorityScore(key, adaptiveScore);
        this.histories.set(key, next);
        if (screenerResult) this.qualifying.set(key, screenerResult);
      }
      const payload = 'data: ' + JSON.stringify({ ...tick, screenerResult, universeFilterPassed: passesUniverseFilter }) + '\\n\\n';
      for (const response of this.clients) response.write(payload);
    }, connected => { this.connected = connected; });
    await this.feed.start(instruments);
    return true;
  }

  stop() {
    this.feed?.stop(); this.feed = null; this.connected = false;
    for (const response of this.clients) response.end(); this.clients.clear();
  }

  status() {
    return { configured: Boolean(fivePaisaAuth.getAccessToken() || (process.env.FIVEPAISA_ACCESS_TOKEN && process.env.FIVEPAISA_CLIENT_CODE)), auth: fivePaisaAuth.status(), connected: this.connected, instruments: this.instrumentCount, liveTicks: this.latest.size, qualifyingCount: this.qualifying.size, universeMode: 'FULL_NSE_BSE_MCX -> LIQUIDITY_FILTER -> MINERVINI', filter: { minPrice: RealtimeMarketFeedService.MIN_PRICE, minLiquidity: RealtimeMarketFeedService.MIN_LIQUIDITY }, websocket: this.feed?.status() ?? { enabled: false }, scripMaster: fivePaisaScripMaster.status() };
  }

  addClient(response: Response) {
    response.setHeader('Content-Type', 'text/event-stream'); response.setHeader('Cache-Control', 'no-cache'); response.setHeader('Connection', 'keep-alive'); response.flushHeaders?.();
    for (const tick of this.latest.values()) response.write('data: ' + JSON.stringify(tick) + '\\n\\n');
    this.clients.add(response); response.on('close', () => this.clients.delete(response));
  }
}