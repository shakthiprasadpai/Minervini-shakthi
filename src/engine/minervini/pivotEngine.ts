import { PricePoint } from '../../types';
import { highestHigh } from './indicators';

/** Highest high of the `lookback` bars before the latest one. */
export function calculatePivot(candles: PricePoint[], lookback = 20) {
  if (candles.length <= lookback) return null;
  const last = candles.length - 1;
  return highestHigh(candles, last - lookback, last - 1);
}
