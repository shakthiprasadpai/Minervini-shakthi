import { PricePoint } from '../../types';

export function detectVcp(candles: PricePoint[]) {
  if (candles.length < 60) return { detected: false, score: 0 };
  const r = candles.slice(-60);
  const avg = (a: PricePoint[]) => a.reduce((s,c)=>s+c.high>0?(s+(c.high-c.low)/c.high*100):s,0)/a.length;
  const firstRange = avg(r.slice(0,20)), lastRange = avg(r.slice(-20));
  const firstVol = r.slice(0,20).reduce((s,c)=>s+c.volume,0)/20;
  const lastVol = r.slice(-20).reduce((s,c)=>s+c.volume,0)/20;
  const range = lastRange < firstRange * .75, volume = lastVol < firstVol * .75;
  return { detected: range && volume, score: (range?50:0)+(volume?50:0) };
}
