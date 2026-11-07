import React, { useMemo, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { MinerviniTradeSetup } from '../types';
import { equityCurve, backtestVerdict } from '../utils/dashboardMetrics';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';

interface Trade {
  signalDate: string; entryDate: string; exitDate: string;
  entryPrice: number; exitPrice: number; quantity: number;
  pnl: number; returnPercent: number; rMultiple: number; reason: string;
}
interface Result {
  initialCapital: number; finalCapital: number; totalReturnPercent: number;
  trades: Trade[]; winRate: number; profitFactor: number | null;
  averageRMultiple: number; maxDrawdownPercent: number;
  barsTested?: number; firstDate?: string | null; lastDate?: string | null;
}

const panel = 'rounded-2xl border border-white/10 bg-[#11151c]';
const num = 'font-mono tabular-nums';
const field = 'mt-1 w-full rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400';

const REASONS: Record<string, string> = {
  TARGET: 'Hit target', STOP: 'Stopped out', TRAILING_STOP: 'Trailing stop', EXIT_SIGNAL: 'Exit signal', END_OF_TEST: 'Still open at end'
};

const EquityChart: React.FC<{ result: Result }> = ({ result }) => {
  const pts = useMemo(() => equityCurve(result.initialCapital, result.trades), [result]);
  if (pts.length < 2) return null;
  const w = 600, h = 140, pad = 6;
  const vals = pts.map(p => p.equity);
  const min = Math.min(...vals, result.initialCapital), max = Math.max(...vals, result.initialCapital);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.equity).toFixed(1)}`).join(' ');
  const up = result.finalCapital >= result.initialCapital;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-4 h-36 w-full" role="img"
      aria-label={`Account value after each trade, from ${Math.round(result.initialCapital)} to ${Math.round(result.finalCapital)}`}>
      <line x1={pad} x2={w - pad} y1={y(result.initialCapital)} y2={y(result.initialCapital)} stroke="rgba(148,163,184,.35)" strokeDasharray="4 4" />
      <path d={d} fill="none" stroke={up ? '#34d399' : '#fb7185'} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const BacktestSection: React.FC<{ apiBaseUrl: string; stocks: MinerviniTradeSetup[]; demoMode: boolean }> = ({ apiBaseUrl, stocks, demoMode }) => {
  const [ticker, setTicker] = useState('');
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [capital, setCapital] = useState('100000');
  const [risk, setRisk] = useState('1');
  const [costs, setCosts] = useState('0.1');
  const [trail, setTrail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [ranFor, setRanFor] = useState('');

  const suggestions = useMemo(() => stocks.slice(0, 200).map(s => s.ticker), [stocks]);
  const sym = getCurrencySymbol(exchange);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) { setError('Enter a ticker, for example RELIANCE.'); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${apiBaseUrl}/api/backtest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: t, exchange, initialCapital: capital, riskPerTradePercent: risk,
          commissionPercent: costs, slippagePercent: costs, trailingAtrMultiple: trail
        })
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.message || `Server answered ${r.status}`);
      setResult(body); setRanFor(t);
    } catch (err: any) {
      setResult(null);
      setError(`Could not run the backtest. ${err?.message || 'The server did not answer.'} Backtests read daily history from the market data provider set in .env (MARKET_DATA_PROVIDER), not from the 5paisa sign-in.`);
    } finally { setBusy(false); }
  };

  return (
    <section className={`${panel} p-6`} aria-labelledby="bt-title">
      <h2 id="bt-title" className="text-base font-semibold text-white font-sans not-italic">Test the setup on past prices</h2>
      <p className="mt-1 max-w-prose text-sm text-slate-400">
        Replays the Trend Template and VCP rules over one stock’s daily history. Orders trigger only at the pivot, after the signal day, so there is no look-ahead.
      </p>

      <form onSubmit={run} className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-6">
        <label className="col-span-2 text-xs text-slate-400">Ticker
          <input className={field} value={ticker} onChange={e => setTicker(e.target.value)} list="bt-tickers" placeholder="RELIANCE" autoComplete="off" />
          <datalist id="bt-tickers">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
        </label>
        <label className="text-xs text-slate-400">Exchange
          <select className={field} value={exchange} onChange={e => setExchange(e.target.value as 'NSE' | 'BSE')}>
            <option>NSE</option><option>BSE</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">Starting capital
          <input className={`${field} ${num}`} inputMode="decimal" value={capital} onChange={e => setCapital(e.target.value)} />
        </label>
        <label className="text-xs text-slate-400">Risk per trade (%)
          <input className={`${field} ${num}`} inputMode="decimal" value={risk} onChange={e => setRisk(e.target.value)} />
        </label>
        <label className="text-xs text-slate-400">Costs per side (%)
          <input className={`${field} ${num}`} inputMode="decimal" value={costs} onChange={e => setCosts(e.target.value)} />
        </label>
        <label className="col-span-2 text-xs text-slate-400 md:col-span-2">Trailing stop (ATR multiple, blank for fixed targets)
          <input className={`${field} ${num}`} inputMode="decimal" value={trail} onChange={e => setTrail(e.target.value)} placeholder="3" />
        </label>
        <div className="col-span-2 flex items-end md:col-span-4">
          <button type="submit" disabled={busy || demoMode}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {busy ? 'Running backtest' : 'Run backtest'}
          </button>
        </div>
      </form>

      {demoMode && <p className="mt-3 text-xs text-slate-500">Backtests need real price history, so they are off in demo mode.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}

      {result && (
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className="text-sm text-slate-200">{ranFor}: {backtestVerdict(result)}</p>
          {result.barsTested ? (
            <p className="mt-1 text-xs text-slate-500">{result.barsTested.toLocaleString()} daily bars{result.firstDate ? `, ${result.firstDate} to ${result.lastDate}` : ''}.</p>
          ) : null}

          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              ['Return', `${result.totalReturnPercent.toFixed(1)}%`, result.totalReturnPercent >= 0 ? 'text-emerald-300' : 'text-rose-300'],
              ['Final value', formatCurrency(result.finalCapital, sym), 'text-slate-100'],
              ['Win rate', `${result.winRate.toFixed(0)}%`, 'text-slate-100'],
              ['Profit factor', result.profitFactor === null ? 'No losses' : result.profitFactor.toFixed(2), 'text-slate-100'],
              ['Average R', result.averageRMultiple.toFixed(2), 'text-slate-100'],
              ['Worst drop', `${Math.abs(result.maxDrawdownPercent).toFixed(1)}%`, 'text-rose-300']
            ].map(([k, v, c]) => (
              <div key={k} className="rounded-xl bg-white/[0.03] px-4 py-3">
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className={`mt-1 text-lg ${num} ${c}`}>{v}</dd>
              </div>
            ))}
          </dl>

          <EquityChart result={result} />

          {result.trades.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Trades from the backtest</caption>
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="py-2 pr-3 font-medium">Bought</th><th className="py-2 pr-3 font-medium">Sold</th>
                    <th className="py-2 pr-3 text-right font-medium">Buy price</th><th className="py-2 pr-3 text-right font-medium">Sell price</th>
                    <th className="py-2 pr-3 text-right font-medium">Result</th><th className="py-2 pr-3 text-right font-medium">R</th>
                    <th className="py-2 font-medium">Why it ended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {result.trades.slice().reverse().slice(0, 25).map((t, i) => (
                    <tr key={i}>
                      <td className={`py-2 pr-3 ${num} text-slate-300`}>{t.entryDate}</td>
                      <td className={`py-2 pr-3 ${num} text-slate-300`}>{t.exitDate}</td>
                      <td className={`py-2 pr-3 text-right ${num} text-slate-200`}>{formatCurrency(t.entryPrice, sym)}</td>
                      <td className={`py-2 pr-3 text-right ${num} text-slate-200`}>{formatCurrency(t.exitPrice, sym)}</td>
                      <td className={`py-2 pr-3 text-right ${num} ${t.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{t.returnPercent >= 0 ? '+' : ''}{t.returnPercent.toFixed(1)}%</td>
                      <td className={`py-2 pr-3 text-right ${num} text-slate-300`}>{t.rMultiple.toFixed(1)}</td>
                      <td className="py-2 text-slate-400">{REASONS[t.reason] ?? t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.trades.length > 25 && <p className="mt-2 text-xs text-slate-500">Showing the latest 25 of {result.trades.length} trades.</p>}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-600">Past results do not predict future trades. Costs and slippage are applied on both sides of each trade.</p>
        </div>
      )}
    </section>
  );
};
