import { PricePoint } from '../../types';

export function evaluateTrendTemplate(candles: PricePoint[]) {
  if (candles.length < 200) return { passed: false, score: 0, reasons: ['At least 200 daily candles are required.'] };
  const c = candles[candles.length - 1];
  const sma200Ago = candles[Math.max(0, candles.length - 22)].sma200;
  const year = candles.slice(-252);
  const high52 = Math.max(...year.map(x => x.high));
  const low52 = Math.min(...year.map(x => x.low));
  const checks = [
    c.close > c.sma150, c.close > c.sma200, c.sma150 > c.sma200,
    c.sma200 > sma200Ago, c.sma50 > c.sma150, c.close > c.sma50,
    c.close >= low52 * 1.30, c.close >= high52 * 0.75
  ];
  return { passed: checks.every(Boolean), score: checks.filter(Boolean).length, reasons: checks.map((v,i)=>`Rule ${i+1}: ${v?'PASS':'FAIL'}`) };
}
