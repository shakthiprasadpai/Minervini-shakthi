import { PricePoint } from '../../types';

const sma = (candles: PricePoint[], endIndex: number, period: number) => {
  const start = Math.max(0, endIndex - period + 1);
  const values = candles.slice(start, endIndex + 1).map(x => x.close);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

export function detectStage2(candles: PricePoint[]) {
  if (candles.length < 200) return { stage: 'UNKNOWN' as const, confirmed: false };

  const i = candles.length - 1;
  const c = candles[i];
  const sma50 = sma(candles, i, 50);
  const sma150 = sma(candles, i, 150);
  const sma200 = sma(candles, i, 200);
  const priorSma200 = sma(candles, Math.max(0, i - 22), 200);
  const recent = candles.slice(-63);
  const above200 = recent.filter((_, offset) => {
    const index = candles.length - recent.length + offset;
    return candles[index].close > sma(candles, index, 200);
  }).length / recent.length;

  const confirmed =
    c.close > sma200 &&
    sma50 > sma150 &&
    sma150 > sma200 &&
    sma200 > priorSma200 &&
    above200 >= 0.70;

  return { stage: confirmed ? 'STAGE_2' : 'NOT_STAGE_2' as const, confirmed };
}
