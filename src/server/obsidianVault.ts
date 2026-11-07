import fs from 'node:fs';
import path from 'node:path';

/** Marker in every note this app writes. Only files carrying it are ever overwritten. */
export const NOTE_SOURCE = 'minervini-sepa-screener';
const ROOT = 'Trading';

export interface PlanInput {
  ticker: string; name?: string; exchange?: string; sector?: string; industry?: string;
  currentPrice: number; changePercent?: number; pivotPrice: number; buyZoneMax?: number;
  stopLossPrice: number; stopLossPercent?: number; target1Price?: number; target2Price?: number;
  riskRewardRatio?: number; rsRating?: number; trendScore?: number; patternType?: string;
  vcpStage?: string; isTightVolume?: boolean; volumeDryUpPercent?: number;
}
export interface BacktestInput {
  ticker: string; initialCapital: number; finalCapital: number; totalReturnPercent: number;
  winRate: number; profitFactor: number | null; averageRMultiple: number; maxDrawdownPercent: number;
  firstDate?: string | null; lastDate?: string | null;
  trades: { entryDate: string; exitDate: string; entryPrice: number; exitPrice: number; returnPercent: number; rMultiple: number; reason: string }[];
}

/** A ticker or title reduced to characters that are safe in a file name on every OS. */
export function safeName(input: string, max = 40): string {
  return String(input ?? '').normalize('NFKD').replace(/[^A-Za-z0-9 &._-]/g, '').replace(/\.{2,}/g, '.').trim().replace(/^\.+/, '').slice(0, max).trim();
}

