import test from 'node:test';
import assert from 'node:assert/strict';
import type { MinerviniTradeSetup } from '../types';
import {
  buildFunnel,
  deriveConnection,
  formatRemaining,
  istClock,
  maskClientCode,
  rankSetups,
  recentCloses,
  setupStatus
} from './dashboardMetrics';
import { renderAuthResultPage } from '../server/authResultPage';

/* ---------------------------------------------------------------- connection state */

const base = { demoMode: false, realtime: null as any, auth: null as any, authFetch: 'ok' as const };

test('connection: demo mode wins over everything', () => {
  assert.equal(deriveConnection({ ...base, demoMode: true, realtime: { connected: true } }), 'DEMO');
});

test('connection: nothing known yet is LOADING, and a failed fetch with no data is UNREACHABLE', () => {
  assert.equal(deriveConnection({ ...base, authFetch: 'loading' }), 'LOADING');
  assert.equal(deriveConnection({ ...base, authFetch: 'error' }), 'UNREACHABLE');
});

test('connection: server up but keys missing is NOT_CONFIGURED', () => {
  assert.equal(deriveConnection({ ...base, auth: { configured: false, hasToken: false } }), 'NOT_CONFIGURED');
});

test('connection: keys present but no token is SIGNED_OUT', () => {
  assert.equal(deriveConnection({ ...base, auth: { configured: true, hasToken: false }, realtime: { configured: false, connected: false } }), 'SIGNED_OUT');
});

test('connection: token present but feed not up yet is CONNECTING', () => {
  assert.equal(deriveConnection({ ...base, auth: { configured: true, hasToken: true }, realtime: { connected: false } }), 'CONNECTING');
});

test('connection: feed connected is LIVE', () => {
  assert.equal(deriveConnection({ ...base, auth: { configured: true, hasToken: true }, realtime: { connected: true } }), 'LIVE');
});

test('connection: fresher direct auth poll overrides the shell\'s older realtime.auth', () => {
  const realtime = { connected: false, configured: false, auth: { configured: true, hasToken: false } };
  assert.equal(deriveConnection({ ...base, realtime, auth: { configured: true, hasToken: true } }), 'CONNECTING');
});

test('connection: falls back to realtime.auth when the direct poll has not answered', () => {
  const realtime = { connected: false, auth: { configured: true, hasToken: false } };
  assert.equal(deriveConnection({ ...base, realtime }), 'SIGNED_OUT');
});

/* ---------------------------------------------------------------- formatting */

test('maskClientCode hides the middle and never prints short codes', () => {
  assert.equal(maskClientCode('50123456'), '50••••56');
  assert.equal(maskClientCode('abcd'), '••••');
  assert.equal(maskClientCode(null), '—');
  assert.ok(!maskClientCode('50123456').includes('1234'));
});

test('formatRemaining', () => {
  assert.equal(formatRemaining(5 * 3_600_000 + 12 * 60_000), '5h 12m');
  assert.equal(formatRemaining(5 * 3_600_000 + 5 * 60_000), '5h 05m');
  assert.equal(formatRemaining(42 * 60_000), '42m');
  assert.equal(formatRemaining(10_000), '1m');
  assert.equal(formatRemaining(0), 'expired');
  assert.equal(formatRemaining(-5), 'expired');
  assert.equal(formatRemaining(NaN), 'expired');
});

/* ---------------------------------------------------------------- market clock (IST = UTC+5:30) */

const ist = (isoUtc: string) => istClock(new Date(isoUtc));

test('istClock: converts UTC to India time and finds the session', () => {
  // Fri 6 Nov 2026
  assert.deepEqual(ist('2026-11-06T03:00:00Z'), { minutes: 510, weekday: 'Fri', label: '08:30', session: 'BEFORE_OPEN' });
  assert.equal(ist('2026-11-06T03:35:00Z').session, 'PRE_OPEN');   // 09:05
  assert.equal(ist('2026-11-06T03:45:00Z').session, 'OPEN');       // 09:15 exactly
  assert.equal(ist('2026-11-06T06:16:00Z').label, '11:46');
  assert.equal(ist('2026-11-06T09:59:00Z').session, 'OPEN');       // 15:29
  assert.equal(ist('2026-11-06T10:00:00Z').session, 'CLOSED');     // 15:30 exactly
});

