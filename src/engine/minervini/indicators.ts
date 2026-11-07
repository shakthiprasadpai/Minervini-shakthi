import type { PricePoint } from '../../types';

/** Minimum daily bars the Trend Template needs: 200-day SMA plus ~1 month to measure its slope. */
export const MIN_TREND_BARS = 222;
export const TRADING_DAYS_1Y = 252;

/** SMA of closes ending at `endIndex`. Returns null if there are not enough bars (never averages a short window). */
export function smaAt(candles: PricePoint[], endIndex: number, period: number): number | null {
  if (period <= 0 || endIndex < period - 1 || endIndex >= candles.length) return null;
  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) sum += candles[i].close;
  return sum / period;
}

/** Loop-based (no spread), so it is safe for very long series. */
export function highestHigh(candles: PricePoint[], from = 0, to = candles.length - 1): number {
  let best = -Infinity;
  for (let i = Math.max(0, from); i <= Math.min(to, candles.length - 1); i++) if (candles[i].high > best) best = candles[i].high;
  return best;
}
export function lowestLow(candles: PricePoint[], from = 0, to = candles.length - 1): number {
  let best = Infinity;
  for (let i = Math.max(0, from); i <= Math.min(to, candles.length - 1); i++) if (candles[i].low < best) best = candles[i].low;
  return best;
}
export function averageVolume(candles: PricePoint[], from: number, to: number): number {
  const start = Math.max(0, from), end = Math.min(to, candles.length - 1);
  if (end < start) return 0;
  let sum = 0;
  for (let i = start; i <= end; i++) sum += candles[i].volume;
  return sum / (end - start + 1);
}
export function fiftyTwoWeekRange(candles: PricePoint[]): { high: number; low: number } {
  const to = candles.length - 1, from = Math.max(0, candles.length - TRADING_DAYS_1Y);
  return { high: highestHigh(candles, from, to), low: lowestLow(candles, from, to) };
}
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
