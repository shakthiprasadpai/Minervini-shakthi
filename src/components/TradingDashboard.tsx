import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyRound, Loader2, LogIn, Radio, RefreshCw, ServerOff, ShieldCheck, TriangleAlert } from 'lucide-react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { BacktestSection } from './BacktestSection';
import { ObsidianPanel } from './ObsidianPanel';
import { DailyPicksCard } from './DailyPicksCard';
import {
  AuthFetchState,
  AuthSnapshot,
  ConnectionState,
  MARKET_CLOSE_MIN,
  MARKET_OPEN_MIN,
  SetupStatus,
  buildFunnel,
  deriveConnection,
  formatRemaining,
  istClock,
  maskClientCode,
  rankSetups,
  recentCloses,
  setupStatus
} from '../utils/dashboardMetrics';

interface TradingDashboardProps {
  apiBaseUrl: string;
  demoMode: boolean;
  stocks: MinerviniTradeSetup[];
  realtimeStatus: any;
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart: (stock: MinerviniTradeSetup) => void;
}

const panel = 'rounded-2xl border border-white/10 bg-[#11151c]';
const num = 'font-mono tabular-nums';

/* ------------------------------------------------------------------ trading-day track */

// The track covers 09:00 to 16:00 India time; the cash session (09:15 to 15:30) is the lit stretch.
const TRACK_START = 9 * 60;
const TRACK_END = 16 * 60;
const pct = (minutes: number) => `${((minutes - TRACK_START) / (TRACK_END - TRACK_START)) * 100}%`;

const SESSION_COPY: Record<string, string> = {
  WEEKEND: 'Markets are closed for the weekend',
  BEFORE_OPEN: 'Markets open at 9:15',
  PRE_OPEN: 'Pre-open session, trading starts at 9:15',
  OPEN: 'Markets are open',
  CLOSED: 'Markets closed for the day'
};

