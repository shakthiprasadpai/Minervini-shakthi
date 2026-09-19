import { PricePoint } from '../../types';

export function detectBreakout(candles: PricePoint[]) {
  if (candles.length < 21) return { breakout: false, pivotPrice: null as number|null };
  const current = candles[candles.length-1], prior = candles.slice(-21,-1);
  const pivotPrice = Math.max(...prior.map(c=>c.high));
  const avgVolume = prior.reduce((s,c)=>s+c.volume,0)/prior.length;
  return { breakout: current.close > pivotPrice && current.volume >= avgVolume*1.4, pivotPrice };
}
