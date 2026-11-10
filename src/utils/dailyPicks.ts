import type { MinerviniTradeSetup } from '../types';
import { calculateAtr } from '../engine/minervini/atrStop';
import { setupStatus } from './dashboardMetrics';

export interface PickPlan {
  kind: 'SWING' | 'INTRADAY';
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  entry: number;
  stop: number;
  target1: number;
  target2: number;
  riskPercent: number;
  rewardRisk: number;
  /** How long to plan on holding, e.g. "2–8 weeks" or "Same session only". */
  holdingPeriod: string;
  reasons: string[];
  warnings: string[];
}

const tick = (n: number) => Math.round(n / 0.05) * 0.05;
const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (a: number, b: number) => ((a - b) / b) * 100;

/** Rupees traded per day, using the 20-day average volume. */
export const dailyTurnover = (s: MinerviniTradeSetup) => s.currentPrice * (s.avgVolume20d || 0);
export const MIN_TURNOVER = 10_00_00_000; // Rs 10 crore a day

/**
 * One swing pick: every Trend Template rule passing, strong relative strength, volume drying up,
 * and price at or just under the pivot (or no more than 5% above it). Entry, stop and targets come from
 * the engine's current-price levels; reward-to-risk is recomputed from where you would actually buy.
 */
export function pickSwing(stocks: MinerviniTradeSetup[]): PickPlan | null {
  const order = { BUY_ZONE: 0, NEAR_PIVOT: 1 } as const;
  const candidates = stocks
    .map(s => ({ s, status: setupStatus(s) }))
    .filter((x): x is { s: MinerviniTradeSetup; status: 'BUY_ZONE' | 'NEAR_PIVOT' } =>
      (x.status === 'BUY_ZONE' || x.status === 'NEAR_PIVOT') &&
      x.s.trendScore >= 8 && (x.s.rsRating ?? 0) >= 70 && x.s.isTightVolume && dailyTurnover(x.s) >= MIN_TURNOVER)
    .map(x => {
      const entry = x.status === 'NEAR_PIVOT' ? x.s.pivotPrice : x.s.currentPrice;
      const stop = x.s.stopLossPrice;
      const risk = entry - stop;
      const rr = risk > 0 ? (x.s.target1Price - entry) / risk : 0;
      return { ...x, entry, stop, risk, rr };
    })
    .filter(x => x.risk > 0 && x.risk / x.entry <= 0.08 && x.rr >= 2);
  if (!candidates.length) return null;
  candidates.sort((a, b) => order[a.status] - order[b.status] || (b.s.rsRating || 0) - (a.s.rsRating || 0) || b.rr - a.rr);
  const { s, status, entry, stop, risk, rr } = candidates[0];
  const reasons = [
    `All ${s.trendScore} Trend Template rules pass`,
    `Relative strength ${s.rsRating}`,
    `Volume is ${Math.round(s.volumeDryUpPercent)}% below its 20-day average`,
    status === 'NEAR_PIVOT' ? `Price is ${pct(s.pivotPrice, s.currentPrice).toFixed(1)}% under the pivot` : `Price is ${pct(s.currentPrice, s.pivotPrice).toFixed(1)}% above the pivot`
  ];
  const warnings: string[] = [];
  if (status === 'NEAR_PIVOT') warnings.push('Buy only if price trades above the entry on strong volume. Below it, there is no trade.');
  else warnings.push('Already past the pivot: buy only if it holds above it, and do not chase further.');
  return {
    kind: 'SWING', ticker: s.ticker, name: s.name, exchange: s.exchange, price: s.currentPrice,
    entry: r2(entry), stop: r2(stop), target1: r2(s.target1Price), target2: r2(s.target2Price),
    riskPercent: r2((risk / entry) * 100), rewardRisk: r2(rr),
    holdingPeriod: '2–8 weeks, reviewed against the stop — exit sooner if the stop or target is hit first',
    reasons, warnings
  };
}

/**
 * One intraday pick from the last finished daily bar: a Stage 2 leader that closed strong on heavy volume.
 * Buy only above the day's high; stop is the tighter of that day's low and 0.8 x ATR; targets at 2R and 3R.
 */
export function pickIntraday(stocks: MinerviniTradeSetup[]): PickPlan | null {
  const scored = stocks.flatMap(s => {
    const h = s.priceHistory ?? [];
    if (h.length < 16 || s.trendScore < 7 || (s.rsRating ?? 0) < 70 || dailyTurnover(s) < MIN_TURNOVER) return [];
    const last = h[h.length - 1], prev = h[h.length - 2];
    const range = last.high - last.low;
    if (!(range > 0) || !(prev.close > 0)) return [];
    const change = pct(last.close, prev.close);
    const volRatio = last.volume / (last.avgVolume20 || s.avgVolume20d || Infinity);
    const closePos = (last.close - last.low) / range;
    const offHigh = s.high52w > 0 ? pct(s.high52w, last.close) : Infinity;
    if (change < 0.8 || change > 6 || volRatio < 1.5 || closePos < 0.7 || offHigh > 10) return [];
    const atr = calculateAtr(h);
    if (atr === null) return [];
    const entry = tick(last.high * 1.001);
    const stop = tick(Math.max(last.low, entry - 0.8 * atr));
    const risk = entry - stop;
    if (!(risk > 0) || risk / entry < 0.005 || risk / entry > 0.03) return [];
    const score = volRatio * 10 + (s.rsRating || 0) * 0.3 + closePos * 10 - offHigh * 0.5;
    return [{ s, last, change, volRatio, closePos, offHigh, entry, stop, risk, score }];
  });
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const { s, change, volRatio, offHigh, entry, stop, risk } = scored[0];
  return {
    kind: 'INTRADAY', ticker: s.ticker, name: s.name, exchange: s.exchange, price: s.currentPrice,
    entry: r2(entry), stop: r2(stop), target1: r2(entry + 2 * risk), target2: r2(entry + 3 * risk),
    riskPercent: r2((risk / entry) * 100), rewardRisk: 2,
    holdingPeriod: 'Same session only — close before 15:15, no overnight carry',
    reasons: [
      `Last session +${change.toFixed(1)}% on ${volRatio.toFixed(1)}x its average volume`,
      `Closed in the top ${Math.max(1, Math.round((1 - scored[0].closePos) * 100))}% of the day's range`,
      `Relative strength ${s.rsRating}, ${offHigh.toFixed(1)}% under the 52-week high`
    ],
    warnings: [
      'Built from daily candles. Confirm with the live price: buy only above the entry, and close the trade before 15:15.',
      'Minervini is a swing method; treat this as a one-session momentum trade with a hard stop.'
    ]
  };
}
