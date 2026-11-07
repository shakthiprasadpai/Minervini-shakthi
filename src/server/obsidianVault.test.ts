import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NOTE_SOURCE, renderBacktest, renderDailySummary, renderTradePlan, resolveVault, safeName, writeNote } from './obsidianVault';

const plan = { ticker: 'DIXON', name: 'Dixon "Tech" Ltd', exchange: 'NSE', sector: 'Tech', currentPrice: 11950, pivotPrice: 12100, stopLossPrice: 11350, rsRating: 97, trendScore: 8 };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'vault-'));

test('safeName strips path tricks and odd characters', () => {
  assert.equal(safeName('../../etc/passwd'), 'etcpasswd');
  assert.equal(safeName('M&M'), 'M&M');
  assert.equal(safeName('a/b\\c:d*e?'), 'abcde');
  assert.equal(safeName('...hidden'), 'hidden');
  assert.equal(safeName(''), '');
  assert.equal(safeName('x'.repeat(200)).length, 40);
});

test('trade plan carries the marker, escapes YAML and links the existing note', () => {
  const md = renderTradePlan(plan, '2026-11-09');
  assert.ok(md.includes(`source: ${NOTE_SOURCE}`));
  assert.match(md, /name: "Dixon \\"Tech\\" Ltd"/);
  assert.match(md, /\[\[DIXON-SEPA\]\]/);
  assert.match(md, /Buy above \(pivot\) \| ₹12,100\.00/);
});

test('daily summary lists the funnel and handles an empty list', () => {
  assert.match(renderDailySummary('2026-11-09', [{ label: 'Stocks scanned', count: 1800 }], [plan as any]), /\[\[DIXON\]\]/);
  assert.match(renderDailySummary('2026-11-09', [], []), /Nothing passed/);
});

test('backtest note handles no trades and no losses', () => {
  const md = renderBacktest({ ticker: 'X', initialCapital: 1000, finalCapital: 1000, totalReturnPercent: 0, winRate: 0, profitFactor: null, averageRMultiple: 0, maxDrawdownPercent: 0, trades: [] }, '2026-11-09');
  assert.match(md, /No trades\./);
  assert.match(md, /no losing trades/);
});

test('writeNote creates, updates its own note, and never overwrites a note it did not write', () => {
  const vault = tmp();
  const a = writeNote(vault, 'Plans', 'DIXON 2026-11-09', renderTradePlan(plan, '2026-11-09'));
  assert.equal(a.status, 'written');
  assert.equal(a.path, 'Trading/Plans/DIXON 2026-11-09.md');
  assert.equal(writeNote(vault, 'Plans', 'DIXON 2026-11-09', renderTradePlan(plan, '2026-11-09')).status, 'updated');

  const mine = path.join(vault, 'Trading', 'Plans', 'HAND.md');
  fs.writeFileSync(mine, 'my own words');
  const r = writeNote(vault, 'Plans', 'HAND', 'replacement');
  assert.equal(r.status, 'skipped');
  assert.equal(fs.readFileSync(mine, 'utf8'), 'my own words');
});

test('writeNote cannot leave the vault', () => {
  const vault = tmp();
  const r = writeNote(vault, 'Plans', '../../../escape', 'x');
  assert.ok(r.status === 'written' && r.path.startsWith('Trading/Plans/'));
  assert.ok(!fs.existsSync(path.join(path.dirname(vault), 'escape.md')));
  assert.equal(writeNote(vault, 'Plans', '', 'x').status, 'skipped');
});

test('resolveVault accepts a folder, quotes and blanks', () => {
  const vault = tmp();
  assert.equal(resolveVault(`"${vault}"`), path.resolve(vault));
  assert.equal(resolveVault(''), null);
  assert.equal(resolveVault(undefined), null);
  assert.equal(resolveVault(path.join(vault, 'nope')), null);
  fs.writeFileSync(path.join(vault, 'f'), '');
  assert.equal(resolveVault(path.join(vault, 'f')), null);
});