const TradingDayTrack: React.FC<{ now: Date; signInEndsInMs: number | null }> = ({ now, signInEndsInMs }) => {
  const clock = istClock(now);
  const inRange = clock.minutes >= TRACK_START && clock.minutes <= TRACK_END && clock.session !== 'WEEKEND';
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-xs text-slate-400">
        <span className="text-slate-200">{SESSION_COPY[clock.session]}</span>
        <span className={`${num} text-slate-500`}>India time {clock.label}</span>
      </div>

      <div className="relative mt-5 h-12" role="img" aria-label={`${SESSION_COPY[clock.session]}. India time ${clock.label}.`}>
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.07]" />
        <div
          className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${clock.session === 'OPEN' ? 'bg-emerald-400/80' : 'bg-slate-600/30'}`}
          style={{ left: pct(MARKET_OPEN_MIN), width: `calc(${pct(MARKET_CLOSE_MIN)} - ${pct(MARKET_OPEN_MIN)})` }}
        />
        {inRange && (
          <div className="absolute top-0 bottom-0 w-px bg-amber-400" style={{ left: pct(clock.minutes) }}>
            <span className={`absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-400 ${clock.session === 'OPEN' ? 'motion-safe:animate-pulse' : ''}`} />
          </div>
        )}
      </div>

      <div className={`relative h-4 text-[11px] text-slate-500 ${num}`}>
        <span className="absolute -translate-x-1/2" style={{ left: pct(MARKET_OPEN_MIN) }}>9:15</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(12 * 60) }}>12:00</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(MARKET_CLOSE_MIN) }}>15:30</span>
      </div>

      {signInEndsInMs !== null && (
        <p className="mt-4 text-xs text-slate-400">
          Your 5paisa sign-in lasts{' '}
          <span className={`${num} text-slate-100`}>{formatRemaining(signInEndsInMs)}</span>
          {signInEndsInMs > 0 ? ' more. It ends at midnight, so sign in again each trading day.' : '. Sign in again to keep prices flowing.'}
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ small pieces */

const Sparkline: React.FC<{ stock: MinerviniTradeSetup }> = ({ stock }) => {
  const closes = recentCloses(stock);
  if (closes.length < 2) return <span className="text-slate-600">—</span>;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const w = 84, h = 26;
  const pts = closes
    .map((c, i) => `${((i / (closes.length - 1)) * w).toFixed(1)},${(h - 2 - ((c - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(' ');
  const up = closes[closes.length - 1] >= closes[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Last ${closes.length} days, ${up ? 'rising' : 'falling'}`}>
      <polyline points={pts} fill="none" stroke={up ? '#34d399' : '#fb7185'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const STATUS_STYLE: Record<SetupStatus, { label: string; cls: string }> = {
  BUY_ZONE: { label: 'In buy zone', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' },
  NEAR_PIVOT: { label: 'Near pivot', cls: 'bg-amber-400/15 text-amber-300 ring-amber-400/30' },
  BUILDING: { label: 'Building', cls: 'bg-white/5 text-slate-300 ring-white/15' },
  EXTENDED: { label: 'Extended', cls: 'bg-rose-500/15 text-rose-300 ring-rose-400/30' }
};

const StatusChip: React.FC<{ status: SetupStatus }> = ({ status }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLE[status].cls}`}>
    {STATUS_STYLE[status].label}
  </span>
);

const FeedRow: React.FC<{ label: string; value: React.ReactNode; tone?: 'good' | 'bad' }> = ({ label, value, tone }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="text-sm text-slate-400">{label}</dt>
    <dd className={`${num} text-sm ${tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-rose-300' : 'text-slate-100'}`}>{value}</dd>
  </div>
);

/* ------------------------------------------------------------------ connection copy */

interface ConnectionCopy { title: string; body: React.ReactNode; tone: 'good' | 'warn' | 'bad' | 'idle' }

function connectionCopy(state: ConnectionState, clientCode: string | null | undefined, instruments: number): ConnectionCopy {
  switch (state) {
    case 'LIVE':
      return {
        tone: 'good',
        title: 'Connected to 5paisa',
        body: <>Client <span className={num}>{maskClientCode(clientCode)}</span>. Live prices are streaming for {instruments.toLocaleString()} stocks.</>
      };
    case 'CONNECTING':
      return { tone: 'warn', title: 'Signed in, starting the price feed', body: 'This usually takes a few seconds. If it stays here, check the server log.' };
    case 'SIGNED_OUT':
      return {
        tone: 'idle',
        title: 'Sign in to start live prices',
        body: 'You sign in on 5paisa’s own page. This app never sees your password.'
      };
    case 'NOT_CONFIGURED':
      return {
        tone: 'bad',
        title: 'The server is missing its 5paisa keys',
        body: <>Add <code className="text-slate-200">FIVEPAISA_APP_KEY</code>, <code className="text-slate-200">FIVEPAISA_ENCRYPTION_KEY</code> and <code className="text-slate-200">FIVEPAISA_USER_ID</code> to the server’s <code className="text-slate-200">.env</code> file, then restart it.</>
      };
    case 'UNREACHABLE':
      return { tone: 'bad', title: 'Can’t reach the server', body: <>Start it with <code className="text-slate-200">npm run dev</code>. This page reconnects by itself.</> };
    case 'DEMO':
      return { tone: 'idle', title: 'Sample data', body: 'Live sign-in is switched off while VITE_DEMO_MODE is true.' };
    default:
      return { tone: 'idle', title: 'Checking your connection', body: 'One moment.' };
  }
}

const TONE_DOT: Record<ConnectionCopy['tone'], string> = {
  good: 'bg-emerald-400',
  warn: 'bg-amber-400',
  bad: 'bg-rose-400',
  idle: 'bg-slate-500'
};

/* ------------------------------------------------------------------ dashboard */

export const TradingDashboard: React.FC<TradingDashboardProps> = ({
  apiBaseUrl, demoMode, stocks, realtimeStatus, onSelectStock, onViewChart
}) => {
  const [auth, setAuth] = useState<AuthSnapshot | null>(null);
  const [authFetch, setAuthFetch] = useState<AuthFetchState>('loading');
  const [waiting, setWaiting] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const popupRef = useRef<Window | null>(null);
  const waitStartedRef = useRef(0);

  const loadAuth = useCallback(async () => {
    if (demoMode) return null;
    try {
      const r = await fetch(`${apiBaseUrl}/api/5paisa/auth/status`);
      if (!r.ok) throw new Error(String(r.status));
      const next: AuthSnapshot = await r.json();
      setAuth(next);
      setAuthFetch('ok');
      return next;
    } catch {
      setAuthFetch('error');
      return null;
    }
  }, [apiBaseUrl, demoMode]);

  // Clock tick, and a slow status poll normally; fast while a sign-in window is open.
  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (demoMode) return;
    void loadAuth();
    const id = window.setInterval(async () => {
      const next = await loadAuth();
      if (!waiting) return;
      const finished = Boolean(next?.hasToken);
      const popupClosed = popupRef.current ? popupRef.current.closed : true;
      const timedOut = Date.now() - waitStartedRef.current > 3 * 60_000;
      if (finished || popupClosed || timedOut) { setWaiting(false); popupRef.current = null; }
    }, waiting ? 2000 : 15000);
    return () => window.clearInterval(id);
  }, [demoMode, loadAuth, waiting]);

  // The sign-in popup tells us when it is done.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'fivepaisa-auth') return;
      setWaiting(false);
      void loadAuth();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [loadAuth]);

  const startSignIn = () => {
    const url = `${apiBaseUrl}/api/5paisa/auth/login`;
    const popup = window.open(url, 'fivepaisa-login', 'popup=yes,width=520,height=760');
    if (!popup) { window.location.assign(url); return; }
    popupRef.current = popup;
    waitStartedRef.current = Date.now();
    setWaiting(true);
  };

  const state = deriveConnection({ demoMode, realtime: realtimeStatus, auth, authFetch });
  const merged: AuthSnapshot | undefined = auth ?? realtimeStatus?.auth;
  const instruments = Number(realtimeStatus?.instruments || 0);
  const copy = connectionCopy(state, merged?.clientCode, instruments);
  const expiresAt = merged?.hasToken && merged.expiresAt ? new Date(merged.expiresAt).getTime() : null;
  const signInEndsInMs = expiresAt !== null ? expiresAt - now.getTime() : null;

  const canSignIn = state === 'SIGNED_OUT' || state === 'CONNECTING' || state === 'LIVE';
  const primarySignIn = state === 'SIGNED_OUT';

  const funnel = useMemo(() => buildFunnel(stocks), [stocks]);
  const ranked = useMemo(() => rankSetups(stocks, 8), [stocks]);
  const widest = Math.max(1, funnel[0]?.count ?? 0);

  const live = state === 'LIVE';

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* ---- connection + trading day ---- */}
      <section className={`${panel} p-6 lg:col-span-2`} aria-labelledby="connection-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1.5 flex h-2.5 w-2.5 shrink-0">
              <span className={`h-2.5 w-2.5 rounded-full ${TONE_DOT[copy.tone]} ${live ? 'motion-safe:animate-pulse' : ''}`} />
            </span>
            <div className="min-w-0">
              <h2 id="connection-title" className="text-lg font-semibold text-white font-sans not-italic">{copy.title}</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">{copy.body}</p>
            </div>
          </div>

          {canSignIn && (
            <button
              type="button"
              onClick={startSignIn}
              disabled={waiting}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151c] disabled:cursor-wait disabled:opacity-70 ${
                primarySignIn
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {waiting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : primarySignIn ? <LogIn className="h-4 w-4" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              {waiting ? 'Waiting for 5paisa…' : primarySignIn ? 'Sign in with 5paisa' : 'Sign in again'}
            </button>
          )}
          {state === 'NOT_CONFIGURED' && <KeyRound className="h-5 w-5 text-rose-300" aria-hidden />}
          {state === 'UNREACHABLE' && <ServerOff className="h-5 w-5 text-rose-300" aria-hidden />}
        </div>

        <div className="mt-7 border-t border-white/[0.06] pt-6">
          <TradingDayTrack now={now} signInEndsInMs={signInEndsInMs} />
        </div>

        {primarySignIn && (
          <p className="mt-5 flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            A window opens on 5paisa. Sign in there with your own login and it closes when you’re done.
          </p>
        )}
        {waiting && (
          <p className="mt-5 flex items-start gap-2 text-xs text-amber-300" role="status">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Finish signing in on the 5paisa window. If you don’t see it, check that your browser allowed the pop-up.
          </p>
        )}
      </section>

      {/* ---- feed health ---- */}
      <section className={`${panel} p-6`} aria-labelledby="feed-title">
        <h2 id="feed-title" className="flex items-center gap-2 text-base font-semibold text-white font-sans not-italic">
          <Radio className="h-4 w-4 text-slate-400" aria-hidden /> Price feed
        </h2>
        <dl className="mt-3 divide-y divide-white/[0.06]">
          <FeedRow label="Status" value={live ? 'Live' : state === 'CONNECTING' ? 'Starting' : 'Offline'} tone={live ? 'good' : state === 'CONNECTING' ? undefined : 'bad'} />
          <FeedRow label="Stocks tracked" value={instruments.toLocaleString()} />
          <FeedRow label="Price updates received" value={Number(realtimeStatus?.liveTicks || 0).toLocaleString()} />
          <FeedRow label="Setups flagged live" value={Number(realtimeStatus?.qualifyingCount || 0).toLocaleString()} />
          {realtimeStatus?.filter?.minPrice != null && (
            <FeedRow label="Skips stocks under" value={formatCurrency(Number(realtimeStatus.filter.minPrice), '₹')} />
          )}
        </dl>
      </section>

      {/* ---- funnel ---- */}
      <section className={`${panel} p-6`} aria-labelledby="funnel-title">
        <h2 id="funnel-title" className="text-base font-semibold text-white font-sans not-italic">From the whole market to a short list</h2>
        {widest <= 1 && funnel[0].count === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            No stocks have loaded yet. Once the screener returns results, you’ll see how many survive each test here.
          </p>
        ) : (
          <ol className="mt-5 space-y-3.5">
            {funnel.map((step, i) => {
              const last = i === funnel.length - 1;
              return (
                <li key={step.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className={last ? 'text-amber-200' : 'text-slate-300'}>{step.label}</span>
                    <span className={`${num} ${last ? 'text-amber-200' : 'text-slate-100'}`}>{step.count.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${last ? 'bg-amber-400' : 'bg-slate-400/60'}`}
                      style={{ width: `${Math.max(step.count > 0 ? 2 : 0, (step.count / widest) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ---- best setups ---- */}
      <section className={`${panel} p-6 lg:col-span-2`} aria-labelledby="setups-title">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="setups-title" className="text-base font-semibold text-white font-sans not-italic">Closest to a buy point</h2>
          <span className="text-xs text-slate-500">Stocks passing the trend template, ranked by position then relative strength</span>
        </div>

        {ranked.length === 0 ? (
          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            {stocks.length === 0
              ? 'Nothing to rank yet. Sign in to 5paisa and the screener will fill this list.'
              : 'None of the scanned stocks pass the trend template right now. That is normal in a weak market, so it is better to wait than to force a trade.'}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th scope="col" className="pb-2 pr-3 font-medium">Stock</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-medium">Price</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-medium">RS</th>
                  <th scope="col" className="pb-2 pr-3 font-medium">Position</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-medium">Pivot</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-medium">Stop</th>
                  <th scope="col" className="pb-2 font-medium">60 days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {ranked.map(stock => {
                  const sym = getCurrencySymbol(stock.exchange);
                  const up = stock.changePercent >= 0;
                  return (
                    <tr key={`${stock.exchange}:${stock.ticker}`} className="hover:bg-white/[0.03]">
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => { onSelectStock(stock); onViewChart(stock); }}
                          className="text-left font-semibold text-white hover:text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded"
                        >
                          {stock.ticker}
                        </button>
                        <div className="text-xs text-slate-500">{stock.exchange}{stock.sector && stock.sector !== 'Unknown' && stock.sector !== '—' ? `, ${stock.sector}` : ''}</div>
                      </td>
                      <td className={`py-3 pr-3 text-right ${num}`}>
                        <div className="text-slate-100">{formatCurrency(stock.currentPrice, sym)}</div>
                        {stock.changePercent !== 0 && (
                          <div className={`text-xs ${up ? 'text-emerald-300' : 'text-rose-300'}`}>{up ? '+' : ''}{stock.changePercent.toFixed(2)}%</div>
                        )}
                      </td>
                      <td className={`py-3 pr-3 text-right ${num} text-slate-100`}>{stock.rsRating || '—'}</td>
                      <td className="py-3 pr-3"><StatusChip status={setupStatus(stock)} /></td>
                      <td className={`py-3 pr-3 text-right ${num} text-slate-200`}>{formatCurrency(stock.pivotPrice, sym)}</td>
                      <td className={`py-3 pr-3 text-right ${num} text-rose-300/90`}>{formatCurrency(stock.stopLossPrice, sym)}</td>
                      <td className="py-3"><Sparkline stock={stock} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-600">Screen results for you to check yourself, not investment advice.</p>
      </section>

      <div className="lg:col-span-3"><DailyPicksCard stocks={stocks} onViewChart={onViewChart} /></div>

      <div className="lg:col-span-3"><ObsidianPanel apiBaseUrl={apiBaseUrl} stocks={stocks} demoMode={demoMode} /></div>

      <div className="lg:col-span-3"><BacktestSection apiBaseUrl={apiBaseUrl} stocks={stocks} demoMode={demoMode} /></div>
    </div>
  );
};
