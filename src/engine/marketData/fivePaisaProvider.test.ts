import test from 'node:test';
import assert from 'node:assert/strict';
import { createFivePaisaProvider, istDate, parseCandles } from './fivePaisaProvider';

const scrip = { exchange: 'NSE' as const, exchangeType: 'C' as const, scripCode: 2885, symbol: 'RELIANCE' };
const row = (d: string, c: number, v = 1000) => [`${d}T00:00:00`, c - 1, c + 2, c - 2, c, v];

function make(over: Partial<Parameters<typeof createFivePaisaProvider>[0]> = {}, responder?: (url: string, init: any) => any) {
  const calls: { url: string; init: any }[] = [];
  const fetchImpl = (async (url: string, init: any) => {
    calls.push({ url, init });
    return responder ? responder(url, init) : new Response(JSON.stringify({ status: 'success', data: { candles: [row('2026-11-05', 100), row('2026-11-06', 110)] } }), { status: 200 });
  }) as any;
  const provider = createFivePaisaProvider({
    getToken: () => 'TOKEN', lookup: (e, s) => (s === 'RELIANCE' ? scrip : undefined),
    fetchImpl, now: () => new Date('2026-11-07T08:00:00Z'), minGapMs: 0, sleep: async () => {}, ...over
  });
  return { provider, calls };
}

test('parseCandles: ascending, de-duplicated, skips junk rows', () => {
  const rows = parseCandles([row('2026-11-06', 110), row('2026-11-05', 100), row('2026-11-05', 101), [1, 2], ['bad', 1, 1, 1, 1, 1], row('2026-11-04', 0), ['2026-11-03T00:00:00', 'x', 1, 1, 1, 1]]);
  assert.deepEqual(rows.map(r => r.date), ['2026-11-05', '2026-11-06']);
  assert.equal(rows[0].close, 101);
  assert.deepEqual(parseCandles(null), []);
  assert.equal(parseCandles([['2026-11-05T00:00:00', 1, 2, 0.5, 1.5, 'oops']])[0].volume, 0);
});

test('istDate uses India time, not UTC', () => {
  assert.equal(istDate(new Date('2026-11-06T20:00:00Z')), '2026-11-07');
  assert.equal(istDate(new Date('2026-11-06T10:00:00Z')), '2026-11-06');
});

test('requests the right URL with a bearer token and returns derived bars', async () => {
  const { provider, calls } = make();
  const rows = await provider.getDailyCandles('RELIANCE', 'NSE');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/openapi\.5paisa\.com\/V2\/historical\/N\/C\/2885\/1d\?from=2025-09-03&end=2026-11-07$/);
  assert.equal(calls[0].init.headers.Authorization, 'bearer TOKEN');
  assert.deepEqual(rows.map(r => r.close), [100, 110]);
  assert.equal(rows[1].sma50, 105);   // derived fields are filled in
});

test('index benchmarks resolve without the scrip master', async () => {
  const { provider, calls } = make();
  await provider.getDailyCandles('NIFTY 50', 'NSE');
  await provider.getDailyCandles('banknifty', 'NSE');
  assert.match(calls[0].url, /\/N\/C\/999920000\/1d/);
  assert.match(calls[1].url, /\/N\/C\/999920005\/1d/);
});

test('caches a series and shares one in-flight request', async () => {
  const { provider, calls } = make();
  await Promise.all([provider.getDailyCandles('RELIANCE', 'NSE'), provider.getDailyCandles('RELIANCE', 'NSE')]);
  await provider.getDailyCandles('reliance', 'NSE');
  assert.equal(calls.length, 1);
});

test('cache expires', async () => {
  let t = new Date('2026-11-07T08:00:00Z').getTime();
  const { provider, calls } = make({ now: () => new Date(t), cacheMs: 1000 });
  await provider.getDailyCandles('RELIANCE', 'NSE');
  t += 2000;
  await provider.getDailyCandles('RELIANCE', 'NSE');
  assert.equal(calls.length, 2);
});

test('clear errors: signed out, unknown stock, expired token, HTTP error, empty body', async () => {
  await assert.rejects(make({ getToken: () => null }).provider.getDailyCandles('RELIANCE', 'NSE'), /Not signed in to 5paisa/);
  const a = make();
  await assert.rejects(a.provider.getDailyCandles('NOPE', 'NSE'), /not found in the 5paisa scrip master/);
  assert.equal(a.calls.length, 0);
  await assert.rejects(make({}, () => new Response('', { status: 401 })).provider.getDailyCandles('RELIANCE', 'NSE'), /expired/);
  await assert.rejects(make({}, () => new Response('', { status: 500 })).provider.getDailyCandles('RELIANCE', 'NSE'), /HTTP 500/);
  await assert.rejects(make({}, () => new Response(JSON.stringify({ head: { Status_description: 'Invalid token' }, body: null }), { status: 200 })).provider.getDailyCandles('RELIANCE', 'NSE'), /Invalid token/);
});

test('a failed request is not cached', async () => {
  let n = 0;
  const { provider } = make({}, () => (n++ === 0 ? new Response('', { status: 500 }) : new Response(JSON.stringify({ data: { candles: [row('2026-11-06', 50)] } }), { status: 200 })));
  await assert.rejects(provider.getDailyCandles('RELIANCE', 'NSE'));
  assert.equal((await provider.getDailyCandles('RELIANCE', 'NSE')).length, 1);
});

test('requests are spaced by the minimum gap', async () => {
  let t = 0; const waits: number[] = [];
  const { provider } = make({ now: () => new Date(Date.UTC(2026, 10, 7, 8) + t), minGapMs: 250, sleep: async ms => { waits.push(ms); t += ms; } }, () => new Response(JSON.stringify({ data: { candles: [row('2026-11-06', 50)] } }), { status: 200 }));
  await provider.getDailyCandles('NIFTY', 'NSE'); await provider.getDailyCandles('BANKNIFTY', 'NSE');
  assert.ok(waits.length >= 1 && waits.every(w => w > 0 && w <= 250));
});

test('getQuote derives close, volume and change from the last two bars', async () => {
  const q = await make().provider.getQuote('RELIANCE', 'NSE');
  assert.equal(q.close, 110); assert.equal(q.volume, 1000);
  assert.ok(Math.abs(q.changePercent! - 10) < 1e-9);
});
