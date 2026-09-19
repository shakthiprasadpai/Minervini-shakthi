import { TrendTemplateRule, MinerviniTradeSetup, PositionSizeResult } from '../types';

export function evaluateTrendTemplate(setup: {
  currentPrice: number;
  sma50: number;
  sma150: number;
  sma200: number;
  sma200_1mo_ago: number;
  high52w: number;
  low52w: number;
  rsRating: number;
}): { rules: TrendTemplateRule[]; passedCount: number } {
  const {
    currentPrice,
    sma50,
    sma150,
    sma200,
    sma200_1mo_ago,
    high52w,
    low52w,
    rsRating
  } = setup;

  const pctAboveLow52 = ((currentPrice - low52w) / low52w) * 100;
  const pctFromHigh52 = ((high52w - currentPrice) / high52w) * 100;

  const rules: TrendTemplateRule[] = [
    {
      id: 'rule_1',
      title: '1. Price Above 150-day & 200-day SMA',
      description: 'Current price must be above both the 150-day and 200-day key moving averages.',
      passed: currentPrice > sma150 && currentPrice > sma200,
      actualValueStr: `$${currentPrice.toFixed(2)}`,
      requiredConditionStr: `> $${sma150.toFixed(2)} (150MA) & $${sma200.toFixed(2)} (200MA)`
    },
    {
      id: 'rule_2',
      title: '2. 150-day SMA Above 200-day SMA',
      description: '150-day moving average must be above the 200-day moving average.',
      passed: sma150 > sma200,
      actualValueStr: `150MA: $${sma150.toFixed(2)}`,
      requiredConditionStr: `> 200MA: $${sma200.toFixed(2)}`
    },
    {
      id: 'rule_3',
      title: '3. 200-day SMA Trending Upward',
      description: '200-day moving average must be sloping upward for at least 1 month.',
      passed: sma200 > sma200_1mo_ago,
      actualValueStr: `Now $${sma200.toFixed(2)} vs 1Mo Ago $${sma200_1mo_ago.toFixed(2)}`,
      requiredConditionStr: `Current 200MA > 1 Month Ago`
    },
    {
      id: 'rule_4',
      title: '4. 50-day SMA Above 150-day & 200-day SMA',
      description: '50-day moving average must be above both 150-day and 200-day moving averages.',
      passed: sma50 > sma150 && sma50 > sma200,
      actualValueStr: `50MA: $${sma50.toFixed(2)}`,
      requiredConditionStr: `> $${sma150.toFixed(2)} (150MA) & $${sma200.toFixed(2)} (200MA)`
    },
    {
      id: 'rule_5',
      title: '5. Price Above 50-day SMA',
      description: 'Current stock price must be trading above the 50-day moving average.',
      passed: currentPrice > sma50,
      actualValueStr: `Price $${currentPrice.toFixed(2)}`,
      requiredConditionStr: `> 50MA: $${sma50.toFixed(2)}`
    },
    {
      id: 'rule_6',
      title: '6. Price At Least 30% Above 52-Week Low',
      description: 'Current price must be at least 30% above its 52-week low level (Stage 2 confirmation).',
      passed: pctAboveLow52 >= 30,
      actualValueStr: `+${pctAboveLow52.toFixed(1)}% above 52W Low ($${low52w.toFixed(2)})`,
      requiredConditionStr: `≥ +30% above $${(low52w * 1.3).toFixed(2)}`
    },
    {
      id: 'rule_7',
      title: '7. Price Within 25% of 52-Week High',
      description: 'Current price must be within 25% of its 52-week high (near leadership breakout).',
      passed: pctFromHigh52 <= 25,
      actualValueStr: `${pctFromHigh52.toFixed(1)}% off 52W High ($${high52w.toFixed(2)})`,
      requiredConditionStr: `Within 25% of High (≥ $${(high52w * 0.75).toFixed(2)})`
    },
    {
      id: 'rule_8',
      title: '8. Relative Strength (RS) Rating ≥ 70',
      description: 'IBD/Minervini RS Rating must be 70 or higher (outperforming 70%+ of market).',
      passed: rsRating >= 70,
      actualValueStr: `RS Rating: ${rsRating}`,
      requiredConditionStr: `RS Rating ≥ 70`
    }
  ];

  const passedCount = rules.filter(r => r.passed).length;
  return { rules, passedCount };
}

export interface TrendReadinessScoreResult {
  passedCount: number;
  totalCount: number;
  scorePercent: number;
  readinessLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  rules: TrendTemplateRule[];
}

export function calculateTrendReadinessScore(setup: {
  currentPrice: number;
  sma50: number;
  sma150: number;
  sma200: number;
  sma200_1mo_ago: number;
  high52w: number;
  low52w: number;
  rsRating: number;
}): TrendReadinessScoreResult {
  const { rules, passedCount } = evaluateTrendTemplate(setup);
  const totalCount = rules.length;
  const scorePercent = Math.round((passedCount / totalCount) * 100);

  let readinessLabel = 'Low Trend Readiness';
  let badgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
  let badgeText = 'text-rose-800';
  let badgeBorder = 'border-rose-300';

  if (passedCount === 8) {
    readinessLabel = 'Perfect Stage 2 Leader';
    badgeBg = 'bg-emerald-950 text-amber-300 border-amber-500 font-bold';
    badgeText = 'text-amber-300';
    badgeBorder = 'border-amber-500';
  } else if (passedCount >= 6) {
    readinessLabel = 'High Trend Readiness';
    badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    badgeText = 'text-emerald-800';
    badgeBorder = 'border-emerald-300';
  } else if (passedCount >= 4) {
    readinessLabel = 'Moderate Trend Readiness';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-300';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-300';
  }

  return {
    passedCount,
    totalCount,
    scorePercent,
    readinessLabel,
    badgeBg,
    badgeText,
    badgeBorder,
    rules
  };
}

