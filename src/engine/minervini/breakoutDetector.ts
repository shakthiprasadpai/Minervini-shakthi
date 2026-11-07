import { PricePoint } from '../../types';
import { averageVolume, highestHigh } from './indicators';

export const BREAKOUT_VOLUME_MULTIPLE = 1.4;

/** Close above the pivot on volume >= 1.4x the prior 20-day average. Pass the VCP pivot when known. */
export function detectBreakout(candles: PricePoint[], pivotOverride?: number | null) {
  if (candles.length < 21) return { breakout: false, pivotPrice: (pivotOverride ?? null) as number | null, volumeRatio: 0 };
  const last = candles.length - 1, current = candles[last];
  const pivotPrice = pivotOverride ?? highestHigh(candles, last - 20, last - 1);
  const avgVolume = averageVolume(candles, last - 20, last - 1);
  const volumeRatio = avgVolume > 0 ? current.volume / avgVolume : 0;
  return { breakout: current.close > pivotPrice && volumeRatio >= BREAKOUT_VOLUME_MULTIPLE, pivotPrice, volumeRatio };
}
