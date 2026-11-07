import type { PricePoint } from '../../types';
import type { MinerviniEngineResult, MinerviniInput } from './types';
import { evaluateTrendTemplate } from './trendTemplate';
import { analyzeVcp } from './vcpDetector';
import { detectBreakout } from './breakoutDetector';
import { approxRsRating, relativeStrengthScore } from './rsRating';
import { detectStage2 } from './stageAnalysis';
import { DEFAULT_ATR_MULTIPLE, calculateAtrStop } from './atrStop';
import { clamp } from './indicators';

export const BUY_ZONE_PERCENT = 5;
export const TARGET_1_R = 3;
export const TARGET_2_R = 5;
export const MIN_VCP_SCORE = 60;

export function runMinerviniEngine(input: MinerviniInput, benchmark?: PricePoint[]): MinerviniEngineResult {
  const history = input.priceHistory;
  const rsScore = benchmark ? relativeStrengthScore(history, benchmark) ?? undefined : undefined;
  const rsRating = input.rsRating ?? (rsScore !== undefined ? approxRsRating(rsScore) : undefined);

  const trend = evaluateTrendTemplate(history, rsRating);
  const vcp = analyzeVcp(history);
  const stage = detectStage2(history);

  const basePivot = input.pivotPrice ?? (vcp.detected ? vcp.pivotPrice : null);
  const breakout = detectBreakout(history, basePivot);
  const pivot = breakout.pivotPrice ?? undefined;

  const stopInfo = pivot
    ? input.stopLossPercent && input.stopLossPercent > 0
      ? { stop: pivot * (1 - input.stopLossPercent / 100), atr: null as number | null }
      : calculateAtrStop(pivot, history, input.atrMultiple ?? DEFAULT_ATR_MULTIPLE)
    : null;
  const stop = stopInfo?.stop;

  const buyZoneMax = pivot ? pivot * (1 + BUY_ZONE_PERCENT / 100) : undefined;
  const risk = pivot && stop ? pivot - stop : undefined;
  const target1 = pivot && risk ? pivot + risk * TARGET_1_R : undefined;
  const target2 = pivot && risk ? pivot + risk * TARGET_2_R : undefined;
  const riskReward = risk && target2 && pivot ? (target2 - pivot) / risk : undefined;

  const current = input.currentPrice;
  const breakoutStatus: MinerviniEngineResult['breakoutStatus'] = !pivot ? 'NO_PIVOT'
    : current > buyZoneMax! ? 'ABOVE_PIVOT' : current >= pivot ? 'IN_BUY_ZONE' : 'BELOW_PIVOT';

  const setupValid = stage.confirmed && trend.passed && vcp.score >= MIN_VCP_SCORE;
  const entryStatus: MinerviniEngineResult['entryStatus'] =
    setupValid && breakoutStatus === 'IN_BUY_ZONE' ? 'READY' : stage.confirmed ? 'WATCH' : 'INVALID';
  const exitStatus: MinerviniEngineResult['exitStatus'] =
    stop !== undefined && current <= stop ? 'EXIT' : trend.sma50 > 0 && current < trend.sma50 ? 'REDUCE' : 'HOLD';

  const lastDryUp = vcp.contractions.length ? vcp.contractions[vcp.contractions.length - 1].volumeDryUpPercent : 0;
  const volumeScore = Math.round(clamp(50 - lastDryUp * 2.5, 0, 100));
  const trendPart = trend.maxScore ? trend.score / trend.maxScore * 40 : 0;
  const overallScore = Math.round(trendPart + vcp.score * 0.25 + (rsRating ?? 50) / 99 * 20 + (stage.confirmed ? 15 : 0));

  return {
    ticker: input.ticker, trendTemplateScore: trend.score, trendTemplateMax: trend.maxScore, trendTemplatePassed: trend.passed,
    rsRating, rsScore, stage: stage.stage, vcpDetected: vcp.detected, vcpScore: vcp.score, contractions: vcp.contractions,
    volumeScore, breakoutStatus, pivotPrice: pivot, buyZoneMax, stopLoss: stop, target1, target2, riskReward,
    setupValid, entryStatus, exitStatus, overallScore,
    reasons: [
      `Trend Template: ${trend.score}/${trend.maxScore}${trend.rsAvailable ? '' : ' (RS rule not evaluated)'}`,
      `Stage: ${stage.stage}`, `VCP score: ${vcp.score}/100`, `RS Rating: ${rsRating ?? 'unavailable'}`,
      `Pivot: ${pivot !== undefined ? pivot.toFixed(2) : 'unavailable'}`,
      stopInfo && stop !== undefined ? `Stop: ${stop.toFixed(2)}${stopInfo.atr ? ` (ATR ${stopInfo.atr.toFixed(2)})` : ' (fixed %)'}` : 'Stop unavailable'
    ]
  };
}
