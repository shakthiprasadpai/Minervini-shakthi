import { PricePoint } from '../../types';

export function evaluateTrendTemplate(candles: PricePoint[]) {
  if(candles.length<200) return {passed:false,score:0,reasons:['At least 200 daily candles are required.'],sma50:undefined,sma150:undefined,sma200:undefined};
  const c=candles[candles.length-1], ago=candles[Math.max(0,candles.length-22)];
  const year=candles.slice(-252);
  const high52=Math.max(...year.map(x=>x.high)), low52=Math.min(...year.map(x=>x.low));
  const checks=[c.close>c.sma150,c.close>c.sma200,c.sma150>c.sma200,c.sma200>ago.sma200,c.sma50>c.sma150,c.sma50>c.sma200,c.close>=high52*.75,c.close>=low52*1.3];
  return {passed:checks.every(Boolean),score:checks.filter(Boolean).length,reasons:checks.map((v,i)=>`Rule ${i+1}: ${v?'PASS':'FAIL'}`),sma50:c.sma50,sma150:c.sma150,sma200:c.sma200};
}