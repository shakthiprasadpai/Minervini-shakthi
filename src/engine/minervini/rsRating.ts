import { PricePoint } from '../../types';

const PERIODS = [63, 126, 252];
const WEIGHTS = [0.2, 0.3, 0.5];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function benchmarkCloseOnOrBefore(benchmark: PricePoint[], date: string): number | null {
  const key = date.slice(0, 10);
  let lo = 0, hi = benchmark.length - 1, found = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (benchmark[mid].date.slice(0, 10) <= key) { found = mid; lo = mid + 1; } else hi = mid - 1; }
  return found >= 0 ? benchmark[found].close : null;
}

/**
 * Weighted benchmark-relative performance over 3/6/12 months (raw score, 0 = in line with the benchmark).
 * Benchmark bars are aligned by date when both series use ISO dates, otherwise by position.
 * Normalised by the weights actually used, so a short history is not biased low.
 */
export function relativeStrengthScore(stock: PricePoint[], benchmark: PricePoint[]): number | null {
  if (!stock.length || !benchmark.length) return null;
  const last = stock.length - 1;
  const byDate = ISO_DATE.test(stock[last].date) && ISO_DATE.test(benchmark[benchmark.length - 1].date);
  const benchNow = byDate ? benchmarkCloseOnOrBefore(benchmark, stock[last].date) : benchmark[benchmark.length - 1].close;
  let score = 0, used = 0;
  PERIODS.forEach((period, k) => {
    if (stock.length <= period) return;
    const stockThen = stock[last - period].close, stockNow = stock[last].close;
    const benchThen = byDate ? benchmarkCloseOnOrBefore(benchmark, stock[last - period].date)
      : benchmark.length > period ? benchmark[benchmark.length - 1 - period].close : null;
    if (!(stockThen > 0) || !benchThen || !benchNow || benchThen <= 0) return;
    score += ((1 + (stockNow / stockThen - 1)) / (1 + (benchNow / benchThen - 1)) - 1) * WEIGHTS[k];
    used += WEIGHTS[k];
  });
  return used ? score / used : null;
}

/** Percentile rank of each raw score across the universe -> 1..99 (ties share the average rank). Null/NaN stay undefined. A lone score gets 50. */
export function rankRsRatings(scores: Array<number | null | undefined>): Array<number | undefined> {
  const valid = scores.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  const n = valid.length;
  const lowerBound = (x: number) => { let l = 0, h = n; while (l < h) { const m = (l + h) >> 1; if (valid[m] < x) l = m + 1; else h = m; } return l; };
  const upperBound = (x: number) => { let l = 0, h = n; while (l < h) { const m = (l + h) >> 1; if (valid[m] <= x) l = m + 1; else h = m; } return l; };
  return scores.map(v => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
    if (n === 1) return 50;
    const below = lowerBound(v), equal = upperBound(v) - below;
    return Math.round(((below + (equal - 1) / 2) / (n - 1)) * 98) + 1;
  });
}

/** Rough 1..99 rating for one stock when no universe exists to rank against (e.g. the live tick feed). Not a true percentile. */
export function approxRsRating(rawScore: number): number {
  return Math.min(99, Math.max(1, Math.round(50 + 49 * Math.tanh(rawScore / 0.35))));
}
