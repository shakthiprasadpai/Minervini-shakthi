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

  // Refined SEPA Fundamental & Technical Screener Metrics
  salesGrowth3Y?: number; // e.g. 24.5%
  profitGrowth3Y?: number; // e.g. 32.0%
  qtrSalesGrowthYoY?: number; // e.g. 28.4%
  qtrProfitGrowthYoY?: number; // e.g. 41.2%
  salesLatestQtr?: number; // e.g. $1,250M
  salesPrecedingQtr?: number; // e.g. $980M (Acceleration > 20%)
  roce?: number; // Return on Capital Employed e.g. 22.5%
  roe?: number; // Return on Equity e.g. 25.8%
  debtToEquity?: number; // e.g. 0.18
  npmLastYear?: number; // Net Profit Margin last year e.g. 14.2%
  npmLatestQtr?: number; // NPM latest quarter e.g. 16.5%
  npmPrecedingQtr?: number; // NPM preceding quarter e.g. 13.8% (Margin expansion)
  pegRatio?: number; // Price/Earnings to Growth ratio e.g. 0.85
  rsi14?: number; // 14-period Relative Strength Index e.g. 62.4
  volume50dAvg?: number; // 50-day average daily volume
  currentVolume?: number; // Latest volume or breakout volume

  // Daily Floor Pivot & Central Pivot Range (CPR)
  dailyPivotP?: number; // Central Floor Pivot
  dailyPivotR1?: number; // Resistance 1
  dailyPivotR2?: number; // Resistance 2
  dailyPivotR3?: number; // Resistance 3
  dailyPivotS1?: number; // Support 1
  dailyPivotS2?: number; // Support 2
  dailyPivotS3?: number; // Support 3
  cprTC?: number; // Central Pivot Range Top Central
  cprBC?: number; // Central Pivot Range Bottom Central
  cprWidthPercent?: number; // Central Pivot Range Width % (Tight CPR indicator)
  cprStatus?: 'NARROW_TIGHT_CPR' | 'BALANCED_CPR' | 'WIDE_RANGE_CPR';

  // Daily Volatility & ATR Metrics
  atr14?: number; // 14-day Average True Range in $
  atr14Percent?: number; // 14-day ATR as % of price
  atr5dTo20dRatio?: number; // 5-day ATR / 20-day ATR (Volatility Contraction Ratio)
  dailyHigh?: number;
  dailyLow?: number;
  dailyRangePercent?: number; // (High - Low) / Close * 100%
  volatilityStatus?: 'ULTRA_TIGHT_COIL' | 'MODERATE_COMPRESSION' | 'EXPANDING_VOLATILITY' | 'HIGH_CHAOS';
  volatilityScore?: number; // 0 to 100 Volatility Compression Score

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
  targetType: 'PIVOT_ENTRY' | 'STOP_LOSS' | 'CUSTOM_ABOVE' | 'CUSTOM_BELOW' | 'VOLATILITY_DRYUP' | 'RISK_REWARD_RATIO';
  targetPrice: number;
  triggerProximityPercent: number; // e.g. within 1.5% of target
  currentPrice: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'MUTED';
  createdAt: string;
  triggeredAt?: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE';
  notes?: string;
  // Volatility Dry-Up Specific Settings
  volatilityTightnessTargetPct?: number; // e.g. <= 5.0% price range tightening
  volatilityVolumeDryUpTargetPct?: number; // e.g. <= -50% volume dry-up
  // Risk-Reward Ratio Specific Settings
  targetRRRatio?: number; // e.g. 3.0 or 5.0 ratio target
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

export type EmotionalState = 
  | 'CONFIDENT'
  | 'CALM'
  | 'ANXIOUS'
  | 'FOMO'
  | 'DISCIPLINED'
  | 'IMPATIENT'
  | 'EUPHORIC'
  | 'REGRETFUL'
  | 'PATIENT';

export type TradeStatus = 'PLANNING' | 'ACTIVE_TRADE' | 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS' | 'STOPPED_OUT' | 'SCRATCHED';

export interface TradeJournalNote {
  id: string;
  ticker: string;
  stockName: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE';
  date: string;
  setupType: string;
  entryPrice?: number;
  exitPrice?: number;
  emotionalState: EmotionalState;
  notes: string;
  keyLesson: string;
  tradeStatus: TradeStatus;
  rating: number; // 1 to 5 stars
  chartSnapshotUrl?: string;
}


