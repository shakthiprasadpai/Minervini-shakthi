import { MinerviniTradeSetup, PricePoint } from '../types';

// Helper function to generate price points with VCP pattern
function generateVcpHistory(
  basePrice: number,
  pivotPrice: number,
  contractions: { depthPct: number; days: number }[]
): PricePoint[] {
  const points: PricePoint[] = [];
  const totalDays = 60;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - totalDays);

  let currentP = basePrice * 0.75; // Start in Stage 2 run-up
  const baseAvgVol = 2500000;

  // 1. Stage 2 initial run-up to High 1 (days 0 to 15)
  for (let i = 0; i < 15; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    currentP += (pivotPrice - currentP) * 0.12 + (Math.random() - 0.4) * 1.5;
    const vol = baseAvgVol * (1.2 + Math.random() * 0.8); // High volume on run-up

    points.push({
      date: d.toISOString().split('T')[0],
      open: Number((currentP - 0.5).toFixed(2)),
      high: Number((currentP + 1.2).toFixed(2)),
      low: Number((currentP - 0.8).toFixed(2)),
      close: Number(currentP.toFixed(2)),
      volume: Math.round(vol),
      avgVolume20: baseAvgVol,
      sma50: Number((currentP * 0.88).toFixed(2)),
      sma150: Number((currentP * 0.78).toFixed(2)),
      sma200: Number((currentP * 0.72).toFixed(2)),
      isTightVolume: false
    });
  }

  // 2. Contractions
  let dayOffset = 15;
  contractions.forEach((c, idx) => {
    const highLevel = pivotPrice * (1 - (idx * 0.015));
    const lowLevel = highLevel * (1 - c.depthPct / 100);

    for (let day = 0; day < c.days; day++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + dayOffset + day);

      const progress = day / c.days;
      // U-shape / V-shape pullback and recovery
      let priceRatio = Math.cos(progress * Math.PI * 2) * 0.5 + 0.5; // 1 -> 0 -> 1
      if (progress < 0.5) {
        // Down leg
        currentP = highLevel - (highLevel - lowLevel) * (progress * 2);
      } else {
        // Up leg back toward pivot
        currentP = lowLevel + (highLevel - lowLevel) * ((progress - 0.5) * 2);
      }

      currentP += (Math.random() - 0.5) * 0.8;

      // Volume decreases progressively with each contraction!
      const volMultiplier = Math.max(0.25, (1 - (idx * 0.22)) * (0.8 - progress * 0.3));
      const vol = baseAvgVol * volMultiplier;
      const isTight = idx >= contractions.length - 1 && day >= c.days - 3;

      points.push({
        date: d.toISOString().split('T')[0],
        open: Number((currentP - 0.3).toFixed(2)),
        high: Number((currentP + 0.6).toFixed(2)),
        low: Number((currentP - 0.5).toFixed(2)),
        close: Number(currentP.toFixed(2)),
        volume: Math.round(vol),
        avgVolume20: baseAvgVol,
        sma50: Number((pivotPrice * 0.90).toFixed(2)),
        sma150: Number((pivotPrice * 0.82).toFixed(2)),
        sma200: Number((pivotPrice * 0.75).toFixed(2)),
        isTightVolume: isTight
      });
    }
    dayOffset += c.days;
  });

  // Fill remaining days right up to current date with tight pivot handle
  while (points.length < totalDays) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + points.length);

    const closeP = pivotPrice * 0.988 + (Math.random() - 0.5) * 0.6;
    const isTight = true;
    const dryVol = baseAvgVol * 0.32; // -68% tight volume!

    points.push({
      date: d.toISOString().split('T')[0],
      open: Number((closeP - 0.2).toFixed(2)),
      high: Number((closeP + 0.4).toFixed(2)),
      low: Number((closeP - 0.3).toFixed(2)),
      close: Number(closeP.toFixed(2)),
      volume: Math.round(dryVol),
      avgVolume20: baseAvgVol,
      sma50: Number((pivotPrice * 0.91).toFixed(2)),
      sma150: Number((pivotPrice * 0.83).toFixed(2)),
      sma200: Number((pivotPrice * 0.76).toFixed(2)),
      isTightVolume: isTight
    });
  }

  return points;
}

