import { MinerviniTradeSetup, PricePoint } from '../../types';
import { MinerviniEngineResult } from './types';
import { calculateAtr } from './atrStop';
import { BUY_ZONE_PERCENT, TARGET_1_R, TARGET_2_R } from './minerviniEngine';
import { averageVolume, fiftyTwoWeekRange } from './indicators';

export function buildTradeSetup(ticker: string, name: string, exchange: 'NSE' | 'BSE' | 'MCX', history: PricePoint[], a: MinerviniEngineResult): MinerviniTradeSetup {
  const c = history[history.length - 1];
  const pivot = a.pivotPrice ?? c.close;
  const stop = a.stopLoss ?? pivot * 0.95;
  const risk = pivot - stop;
  const target1 = a.target1 ?? pivot + risk * TARGET_1_R;
  const target2 = a.target2 ?? pivot + risk * TARGET_2_R;
  const { high: high52w, low: low52w } = fiftyTwoWeekRange(history);
  const atr = calculateAtr(history);
  const last = history.length - 1;
  const lastContraction = a.contractions?.length ? a.contractions[a.contractions.length - 1] : undefined;
  const volumeDryUp = lastContraction?.volumeDryUpPercent ?? 0;
  return {
    ticker, name, exchange, sector: 'Unknown', industry: 'Unknown', currentPrice: c.close, changePercent: 0,
    sma50: c.sma50, sma150: c.sma150, sma200: c.sma200,
    sma200_1mo_ago: history[Math.max(0, history.length - 22)]?.sma200 ?? c.sma200,
    high52w, low52w, rsRating: a.rsRating ?? 0,
    patternType: a.vcpDetected ? (`VCP (${Math.min(4, Math.max(2, a.contractions?.length ?? 2))} Contractions)` as MinerviniTradeSetup['patternType']) : 'Pivot Pullback',
    vcpStage: a.breakoutStatus === 'ABOVE_PIVOT' || a.breakoutStatus === 'IN_BUY_ZONE' ? 'Active Breakout' : 'Breakout Pending',
    trendScore: a.trendTemplateScore,
    avgVolume20d: averageVolume(history, last - 19, last), pivotVolume: c.volume,
    pivotPrice: pivot, buyZoneMax: a.buyZoneMax ?? pivot * (1 + BUY_ZONE_PERCENT / 100),
    stopLossPrice: stop, stopLossPercent: (stop / pivot - 1) * 100,
    target1Price: target1, target1Percent: (target1 / pivot - 1) * 100,
    target2Price: target2, target2Percent: (target2 / pivot - 1) * 100,
    riskRewardRatio: a.riskReward ?? TARGET_2_R, volumeDryUpPercent: volumeDryUp, isTightVolume: volumeDryUp <= -20,
    contractions: a.contractions ?? [], priceHistory: history, sepaNotes: a.reasons.join(' | '),
    atr14: atr ?? undefined, atr14Percent: atr !== null && c.close > 0 ? atr / c.close * 100 : undefined
  };
}