/** YAML-safe quoted string. */
const q = (s: unknown) => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`;
const money = (n: number | undefined, sym = '₹') => (Number.isFinite(n as number) ? `${sym}${(n as number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—');
const fin = (n: unknown, d = 1) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—');

export function renderTradePlan(p: PlanInput, date: string): string {
  const t = safeName(p.ticker);
  return `---
type: trade-plan
source: ${NOTE_SOURCE}
ticker: ${t}
name: ${q(p.name || t)}
exchange: ${p.exchange || 'NSE'}
sector: ${q(p.sector || '')}
date: ${date}
pivot_price: ${p.pivotPrice}
stop_loss: ${p.stopLossPrice}
rs_rating: ${p.rsRating ?? ''}
trend_score: ${p.trendScore ?? ''}
tags:
  - trading/plan
  - ${t.toLowerCase().replace(/[^a-z0-9]/g, '')}
---

# ${t} trade plan, ${date}

${p.name ? `${p.name} (${p.exchange || 'NSE'})` : ''}${p.sector ? `, ${p.sector}` : ''}${p.industry && p.industry !== p.sector ? `, ${p.industry}` : ''}

| | |
|---|---|
| Last price | ${money(p.currentPrice)}${p.changePercent ? ` (${p.changePercent >= 0 ? '+' : ''}${fin(p.changePercent, 2)}%)` : ''} |
| Buy above (pivot) | ${money(p.pivotPrice)} |
| Buy zone ends | ${money(p.buyZoneMax)} |
| Stop | ${money(p.stopLossPrice)}${p.stopLossPercent ? ` (${fin(p.stopLossPercent)}%)` : ''} |
| Target 1 | ${money(p.target1Price)} |
| Target 2 | ${money(p.target2Price)} |
| Reward to risk | ${p.riskRewardRatio ? `1 : ${fin(p.riskRewardRatio, 1)}` : '—'} |

- Relative strength: ${p.rsRating ?? '—'} / 99
- Trend template: ${p.trendScore ?? '—'} / 8 rules passing
- Pattern: ${p.patternType || '—'}${p.vcpStage ? `, ${p.vcpStage}` : ''}
- Volume: ${p.isTightVolume ? 'drying up' : 'not drying up'}${Number.isFinite(p.volumeDryUpPercent as number) ? ` (${fin(p.volumeDryUpPercent, 0)}% vs 20-day average)` : ''}

## Before I act
- [ ] Price is at or above the pivot on above-average volume
- [ ] Position size fits my risk per trade
- [ ] Stop is placed when I buy

## Notes

Existing note for this stock: [[${t}-SEPA]]
`;
}

export function renderDailySummary(date: string, funnel: { label: string; count: number }[], top: PlanInput[]): string {
  const rows = top.map(s => `| [[${safeName(s.ticker)}]] | ${fin(s.rsRating, 0)} | ${money(s.currentPrice)} | ${money(s.pivotPrice)} | ${money(s.stopLossPrice)} |`).join('\n');
  return `---
type: screener-daily
source: ${NOTE_SOURCE}
date: ${date}
tags:
  - trading/daily
---

# Screener, ${date}

## From the whole market to a short list
${funnel.map(f => `- ${f.label}: ${f.count}`).join('\n')}

## Closest to a buy point
${top.length ? `| Stock | RS | Price | Pivot | Stop |\n|---|---|---|---|---|\n${rows}` : 'Nothing passed the filters.'}

Screen results to check yourself, not investment advice.
`;
}

export function renderBacktest(b: BacktestInput, date: string): string {
  const t = safeName(b.ticker);
  const rows = b.trades.slice(-30).reverse().map(x =>
    `| ${x.entryDate} | ${x.exitDate} | ${fin(x.entryPrice, 2)} | ${fin(x.exitPrice, 2)} | ${x.returnPercent >= 0 ? '+' : ''}${fin(x.returnPercent)}% | ${fin(x.rMultiple)} | ${x.reason} |`).join('\n');
  return `---
type: backtest
source: ${NOTE_SOURCE}
ticker: ${t}
date: ${date}
return_percent: ${fin(b.totalReturnPercent)}
trades: ${b.trades.length}
tags:
  - trading/backtest
---

# ${t} backtest, ${date}

History tested: ${b.firstDate ?? '—'} to ${b.lastDate ?? '—'}

| | |
|---|---|
| Return | ${fin(b.totalReturnPercent)}% |
| Start to end value | ${money(b.initialCapital)} to ${money(b.finalCapital)} |
| Trades | ${b.trades.length} |
| Win rate | ${fin(b.winRate, 0)}% |
| Profit factor | ${b.profitFactor === null ? 'no losing trades' : fin(b.profitFactor, 2)} |
| Average R | ${fin(b.averageRMultiple, 2)} |
| Worst drop | ${fin(Math.abs(b.maxDrawdownPercent))}% |

## Latest ${Math.min(30, b.trades.length)} trades
${b.trades.length ? `| Bought | Sold | Buy | Sell | Result | R | Ended by |\n|---|---|---|---|---|---|---|\n${rows}` : 'No trades.'}

One stock's history is a small sample. Past results do not predict future trades.

Existing note for this stock: [[${t}-SEPA]]
`;
}

/* ------------------------------------------------------------------ writing */

export type WriteResult = { path: string; status: 'written' | 'updated' | 'skipped'; reason?: string };

/** Absolute vault path from the environment, or null when unset or not a folder. */
export function resolveVault(raw: string | undefined): string | null {
  const v = (raw ?? '').trim().replace(/^["']|["']$/g, '');
  if (!v) return null;
  try { return fs.statSync(v).isDirectory() ? path.resolve(v) : null; } catch { return null; }
}

/**
 * Writes `content` to `<vault>/Trading/<sub>/<fileName>.md`.
 * Never leaves the vault, and never overwrites a note this app did not write.
 */
export function writeNote(vault: string, sub: 'Plans' | 'Daily' | 'Backtests', fileName: string, content: string): WriteResult {
  const name = `${safeName(fileName, 80)}.md`;
  if (name === '.md') return { path: '', status: 'skipped', reason: 'empty file name' };
  const dir = path.resolve(vault, ROOT, sub);
  const file = path.resolve(dir, name);
  const rel = path.relative(vault, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return { path: rel, status: 'skipped', reason: 'outside the vault' };
  const shown = rel.split(path.sep).join('/');
  let existed = false;
  try {
    const current = fs.readFileSync(file, 'utf8');
    existed = true;
    if (!current.includes(`source: ${NOTE_SOURCE}`)) return { path: shown, status: 'skipped', reason: 'a note you wrote already has this name' };
  } catch { /* new file */ }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  return { path: shown, status: existed ? 'updated' : 'written' };
}
