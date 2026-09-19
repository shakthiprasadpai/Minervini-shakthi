import { PricePoint } from '../../types';

export function calculateAtr(candles: PricePoint[], period=14) {
  if(candles.length<period+1) return null;
  const tr=candles.slice(1).map((c,i)=>Math.max(c.high-c.low,Math.abs(c.high-candles[i].close),Math.abs(c.low-candles[i].close)));
  const r=tr.slice(-period);
  return r.reduce((a,b)=>a+b,0)/r.length;
}

export function calculateAtrStop(entry:number,candles:PricePoint[],atrMultiple=1.5) {
  const atr=calculateAtr(candles);
  if(atr===null) return null;
  return {atr, stop:Math.max(0,entry-atr*atrMultiple), atrPercent:atr/entry*100};
}
