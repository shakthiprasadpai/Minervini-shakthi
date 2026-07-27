export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avgVolume20: number;
  sma50: number;
  sma150: number;
  sma200: number;
  isTightVolume?: boolean;
}

export interface VcpContraction {
  contractionIndex: number; // 1, 2, 3, 4 (e.g., T1, T2, T3)
  depthPercent: number; // e.g. -22.5, -9.8, -3.1
  durationDays: number; // e.g. 18, 10, 4
  volumeDryUpPercent: number; // e.g. -65% vs 20-day avg
  startDate: string;
  endDate: string;
  highPrice: number;
  lowPrice: number;
}

export interface TrendTemplateRule {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  actualValueStr: string;
  requiredConditionStr: string;
}

export interface MinerviniTradeSetup {
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE';
  sector: string;
  industry: string;
  currentPrice: number;
  changePercent: number;
  
  // Moving Averages & Key Levels
  sma50: number;
  sma150: number;
  sma200: number;
  sma200_1mo_ago: number;
  high52w: number;
  low52w: number;
  rsRating: number; // Relative Strength 1-99
  
  // SEPA & VCP Setup Metadata
  patternType: 'VCP (3 Contractions)' | 'VCP (4 Contractions)' | 'High Tight Flag' | 'Cup with Handle' | 'Pivot Pullback';
  vcpStage: 'T2' | 'T3' | 'T4' | 'Breakout Pending' | 'Active Breakout';
  trendScore: number; // e.g. 8 out of 8
  
  // Tight Volume Metrics
  avgVolume20d: number; // e.g. 2,500,000
  pivotVolume: number; // e.g. 850,000
  volumeDryUpPercent: number; // e.g. -66% below average (tight volume)
  isTightVolume: boolean;
  
  // Precise Trade Execution Levels
  pivotPrice: number; // Exact Entry Price
  buyZoneMax: number; // Pivot + 2%
  stopLossPrice: number; // Exit price (hard stop or low of pivot)
  stopLossPercent: number; // e.g. -5.2%
  target1Price: number; // +20% (3:1 R/R target)
  target1Percent: number; // 20%
  target2Price: number; // +35% extended target
  target2Percent: number; // 35%
  riskRewardRatio: number; // e.g. 3.85
  
  // Contractions Breakdown
  contractions: VcpContraction[];
  
  // Historical chart candles
  priceHistory: PricePoint[];
  
  // Minervini Analysis Summary
  sepaNotes: string;

  // 3C Cheat Entry Breakdown
  has3CCheatEntry?: boolean;
  cheatEntryPrice?: number;
  cheatStopLossPrice?: number;
  cheatRiskPercent?: number;

  // Earnings & Catalyst Metadata
  nextEarningsDate?: string; // e.g. "2026-07-29"
  earningsTime?: 'BMO' | 'AMC'; // Before Market Open / After Market Close
  daysToEarnings?: number; // Calculated or mock offset e.g. 5 days
  epsEstimate?: number; // e.g. $1.25
  epsActualLastQ?: number; // e.g. $1.10 (+85% YoY)
  epsYoYGrowthLastQ?: number; // e.g. 85%
  revYoYGrowthLastQ?: number; // e.g. 42%
  earningsRiskStatus?: 'DANGER_IMMINENT' | 'WARNING_SOON' | 'SAFE_WINDOW' | 'POST_EARNINGS_GAP';
}

export interface ScreenerFilters {
  searchQuery: string;
  exchange: string;
  patternType: string;
  minTrendScore: number;
  tightVolumeOnly: boolean;
  minRsRating: number;
  maxStopLossPercent: number;
}

export interface PositionSizeResult {
  accountCapital: number;
  riskTolerancePercent: number;
  riskAmount: number;
  entryPrice: number;
  stopPrice: number;
  riskPerShare: number;
  shareQuantity: number;
  totalPositionCost: number;
  portfolioAllocationPercent: number;
}

export interface PriceAlert {
  id: string;
  ticker: string;
  stockName: string;
  targetType: 'PIVOT_ENTRY' | 'STOP_LOSS' | 'CUSTOM_ABOVE' | 'CUSTOM_BELOW';
  targetPrice: number;
  triggerProximityPercent: number; // e.g. within 1.5% of target
  currentPrice: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'MUTED';
  createdAt: string;
  triggeredAt?: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE';
  notes?: string;
}

export interface PortfolioHolding {
  id: string;
  ticker: string;
  stockName: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE';
  shares: number;
  entryPrice: number;
  currentPrice: number;
  buyDate: string;
  stopLossPrice: number;
  pivotTargetPrice: number;
  notes?: string;
  // SEPA Alignment metadata
  trendScore?: number;
  sma50?: number;
  sma200?: number;
  vcpStage?: string;
}

export interface MinerviniVideoLesson {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  category: '3C_CHEAT' | 'VCP_FOUNDATIONS' | 'RISK_MANAGEMENT' | 'POSITION_SIZING' | 'EARNINGS_DRIFT';
  summary: string;
  keyTimestamps: { time: string; label: string }[];
  takeaways: string[];
}

