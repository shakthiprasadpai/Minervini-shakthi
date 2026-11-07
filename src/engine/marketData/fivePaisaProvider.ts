import { PricePoint } from '../../types';
import { MarketDataProvider } from './types';
import { derive } from './httpProvider';
import type { FivePaisaScrip } from './fivePaisaScripMaster';

const HISTORY_BASE = 'https://openapi.5paisa.com/V2/historical';
/** ~14 months: comfortably more than the 222 daily bars the Trend Template needs. */
const LOOKBACK_DAYS = 430;

/** Index scrip codes in the 5paisa scrip master (NSE cash segment). */
const INDEX_CODES: Record<string, number> = {
  'NIFTY 50': 999920000, 'NIFTY': 999920000,
  'NIFTY NEXT 50': 999920001, 'NIFTY JR': 999920001,
  'NIFTY 500': 999920003, 'NIFTY 100': 999920006, 'NIFTY 200': 999920021,
  'NIFTY BANK': 999920005, 'BANKNIFTY': 999920005,
  'NIFTY IT': 999920008
};

export interface FivePaisaProviderDeps {
  /** Today's 5paisa access token, or null when not signed in. */
  getToken: () => string | null;
  lookup: (exchange: 'NSE' | 'BSE' | 'MCX', symbol: string) => FivePaisaScrip | undefined;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  /** Minimum gap between requests, so a full-universe scan stays under 5paisa's rate limit. */
  minGapMs?: number;
  /** How long a fetched series is reused. */
  cacheMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** India date (YYYY-MM-DD) for a moment in time. */
export function istDate(d: Date): string {
  return new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
}
function shiftDays(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** 5paisa candle rows are [timestamp, open, high, low, close, volume]. Returns ascending, de-duplicated daily bars. */
export function parseCandles(rows: unknown): PricePoint[] {
  if (!Array.isArray(rows)) return [];
  const byDate = new Map<string, PricePoint>();
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 6) continue;
    const date = String(r[0]).slice(0, 10);
    const [open, high, low, close, volume] = [r[1], r[2], r[3], r[4], r[5]].map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || ![open, high, low, close].every(Number.isFinite) || close <= 0) continue;
    byDate.set(date, { date, open, high, low, close, volume: Number.isFinite(volume) ? volume : 0, avgVolume20: 0, sma50: 0, sma150: 0, sma200: 0 });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function createFivePaisaProvider(deps: FivePaisaProviderDeps): MarketDataProvider {
  const doFetch = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => new Date());
  const minGap = deps.minGapMs ?? 250;
  const cacheMs = deps.cacheMs ?? 6 * 3600_000;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  const cache = new Map<string, { at: number; rows: PricePoint[] }>();
  const inflight = new Map<string, Promise<PricePoint[]>>();
  let gate: Promise<unknown> = Promise.resolve();
  let lastCall = 0;

  /** Requests run one at a time with a minimum gap between them. */
  const throttled = <T>(job: () => Promise<T>): Promise<T> => {
    const run = gate.then(async () => {
      const wait = lastCall + minGap - now().getTime();
      if (wait > 0) await sleep(wait);
      lastCall = now().getTime();
      return job();
    });
    gate = run.catch(() => undefined);
    return run;
  };

  const resolveScrip = (ticker: string, exchange: 'NSE' | 'BSE' | 'MCX') => {
    const key = ticker.trim().toUpperCase();
    if (exchange === 'NSE' && INDEX_CODES[key]) return { exch: 'N', type: 'C', code: INDEX_CODES[key] };
    const s = deps.lookup(exchange, ticker);
    if (!s) throw new Error(`${ticker} (${exchange}) was not found in the 5paisa scrip master`);
    return { exch: s.exchange === 'NSE' ? 'N' : s.exchange === 'BSE' ? 'B' : 'M', type: s.exchangeType, code: s.scripCode };
  };

  async function fetchHistory(ticker: string, exchange: 'NSE' | 'BSE' | 'MCX'): Promise<PricePoint[]> {
    const token = deps.getToken();
    if (!token) throw new Error('Not signed in to 5paisa. Sign in on the Dashboard, then try again.');
    const { exch, type, code } = resolveScrip(ticker, exchange);
    const end = istDate(now());
    const from = shiftDays(end, -LOOKBACK_DAYS);
    const url = `${HISTORY_BASE}/${exch}/${type}/${code}/1d?from=${from}&end=${end}`;
    const res = await throttled(() => doFetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `bearer ${token}` } }));
    if (res.status === 401 || res.status === 403) throw new Error('5paisa sign-in has expired. Sign in again on the Dashboard.');
    if (!res.ok) throw new Error(`5paisa history request for ${ticker} failed with HTTP ${res.status}`);
    const body: any = await res.json().catch(() => null);
    const candles = body?.data?.candles;
    if (!Array.isArray(candles)) {
      const why = body?.head?.Status_description || body?.message || 'no candles in the response';
      throw new Error(`5paisa returned no history for ${ticker}: ${why}`);
    }
    return derive(parseCandles(candles));
  }

  async function getDailyCandles(ticker: string, exchange: 'NSE' | 'BSE' | 'MCX'): Promise<PricePoint[]> {
    const key = `${exchange}:${ticker.trim().toUpperCase()}`;
    const hit = cache.get(key);
    if (hit && now().getTime() - hit.at < cacheMs) return hit.rows;
    const pending = inflight.get(key);
    if (pending) return pending;
    const p = fetchHistory(ticker, exchange)
      .then(rows => { cache.set(key, { at: now().getTime(), rows }); return rows; })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  }

  return {
    getDailyCandles,
    async getQuote(ticker, exchange) {
      const rows = await getDailyCandles(ticker, exchange);
      const last = rows[rows.length - 1];
      if (!last) throw new Error(`No price history for ${ticker}`);
      const prev = rows[rows.length - 2];
      return { close: last.close, volume: last.volume, changePercent: prev ? ((last.close - prev.close) / prev.close) * 100 : undefined };
    }
  };
}