test('istClock: weekend is closed all day, and the India date can differ from UTC', () => {
  assert.equal(ist('2026-11-07T06:30:00Z').session, 'WEEKEND');    // Saturday 12:00 IST
  assert.equal(ist('2026-11-08T05:00:00Z').session, 'WEEKEND');    // Sunday
  // Fri 23:30 UTC is already Saturday 05:00 in India
  assert.equal(ist('2026-11-06T23:30:00Z').weekday, 'Sat');
  assert.equal(ist('2026-11-06T23:30:00Z').session, 'WEEKEND');
  // Midnight India time must not come out as hour 24
  assert.equal(ist('2026-11-09T18:30:00Z').label, '00:00');
});

/* ---------------------------------------------------------------- setups */

let uid = 0;
function stock(over: Partial<MinerviniTradeSetup> = {}): MinerviniTradeSetup {
  uid++;
  return {
    ticker: `S${uid}`, name: `S${uid}`, exchange: 'NSE', sector: 'Tech', industry: 'x',
    currentPrice: 100, changePercent: 0, sma50: 0, sma150: 0, sma200: 0, sma200_1mo_ago: 0,
    high52w: 0, low52w: 0, rsRating: 80, patternType: 'Pivot Pullback', vcpStage: 'Breakout Pending',
    trendScore: 8, avgVolume20d: 0, pivotVolume: 0, volumeDryUpPercent: 0, isTightVolume: true,
    pivotPrice: 100, buyZoneMax: 105, stopLossPrice: 94, stopLossPercent: -6, target1Price: 118,
    target1Percent: 18, target2Price: 130, target2Percent: 30, riskRewardRatio: 5, contractions: [],
    priceHistory: [], sepaNotes: '', ...over
  } as MinerviniTradeSetup;
}

test('setupStatus', () => {
  assert.equal(setupStatus(stock({ currentPrice: 102 })), 'BUY_ZONE');
  assert.equal(setupStatus(stock({ currentPrice: 100 })), 'BUY_ZONE');
  assert.equal(setupStatus(stock({ currentPrice: 99 })), 'NEAR_PIVOT');
  assert.equal(setupStatus(stock({ currentPrice: 90 })), 'BUILDING');
  assert.equal(setupStatus(stock({ currentPrice: 106 })), 'EXTENDED');
  assert.equal(setupStatus(stock({ currentPrice: 105 })), 'BUY_ZONE');   // top of the zone is still inside it
  assert.equal(setupStatus(stock({ pivotPrice: 0 })), 'BUILDING');       // no pivot, no claim
  assert.equal(setupStatus(stock({ currentPrice: 0 })), 'BUILDING');
  assert.equal(setupStatus(stock({ currentPrice: 104, buyZoneMax: 0 })), 'BUY_ZONE'); // falls back to pivot + 5%
});

test('rankSetups: only trend passers, buy zone first, then near pivot, ties by RS', () => {
  const a = stock({ ticker: 'EXT', currentPrice: 110, rsRating: 99 });
  const b = stock({ ticker: 'BLD', currentPrice: 80, rsRating: 95 });
  const c = stock({ ticker: 'NEAR', currentPrice: 99, rsRating: 90 });
  const d = stock({ ticker: 'BUY_LOW_RS', currentPrice: 101, rsRating: 75 });
  const e = stock({ ticker: 'BUY_HIGH_RS', currentPrice: 101, rsRating: 92 });
  const f = stock({ ticker: 'FAILS', currentPrice: 101, rsRating: 99, trendScore: 6 });
  assert.deepEqual(rankSetups([a, b, c, d, e, f]).map(s => s.ticker), ['BUY_HIGH_RS', 'BUY_LOW_RS', 'NEAR', 'BLD', 'EXT']);
});

