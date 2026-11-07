import test from 'node:test';
import assert from 'node:assert/strict';
import type { PricePoint } from '../types';
import { smaAt, MIN_TREND_BARS } from './minervini/indicators';
import { evaluateTrendTemplate } from './minervini/trendTemplate';
import { analyzeVcp, findSwings } from './minervini/vcpDetector';
import { rankRsRatings, relativeStrengthScore } from './minervini/rsRating';
import { calculateAtrStop, STOP_MAX_PERCENT, STOP_MIN_PERCENT } from './minervini/atrStop';
import { runMinerviniEngine } from './minervini/minerviniEngine';
import { backtestMinervini } from './backtest/backtestEngine';

// ---------------------------------------------------------------- synthetic data helpers
const pad = (n: number) => String(n).padStart(2, '0');
function isoDay(i: number): string {
  const d = new Date(Date.UTC(2024, 0, 1 + i));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function bar(i: number, open: number, high: number, low: number, close: number, volume: number): PricePoint {
  return { date: isoDay(i), open, high, low, close, volume, avgVolume20: 0, sma50: 0, sma150: 0, sma200: 0 };
}
/** Linear walk from the previous close to each [target, bars, volume] leg; tiny wicks so swing highs/lows sit at the legs' extremes. */
function walk(start: number, legs: Array<[number, number, number]>, firstIndex = 0): PricePoint[] {
  const out: PricePoint[] = [];
  let prev = start, idx = firstIndex;
  for (const [target, bars, volume] of legs) {
    for (let k = 1; k <= bars; k++) {
      const close = prev + ((target - prev) * k) / bars;
      const open = out.length ? out[out.length - 1].close : prev;
      out.push(bar(idx++, open, Math.max(open, close) * 1.002, Math.min(open, close) * 0.998, close, volume));
    }
    prev = target;
  }
  return out;
}
/** 260-bar steady uptrend followed by a 3-contraction VCP (20% -> 10% -> 5% pullbacks, volume drying up). */
function vcpSeries(): PricePoint[] {
  return walk(50, [
    [100, 260, 1_000_000],
    [110, 8, 1_200_000],  // run-up
    [88, 8, 1_100_000],   // contraction 1: ~20%
    [109, 8, 1_000_000],
    [98, 6, 800_000],     // contraction 2: ~10%
    [108.5, 6, 800_000],
    [103, 5, 300_000],    // contraction 3: ~5%, volume dries up
    [108, 4, 300_000]     // coil just under the 108.5 pivot
  ]);
}

// ---------------------------------------------------------------- indicators
test('smaAt returns null instead of averaging a short window', () => {
  const c = walk(10, [[20, 30, 1000]]);
  assert.equal(smaAt(c, 48, 50), null);
  assert.equal(smaAt(c, 29, 50), null);
  assert.ok(Math.abs((smaAt(c, 29, 10) as number) - c.slice(20).reduce((s, x) => s + x.close, 0) / 10) < 1e-9);
});

// ---------------------------------------------------------------- trend template
test('trend template: a clean uptrend passes all 8 rules when RS >= 70', () => {
  const r = evaluateTrendTemplate(walk(50, [[100, 260, 1e6]]), 85);
  assert.equal(r.maxScore, 8);
  assert.equal(r.score, 8);
  assert.equal(r.passed, true);
});

test('trend template: low RS fails rule 8 only', () => {
  const r = evaluateTrendTemplate(walk(50, [[100, 260, 1e6]]), 60);
  assert.equal(r.passed, false);
  assert.equal(r.rules.find(x => x.id === 8)?.passed, false);
  assert.equal(r.score, 7);
});

test('trend template: missing RS leaves rule 8 unevaluated (7 rules), never silently passed', () => {
  const r = evaluateTrendTemplate(walk(50, [[100, 260, 1e6]]));
  assert.equal(r.rsAvailable, false);
  assert.equal(r.maxScore, 7);
  assert.equal(r.rules.find(x => x.id === 8)?.passed, null);
});

test('trend template: price must be above the 50-day SMA (rule 5)', () => {
  // uptrend, then a sharp 12% dip that keeps price above the 150/200 but under the 50
  const c = walk(50, [[100, 260, 1e6], [88, 10, 1e6]]);
  const r = evaluateTrendTemplate(c, 90);
  assert.equal(r.rules.find(x => x.id === 5)?.passed, false);
  assert.equal(r.passed, false);
});

test('trend template: downtrend fails and too-short history is rejected', () => {
  assert.equal(evaluateTrendTemplate(walk(100, [[50, 260, 1e6]]), 90).passed, false);
  const short = evaluateTrendTemplate(walk(50, [[100, MIN_TREND_BARS - 10, 1e6]]), 90);
  assert.equal(short.passed, false);
  assert.match(short.reasons[0], /required/);
});

// ---------------------------------------------------------------- VCP
test('findSwings alternates highs and lows', () => {
  const sw = findSwings(vcpSeries().slice(-60));
  for (let i = 1; i < sw.length; i++) assert.notEqual(sw[i].type, sw[i - 1].type);
});

test('VCP: detects sequential contractions that tighten, with the pivot at the last contraction high', () => {
  const v = analyzeVcp(vcpSeries());
  assert.equal(v.detected, true);
  assert.ok(v.contractions.length >= 2);
  const depths = v.contractions.map(c => Math.abs(c.depthPercent));
  for (let i = 1; i < depths.length; i++) assert.ok(depths[i] <= depths[i - 1], `depths ${depths}`);
  assert.ok(Math.abs((v.pivotPrice as number) - 108.5 * 1.002) < 0.3, `pivot ${v.pivotPrice}`);
  assert.ok(v.score >= 60);
});

test('VCP: a straight-line uptrend with no pullbacks is NOT a VCP (old nested-window logic would score it)', () => {
  const v = analyzeVcp(walk(50, [[100, 260, 1e6]]));
  assert.equal(v.detected, false);
});

test('VCP: widening pullbacks are rejected', () => {
  const c = walk(50, [[100, 260, 1e6], [110, 8, 1e6], [105, 5, 1e6], [112, 6, 1e6], [95, 8, 1e6], [111, 6, 1e6]]);
  assert.equal(analyzeVcp(c).detected, false);
});

// ---------------------------------------------------------------- relative strength
test('rankRsRatings: percentile 1..99, ties share a rank, missing stays undefined', () => {
  const r = rankRsRatings([0.5, 0.1, null, 0.1, -0.2, undefined, NaN]);
  assert.equal(r[2], undefined);
  assert.equal(r[5], undefined);
  assert.equal(r[6], undefined);
  assert.equal(r[1], r[3]);
  assert.equal(r[0], 99);
  assert.equal(r[4], 1);
  assert.ok((r[1] as number) > 1 && (r[1] as number) < 99);
});

test('rankRsRatings: single valid score is a neutral 50', () => {
  assert.deepEqual(rankRsRatings([0.3]), [50]);
});

test('relativeStrengthScore: outperformer > 0, underperformer < 0, aligned by date', () => {
  const stock = walk(50, [[120, 300, 1e6]]);
  const bench = walk(100, [[110, 300, 1e6]]);
  assert.ok((relativeStrengthScore(stock, bench) as number) > 0);
  assert.ok((relativeStrengthScore(bench, stock) as number) < 0);
  assert.equal(relativeStrengthScore([], bench), null);
});

// ---------------------------------------------------------------- stops
test('ATR stop is clamped between the 5% floor and the 8% cap', () => {
  const calm = walk(100, [[101, 40, 1e6]]);
  const calmStop = calculateAtrStop(100, calm)!;
  assert.ok(Math.abs(calmStop.stopPercent - STOP_MIN_PERCENT) < 1e-9);
  assert.equal(calmStop.limitedBy, 'MIN');

  const wild: PricePoint[] = [];
  for (let i = 0; i < 40; i++) wild.push(bar(i, 100, 120, 80, 100, 1e6));
  const wildStop = calculateAtrStop(100, wild)!;
  assert.ok(Math.abs(wildStop.stopPercent - STOP_MAX_PERCENT) < 1e-9);
  assert.equal(wildStop.limitedBy, 'MAX');
});

// ---------------------------------------------------------------- engine
test('engine: valid VCP under the pivot is WATCH with a pivot, stop below it, and R-multiple targets', () => {
  const c = vcpSeries();
  const r = runMinerviniEngine({ ticker: 'TEST', currentPrice: c[c.length - 1].close, priceHistory: c, rsRating: 90 });
  assert.equal(r.stage, 'STAGE_2');
  assert.equal(r.trendTemplatePassed, true);
  assert.equal(r.setupValid, true);
  assert.equal(r.breakoutStatus, 'BELOW_PIVOT');
  assert.equal(r.entryStatus, 'WATCH');
  assert.ok(r.stopLoss! < r.pivotPrice!);
  const risk = r.pivotPrice! - r.stopLoss!;
  assert.ok(Math.abs(r.target1! - (r.pivotPrice! + 3 * risk)) < 1e-6);
  assert.ok(Math.abs(r.target2! - (r.pivotPrice! + 5 * risk)) < 1e-6);
});

test('engine: price inside the 5% buy zone is READY; extended beyond it is WATCH, not READY', () => {
  const c = vcpSeries();
  const base = runMinerviniEngine({ ticker: 'T', currentPrice: c[c.length - 1].close, priceHistory: c, rsRating: 90 });
  const pivot = base.pivotPrice!;
  const ready = runMinerviniEngine({ ticker: 'T', currentPrice: pivot * 1.02, priceHistory: c, rsRating: 90 });
  assert.equal(ready.entryStatus, 'READY');
  const extended = runMinerviniEngine({ ticker: 'T', currentPrice: pivot * 1.08, priceHistory: c, rsRating: 90 });
  assert.equal(extended.breakoutStatus, 'ABOVE_PIVOT');
  assert.equal(extended.entryStatus, 'WATCH');
});

test('engine: stopLossPercent input is honoured (it used to be ignored)', () => {
  const c = vcpSeries();
  const r = runMinerviniEngine({ ticker: 'T', currentPrice: c[c.length - 1].close, priceHistory: c, rsRating: 90, stopLossPercent: 6 });
  assert.ok(Math.abs(r.stopLoss! - r.pivotPrice! * 0.94) < 1e-6);
});

test('engine: low universe RS rating blocks the setup (Trend Template rule 8)', () => {
  const c = vcpSeries();
  const r = runMinerviniEngine({ ticker: 'T', currentPrice: c[c.length - 1].close, priceHistory: c, rsRating: 40 });
  assert.equal(r.trendTemplatePassed, false);
  assert.equal(r.setupValid, false);
});

// ---------------------------------------------------------------- backtest fills
const CFG = { initialCapital: 1_000_000, riskPerTradePercent: 1, slippagePercent: 0, commissionPercent: 0 };

/** The VCP series plus a breakout bar that opens under the pivot and trades through it. */
function breakoutThen(tail: PricePoint[]): PricePoint[] {
  const c = vcpSeries();
  const n = c.length;
  const breakout = bar(n, 108, 111, 107.5, 110.5, 2_000_000);
  const rest = tail.map((t, k) => ({ ...t, date: isoDay(n + 1 + k) }));
  return [...c, breakout, ...rest];
}

test('backtest: a gap down through the stop fills at the OPEN, not the stop or the close', () => {
  const gapOpen = 90;
  const candles = breakoutThen([bar(0, gapOpen, 91, 88, 89, 3_000_000), bar(0, 89, 90, 86, 87, 2_000_000)]);
  const res = backtestMinervini('TEST', candles, CFG);
  assert.ok(res.trades.length >= 1, 'expected a trade');
  const t = res.trades[0];
  assert.equal(t.reason, 'STOP');
  assert.equal(t.exitPrice, gapOpen);
  assert.ok(t.exitPrice < t.initialStop);
  assert.ok(t.rMultiple < -1, `gap loss should exceed 1R, got ${t.rMultiple}`);
});

test('backtest: an intrabar stop touch fills AT the stop, not the close', () => {
  const candles = breakoutThen([bar(0, 110, 110.5, 80, 109, 2_000_000), bar(0, 109, 110, 108, 109, 1e6)]);
  const res = backtestMinervini('TEST', candles, CFG);
  const t = res.trades[0];
  assert.equal(t.reason, 'STOP');
  assert.ok(Math.abs(t.exitPrice - t.initialStop) < 1e-9);
  assert.ok(Math.abs(t.rMultiple - -1) < 1e-6);
});

test('backtest: target fills at the target price (3R)', () => {
  const candles = breakoutThen([bar(0, 111, 150, 110, 140, 3e6), bar(0, 140, 141, 139, 140, 1e6)]);
  const res = backtestMinervini('TEST', candles, CFG);
  const t = res.trades[0];
  assert.equal(t.reason, 'TARGET');
  assert.ok(Math.abs(t.rMultiple - 3) < 1e-6, `R=${t.rMultiple}`);
});

test('backtest: an open position at the end is closed at the LAST close, not after one bar', () => {
  const quiet = Array.from({ length: 6 }, () => bar(0, 110, 111, 109.5, 110.4, 1e6));
  const res = backtestMinervini('TEST', breakoutThen(quiet), CFG);
  const t = res.trades[0];
  assert.equal(t.reason, 'END_OF_TEST');
  assert.equal(t.exitPrice, 110.4);
  assert.equal(t.exitDate, isoDay(vcpSeries().length + 1 + quiet.length - 1 + 0));
});

test('backtest: no lookahead - an unbroken pivot never produces a trade', () => {
  const res = backtestMinervini('TEST', vcpSeries(), CFG);
  assert.equal(res.trades.length, 0);
  assert.equal(res.finalCapital, CFG.initialCapital);
});
