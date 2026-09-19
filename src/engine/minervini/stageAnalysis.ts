import { PricePoint } from '../../types';

export function detectStage2(candles: PricePoint[]) {
  if(candles.length<200) return {stage:'UNKNOWN' as const, confirmed:false};
  const c=candles[candles.length-1];
  const sma200=c.sma200;
  const rising200=c.sma200>candles[Math.max(0,candles.length-22)].sma200;
  const recent=candles.slice(-63);
  const above200=recent.filter(x=>x.close>x.sma200).length/recent.length;
  const confirmed=c.close>sma200 && c.sma50>c.sma150 && c.sma150>sma200 && rising200 && above200>=0.7;
  return {stage:confirmed?'STAGE_2':'NOT_STAGE_2' as const,confirmed};
}
