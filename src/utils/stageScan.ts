import type { MinerviniTradeSetup } from '../types';

/**
 * Stage 4 is the mirror image of Minervini's Stage 2 trend template: a stock in a
 * confirmed downtrend. Each rule below is the inverse of one trend-template rule.
 */
export interface BearRule { id: string; label: string; passed: boolean }

export interface BearScan {
  rules: BearRule[];
  score: number;
  isStage4: boolean;
}

export function bearRules(s: MinerviniTradeSetup): BearRule[] {
  const p = s.currentPrice;
  const ok = (v: number) => Number.isFinite(v) && v > 0;
  const has = ok(p) && ok(s.sma50) && ok(s.sma150) && ok(s.sma200) && ok(s.high52w) && ok(s.low52w);
  const r = (id: string, label: string, passed: boolean): BearRule => ({ id, label, passed: has && passed });
  return [
    r('below150_200', 'Price below the 150 and 200-day averages', p < s.sma150 && p < s.sma200),
    r('150_below_200', '150-day average below the 200-day', s.sma150 < s.sma200),
    r('200_falling', '200-day average falling', ok(s.sma200_1mo_ago) && s.sma200 < s.sma200_1mo_ago),
    r('50_below_150', '50-day average below the 150 and 200-day', s.sma50 < s.sma150 && s.sma50 < s.sma200),
    r('below50', 'Price below the 50-day average', p < s.sma50),
    r('off_high', 'Price at least 25% under the 52-week high', p <= s.high52w * 0.75),
    r('near_low', 'Price within 30% of the 52-week low', p <= s.low52w * 1.3),
    r('weak_rs', 'Relative strength below 40', (s.rsRating ?? 50) < 40)
  ];
}

export function scanBear(s: MinerviniTradeSetup): BearScan {
  const rules = bearRules(s);
  const score = rules.filter(x => x.passed).length;
  return { rules, score, isStage4: score === rules.length };
}

export interface ShortPlan { trigger: number; stop: number; target: number; riskPercent: number; rewardRisk: number }

/**
 * Short plan from the last `lookback` daily bars: sell below the recent low, stop above the recent high
 * (never wider than 8%), target at twice the risk. Null without enough history.
 */
export function shortPlan(s: MinerviniTradeSetup, lookback = 10): ShortPlan | null {
  const bars = (s.priceHistory ?? []).slice(-lookback);
  if (bars.length < Math.min(lookback, 5)) return null;
  const trigger = Math.min(...bars.map(b => b.low));
  const recentHigh = Math.max(...bars.map(b => b.high));
  if (!(trigger > 0) || !(recentHigh > trigger)) return null;
  const stop = Math.min(recentHigh * 1.005, trigger * 1.08);
  const risk = stop - trigger;
  const target = trigger - 2 * risk;
  if (target <= 0) return null;
  return { trigger, stop, target, riskPercent: (risk / trigger) * 100, rewardRisk: 2 };
}

export type StageView = 'STAGE_2' | 'STAGE_4';

/** Stocks for the scanner, best first: Stage 2 by RS rating, Stage 4 by weakest RS then deepest rule score. */
export function stageList(stocks: MinerviniTradeSetup[], view: StageView, limit = 50): MinerviniTradeSetup[] {
  const list = view === 'STAGE_2'
    ? stocks.filter(s => s.trendScore >= 8)
    : stocks.filter(s => scanBear(s).isStage4);
  return [...list]
    .sort((a, b) => view === 'STAGE_2' ? (b.rsRating ?? 0) - (a.rsRating ?? 0) : (a.rsRating ?? 100) - (b.rsRating ?? 100))
    .slice(0, limit);
}
