import test from 'node:test';
import assert from 'node:assert/strict';
import { requestBacktest, takePendingBacktest } from './backtestRequest';

test('a backtest request is handed over once, even before the section exists', () => {
  assert.equal(takePendingBacktest(), null);
  requestBacktest('TRENT');
  assert.equal(takePendingBacktest(), 'TRENT');
  assert.equal(takePendingBacktest(), null);
});

test('the latest request wins', () => {
  requestBacktest('A');
  requestBacktest('B');
  assert.equal(takePendingBacktest(), 'B');
});
