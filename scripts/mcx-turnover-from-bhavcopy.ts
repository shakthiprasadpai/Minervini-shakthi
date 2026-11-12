/**
 * Aggregates an MCX "BhavCopyDateWise" commodity-derivatives export
 * (one row per instrument/expiry/strike for a single session) into
 * per-commodity totals: traded value, volume and open interest.
 *
 * This is the script behind the "MCX exchange turnover by commodity" chart
 * in the Minervini Picks Dashboard artifact — turnover is a proxy for the
 * MCX (the exchange operator) stock pick's transaction-revenue driver,
 * since MCX earns fees on this trading activity.
 *
 * Usage:
 *   npx tsx scripts/mcx-turnover-from-bhavcopy.ts <input.csv> <output.csv> [topN]
 *
 * Input columns (MCX bhavcopy export):
 *   Date, Instrument Name, Symbol, Expiry Date, Option Type, Strike Price,
 *   Open, High, Low, Close, Previous Close, Volume(Lots), Volume(In 000's),
 *   Value(Lacs), Open Interest(Lots)
 *
 * Output columns: symbol, value_lacs, volume_lots, oi_lots — sorted by
 * value_lacs descending, top N only (default 10), zero-turnover rows
 * dropped. Also prints the full-market total turnover to stdout, since
 * that single number doesn't belong in a per-commodity chart.
 */
import { readFileSync, writeFileSync } from 'fs';

interface Totals {
  valueLacs: number;
  volumeLots: number;
  oiLots: number;
}

/** Minimal RFC4180-ish CSV line splitter: handles double-quoted fields with embedded commas. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function toNumber(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : 0;
}

function main() {
  const [inputPath, outputPath, topNArg] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error('Usage: tsx scripts/mcx-turnover-from-bhavcopy.ts <input.csv> <output.csv> [topN]');
    process.exit(1);
  }
  const topN = topNArg ? parseInt(topNArg, 10) : 10;

  const raw = readFileSync(inputPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseCsvLine(lines[0]).map(h => h.trim());
  const col = (name: string) => header.indexOf(name);

  const symbolCol = col('Symbol');
  const valueCol = col('Value(Lacs)');
  const volumeCol = col('Volume(Lots)');
  const oiCol = col('Open Interest(Lots)');
  if ([symbolCol, valueCol, volumeCol, oiCol].some(i => i === -1)) {
    throw new Error('Unexpected bhavcopy header — expected Symbol, Value(Lacs), Volume(Lots), Open Interest(Lots) columns.');
  }

  const totals = new Map<string, Totals>();
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const symbol = (fields[symbolCol] || '').trim();
    if (!symbol) continue;
    const t = totals.get(symbol) ?? { valueLacs: 0, volumeLots: 0, oiLots: 0 };
    t.valueLacs += toNumber(fields[valueCol]);
    t.volumeLots += toNumber(fields[volumeCol]);
    t.oiLots += toNumber(fields[oiCol]);
    totals.set(symbol, t);
  }

  const totalMarketValueLacs = [...totals.values()].reduce((s, t) => s + t.valueLacs, 0);

  const rows = [...totals.entries()]
    .filter(([, t]) => t.valueLacs > 0)
    .sort((a, b) => b[1].valueLacs - a[1].valueLacs)
    .slice(0, topN);

  const out = ['symbol,value_lacs,volume_lots,oi_lots'];
  for (const [symbol, t] of rows) {
    out.push(`${symbol},${t.valueLacs.toFixed(2)},${t.volumeLots},${t.oiLots}`);
  }
  writeFileSync(outputPath, out.join('\n') + '\n');

  console.log(`Wrote ${rows.length} commodities to ${outputPath}`);
  console.log(`Full-market turnover: ₹${totalMarketValueLacs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} lacs across ${totals.size} commodities`);
}

main();
