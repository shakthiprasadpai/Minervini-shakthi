import type { MinerviniTradeSetup } from '../types';

/* ------------------------------------------------------------------ connection state */

export interface AuthSnapshot {
  configured?: boolean;
  hasToken?: boolean;
  clientCode?: string | null;
  expiresAt?: string | null;
}

export interface RealtimeSnapshot {
  configured?: boolean;
  connected?: boolean;
  auth?: AuthSnapshot;
  instruments?: number;
  liveTicks?: number;
  qualifyingCount?: number;
  filter?: { minPrice?: number; minLiquidity?: number };
}

export type AuthFetchState = 'loading' | 'ok' | 'error';

export type ConnectionState =
  | 'DEMO'
  | 'LOADING'
  | 'UNREACHABLE'
  | 'NOT_CONFIGURED'
  | 'SIGNED_OUT'
  | 'CONNECTING'
  | 'LIVE';

/**
 * Collapses what the server reports into the one state the dashboard shows.
 * `auth` (polled directly, fresher) wins over `realtime.auth` (polled every few seconds by the app shell).
 */
export function deriveConnection(input: {
  demoMode: boolean;
  realtime: RealtimeSnapshot | null | undefined;
  auth: AuthSnapshot | null | undefined;
  authFetch: AuthFetchState;
}): ConnectionState {
  const { demoMode, realtime, auth, authFetch } = input;
  if (demoMode) return 'DEMO';
  const merged = auth ?? realtime?.auth;
  if (!merged && !realtime) return authFetch === 'error' ? 'UNREACHABLE' : 'LOADING';
  if (realtime?.connected) return 'LIVE';
  if (merged?.hasToken || realtime?.configured) return 'CONNECTING';
  if (merged?.configured) return 'SIGNED_OUT';
  return 'NOT_CONFIGURED';
}

export function maskClientCode(code: string | null | undefined): string {
  if (!code) return '—';
  if (code.length <= 4) return '••••';
  return `${code.slice(0, 2)}••••${code.slice(-2)}`;
}

export function formatRemaining(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'expired';
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${Math.max(1, m)}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/* ------------------------------------------------------------------ Indian market clock */

export const MARKET_PRE_OPEN_MIN = 9 * 60;
export const MARKET_OPEN_MIN = 9 * 60 + 15;
export const MARKET_CLOSE_MIN = 15 * 60 + 30;

export type MarketSession = 'WEEKEND' | 'BEFORE_OPEN' | 'PRE_OPEN' | 'OPEN' | 'CLOSED';

export interface IstClock {
  /** Minutes since midnight, India time. */
  minutes: number;
  weekday: string;
  /** "11:46" */
  label: string;
  session: MarketSession;
}

/**
 * Current time in India plus the NSE/BSE cash-market session.
 * Weekends are detected; exchange holidays are not (no holiday calendar is available here).
 */
export function istClock(now: Date): IstClock {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  const weekday = get('weekday');
  const minutes = hour * 60 + minute;
  let session: MarketSession;
  if (weekday === 'Sat' || weekday === 'Sun') session = 'WEEKEND';
  else if (minutes < MARKET_PRE_OPEN_MIN) session = 'BEFORE_OPEN';
  else if (minutes < MARKET_OPEN_MIN) session = 'PRE_OPEN';
  else if (minutes < MARKET_CLOSE_MIN) session = 'OPEN';
  else session = 'CLOSED';
  return { minutes, weekday, label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, session };
}

/* ------------------------------------------------------------------ setups */

export type SetupStatus = 'BUY_ZONE' | 'NEAR_PIVOT' | 'BUILDING' | 'EXTENDED';

export function setupStatus(stock: Pick<MinerviniTradeSetup, 'currentPrice' | 'pivotPrice' | 'buyZoneMax'>): SetupStatus {
  const { currentPrice: price, pivotPrice: pivot, buyZoneMax } = stock;
  if (!(pivot > 0) || !(price > 0)) return 'BUILDING';
  const zoneTop = buyZoneMax > 0 ? buyZoneMax : pivot * 1.05;
  if (price > zoneTop) return 'EXTENDED';
  if (price >= pivot) return 'BUY_ZONE';
  if ((pivot - price) / pivot <= 0.02) return 'NEAR_PIVOT';
  return 'BUILDING';
}

const STATUS_ORDER: Record<SetupStatus, number> = { BUY_ZONE: 0, NEAR_PIVOT: 1, BUILDING: 2, EXTENDED: 3 };

export const TREND_PASS_SCORE = 7;
export const STRONG_RS = 70;

/** Trend-template passers, best-placed first (buy zone, then near pivot), ties broken by RS then trend score. */
export function rankSetups(stocks: MinerviniTradeSetup[], limit = 8): MinerviniTradeSetup[] {
  return stocks
    .filter(s => s.trendScore >= TREND_PASS_SCORE)
    .map(s => ({ s, status: setupStatus(s) }))
    .sort((a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (b.s.rsRating || 0) - (a.s.rsRating || 0) ||
      (b.s.trendScore || 0) - (a.s.trendScore || 0))
    .slice(0, limit)
    .map(x => x.s);
}

export interface FunnelStep { key: string; label: string; count: number }

/** Each step is a subset of the one before it, so the bars can only narrow. */
export function buildFunnel(stocks: MinerviniTradeSetup[]): FunnelStep[] {
  const trend = stocks.filter(s => s.trendScore >= TREND_PASS_SCORE);
  const strong = trend.filter(s => (s.rsRating || 0) >= STRONG_RS);
  const tight = strong.filter(s => s.isTightVolume);
  const ready = tight.filter(s => {
    const st = setupStatus(s);
    return st === 'BUY_ZONE' || st === 'NEAR_PIVOT';
  });
  return [
    { key: 'universe', label: 'Stocks scanned', count: stocks.length },
    { key: 'trend', label: 'Pass the trend template', count: trend.length },
    { key: 'rs', label: 'Relative strength 70+', count: strong.length },
    { key: 'volume', label: 'Volume drying up', count: tight.length },
    { key: 'ready', label: 'At or near the pivot', count: ready.length }
  ];
}

/** Last `n` closes for a sparkline; empty when there is not enough history. */
export function recentCloses(stock: Pick<MinerviniTradeSetup, 'priceHistory'>, n = 60): number[] {
  const history = stock.priceHistory ?? [];
  if (history.length < 2) return [];
  return history.slice(-n).map(p => p.close);
}