export const MOCK_STOCKS: MinerviniTradeSetup[] = [
  {
    ticker: 'TRENT',
    name: 'Trent Limited',
    exchange: 'BSE',
    sector: 'Consumer Cyclical',
    industry: 'Apparel Retail',
    currentPrice: 6840.50,
    changePercent: 3.85,
    sma50: 6250.00,
    sma150: 5500.00,
    sma200: 4890.00,
    sma200_1mo_ago: 4750.00,
    high52w: 6950.00,
    low52w: 2400.00,
    rsRating: 99,
    patternType: 'High Tight Flag',
    vcpStage: 'Breakout Pending',
    trendScore: 8,
    avgVolume20d: 1200000,
    pivotVolume: 340000,
    volumeDryUpPercent: -71.5,
    isTightVolume: true,
    pivotPrice: 6880.00,
    buyZoneMax: 7017.60,
    stopLossPrice: 6450.00,
    stopLossPercent: 6.25,
    target1Price: 8256.00,
    target1Percent: 20.00,
    target2Price: 9288.00,
    target2Percent: 35.00,
    riskRewardRatio: 3.20,
    contractions: [
      { contractionIndex: 1, depthPercent: 14.5, durationDays: 14, volumeDryUpPercent: -35, startDate: '2026-06-05', endDate: '2026-06-18', highPrice: 6850.00, lowPrice: 5856.75 },
      { contractionIndex: 2, depthPercent: 4.2, durationDays: 5, volumeDryUpPercent: -71, startDate: '2026-06-19', endDate: '2026-06-25', highPrice: 6880.00, lowPrice: 6591.04 }
    ],
    priceHistory: generateVcpHistory(5200, 6880.00, [{ depthPct: 14.5, days: 14 }, { depthPct: 4.2, days: 5 }]),
    sepaNotes: 'BSE retail market leader showing exceptional Relative Strength 99. Forms a pristine High Tight Flag on the BSE exchange with extreme volume dry-up (-71.5%). Pivot buy level at ₹6,880.00.',
    has3CCheatEntry: true,
    cheatEntryPrice: 6750.00,
    cheatStopLossPrice: 6480.00,
    cheatRiskPercent: 4.00,
    nextEarningsDate: '2026-08-05',
    earningsTime: 'AMC',
    daysToEarnings: 11,
    epsEstimate: 48.50,
    epsActualLastQ: 42.00,
    epsYoYGrowthLastQ: 95,
    revYoYGrowthLastQ: 42,
    earningsRiskStatus: 'WARNING_SOON',
  },
  {
    ticker: 'SUVEN',
    name: 'Suven Life Sciences Ltd',
    exchange: 'NSE',
    sector: 'Healthcare',
    industry: 'Pharmaceuticals',
    currentPrice: 327.60,
    changePercent: 9.95,
    sma50: 272.10,
    sma150: 228.40,
    sma200: 195.20,
    sma200_1mo_ago: 188.00,
    high52w: 335.00,
    low52w: 112.00,
    rsRating: 94,
    patternType: 'VCP (3 Contractions)',
    vcpStage: 'Active Breakout',
    trendScore: 8,
    avgVolume20d: 3800000,
    pivotVolume: 10664300,
    volumeDryUpPercent: 180.6,
    isTightVolume: false,
    pivotPrice: 310.00,
    buyZoneMax: 316.20,
    stopLossPrice: 292.00,
    stopLossPercent: 5.80,
    target1Price: 372.00,
    target1Percent: 20.00,
    target2Price: 418.00,
    target2Percent: 34.84,
    riskRewardRatio: 3.45,
    contractions: [
      { contractionIndex: 1, depthPercent: 21.0, durationDays: 16, volumeDryUpPercent: -20, startDate: '2026-06-01', endDate: '2026-06-17', highPrice: 305.00, lowPrice: 240.95 },
      { contractionIndex: 2, depthPercent: 9.2, durationDays: 8, volumeDryUpPercent: -50, startDate: '2026-06-18', endDate: '2026-06-26', highPrice: 308.00, lowPrice: 279.66 },
      { contractionIndex: 3, depthPercent: 3.1, durationDays: 4, volumeDryUpPercent: -70, startDate: '2026-06-27', endDate: '2026-07-01', highPrice: 310.00, lowPrice: 300.39 }
    ],
    priceHistory: generateVcpHistory(210, 310.00, [{ depthPct: 21.0, days: 16 }, { depthPct: 9.2, days: 8 }, { depthPct: 3.1, days: 4 }]),
    sepaNotes: 'Indian growth stock leader exploding out of a 3-contraction VCP. Today erupted with +9.95% surge on 10.66M shares (280% of average volume), validating institutional buying demand.',
    nextEarningsDate: '2026-07-22',
    earningsTime: 'BMO',
    daysToEarnings: -2,
    epsEstimate: 8.50,
    epsActualLastQ: 12.40,
    epsYoYGrowthLastQ: 210,
    revYoYGrowthLastQ: 64,
    earningsRiskStatus: 'POST_EARNINGS_GAP',
  },
  {
    ticker: 'MOSCHIP',
    name: 'Moschip Technologies Ltd',
    exchange: 'NSE',
    sector: 'Technology',
    industry: 'Semiconductor Design',
    currentPrice: 223.55,
    changePercent: 7.21,
    sma50: 188.40,
    sma150: 152.00,
    sma200: 128.50,
    sma200_1mo_ago: 122.00,
    high52w: 232.00,
    low52w: 82.00,
    rsRating: 91,
    patternType: 'Cup with Handle',
    vcpStage: 'Breakout Pending',
    trendScore: 8,
    avgVolume20d: 5200000,
    pivotVolume: 1850000,
    volumeDryUpPercent: -64.4,
    isTightVolume: true,
    pivotPrice: 226.00,
    buyZoneMax: 230.52,
    stopLossPrice: 212.00,
    stopLossPercent: 6.19,
    target1Price: 271.20,
    target1Percent: 20.00,
    target2Price: 305.00,
    target2Percent: 34.95,
    riskRewardRatio: 3.23,
    contractions: [
      { contractionIndex: 1, depthPercent: 26.8, durationDays: 22, volumeDryUpPercent: -10, startDate: '2026-05-20', endDate: '2026-06-11', highPrice: 228.00, lowPrice: 166.90 },
      { contractionIndex: 2, depthPercent: 7.4, durationDays: 7, volumeDryUpPercent: -64, startDate: '2026-06-12', endDate: '2026-06-19', highPrice: 226.00, lowPrice: 209.28 }
    ],
    priceHistory: generateVcpHistory(150, 226.00, [{ depthPct: 26.8, days: 22 }, { depthPct: 7.4, days: 7 }]),
    sepaNotes: 'Cup with Handle pattern with clean 7.4% handle contraction. Handle volume dried up to 1.85M shares (-64% below average), establishing a tight pivot buy line at ₹226.00.',
    nextEarningsDate: '2026-07-27',
    earningsTime: 'BMO',
    daysToEarnings: 3,
    epsEstimate: 4.10,
    epsActualLastQ: 3.80,
    epsYoYGrowthLastQ: 75,
    revYoYGrowthLastQ: 32,
    earningsRiskStatus: 'DANGER_IMMINENT',
  },
  {
    ticker: 'GOLDIAM',
    name: 'Goldiam International Ltd',
    exchange: 'NSE',
    sector: 'Consumer Cyclical',
    industry: 'Luxury Goods',
    currentPrice: 480.40,
    changePercent: 6.77,
    sma50: 410.20,
    sma150: 345.10,
    sma200: 298.00,
    sma200_1mo_ago: 289.00,
    high52w: 488.00,
    low52w: 165.00,
    rsRating: 92,
    patternType: 'VCP (3 Contractions)',
    vcpStage: 'Breakout Pending',
    trendScore: 8,
    avgVolume20d: 1100000,
    pivotVolume: 380000,
    volumeDryUpPercent: -65.5,
    isTightVolume: true,
    pivotPrice: 485.00,
    buyZoneMax: 494.70,
    stopLossPrice: 455.00,
    stopLossPercent: 6.18,
    target1Price: 582.00,
    target1Percent: 20.00,
    target2Price: 654.00,
    target2Percent: 34.85,
    riskRewardRatio: 3.23,
    contractions: [
      { contractionIndex: 1, depthPercent: 18.2, durationDays: 14, volumeDryUpPercent: -22, startDate: '2026-06-02', endDate: '2026-06-16', highPrice: 475.00, lowPrice: 388.55 },
      { contractionIndex: 2, depthPercent: 8.0, durationDays: 8, volumeDryUpPercent: -45, startDate: '2026-06-17', endDate: '2026-06-25', highPrice: 480.00, lowPrice: 441.60 },
      { contractionIndex: 3, depthPercent: 2.9, durationDays: 5, volumeDryUpPercent: -65, startDate: '2026-06-26', endDate: '2026-06-30', highPrice: 485.00, lowPrice: 470.935 }
    ],
    priceHistory: generateVcpHistory(380, 485.00, [{ depthPct: 18.2, days: 14 }, { depthPct: 8.0, days: 8 }, { depthPct: 2.9, days: 5 }]),
    sepaNotes: 'Strong Indian consumer growth leader forming a 3-contraction VCP. Pivot line at ₹485.00 with tight 6.18% risk stop.',
    nextEarningsDate: '2026-08-01',
    earningsTime: 'BMO',
    daysToEarnings: 8,
    epsEstimate: 14.20,
    epsActualLastQ: 12.80,
    epsYoYGrowthLastQ: 82,
    revYoYGrowthLastQ: 28,
    earningsRiskStatus: 'WARNING_SOON',
  }
];
