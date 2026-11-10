import test from 'node:test';
import assert from 'node:assert/strict';
import { NIFTY_100, parseSymbols, screenerUniverse } from './screenerUniverse';

const full = () => [{ ticker: 'ZZZ', exchange: 'NSE' as const }];

test('parseSymbols: exchanges, defaults and blanks', () => {
  assert.deepEqual(parseSymbols('NSE:INFY, TCS ,, BSE:500325'), [
    { ticker: 'INFY', exchange: 'NSE' }, { ticker: 'TCS', exchange: 'NSE' }, { ticker: '500325', exchange: 'BSE' }
  ]);
  assert.deepEqual(parseSymbols(undefined), []);
  assert.deepEqual(parseSymbols('M&M'), [{ ticker: 'M&M', exchange: 'NSE' }]);
});

test('screenerUniverse: own list wins, then Nifty 100 by default, full market only when asked', () => {
  assert.deepEqual(screenerUniverse({ SCREENER_SYMBOLS: 'INFY' }, full), [{ ticker: 'INFY', exchange: 'NSE' }]);
  const dflt = screenerUniverse({ AUTO_UNIVERSE: 'true', REALTIME_MARKET_PROVIDER: '5paisa' }, full);
  assert.equal(dflt.length, NIFTY_100.length);
  assert.equal(screenerUniverse({ SCREENER_FULL_MARKET: 'true', REALTIME_MARKET_PROVIDER: '5paisa' }, full)[0].ticker, 'ZZZ');
  assert.equal(screenerUniverse({ SCREENER_FULL_MARKET: 'true' }, full).length, NIFTY_100.length);
});

test('NIFTY_100 has no duplicates and no blanks', () => {
  assert.equal(new Set(NIFTY_100).size, NIFTY_100.length);
  assert.ok(NIFTY_100.every(s => s.trim() === s && s.length > 0));
  assert.equal(NIFTY_100.length, 100);
});
