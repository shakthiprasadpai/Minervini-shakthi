import React, { useMemo } from 'react';
import type { MinerviniTradeSetup } from '../types';
import { PickPlan, pickIntraday, pickSwing } from '../utils/dailyPicks';
import { MANUAL_INTRADAY_PICK, MANUAL_PICKS_AS_OF, MANUAL_SWING_PICK } from '../utils/manualPicks';

interface Props {
  stocks: MinerviniTradeSetup[];
  onViewChart?: (stock: MinerviniTradeSetup) => void;
}

const rupee = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Plan({ title, hint, plan, empty, stock, onViewChart }: {
  title: string; hint: string; plan: PickPlan | null; empty: string;
  stock?: MinerviniTradeSetup; onViewChart?: (s: MinerviniTradeSetup) => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      {!plan ? (
        <p className="mt-4 text-sm text-slate-400">{empty}</p>
      ) : (
        <>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <div className="text-2xl font-black text-white">{plan.ticker}</div>
            <div className="text-sm tabular-nums text-slate-400">Last {rupee(plan.price)}</div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {([
              ['Buy above', plan.entry, 'text-white'],
              ['Stop', plan.stop, 'text-rose-300'],
              ['Target 1', plan.target1, 'text-emerald-300'],
              ['Target 2', plan.target2, 'text-emerald-300']
            ] as const).map(([k, v, c]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className={`font-bold tabular-nums ${c}`}>{rupee(v)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Risk {plan.riskPercent.toFixed(1)}% per share, first target {plan.rewardRisk.toFixed(1)} times the risk.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Holding period:</span> {plan.holdingPeriod}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {plan.reasons.map(r => <li key={r}>{r}</li>)}
          </ul>
          <ul className="mt-3 space-y-1 text-xs text-amber-300/90">
            {plan.warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
          {stock && onViewChart && (
            <button
              onClick={() => onViewChart(stock)}
              className="mt-4 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-amber-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              View chart
            </button>
          )}
        </>
      )}
    </article>
  );
}

export const DailyPicksCard: React.FC<Props> = ({ stocks, onViewChart }) => {
  const liveSwing = useMemo(() => pickSwing(stocks), [stocks]);
  const liveIntraday = useMemo(() => pickIntraday(stocks), [stocks]);
  const find = (p: PickPlan | null) => (p ? stocks.find(s => s.ticker === p.ticker && s.exchange === p.exchange) : undefined);

  // Before the live screener has loaded any stocks, fall back to the last manual screen
  // rather than showing an empty card. It disappears automatically once real data loads.
  const usingManual = stocks.length === 0;
  const swing = usingManual ? MANUAL_SWING_PICK : liveSwing;
  const intraday = usingManual ? MANUAL_INTRADAY_PICK : liveIntraday;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#11151c] p-6 text-white" aria-labelledby="picks-title">
      <h2 id="picks-title" className="text-xl font-black">Today's picks</h2>
      <p className="mt-1 text-sm text-slate-400">
        One swing trade and one intraday trade from the stocks the screener has loaded, with entry, stop and targets on current prices.
      </p>
      {usingManual && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200">
          Showing a manual screen from {MANUAL_PICKS_AS_OF} — not live. Sign in with 5paisa above so the screener loads the Nifty 100 and replaces this automatically.
        </p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Plan
          title="Swing pick"
          hint="Days to weeks. Minervini Trend Template plus a tight base."
          plan={swing}
          stock={find(liveSwing)}
          onViewChart={onViewChart}
          empty="No stock passes every swing rule right now. Waiting is better than forcing a trade."
        />
        <Plan
          title="Intraday pick"
          hint="One session. A strong Stage 2 leader that closed strong on heavy volume."
          plan={intraday}
          stock={find(liveIntraday)}
          onViewChart={onViewChart}
          empty="No stock closed strong on heavy volume near its high. Skip intraday trades until one does."
        />
      </div>
      <p className="mt-4 text-xs text-slate-600">Screen results for you to check yourself, not investment advice.</p>
    </section>
  );
};
