import { PricePoint, VcpContraction } from '../../types';
import { averageVolume, clamp } from './indicators';

export const VCP_SWING_THRESHOLD = 0.03;
export const VCP_LOOKBACK_BARS = 150;
export const VCP_MAX_CONTRACTIONS = 4;
export const VCP_MAX_FINAL_DEPTH_PERCENT = 12;
export const VCP_VOLUME_DRYUP_PERCENT = -20;
const VOLUME_BASELINE_BARS = 50;

export interface Swing { index: number; price: number; type: 'H' | 'L'; confirmed: boolean }

/** Zigzag swings: a high is confirmed after a `threshold` drop, a low after a `threshold` rally. The open extreme at the end is unconfirmed. */
export function findSwings(candles: PricePoint[], threshold = VCP_SWING_THRESHOLD): Swing[] {
  const swings: Swing[] = [];
  if (candles.length < 2) return swings;
  let trend: 'up' | 'down' | null = null;
  let hi = { i: 0, p: candles[0].high };
  let lo = { i: 0, p: candles[0].low };
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    if (trend === null) {
      if (c.high > hi.p) hi = { i, p: c.high };
      if (c.low < lo.p) lo = { i, p: c.low };
      const rallied = lo.i < i && c.high >= lo.p * (1 + threshold);
      const dropped = hi.i < i && c.low <= hi.p * (1 - threshold);
      if (rallied && (!dropped || lo.i <= hi.i)) { swings.push({ index: lo.i, price: lo.p, type: 'L', confirmed: true }); trend = 'up'; hi = { i, p: c.high }; }
      else if (dropped) { swings.push({ index: hi.i, price: hi.p, type: 'H', confirmed: true }); trend = 'down'; lo = { i, p: c.low }; }
    } else if (trend === 'up') {
      if (c.high > hi.p) hi = { i, p: c.high };
      else if (c.low <= hi.p * (1 - threshold)) { swings.push({ index: hi.i, price: hi.p, type: 'H', confirmed: true }); trend = 'down'; lo = { i, p: c.low }; }
    } else {
      if (c.low < lo.p) lo = { i, p: c.low };
      else if (c.high >= lo.p * (1 + threshold)) { swings.push({ index: lo.i, price: lo.p, type: 'L', confirmed: true }); trend = 'up'; hi = { i, p: c.high }; }
    }
  }
  if (trend === 'up') swings.push({ index: hi.i, price: hi.p, type: 'H', confirmed: false });
  else if (trend === 'down') swings.push({ index: lo.i, price: lo.p, type: 'L', confirmed: false });
  return swings;
}

export interface VcpAnalysis { detected: boolean; score: number; contractions: VcpContraction[]; pivotPrice: number | null }
const EMPTY: VcpAnalysis = { detected: false, score: 0, contractions: [], pivotPrice: null };

/**
 * VCP from sequential swing pullbacks (swing high -> next swing low), newest last.
 * detected = >=2 pullbacks, each no deeper than the previous, final depth <= 12%, final-pullback volume >= 20% under baseline.
 * Score 0-100 = tightening 50 + contraction count 10 + final depth 15 + volume dry-up 25.
 */
export function analyzeVcp(candles: PricePoint[]): VcpAnalysis {
  if (candles.length < 60) return EMPTY;
  const offset = Math.max(0, candles.length - VCP_LOOKBACK_BARS);
  const swings = findSwings(offset ? candles.slice(offset) : candles);

  const pairs: Array<{ high: Swing; low: Swing }> = [];
  for (let k = 0; k < swings.length - 1; k++) if (swings[k].type === 'H' && swings[k + 1].type === 'L') pairs.push({ high: swings[k], low: swings[k + 1] });
  const recent = pairs.slice(-VCP_MAX_CONTRACTIONS);
  if (!recent.length) return EMPTY;

  const contractions: VcpContraction[] = recent.map((p, n) => {
    const hiIdx = p.high.index + offset, loIdx = p.low.index + offset;
    const depth = (p.high.price - p.low.price) / p.high.price * 100;
    const baselineAvg = averageVolume(candles, hiIdx - VOLUME_BASELINE_BARS, hiIdx - 1);
    const pullbackAvg = averageVolume(candles, hiIdx + 1, loIdx);
    const dryUp = baselineAvg > 0 && loIdx > hiIdx ? (pullbackAvg / baselineAvg - 1) * 100 : 0;
    return {
      contractionIndex: n + 1, depthPercent: -Number(depth.toFixed(2)), durationDays: Math.max(1, loIdx - hiIdx),
      volumeDryUpPercent: Number(dryUp.toFixed(2)), startDate: candles[hiIdx]?.date || '', endDate: candles[loIdx]?.date || '',
      highPrice: p.high.price, lowPrice: p.low.price
    };
  });

  const depths = contractions.map(c => Math.abs(c.depthPercent));
  let tighter = 0;
  for (let k = 1; k < depths.length; k++) if (depths[k] <= depths[k - 1]) tighter++;
  const pairsCompared = depths.length - 1;
  const allTighter = pairsCompared >= 1 && tighter === pairsCompared;
  const lastDepth = depths[depths.length - 1];
  const lastDryUp = contractions[contractions.length - 1].volumeDryUpPercent;

  const tighteningPts = pairsCompared >= 1 ? (tighter / pairsCompared) * 50 : 0;
  const countPts = contractions.length >= 3 ? 10 : contractions.length === 2 ? 5 : 0;
  const depthPts = lastDepth <= 10 ? 15 : lastDepth <= VCP_MAX_FINAL_DEPTH_PERCENT ? 10 : lastDepth <= 15 ? 5 : 0;
  const volumePts = clamp(-lastDryUp / Math.abs(VCP_VOLUME_DRYUP_PERCENT), 0, 1) * 25;
  const score = Math.round(clamp(tighteningPts + countPts + depthPts + volumePts, 0, 100));

  return {
    detected: contractions.length >= 2 && allTighter && lastDepth <= VCP_MAX_FINAL_DEPTH_PERCENT && lastDryUp <= VCP_VOLUME_DRYUP_PERCENT,
    score, contractions, pivotPrice: recent[recent.length - 1].high.price
  };
}
