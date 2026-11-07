import { PricePoint } from '../../types';
import { clamp } from './indicators';

export const DEFAULT_ATR_MULTIPLE = 2;
export const STOP_MIN_PERCENT = 5;
export const STOP_MAX_PERCENT = 8;

export function calculateAtr(candles: PricePoint[], period = 14) {
  if (candles.length < period + 1) return null;
  let sum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const c = candles[i], prevClose = candles[i - 1].close;
    sum += Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  }
  return sum / period;
}

/** Stop distance = clamp(ATR x multiple, 5%..8% of entry): the floor avoids noise stop-outs, the cap keeps loss within Minervini's ~8%. */
export function calculateAtrStop(entry: number, candles: PricePoint[], atrMultiple = DEFAULT_ATR_MULTIPLE, opts: { minPercent?: number; maxPercent?: number } = {}) {
  const atr = calculateAtr(candles);
  if (atr === null || !(entry > 0)) return null;
  const minD = entry * (opts.minPercent ?? STOP_MIN_PERCENT) / 100, maxD = entry * (opts.maxPercent ?? STOP_MAX_PERCENT) / 100;
  const raw = atr * atrMultiple, distance = clamp(raw, minD, maxD);
  return { atr, stop: Math.max(0, entry - distance), atrPercent: atr / entry * 100, stopPercent: distance / entry * 100, limitedBy: raw < minD ? ('MIN' as const) : raw > maxD ? ('MAX' as const) : null };
}