export function calculatePositionSize(
  accountCapital: number,
  riskTolerancePercent: number, // e.g. 1% of account
  entryPrice: number,
  stopPrice: number
): PositionSizeResult {
  const riskAmount = accountCapital * (riskTolerancePercent / 100);
  const riskPerShare = Math.max(0.01, entryPrice - stopPrice);
  const rawShares = Math.floor(riskAmount / riskPerShare);
  
  // Cap max position size at 25% of portfolio (Minervini standard position is 10-25%)
  const maxPositionCapShares = Math.floor((accountCapital * 0.25) / entryPrice);
  const shareQuantity = Math.min(rawShares, maxPositionCapShares);

  const totalPositionCost = shareQuantity * entryPrice;
  const portfolioAllocationPercent = accountCapital > 0 ? (totalPositionCost / accountCapital) * 100 : 0;

  return {
    accountCapital,
    riskTolerancePercent,
    riskAmount,
    entryPrice,
    stopPrice,
    riskPerShare,
    shareQuantity,
    totalPositionCost,
    portfolioAllocationPercent
  };
}

export function getCurrencySymbol(exchange?: string): string {
  return exchange === 'NSE' || exchange === 'BSE' || exchange === 'MCX' ? 'Rs. ' : '
}

export function formatCurrency(num: number | undefined | null, symbol = '$', decimals?: number): string {
  if (num === undefined || num === null || isNaN(num)) {
    return `${symbol}0.00`;
  }
  if (decimals !== undefined) {
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (num >= 10000) {
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${num.toFixed(2)}`;
}

export interface BreakoutProbabilityResult {
  score: number; // 0 to 99%
  rating: 'EXCEPTIONALLY HIGH (INSTITUTIONAL)' | 'HIGH BREAKOUT PROBABILITY' | 'MODERATE / AVERAGE' | 'LOW PROBABILITY / HIGH SLIPPAGE';
  vcpTightnessScore: number; // max 35
  volumeDryUpScore: number; // max 30
  rsLeadershipScore: number; // max 20
  trendAlignmentScore: number; // max 15
  factors: {
    finalContractionDepth: number;
    volumeDryUpPercent: number;
    rsRating: number;
    trendScore: number;
    squeezeCompressionPercent: number;
  };
}

export function calculateBreakoutProbability(stock: MinerviniTradeSetup): BreakoutProbabilityResult {
  const initialDepth = stock.contractions.length > 0 ? stock.contractions[0].depthPercent : 15;
  const finalDepth = stock.contractions.length > 0 ? stock.contractions[stock.contractions.length - 1].depthPercent : 8;
  const squeezeCompressionPercent = initialDepth > 0
    ? Math.max(0, ((initialDepth - finalDepth) / initialDepth) * 100)
    : 0;

  // 1. VCP Contraction Tightness (Max 35 Pts)
  let vcpTightnessScore = 0;
  if (finalDepth <= 3.5) {
    vcpTightnessScore += 25;
  } else if (finalDepth <= 6.0) {
    vcpTightnessScore += 18;
  } else if (finalDepth <= 10.0) {
    vcpTightnessScore += 12;
  } else {
    vcpTightnessScore += 5;
  }

  if (squeezeCompressionPercent >= 70) {
    vcpTightnessScore += 10;
  } else if (squeezeCompressionPercent >= 50) {
    vcpTightnessScore += 7;
  } else if (squeezeCompressionPercent >= 30) {
    vcpTightnessScore += 4;
  }
  vcpTightnessScore = Math.min(35, vcpTightnessScore);

  // 2. Volume Dry-Up & Contraction Trend (Max 30 Pts)
  let volumeDryUpScore = 0;
  const volDryUpAbs = Math.abs(stock.volumeDryUpPercent);
  if (stock.volumeDryUpPercent <= -60 || volDryUpAbs >= 60) {
    volumeDryUpScore += 20;
  } else if (stock.volumeDryUpPercent <= -40 || volDryUpAbs >= 40) {
    volumeDryUpScore += 15;
  } else if (stock.volumeDryUpPercent <= -25 || volDryUpAbs >= 25) {
    volumeDryUpScore += 10;
  } else {
    volumeDryUpScore += 5;
  }

  if (stock.isTightVolume) {
    volumeDryUpScore += 10;
  }
  volumeDryUpScore = Math.min(30, volumeDryUpScore);

  // 3. RS Leadership (Max 20 Pts)
  let rsLeadershipScore = 0;
  if (stock.rsRating >= 95) {
    rsLeadershipScore = 20;
  } else if (stock.rsRating >= 90) {
    rsLeadershipScore = 17;
  } else if (stock.rsRating >= 80) {
    rsLeadershipScore = 13;
  } else if (stock.rsRating >= 70) {
    rsLeadershipScore = 8;
  } else {
    rsLeadershipScore = 4;
  }

  // 4. Trend Alignment (Max 15 Pts)
  const trendScoreVal = stock.trendScore || 7;
  const trendAlignmentScore = Math.round((trendScoreVal / 8) * 15);

  const rawTotal = vcpTightnessScore + volumeDryUpScore + rsLeadershipScore + trendAlignmentScore;
  const score = Math.min(98, Math.max(25, rawTotal));

  let rating: BreakoutProbabilityResult['rating'] = 'MODERATE / AVERAGE';
  if (score >= 88) {
    rating = 'EXCEPTIONALLY HIGH (INSTITUTIONAL)';
  } else if (score >= 75) {
    rating = 'HIGH BREAKOUT PROBABILITY';
  } else if (score >= 60) {
    rating = 'MODERATE / AVERAGE';
  } else {
    rating = 'LOW PROBABILITY / HIGH SLIPPAGE';
  }

  return {
    score,
    rating,
    vcpTightnessScore,
    volumeDryUpScore,
    rsLeadershipScore,
    trendAlignmentScore,
    factors: {
      finalContractionDepth: finalDepth,
      volumeDryUpPercent: stock.volumeDryUpPercent,
      rsRating: stock.rsRating,
      trendScore: trendScoreVal,
      squeezeCompressionPercent: Math.round(squeezeCompressionPercent)
    }
  };
}

export function formatVolume(vol: number | undefined | null): string {
  if (vol === undefined || vol === null || isNaN(vol)) return '0';
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

export interface TrendStrengthMeterResult {
  slopePercent: number; // e.g. +2.85% 1-month slope of 200MA
  tier: 'TIER_1_POWER' | 'STAGE_2_STEADY' | 'STAGE_2_TURNING' | 'DECLINING_WEAK';
  tierLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  meterColor: string;
  meterFillPercent: number;
  description: string;
}

export function calculateTrendStrengthMeter(stock: MinerviniTradeSetup): TrendStrengthMeterResult {
  const sma200Now = stock.sma200;
  const sma200Prev = stock.sma200_1mo_ago;
  
  const slopePercent = sma200Prev > 0
    ? ((sma200Now - sma200Prev) / sma200Prev) * 100
    : 0;

  const isMaAligned = stock.currentPrice > stock.sma50 && stock.sma50 > stock.sma150 && stock.sma150 > stock.sma200;

  if (slopePercent >= 1.5 && stock.trendScore >= 7 && isMaAligned) {
    const fill = Math.min(100, Math.round(75 + Math.min(25, (slopePercent - 1.5) * 10)));
    return {
      slopePercent,
      tier: 'TIER_1_POWER',
      tierLabel: 'Tier-1 Power Stage 2',
      badgeBg: 'bg-[#107c41]',
      badgeText: 'text-white',
      badgeBorder: 'border-[#0d6233]',
      meterColor: 'bg-[#107c41]',
      meterFillPercent: fill,
      description: `200MA sharply sloping upward (+${slopePercent.toFixed(2)}%/mo) with perfect MA alignment (50 > 150 > 200).`
    };
  } else if (slopePercent >= 0.5) {
    const fill = Math.min(74, Math.round(50 + Math.min(24, (slopePercent - 0.5) * 20)));
    return {
      slopePercent,
      tier: 'STAGE_2_STEADY',
      tierLabel: 'Stage 2 Steady Slope',
      badgeBg: 'bg-teal-700',
      badgeText: 'text-white',
      badgeBorder: 'border-teal-800',
      meterColor: 'bg-teal-600',
      meterFillPercent: fill,
      description: `Confirmed Stage 2 advance with steady 200MA slope (+${slopePercent.toFixed(2)}%/mo).`
    };
  } else if (slopePercent > 0) {
    const fill = Math.min(49, Math.round(25 + slopePercent * 40));
    return {
      slopePercent,
      tier: 'STAGE_2_TURNING',
      tierLabel: 'Stage 2 Base Turning',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      meterColor: 'bg-amber-500',
      meterFillPercent: fill,
      description: `200MA slope turning positive (+${slopePercent.toFixed(2)}%/mo). Early Stage 2 base accumulation.`
    };
  } else {
    const fill = Math.max(5, Math.round(20 + slopePercent * 10));
    return {
      slopePercent,
      tier: 'DECLINING_WEAK',
      tierLabel: 'Declining 200MA',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-900',
      badgeBorder: 'border-rose-300',
      meterColor: 'bg-rose-600',
      meterFillPercent: fill,
      description: `200MA sloping downward (${slopePercent.toFixed(2)}%/mo). Fails Minervini Trend Template Rule 3.`
    };
  }
}

export interface DailyPivotResult {
  p: number; // Floor Pivot Point
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  r3: number;
  s3: number;
  tc: number; // Central Pivot Range (Top)
  bc: number; // Central Pivot Range (Bottom)
  cprWidthPct: number;
  cprStatus: 'NARROW_TIGHT_CPR' | 'BALANCED_CPR' | 'WIDE_RANGE_CPR';
  cprStatusLabel: string;
  proximityToPivotPct: number; // % distance from floor pivot P
  vcpPivotPrice: number; // SEPA VCP Pivot Entry
  buyZoneMax: number; // Pivot + 2% or 5%
  vcpPivotProximityPct: number; // % distance from VCP pivot
  vcpPivotStatus: 'BREAKOUT_ACTIVE' | 'IN_BUY_ZONE' | 'COILING_AT_PIVOT' | 'SETTING_UP' | 'EXTENDED';
}

export function calculateDailyPivotPoints(stock: MinerviniTradeSetup): DailyPivotResult {
  const priceHistory = stock.priceHistory || [];
  const latestPt = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : null;

  const high = stock.dailyHigh ?? (latestPt?.high ?? stock.currentPrice * 1.02);
  const low = stock.dailyLow ?? (latestPt?.low ?? stock.currentPrice * 0.98);
  const close = stock.currentPrice;

  // Floor Pivot Calculations
  const p = (high + low + close) / 3;
  const r1 = (2 * p) - low;
  const s1 = (2 * p) - high;
  const r2 = p + (high - low);
  const s2 = p - (high - low);
  const r3 = high + 2 * (p - low);
  const s3 = low - 2 * (high - p);

  // Central Pivot Range (CPR)
  const bc = (high + low) / 2;
  const tc = (p - bc) + p;
  const cprWidthPct = p > 0 ? (Math.abs(tc - bc) / p) * 100 : 0;

  let cprStatus: 'NARROW_TIGHT_CPR' | 'BALANCED_CPR' | 'WIDE_RANGE_CPR' = 'BALANCED_CPR';
  let cprStatusLabel = 'Balanced CPR Range';

  if (cprWidthPct <= 0.45) {
    cprStatus = 'NARROW_TIGHT_CPR';
    cprStatusLabel = 'Narrow Coiling CPR (Potential Explosive Move)';
  } else if (cprWidthPct > 1.2) {
    cprStatus = 'WIDE_RANGE_CPR';
    cprStatusLabel = 'Wide Range CPR (Choppy/Consolidation)';
  }

  const proximityToPivotPct = p > 0 ? ((close - p) / p) * 100 : 0;

  // SEPA VCP Pivot
  const vcpPivotPrice = stock.pivotPrice;
  const buyZoneMax = stock.buyZoneMax || (vcpPivotPrice * 1.02);
  const vcpPivotProximityPct = vcpPivotPrice > 0 ? ((close - vcpPivotPrice) / vcpPivotPrice) * 100 : 0;

  let vcpPivotStatus: DailyPivotResult['vcpPivotStatus'] = 'SETTING_UP';
  if (close > buyZoneMax * 1.03) {
    vcpPivotStatus = 'EXTENDED';
  } else if (close > vcpPivotPrice && close <= buyZoneMax) {
    vcpPivotStatus = 'IN_BUY_ZONE';
  } else if (close > buyZoneMax) {
    vcpPivotStatus = 'BREAKOUT_ACTIVE';
  } else if (vcpPivotProximityPct >= -2.0) {
    vcpPivotStatus = 'COILING_AT_PIVOT';
  }

  return {
    p: Number(p.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s3: Number(s3.toFixed(2)),
    tc: Number(tc.toFixed(2)),
    bc: Number(bc.toFixed(2)),
    cprWidthPct: Number(cprWidthPct.toFixed(2)),
    cprStatus,
    cprStatusLabel,
    proximityToPivotPct: Number(proximityToPivotPct.toFixed(2)),
    vcpPivotPrice: Number(vcpPivotPrice.toFixed(2)),
    buyZoneMax: Number(buyZoneMax.toFixed(2)),
    vcpPivotProximityPct: Number(vcpPivotProximityPct.toFixed(2)),
    vcpPivotStatus
  };
}

export interface DailyVolatilityResult {
  dailyHigh: number;
  dailyLow: number;
  dailyRange: number;
  dailyRangePercent: number; // (High - Low) / Close * 100%
  atr14: number; // 14-day Average True Range in $
  atr14Percent: number; // ATR as % of current price
  volatilityContractionRatio: number; // 5d ATR / 20d ATR
  volatilityStatus: 'ULTRA_TIGHT_COIL' | 'MODERATE_COMPRESSION' | 'EXPANDING_VOLATILITY' | 'HIGH_CHAOS';
  volatilityLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  volatilityCompressionScore: number; // 0 - 100
  dryUpPercent: number;
}

export function calculateDailyVolatilityMetrics(stock: MinerviniTradeSetup): DailyVolatilityResult {
  const priceHistory = stock.priceHistory || [];
  const close = stock.currentPrice;

  let atr14 = stock.atr14 || 0;
  let atr14Percent = stock.atr14Percent || 0;
  let vcr = stock.atr5dTo20dRatio || 0.75;

  if (priceHistory.length > 0) {
    const latestPt = priceHistory[priceHistory.length - 1];
    const high = stock.dailyHigh ?? latestPt.high;
    const low = stock.dailyLow ?? latestPt.low;

    // Calculate ATR over history if not explicitly provided
    let totalTr14 = 0;
    const count = Math.min(14, priceHistory.length);
    for (let i = priceHistory.length - count; i < priceHistory.length; i++) {
      const pt = priceHistory[i];
      const prevC = i > 0 ? priceHistory[i - 1].close : pt.close;
      const tr = Math.max(pt.high - pt.low, Math.abs(pt.high - prevC), Math.abs(pt.low - prevC));
      totalTr14 += tr;
    }
    const computedAtr14 = count > 0 ? totalTr14 / count : (high - low);
    atr14 = computedAtr14;
    atr14Percent = close > 0 ? (computedAtr14 / close) * 100 : 0;

    // Estimate 5-day vs 20-day ATR ratio (VCR)
    let totalTr5 = 0;
    const count5 = Math.min(5, priceHistory.length);
    for (let i = priceHistory.length - count5; i < priceHistory.length; i++) {
      const pt = priceHistory[i];
      const prevC = i > 0 ? priceHistory[i - 1].close : pt.close;
      totalTr5 += Math.max(pt.high - pt.low, Math.abs(pt.high - prevC), Math.abs(pt.low - prevC));
    }
    const atr5 = count5 > 0 ? totalTr5 / count5 : computedAtr14;

    vcr = computedAtr14 > 0 ? atr5 / computedAtr14 : 0.75;
  } else {
    atr14 = stock.currentPrice * 0.028;
    atr14Percent = 2.8;
  }

  const high = stock.dailyHigh ?? (close * 1.018);
  const low = stock.dailyLow ?? (close * 0.985);
  const dailyRange = high - low;
  const dailyRangePercent = close > 0 ? (dailyRange / close) * 100 : 0;

  // Compression Score calculation
  // Low ATR% + Low VCR + High Dry-up % = High Compression Score (0-100)
  const dryUp = stock.volumeDryUpPercent || 50;
  const atrScore = Math.max(0, Math.min(40, (6 - atr14Percent) * 8));
  const vcrScore = Math.max(0, Math.min(30, (1.2 - vcr) * 35));
  const dryScore = Math.max(0, Math.min(30, (dryUp / 100) * 30));

  const volatilityCompressionScore = Math.round(Math.min(100, atrScore + vcrScore + dryScore));

  let volatilityStatus: DailyVolatilityResult['volatilityStatus'] = 'MODERATE_COMPRESSION';
  let volatilityLabel = 'Moderate Volatility Compression';
  let badgeBg = 'bg-teal-50 text-teal-800 border-teal-300';
  let badgeText = 'text-teal-800';
  let badgeBorder = 'border-teal-300';

  if (atr14Percent <= 3.2 && vcr <= 0.65) {
    volatilityStatus = 'ULTRA_TIGHT_COIL';
    volatilityLabel = 'Ultra-Tight Volatility Coil (VCP Squeeze)';
    badgeBg = 'bg-emerald-950 text-amber-300 border-amber-500 font-bold';
    badgeText = 'text-amber-300';
    badgeBorder = 'border-amber-500';
  } else if (atr14Percent <= 4.5) {
    volatilityStatus = 'MODERATE_COMPRESSION';
    volatilityLabel = 'Moderate Volatility Tightening';
    badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    badgeText = 'text-emerald-800';
    badgeBorder = 'border-emerald-300';
  } else if (atr14Percent <= 7.0) {
    volatilityStatus = 'EXPANDING_VOLATILITY';
    volatilityLabel = 'Expanding Daily Range';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-300';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-300';
  } else {
    volatilityStatus = 'HIGH_CHAOS';
    volatilityLabel = 'High Volatility / Wide Spreads';
    badgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
    badgeText = 'text-rose-800';
    badgeBorder = 'border-rose-300';
  }

  return {
    dailyHigh: Number(high.toFixed(2)),
    dailyLow: Number(low.toFixed(2)),
    dailyRange: Number(dailyRange.toFixed(2)),
    dailyRangePercent: Number(dailyRangePercent.toFixed(2)),
    atr14: Number(atr14.toFixed(2)),
    atr14Percent: Number(atr14Percent.toFixed(2)),
    volatilityContractionRatio: Number(vcr.toFixed(2)),
    volatilityStatus,
    volatilityLabel,
    badgeBg,
    badgeText,
    badgeBorder,
    volatilityCompressionScore,
    dryUpPercent: dryUp
  };
}

;
}

export function formatCurrency(num: number | undefined | null, symbol = '$', decimals?: number): string {
  if (num === undefined || num === null || isNaN(num)) {
    return `${symbol}0.00`;
  }
  if (decimals !== undefined) {
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (num >= 10000) {
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${num.toFixed(2)}`;
}

export interface BreakoutProbabilityResult {
  score: number; // 0 to 99%
  rating: 'EXCEPTIONALLY HIGH (INSTITUTIONAL)' | 'HIGH BREAKOUT PROBABILITY' | 'MODERATE / AVERAGE' | 'LOW PROBABILITY / HIGH SLIPPAGE';
  vcpTightnessScore: number; // max 35
  volumeDryUpScore: number; // max 30
  rsLeadershipScore: number; // max 20
  trendAlignmentScore: number; // max 15
  factors: {
    finalContractionDepth: number;
    volumeDryUpPercent: number;
    rsRating: number;
    trendScore: number;
    squeezeCompressionPercent: number;
  };
}

export function calculateBreakoutProbability(stock: MinerviniTradeSetup): BreakoutProbabilityResult {
  const initialDepth = stock.contractions.length > 0 ? stock.contractions[0].depthPercent : 15;
  const finalDepth = stock.contractions.length > 0 ? stock.contractions[stock.contractions.length - 1].depthPercent : 8;
  const squeezeCompressionPercent = initialDepth > 0
    ? Math.max(0, ((initialDepth - finalDepth) / initialDepth) * 100)
    : 0;

  // 1. VCP Contraction Tightness (Max 35 Pts)
  let vcpTightnessScore = 0;
  if (finalDepth <= 3.5) {
    vcpTightnessScore += 25;
  } else if (finalDepth <= 6.0) {
    vcpTightnessScore += 18;
  } else if (finalDepth <= 10.0) {
    vcpTightnessScore += 12;
  } else {
    vcpTightnessScore += 5;
  }

  if (squeezeCompressionPercent >= 70) {
    vcpTightnessScore += 10;
  } else if (squeezeCompressionPercent >= 50) {
    vcpTightnessScore += 7;
  } else if (squeezeCompressionPercent >= 30) {
    vcpTightnessScore += 4;
  }
  vcpTightnessScore = Math.min(35, vcpTightnessScore);

  // 2. Volume Dry-Up & Contraction Trend (Max 30 Pts)
  let volumeDryUpScore = 0;
  const volDryUpAbs = Math.abs(stock.volumeDryUpPercent);
  if (stock.volumeDryUpPercent <= -60 || volDryUpAbs >= 60) {
    volumeDryUpScore += 20;
  } else if (stock.volumeDryUpPercent <= -40 || volDryUpAbs >= 40) {
    volumeDryUpScore += 15;
  } else if (stock.volumeDryUpPercent <= -25 || volDryUpAbs >= 25) {
    volumeDryUpScore += 10;
  } else {
    volumeDryUpScore += 5;
  }

  if (stock.isTightVolume) {
    volumeDryUpScore += 10;
  }
  volumeDryUpScore = Math.min(30, volumeDryUpScore);

  // 3. RS Leadership (Max 20 Pts)
  let rsLeadershipScore = 0;
  if (stock.rsRating >= 95) {
    rsLeadershipScore = 20;
  } else if (stock.rsRating >= 90) {
    rsLeadershipScore = 17;
  } else if (stock.rsRating >= 80) {
    rsLeadershipScore = 13;
  } else if (stock.rsRating >= 70) {
    rsLeadershipScore = 8;
  } else {
    rsLeadershipScore = 4;
  }

  // 4. Trend Alignment (Max 15 Pts)
  const trendScoreVal = stock.trendScore || 7;
  const trendAlignmentScore = Math.round((trendScoreVal / 8) * 15);

  const rawTotal = vcpTightnessScore + volumeDryUpScore + rsLeadershipScore + trendAlignmentScore;
  const score = Math.min(98, Math.max(25, rawTotal));

  let rating: BreakoutProbabilityResult['rating'] = 'MODERATE / AVERAGE';
  if (score >= 88) {
    rating = 'EXCEPTIONALLY HIGH (INSTITUTIONAL)';
  } else if (score >= 75) {
    rating = 'HIGH BREAKOUT PROBABILITY';
  } else if (score >= 60) {
    rating = 'MODERATE / AVERAGE';
  } else {
    rating = 'LOW PROBABILITY / HIGH SLIPPAGE';
  }

  return {
    score,
    rating,
    vcpTightnessScore,
    volumeDryUpScore,
    rsLeadershipScore,
    trendAlignmentScore,
    factors: {
      finalContractionDepth: finalDepth,
      volumeDryUpPercent: stock.volumeDryUpPercent,
      rsRating: stock.rsRating,
      trendScore: trendScoreVal,
      squeezeCompressionPercent: Math.round(squeezeCompressionPercent)
    }
  };
}

export function formatVolume(vol: number | undefined | null): string {
  if (vol === undefined || vol === null || isNaN(vol)) return '0';
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

export interface TrendStrengthMeterResult {
  slopePercent: number; // e.g. +2.85% 1-month slope of 200MA
  tier: 'TIER_1_POWER' | 'STAGE_2_STEADY' | 'STAGE_2_TURNING' | 'DECLINING_WEAK';
  tierLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  meterColor: string;
  meterFillPercent: number;
  description: string;
}

export function calculateTrendStrengthMeter(stock: MinerviniTradeSetup): TrendStrengthMeterResult {
  const sma200Now = stock.sma200;
  const sma200Prev = stock.sma200_1mo_ago;
  
  const slopePercent = sma200Prev > 0
    ? ((sma200Now - sma200Prev) / sma200Prev) * 100
    : 0;

  const isMaAligned = stock.currentPrice > stock.sma50 && stock.sma50 > stock.sma150 && stock.sma150 > stock.sma200;

  if (slopePercent >= 1.5 && stock.trendScore >= 7 && isMaAligned) {
    const fill = Math.min(100, Math.round(75 + Math.min(25, (slopePercent - 1.5) * 10)));
    return {
      slopePercent,
      tier: 'TIER_1_POWER',
      tierLabel: 'Tier-1 Power Stage 2',
      badgeBg: 'bg-[#107c41]',
      badgeText: 'text-white',
      badgeBorder: 'border-[#0d6233]',
      meterColor: 'bg-[#107c41]',
      meterFillPercent: fill,
      description: `200MA sharply sloping upward (+${slopePercent.toFixed(2)}%/mo) with perfect MA alignment (50 > 150 > 200).`
    };
  } else if (slopePercent >= 0.5) {
    const fill = Math.min(74, Math.round(50 + Math.min(24, (slopePercent - 0.5) * 20)));
    return {
      slopePercent,
      tier: 'STAGE_2_STEADY',
      tierLabel: 'Stage 2 Steady Slope',
      badgeBg: 'bg-teal-700',
      badgeText: 'text-white',
      badgeBorder: 'border-teal-800',
      meterColor: 'bg-teal-600',
      meterFillPercent: fill,
      description: `Confirmed Stage 2 advance with steady 200MA slope (+${slopePercent.toFixed(2)}%/mo).`
    };
  } else if (slopePercent > 0) {
    const fill = Math.min(49, Math.round(25 + slopePercent * 40));
    return {
      slopePercent,
      tier: 'STAGE_2_TURNING',
      tierLabel: 'Stage 2 Base Turning',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      meterColor: 'bg-amber-500',
      meterFillPercent: fill,
      description: `200MA slope turning positive (+${slopePercent.toFixed(2)}%/mo). Early Stage 2 base accumulation.`
    };
  } else {
    const fill = Math.max(5, Math.round(20 + slopePercent * 10));
    return {
      slopePercent,
      tier: 'DECLINING_WEAK',
      tierLabel: 'Declining 200MA',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-900',
      badgeBorder: 'border-rose-300',
      meterColor: 'bg-rose-600',
      meterFillPercent: fill,
      description: `200MA sloping downward (${slopePercent.toFixed(2)}%/mo). Fails Minervini Trend Template Rule 3.`
    };
  }
}

export interface DailyPivotResult {
  p: number; // Floor Pivot Point
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  r3: number;
  s3: number;
  tc: number; // Central Pivot Range (Top)
  bc: number; // Central Pivot Range (Bottom)
  cprWidthPct: number;
  cprStatus: 'NARROW_TIGHT_CPR' | 'BALANCED_CPR' | 'WIDE_RANGE_CPR';
  cprStatusLabel: string;
  proximityToPivotPct: number; // % distance from floor pivot P
  vcpPivotPrice: number; // SEPA VCP Pivot Entry
  buyZoneMax: number; // Pivot + 2% or 5%
  vcpPivotProximityPct: number; // % distance from VCP pivot
  vcpPivotStatus: 'BREAKOUT_ACTIVE' | 'IN_BUY_ZONE' | 'COILING_AT_PIVOT' | 'SETTING_UP' | 'EXTENDED';
}

export function calculateDailyPivotPoints(stock: MinerviniTradeSetup): DailyPivotResult {
  const priceHistory = stock.priceHistory || [];
  const latestPt = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : null;

  const high = stock.dailyHigh ?? (latestPt?.high ?? stock.currentPrice * 1.02);
  const low = stock.dailyLow ?? (latestPt?.low ?? stock.currentPrice * 0.98);
  const close = stock.currentPrice;

  // Floor Pivot Calculations
  const p = (high + low + close) / 3;
  const r1 = (2 * p) - low;
  const s1 = (2 * p) - high;
  const r2 = p + (high - low);
  const s2 = p - (high - low);
  const r3 = high + 2 * (p - low);
  const s3 = low - 2 * (high - p);

  // Central Pivot Range (CPR)
  const bc = (high + low) / 2;
  const tc = (p - bc) + p;
  const cprWidthPct = p > 0 ? (Math.abs(tc - bc) / p) * 100 : 0;

  let cprStatus: 'NARROW_TIGHT_CPR' | 'BALANCED_CPR' | 'WIDE_RANGE_CPR' = 'BALANCED_CPR';
  let cprStatusLabel = 'Balanced CPR Range';

  if (cprWidthPct <= 0.45) {
    cprStatus = 'NARROW_TIGHT_CPR';
    cprStatusLabel = 'Narrow Coiling CPR (Potential Explosive Move)';
  } else if (cprWidthPct > 1.2) {
    cprStatus = 'WIDE_RANGE_CPR';
    cprStatusLabel = 'Wide Range CPR (Choppy/Consolidation)';
  }

  const proximityToPivotPct = p > 0 ? ((close - p) / p) * 100 : 0;

  // SEPA VCP Pivot
  const vcpPivotPrice = stock.pivotPrice;
  const buyZoneMax = stock.buyZoneMax || (vcpPivotPrice * 1.02);
  const vcpPivotProximityPct = vcpPivotPrice > 0 ? ((close - vcpPivotPrice) / vcpPivotPrice) * 100 : 0;

  let vcpPivotStatus: DailyPivotResult['vcpPivotStatus'] = 'SETTING_UP';
  if (close > buyZoneMax * 1.03) {
    vcpPivotStatus = 'EXTENDED';
  } else if (close > vcpPivotPrice && close <= buyZoneMax) {
    vcpPivotStatus = 'IN_BUY_ZONE';
  } else if (close > buyZoneMax) {
    vcpPivotStatus = 'BREAKOUT_ACTIVE';
  } else if (vcpPivotProximityPct >= -2.0) {
    vcpPivotStatus = 'COILING_AT_PIVOT';
  }

  return {
    p: Number(p.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s3: Number(s3.toFixed(2)),
    tc: Number(tc.toFixed(2)),
    bc: Number(bc.toFixed(2)),
    cprWidthPct: Number(cprWidthPct.toFixed(2)),
    cprStatus,
    cprStatusLabel,
    proximityToPivotPct: Number(proximityToPivotPct.toFixed(2)),
    vcpPivotPrice: Number(vcpPivotPrice.toFixed(2)),
    buyZoneMax: Number(buyZoneMax.toFixed(2)),
    vcpPivotProximityPct: Number(vcpPivotProximityPct.toFixed(2)),
    vcpPivotStatus
  };
}

export interface DailyVolatilityResult {
  dailyHigh: number;
  dailyLow: number;
  dailyRange: number;
  dailyRangePercent: number; // (High - Low) / Close * 100%
  atr14: number; // 14-day Average True Range in $
  atr14Percent: number; // ATR as % of current price
  volatilityContractionRatio: number; // 5d ATR / 20d ATR
  volatilityStatus: 'ULTRA_TIGHT_COIL' | 'MODERATE_COMPRESSION' | 'EXPANDING_VOLATILITY' | 'HIGH_CHAOS';
  volatilityLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  volatilityCompressionScore: number; // 0 - 100
  dryUpPercent: number;
}

export function calculateDailyVolatilityMetrics(stock: MinerviniTradeSetup): DailyVolatilityResult {
  const priceHistory = stock.priceHistory || [];
  const close = stock.currentPrice;

  let atr14 = stock.atr14 || 0;
  let atr14Percent = stock.atr14Percent || 0;
  let vcr = stock.atr5dTo20dRatio || 0.75;

  if (priceHistory.length > 0) {
    const latestPt = priceHistory[priceHistory.length - 1];
    const high = stock.dailyHigh ?? latestPt.high;
    const low = stock.dailyLow ?? latestPt.low;

    // Calculate ATR over history if not explicitly provided
    let totalTr14 = 0;
    const count = Math.min(14, priceHistory.length);
    for (let i = priceHistory.length - count; i < priceHistory.length; i++) {
      const pt = priceHistory[i];
      const prevC = i > 0 ? priceHistory[i - 1].close : pt.close;
      const tr = Math.max(pt.high - pt.low, Math.abs(pt.high - prevC), Math.abs(pt.low - prevC));
      totalTr14 += tr;
    }
    const computedAtr14 = count > 0 ? totalTr14 / count : (high - low);
    atr14 = computedAtr14;
    atr14Percent = close > 0 ? (computedAtr14 / close) * 100 : 0;

    // Estimate 5-day vs 20-day ATR ratio (VCR)
    let totalTr5 = 0;
    const count5 = Math.min(5, priceHistory.length);
    for (let i = priceHistory.length - count5; i < priceHistory.length; i++) {
      const pt = priceHistory[i];
      const prevC = i > 0 ? priceHistory[i - 1].close : pt.close;
      totalTr5 += Math.max(pt.high - pt.low, Math.abs(pt.high - prevC), Math.abs(pt.low - prevC));
    }
    const atr5 = count5 > 0 ? totalTr5 / count5 : computedAtr14;

    vcr = computedAtr14 > 0 ? atr5 / computedAtr14 : 0.75;
  } else {
    atr14 = stock.currentPrice * 0.028;
    atr14Percent = 2.8;
  }

  const high = stock.dailyHigh ?? (close * 1.018);
  const low = stock.dailyLow ?? (close * 0.985);
  const dailyRange = high - low;
  const dailyRangePercent = close > 0 ? (dailyRange / close) * 100 : 0;

  // Compression Score calculation
  // Low ATR% + Low VCR + High Dry-up % = High Compression Score (0-100)
  const dryUp = stock.volumeDryUpPercent || 50;
  const atrScore = Math.max(0, Math.min(40, (6 - atr14Percent) * 8));
  const vcrScore = Math.max(0, Math.min(30, (1.2 - vcr) * 35));
  const dryScore = Math.max(0, Math.min(30, (dryUp / 100) * 30));

  const volatilityCompressionScore = Math.round(Math.min(100, atrScore + vcrScore + dryScore));

  let volatilityStatus: DailyVolatilityResult['volatilityStatus'] = 'MODERATE_COMPRESSION';
  let volatilityLabel = 'Moderate Volatility Compression';
  let badgeBg = 'bg-teal-50 text-teal-800 border-teal-300';
  let badgeText = 'text-teal-800';
  let badgeBorder = 'border-teal-300';

  if (atr14Percent <= 3.2 && vcr <= 0.65) {
    volatilityStatus = 'ULTRA_TIGHT_COIL';
    volatilityLabel = 'Ultra-Tight Volatility Coil (VCP Squeeze)';
    badgeBg = 'bg-emerald-950 text-amber-300 border-amber-500 font-bold';
    badgeText = 'text-amber-300';
    badgeBorder = 'border-amber-500';
  } else if (atr14Percent <= 4.5) {
    volatilityStatus = 'MODERATE_COMPRESSION';
    volatilityLabel = 'Moderate Volatility Tightening';
    badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    badgeText = 'text-emerald-800';
    badgeBorder = 'border-emerald-300';
  } else if (atr14Percent <= 7.0) {
    volatilityStatus = 'EXPANDING_VOLATILITY';
    volatilityLabel = 'Expanding Daily Range';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-300';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-300';
  } else {
    volatilityStatus = 'HIGH_CHAOS';
    volatilityLabel = 'High Volatility / Wide Spreads';
    badgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
    badgeText = 'text-rose-800';
    badgeBorder = 'border-rose-300';
  }

  return {
    dailyHigh: Number(high.toFixed(2)),
    dailyLow: Number(low.toFixed(2)),
    dailyRange: Number(dailyRange.toFixed(2)),
    dailyRangePercent: Number(dailyRangePercent.toFixed(2)),
    atr14: Number(atr14.toFixed(2)),
    atr14Percent: Number(atr14Percent.toFixed(2)),
    volatilityContractionRatio: Number(vcr.toFixed(2)),
    volatilityStatus,
    volatilityLabel,
    badgeBg,
    badgeText,
    badgeBorder,
    volatilityCompressionScore,
    dryUpPercent: dryUp
  };
}

