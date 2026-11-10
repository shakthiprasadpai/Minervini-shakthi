import React, { useMemo, useState } from 'react';
import type { MinerviniTradeSetup } from '../types';
import { scanBear, shortPlan, stageList, StageView } from '../utils/stageScan';

interface Props {
  stocks: MinerviniTradeSetup[];
  onViewChart: (stock: MinerviniTradeSetup) => void;
  /** Which list to show. Leave out to let the scanner keep its own choice. */
  view?: StageView;
  onViewChange?: (view: StageView) => void;
}

const rupee = (n: number | undefined) =>
  Number.isFinite(n as number) ? `₹${(n as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

export const StageScanner: React.FC<Props> = ({ stocks, onViewChart, view: controlled, onViewChange }) => {
  const [own, setOwn] = useState<StageView>('STAGE_2');
  const view = controlled ?? own;
  const setView = (v: StageView) => { setOwn(v); onViewChange?.(v); };
  const rows = useMemo(() => stageList(stocks, view, 50), [stocks, view]);
  const up = view === 'STAGE_2';

  return (
    <section className="rounded-3xl border border-white/10 bg-[#11151c] p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{up ? 'Stage 2 uptrends' : 'Stage 4 downtrends'}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {up
              ? 'Stocks passing all eight Trend Template rules, strongest relative strength first.'
              : 'Stocks passing the eight mirrored downtrend rules, weakest relative strength first. In India, cash-market shorts must be closed the same day; overnight shorts need futures.'}
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Stage view">
          {([['STAGE_2', 'Stage 2 uptrends'], ['STAGE_4', 'Stage 4 downtrends']] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                view === id ? 'border-amber-400/60 bg-amber-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          {stocks.length === 0
            ? 'No stocks loaded yet. Sign in with 5paisa on the Dashboard so the screener can load price history.'
            : up ? 'No stock passes all eight Trend Template rules right now.' : 'No stock is in a confirmed downtrend right now.'}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-semibold">Stock</th>
                <th className="py-2 pr-4 font-semibold">Price</th>
                <th className="py-2 pr-4 font-semibold">RS</th>
                <th className="py-2 pr-4 font-semibold">{up ? 'Buy above' : 'Sell below'}</th>
                <th className="py-2 pr-4 font-semibold">Stop</th>
                <th className="py-2 pr-4 font-semibold">{up ? 'Target' : 'Target (2R)'}</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const plan = up ? null : shortPlan(s);
                const trigger = up ? s.pivotPrice : plan?.trigger;
                const stop = up ? s.stopLossPrice : plan?.stop;
                const target = up ? s.target1Price : plan?.target;
                return (
                  <tr key={s.ticker} className="border-t border-white/5">
                    <td className="py-3 pr-4">
                      <div className="font-bold">{s.ticker}</div>
                      <div className="text-xs text-slate-500">{s.sector}</div>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{rupee(s.currentPrice)}</td>
                    <td className="py-3 pr-4 tabular-nums">{Number.isFinite(s.rsRating as number) ? s.rsRating : '—'}</td>
                    <td className="py-3 pr-4 tabular-nums">{rupee(trigger)}</td>
                    <td className="py-3 pr-4 tabular-nums">{rupee(stop)}</td>
                    <td className="py-3 pr-4 tabular-nums">{rupee(target)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onViewChart(s)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-amber-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        View chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!up && rows.length > 0 && (
        <p className="mt-4 text-xs text-slate-500">
          Rules checked: {scanBear(rows[0]).rules.map(r => r.label.toLowerCase()).join('; ')}. Screen results to check yourself, not investment advice.
        </p>
      )}
    </section>
  );
};
