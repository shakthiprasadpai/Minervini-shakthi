import { PricePoint } from '../../types';
import { MIN_TREND_BARS, fiftyTwoWeekRange, smaAt } from './indicators';

export const TREND_TEMPLATE_MIN_RS = 70;
export const TREND_SLOPE_LOOKBACK_BARS = 22;

export interface TrendTemplateRuleResult { id: number; title: string; passed: boolean | null }
export interface TrendTemplateResult {
  passed: boolean;
  score: number;
  /** Rules that could be evaluated: 8, or 7 when no RS rating was supplied. */
  maxScore: number;
  rsAvailable: boolean;
  rules: TrendTemplateRuleResult[];
  reasons: string[];
  sma50: number; sma150: number; sma200: number;
}

const insufficient = (reason: string): TrendTemplateResult => ({
  passed: false, score: 0, maxScore: 8, rsAvailable: false, rules: [], reasons: [reason], sma50: 0, sma150: 0, sma200: 0
});

/**
 * Minervini's 8-point Trend Template:
 * 1 price > 150 & 200 SMA | 2 150 SMA > 200 SMA | 3 200 SMA rising >= 1 month | 4 50 SMA > 150 & 200 SMA
 * 5 price > 50 SMA | 6 price >= 30% above 52w low | 7 price within 25% of 52w high | 8 RS rating >= 70
 */
export function evaluateTrendTemplate(candles: PricePoint[], rsRating?: number | null): TrendTemplateResult {
  if (candles.length < MIN_TREND_BARS) return insufficient(`At least ${MIN_TREND_BARS} daily candles are required (have ${candles.length}).`);
  const i = candles.length - 1, price = candles[i].close;
  const sma50 = smaAt(candles, i, 50), sma150 = smaAt(candles, i, 150), sma200 = smaAt(candles, i, 200);
  const priorSma200 = smaAt(candles, i - TREND_SLOPE_LOOKBACK_BARS, 200);
  if (sma50 === null || sma150 === null || sma200 === null || priorSma200 === null) return insufficient('Not enough history for the moving averages.');
  const { high: high52, low: low52 } = fiftyTwoWeekRange(candles);
  const rsAvailable = typeof rsRating === 'number' && Number.isFinite(rsRating);

  const rules: TrendTemplateRuleResult[] = [
    { id: 1, title: 'Price above 150-day and 200-day SMA', passed: price > sma150 && price > sma200 },
    { id: 2, title: '150-day SMA above 200-day SMA', passed: sma150 > sma200 },
    { id: 3, title: '200-day SMA rising for at least 1 month', passed: sma200 > priorSma200 },
    { id: 4, title: '50-day SMA above 150-day and 200-day SMA', passed: sma50 > sma150 && sma50 > sma200 },
    { id: 5, title: 'Price above 50-day SMA', passed: price > sma50 },
    { id: 6, title: 'Price at least 30% above 52-week low', passed: price >= low52 * 1.3 },
    { id: 7, title: 'Price within 25% of 52-week high', passed: price >= high52 * 0.75 },
    { id: 8, title: `RS rating >= ${TREND_TEMPLATE_MIN_RS}`, passed: rsAvailable ? (rsRating as number) >= TREND_TEMPLATE_MIN_RS : null }
  ];
  const evaluated = rules.filter(r => r.passed !== null);
  const score = evaluated.filter(r => r.passed).length;
  return {
    passed: evaluated.every(r => r.passed), score, maxScore: evaluated.length, rsAvailable, rules,
    reasons: rules.map(r => `Rule ${r.id}: ${r.passed === null ? 'N/A (no RS rating)' : r.passed ? 'PASS' : 'FAIL'}`),
    sma50, sma150, sma200
  };
}
