import { PricePoint } from '../../types';
import { MIN_TREND_BARS, smaAt } from './indicators';
import { TREND_SLOPE_LOOKBACK_BARS } from './trendTemplate';

const STAGE_LOOKBACK_BARS = 63;
const MIN_SHARE_ABOVE_200 = 0.7;

export function detectStage2(candles: PricePoint[]) {
  if (candles.length < MIN_TREND_BARS) return { stage: 'UNKNOWN' as const, confirmed: false };
  const i = candles.length - 1, close = candles[i].close;
  const sma50 = smaAt(candles, i, 50), sma150 = smaAt(candles, i, 150), sma200 = smaAt(candles, i, 200);
  const priorSma200 = smaAt(candles, i - TREND_SLOPE_LOOKBACK_BARS, 200);
  if (sma50 === null || sma150 === null || sma200 === null || priorSma200 === null) return { stage: 'UNKNOWN' as const, confirmed: false };

  let counted = 0, above = 0;
  for (let k = Math.max(0, candles.length - STAGE_LOOKBACK_BARS); k < candles.length; k++) {
    const s = smaAt(candles, k, 200);
    if (s === null) continue;
    counted++;
    if (candles[k].close > s) above++;
  }
  const shareAbove200 = counted ? above / counted : 0;
  const confirmed = close > sma200 && sma50 > sma150 && sma150 > sma200 && sma200 > priorSma200 && shareAbove200 >= MIN_SHARE_ABOVE_200;
  return { stage: confirmed ? ('STAGE_2' as const) : ('NOT_STAGE_2' as const), confirmed };
}