test('rankSetups respects the limit and does not mutate the input', () => {
  const list = Array.from({ length: 12 }, (_, i) => stock({ rsRating: 70 + i }));
  const before = list.map(s => s.ticker);
  assert.equal(rankSetups(list, 5).length, 5);
  assert.deepEqual(list.map(s => s.ticker), before);
});

test('buildFunnel: every step is a subset of the one before', () => {
  const stocks = [
    stock({ trendScore: 8, rsRating: 90, isTightVolume: true, currentPrice: 101 }),   // makes it to the end
    stock({ trendScore: 8, rsRating: 90, isTightVolume: true, currentPrice: 120 }),   // extended
    stock({ trendScore: 8, rsRating: 90, isTightVolume: false }),                     // loud volume
    stock({ trendScore: 8, rsRating: 50 }),                                           // weak RS
    stock({ trendScore: 5 })                                                          // fails trend
  ];
  const steps = buildFunnel(stocks);
  assert.deepEqual(steps.map(s => s.count), [5, 4, 3, 2, 1]);
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i].count <= steps[i - 1].count);
  assert.deepEqual(buildFunnel([]).map(s => s.count), [0, 0, 0, 0, 0]);
});

test('recentCloses: last n closes, empty without history', () => {
  const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ close: i + 1 })) as any;
  assert.deepEqual(recentCloses({ priceHistory: mk(100) }, 3), [98, 99, 100]);
  assert.deepEqual(recentCloses({ priceHistory: mk(1) }), []);
  assert.deepEqual(recentCloses({ priceHistory: undefined as any }), []);
});

/* ---------------------------------------------------------------- sign-in result page */

test('auth result page: success reports ok and closes the popup', () => {
  const html = renderAuthResultPage(true, 'You are connected.');
  assert.match(html, /Signed in to 5paisa/);
  assert.match(html, /type: 'fivepaisa-auth', ok: true/);
  assert.match(html, /window\.close\(\)/);
});

test('auth result page: failure reports not-ok and keeps the window open for the message', () => {
  const html = renderAuthResultPage(false, 'No luck');
  assert.match(html, /Sign-in did not finish/);
  assert.match(html, /ok: false/);
  assert.match(html, /if \(false && window\.opener\)/);
});

test('auth result page escapes remote error text (no script injection)', () => {
  const html = renderAuthResultPage(false, '<script>alert(1)</script> & "x"');
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;x&quot;/);
});

test('auth result page only targets its own origin when messaging the opener', () => {
  assert.match(renderAuthResultPage(true, 'x'), /window\.location\.origin\)/);
  assert.ok(!/postMessage\([^)]*'\*'/.test(renderAuthResultPage(true, 'x')));
});

/* ---------------------------------------------------------------- backtest helpers */
import { backtestVerdict, equityCurve } from './dashboardMetrics';

test('equityCurve: starts at capital, accumulates in exit-date order', () => {
  const pts = equityCurve(1000, [
    { exitDate: '2026-03-01', pnl: -50 },
    { exitDate: '2026-02-01', pnl: 200 }
  ]);
  assert.deepEqual(pts.map(p => p.equity), [1000, 1200, 1150]);
  assert.deepEqual(equityCurve(500, []), [{ date: '', equity: 500 }]);
});

test('backtestVerdict does not oversell small samples', () => {
  assert.match(backtestVerdict({ trades: [], totalReturnPercent: 0, maxDrawdownPercent: 0 }), /No trades/);
  assert.match(backtestVerdict({ trades: [1], totalReturnPercent: 30, maxDrawdownPercent: -2 }), /too few/);
  assert.match(backtestVerdict({ trades: new Array(12).fill(1), totalReturnPercent: -4, maxDrawdownPercent: -9 }), /loss overall/);
  assert.match(backtestVerdict({ trades: new Array(12).fill(1), totalReturnPercent: 18.2, maxDrawdownPercent: -7.5 }), /18\.2%.*7\.5%/);
});
