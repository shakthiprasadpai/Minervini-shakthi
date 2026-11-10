import test from 'node:test';
import assert from 'node:assert/strict';
import type { MinerviniTradeSetup } from '../types';
import { scanBear, shortPlan, stageList } from './stageScan';

function stock(over: Partial<MinerviniTradeSetup> = {}): MinerviniTradeSetup {
  return {
    ticker: 'X', name: 'X', exchange: 'NSE', sector: 'Tech', industry: 'x',
    currentPrice: 60, changePercent: 0, sma50: 70, sma150: 85, sma200: 95, sma200_1mo_ago: 98,
    high52w: 130, low52w: 55, rsRating: 20, trendScore: 1, priceHistory: [], ...over
  } as MinerviniTradeSetup;
}

const bars = (n: number, low: number, high: number) =>
  Array.from({ length: n }, (_, i) => ({ date: `d${i}`, open: low, high, low, close: low, volume: 1, avgVolume20: 1, sma50: 0, sma150: 0, sma200: 0 })) as any;

test('scanBear: a clean downtrend passes all eight rules', () => {
  const r = scanBear(stock());
  assert.equal(r.score, 8);
  assert.equal(r.isStage4, true);
});

test('scanBear: a rising 200-day average breaks it', () => {
  const r = scanBear(stock({ sma200_1mo_ago: 90 }));
  assert.equal(r.isStage4, false);
  assert.equal(r.rules.find(x => x.id === '200_falling')!.passed, false);
});

test('scanBear: missing averages never count as a downtrend', () => {
  assert.equal(scanBear(stock({ sma200: 0 })).score, 0);
  assert.equal(scanBear(stock({ currentPrice: 0 })).isStage4, false);
});

test('shortPlan: sells below the recent low, stops above the recent high, target at 2R', () => {
  const p = shortPlan(stock({ priceHistory: [...bars(9, 59, 60.5), ...bars(1, 58, 60)] }))!;
  assert.equal(p.trigger, 58);
  assert.ok(Math.abs(p.stop - 60.5 * 1.005) < 1e-9);
  assert.ok(Math.abs((p.trigger - p.target) - 2 * (p.stop - p.trigger)) < 1e-9);
});

test('shortPlan: stop is capped at 8% and short history gives no plan', () => {
  const p = shortPlan(stock({ priceHistory: [...bars(5, 50, 90), ...bars(5, 50, 90)] }))!;
  assert.ok(Math.abs(p.stop - 54) < 1e-9);
  assert.equal(shortPlan(stock({ priceHistory: bars(2, 50, 52) })), null);
  assert.equal(shortPlan(stock()), null);
});

test('stageList: Stage 2 by strongest RS, Stage 4 by weakest RS, respects the limit', () => {
  const up = (t: string, rs: number) => stock({ ticker: t, trendScore: 8, rsRating: rs, sma50: 0 });
  assert.deepEqual(stageList([up('A', 80), up('B', 95), stock({ ticker: 'C' })], 'STAGE_2').map(s => s.ticker), ['B', 'A']);
  const down = (t: string, rs: number) => stock({ ticker: t, rsRating: rs });
  assert.deepEqual(stageList([down('A', 30), down('B', 5), up('U', 99)], 'STAGE_4').map(s => s.ticker), ['B', 'A']);
  assert.equal(stageList([down('A', 30), down('B', 5)], 'STAGE_4', 1).length, 1);
});
