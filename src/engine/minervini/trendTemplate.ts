import { PricePoint } from '../../types';

const sma = (candles: PricePoint[], endIndex: number, period: number) => {
  const start = Math.max(0, endIndex - period + 1);
  const values = candles.slice(start, endIndex + 1).map(x => x.close);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

export function evaluateTrendTemplate(candles: PricePoint[]) {
  if (candles.length < 200) {
    return { passed: false, score: 0, reasons: ['At least 200 daily candles are required.'], sma50: 0, sma150: 0, sma200: 0 };
  }

  const i = candles.length - 1;
  const c = candles[i];
  const sma50 = sma(candles, i, 50);
  const sma150 = sma(candles, i, 150);
  const sma200 = sma(candles, i, 200);
  const priorSma200 = sma(candles, Math.max(0, i - 22), 200);
  const year = candles.slice(-252);
  const high52 = Math.max(...year.map(x => x.high));
  const low52 = Math.min(...year.map(x => x.low));

  const checks = [
    c.close > sma150,
    c.close > sma200,
    sma150 > sma200,
    sma200 > priorSma200,
    sma50 > sma150,
    sma50 > sma200,
    c.close >= high52 * 0.75,
    c.close >= low52 * 1.30
  ];

  return {
    passed: checks.every(Boolean),
    score: checks.filter(Boolean).length,
    reasons: checks.map((v, idx) => `Rule ${idx + 1}: ${v ? 'PASS' : 'FAIL'}`),
    sma50,
    sma150,
    sma200
  };
}
