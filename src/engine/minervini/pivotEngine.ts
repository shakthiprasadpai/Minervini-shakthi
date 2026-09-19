import { PricePoint } from '../../types';

export function calculatePivot(candles: PricePoint[], lookback = 20) {
  if (candles.length <= lookback) return null;
  const prior = candles.slice(-(lookback+1),-1);
  return Math.max(...prior.map(c=>c.high));
}
