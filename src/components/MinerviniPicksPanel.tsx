import React, { useEffect, useState } from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';
import type { PriceAlert } from '../types';

/** The standalone Claude dashboard artifact showing this same picks data as charts/tiles. */
const DASHBOARD_ARTIFACT_URL = 'https://claude.ai/artifact/UyXGKo1JYY1jNqbhPKhxZb';
/** The editable Sheets tracker with the same 5 rows — links back from the dashboard too. */
const TRACKER_SHEET_URL = 'https://claude.ai/artifact/Wr1e2fsvHPgfbsPDm9t3X1';

/**
 * Curated Minervini-setup picks, one per market-cap bucket, screened via the
 * Trend Template on 2026-11-11/12. Entry/stop shown here fall back to these
 * static values and are overridden live from /api/alerts where a matching
 * PIVOT_ENTRY / STOP_LOSS pair exists, so this stays in sync with whatever
 * the background price checker has updated.
 */
const CURATED_PICKS: Array<{
  ticker: string;
  cap: 'Large' | 'Mid' | 'Small' | 'Micro';
  entry: number;
  stop: number;
  status: 'Triggered' | 'Watch' | 'Planning';
  rs3m?: number;
  pattern: string;
}> = [
  { ticker: 'LAURUSLABS', cap: 'Large', entry: 2485, stop: 2460.15, status: 'Planning', pattern: '20% above 50DMA (extended); prefer pullback near 2400 or size smaller on breakout' },
  { ticker: 'SAILIFE', cap: 'Mid', entry: 1898, stop: 1879.02, status: 'Triggered', rs3m: 30.0, pattern: 'Cleared entry on 2.2x volume; RSI 82 — stretched, watch for flag/handle under 2000' },
  { ticker: 'MCX', cap: 'Large', entry: 3640, stop: 3603.6, status: 'Planning', rs3m: 22.3, pattern: 'At 52W high; 1M RS turned negative — likely pullback or tight flag before next leg' },
  { ticker: 'MANINDS', cap: 'Small', entry: 900, stop: 891, status: 'Watch', rs3m: 47.9, pattern: 'Cup forming after 18% correction; needs reclaim of 900 with tightening closes to confirm' },
  { ticker: 'KOPRAN', cap: 'Micro', entry: 268, stop: 265.32, status: 'Watch', rs3m: 48.0, pattern: 'Classic VCP coil — 20MA/50MA converged, ADX at 15, volume dried to half the 20-day average' },
];

const STATUS_STYLE: Record<string, string> = {
  Triggered: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  Watch: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  Planning: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
};

const CAP_STYLE: Record<string, string> = {
  Large: 'text-sky-300',
  Mid: 'text-violet-300',
  Small: 'text-amber-300',
  Micro: 'text-rose-300',
};

interface Props {
  currencySymbol: string;
}

export const MinerviniPicksPanel: React.FC<Props> = ({ currencySymbol }) => {
  const [live, setLive] = useState<PriceAlert[]>([]);

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => (r.ok ? r.json() : []))
      .then((d: PriceAlert[]) => setLive(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const rows = CURATED_PICKS.map(pick => {
    const pivot = live.find(a => a.ticker === pick.ticker && a.targetType === 'PIVOT_ENTRY');
    const stopAlert = live.find(a => a.ticker === pick.ticker && a.targetType === 'STOP_LOSS');
    return {
      ...pick,
      entry: pivot?.targetPrice ?? pick.entry,
      stop: stopAlert?.targetPrice ?? pick.stop,
      status: stopAlert?.status === 'TRIGGERED' || pivot?.status === 'TRIGGERED' ? 'Triggered' : pick.status,
    };
  });

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> Minervini picks — one per cap bucket
        </h3>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
          <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
            {counts.Triggered ?? 0} triggered
          </span>
          <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-amber-300">
            {counts.Watch ?? 0} watching
          </span>
          <span className="rounded-md border border-slate-500/40 bg-slate-500/10 px-2 py-0.5 text-slate-400">
            {counts.Planning ?? 0} planning
          </span>
          <a
            href={DASHBOARD_ARTIFACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-sky-300 hover:border-sky-400/70 hover:text-sky-200"
          >
            Full dashboard <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={TRACKER_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-violet-400/40 bg-violet-400/10 px-2 py-0.5 text-violet-300 hover:border-violet-400/70 hover:text-violet-200"
          >
            Edit tracker <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-3">Ticker</th>
              <th className="pb-2 pr-3">Cap</th>
              <th className="pb-2 pr-3 text-right">Entry</th>
              <th className="pb-2 pr-3 text-right">Stop (-1%)</th>
              <th className="pb-2 pr-3">RS 3M</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2">Pattern forming</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(r => (
              <tr key={r.ticker}>
                <td className="py-2 pr-3 font-bold text-white">{r.ticker}</td>
                <td className={`py-2 pr-3 font-semibold ${CAP_STYLE[r.cap]}`}>{r.cap}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-200">
                  {currencySymbol}{r.entry.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-rose-300">
                  {currencySymbol}{r.stop.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                <td className="py-2 pr-3 tabular-nums text-slate-300">
                  {r.rs3m != null ? `+${r.rs3m.toFixed(1)}%` : '—'}
                </td>
                <td className="py-2 pr-3">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-2 pr-2 text-slate-500">{r.pattern}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-slate-600">
        From a Trend Template screen on 2026-11-11/12; each stop is 1% below its entry/pivot. Entry/stop update live from the
        price alerts you've set — this list itself is a point-in-time snapshot, not a live feed.
      </p>
    </div>
  );
};
