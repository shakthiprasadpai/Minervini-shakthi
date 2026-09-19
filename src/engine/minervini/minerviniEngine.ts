import type { PricePoint } from '../../types';
import type { MinerviniEngineResult, MinerviniInput } from './types';

const sma = (values: number[], period: number) =>
  values.length < period ? undefined : values.slice(-period).reduce((a, b) => a + b, 0) / period;

const atr = (history: PricePoint[], period = 14) => {
  if (history.length < period + 1) return undefined;
  const ranges = history.slice(1).map((c, i) => {
    const prev = history[i].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  });
  const recent = ranges.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
};

function trendTemplate(input: MinerviniInput) {
  const closes = input.priceHistory.map(x => x.close);
  const c = input.currentPrice;
  const sma50 = sma(closes, 50);
  const sma150 = sma(closes, 150);
  const sma200 = sma(closes, 200);
  const prior200 = closes.length >= 220 ? sma(closes.slice(0, -20), 200) : undefined;
  const high52 = Math.max(...input.priceHistory.slice(-252).map(x => x.high));
  const low52 = Math.min(...input.priceHistory.slice(-252).map(x => x.low));

  const checks = [
    c > (sma150 ?? Infinity),
    c > (sma200 ?? Infinity),
    (sma150 ?? 0) > (sma200 ?? Infinity),
    (sma200 ?? 0) > (prior200 ?? -Infinity),
    (sma50 ?? 0) > (sma150 ?? Infinity),
    (sma50 ?? 0) > (sma200 ?? Infinity),
    c >= high52 * 0.75,
    c >= low52 * 1.30,
  ];
  const score = checks.filter(Boolean).length;
  return { score, passed: score >= 7, sma50, sma150, sma200 };
}

function volumeScore(history: PricePoint[]) {
  if (history.length < 20) return 0;
  const recent = history.slice(-5).reduce((s, x) => s + x.volume, 0) / 5;
  const avg20 = history.slice(-20).reduce((s, x) => s + x.volume, 0) / 20;
  if (!avg20) return 0;
  const ratio = recent / avg20;
  return Math.max(0, Math.min(100, Math.round((1 - Math.min(ratio, 1.5) / 1.5) * 100)));
}

function detectVcp(history: PricePoint[]) {
  if (history.length < 40) return { detected: false, score: 0 };
  const chunks = [20, 10, 5];
  const depths = chunks.map((n, i) => {
    const end = history.slice(-(i === 0 ? 20 : i === 1 ? 10 : 5));
    const hi = Math.max(...end.map(x => x.high));
    const lo = Math.min(...end.map(x => x.low));
    return hi ? (hi - lo) / hi : 1;
  });
  const contracting = depths[2] < depths[1] && depths[1] < depths[0];
  const score = contracting ? 80 : 35;
  return { detected: contracting, score };
}

export function runMinerviniEngine(input: MinerviniInput): MinerviniEngineResult {
  const t = trendTemplate(input);
  const v = detectVcp(input.priceHistory);
  const vol = volumeScore(input.priceHistory);
  const pivot = input.pivotPrice;
  const buyZoneMax = pivot ? pivot * 1.02 : undefined;
  const stop = pivot && input.stopLossPercent ? pivot * (1 - input.stopLossPercent / 100) : undefined;
  const risk = pivot && stop ? pivot - stop : undefined;
  const target1 = pivot && risk ? pivot + risk * 3 : undefined;
  const target2 = pivot && risk ? pivot + risk * 5 : undefined;
  const rr = risk && target2 ? (target2 - pivot) / risk : undefined;

  let breakoutStatus: MinerviniEngineResult['breakoutStatus'] = 'NO_PIVOT';
  if (pivot) {
    breakoutStatus = input.currentPrice > buyZoneMax! ? 'ABOVE_PIVOT' :
      input.currentPrice >= pivot ? 'IN_BUY_ZONE' : 'BELOW_PIVOT';
  }

  const reasons: string[] = [];
  reasons.push(`Trend Template: ${t.score}/8`);
  reasons.push(`VCP structure: ${v.detected ? 'detected' : 'not confirmed'}`);
  reasons.push(`Volume score: ${vol}/100`);
  if (input.rsRating !== undefined) reasons.push(`RS Rating: ${input.rsRating}`);

  const overallScore = Math.round(
    t.score / 8 * 50 + v.score * 0.25 + vol * 0.15 + ((input.rsRating ?? 50) / 99) * 10
  );
  const entryStatus = t.passed && (v.detected || vol >= 60) && breakoutStatus !== 'BELOW_PIVOT'
    ? 'READY' : t.passed ? 'WATCH' : 'INVALID';

  return {
    ticker: input.ticker,
    trendTemplateScore: t.score,
    trendTemplatePassed: t.passed,
    rsRating: input.rsRating,
    stage: t.passed ? 'STAGE_2' : 'NOT_STAGE_2',
    vcpDetected: v.detected,
    vcpScore: v.score,
    volumeScore: vol,
    breakoutStatus,
    pivotPrice: pivot,
    buyZoneMax,
    stopLoss: stop,
    target1,
    target2,
    riskReward: rr,
    entryStatus,
    exitStatus: input.currentPrice < (t.sma50 ?? 0) ? 'EXIT' : 'HOLD',
    overallScore,
    reasons,
  };
}

export type { PricePoint };
