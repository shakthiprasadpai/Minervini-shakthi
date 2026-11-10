import test from 'node:test';
import assert from 'node:assert/strict';
import type { MinerviniTradeSetup } from '../types';
import { pickIntraday, pickSwing } from './dailyPicks';

function bars(n: number, last: Partial<{ open: number; high: number; low: number; close: number; volume: number }> = {}) {
  const out = Array.from({ length: n }, (_, i) => ({
    date: `d${i}`, open: 99, high: 101, low: 98, close: 100, volume: 1_000_000, avgVolume20: 1_000_000, sma50: 0, sma150: 0, sma200: 0
  }));
  Object.assign(out[n - 1], last);
  return out as any;
}

let id = 0;
function stock(over: Partial<MinerviniTradeSetup> = {}): MinerviniTradeSetup {
  id++;
  return {
    ticker: `S${id}`, name: `S${id}`, exchange: 'NSE', sector: 'x', industry: 'x',
    currentPrice: 100, changePercent: 0, sma50: 0, sma150: 0, sma200: 0, sma200_1mo_ago: 0, high52w: 104, low52w: 50,
    rsRating: 85, trendScore: 8, avgVolume20d: 2_000_000, isTightVolume: true, volumeDryUpPercent: 45,
    pivotPrice: 100, buyZoneMax: 105, stopLossPrice: 94, stopLossPercent: -6, target1Price: 118, target1Percent: 18,
    target2Price: 130, target2Percent: 30, riskRewardRatio: 3, priceHistory: bars(30), ...over
  } as MinerviniTradeSetup;
}

test('pickSwing: nothing qualifies in an empty or weak market', () => {
  assert.equal(pickSwing([]), null);
  assert.equal(pickSwing([stock({ trendScore: 7 }), stock({ rsRating: 60 }), stock({ isTightVolume: false })]), null);
});

test('pickSwing: skips extended, illiquid and wide-stop stocks', () => {
  assert.equal(pickSwing([stock({ currentPrice: 112 })]), null);              // past the buy zone
  assert.equal(pickSwing([stock({ avgVolume20d: 1000 })]), null);             // under Rs 10 crore a day
  assert.equal(pickSwing([stock({ stopLossPrice: 88 })]), null);              // 12% stop
});

test('pickSwing: prefers the stock nearest its pivot, then the stronger RS, and rebuilds levels from the buy price', () => {
  const near = stock({ ticker: 'NEAR', currentPrice: 99, rsRating: 80 });
  const buyZone = stock({ ticker: 'ZONE', currentPrice: 102, rsRating: 99 });
  const p = pickSwing([buyZone, near])!;
  assert.equal(p.ticker, 'ZONE');                                              // buy zone ranks first
  assert.equal(p.entry, 102);                                                  // buys at the current price, not the pivot
  assert.equal(p.stop, 94);
  assert.equal(p.rewardRisk, 2);                                               // (118-102)/(102-94)
  const q = pickSwing([near])!;
  assert.equal(q.entry, 100);                                                  // buy-stop at the pivot
  assert.equal(q.rewardRisk, 3);
});

test('pickSwing: a target under 2R from the entry is rejected', () => {
  assert.equal(pickSwing([stock({ currentPrice: 104, target1Price: 110 })]), null);
});

test('pickIntraday: needs a strong close on heavy volume near the 52-week high', () => {
  const good = stock({ ticker: 'GO', priceHistory: bars(30, { open: 100, high: 104, low: 99.5, close: 103.5, volume: 2_500_000 }), currentPrice: 103.5 });
  const p = pickIntraday([good])!;
  assert.equal(p.ticker, 'GO');
  assert.ok(p.entry > 104 && p.entry < 104.3);                                 // just above the day's high
  assert.ok(p.stop < p.entry);
  assert.ok(Math.abs((p.target1 - p.entry) - 2 * (p.entry - p.stop)) < 0.06);  // 2R
  assert.equal(pickIntraday([stock({ priceHistory: bars(30, { close: 103.5, high: 104, low: 99.5, volume: 1_100_000 }) })]), null); // volume not heavy
  assert.equal(pickIntraday([stock({ priceHistory: bars(30, { close: 100, high: 104, low: 99.5, volume: 2_500_000 }) })]), null);   // weak close
  assert.equal(pickIntraday([stock({ priceHistory: bars(30, { close: 109, high: 109.5, low: 100, volume: 2_500_000 }) })]), null);  // up more than 6%
  assert.equal(pickIntraday([stock({ high52w: 150, priceHistory: bars(30, { close: 103.5, high: 104, low: 99.5, volume: 2_500_000 }) })]), null); // far from high
  assert.equal(pickIntraday([stock({ priceHistory: bars(5) })]), null);        // not enough history
});

test('pickIntraday: ranks the heavier-volume leader first', () => {
  const mk = (t: string, v: number) => stock({ ticker: t, priceHistory: bars(30, { open: 100, high: 104, low: 99.5, close: 103.5, volume: v }), currentPrice: 103.5 });
  assert.equal(pickIntraday([mk('A', 2_000_000), mk('B', 4_000_000)])!.ticker, 'B');
});
