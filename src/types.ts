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
  contractionIndex: number;
  depthPercent: number;
  durationDays: number;
  volumeDryUpPercent: number;
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
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE' | 'MCX';
  sector: string;
  industry: string;
  currentPrice: number;
  changePercent: number;
  sma50: number;
  sma150: number;
  sma200: number;
  sma200_1mo_ago: number;
  high52w: number;
  low52w: number;
  rsRating: number;
  patternType: 'VCP (3 Contractions)' | 'VCP (4 Contractions)' | 'High Tight Flag' | 'Cup with Handle' | 'Pivot Pullback';
  vcpStage: 'T2' | 'T3' | 'T4' | 'Breakout Pending' | 'Active Breakout';
  trendScore: number;
  avgVolume20d: number;
  pivotVolume: number;
  volumeDryUpPercent: number;
  isTightVolume: boolean;
  pivotPrice: number;
  buyZoneMax: number;
  stopLossPrice: number;
  stopLossPercent: number;
  target1Price: number;
  target1Percent: number;
  target2Price: number;
  target2Percent: number;
  riskRewardRatio: number;
  contractions: VcpContraction[];
  priceHistory: PricePoint[];
  sepaNotes: string;
  salesGrowth3Y?: number;
  profitGrowth3Y?: number;
  qtrSalesGrowthYoY?: number;
  qtrProfitGrowthYoY?: number;
  salesLatestQtr?: number;
  salesPrecedingQtr?: number;
  roce?: number;
  roe?: number;
  debtToEquity?: number;
  npmLastYear?: number;
  npmLatestQtr?: number;
  npmPrecedingQtr?: number;
  pegRatio?: number;
  rsi14?: number;
  volume50dAvg?: number;
  currentVolume?: number;
  dailyPivotP?: number;
  dailyPivotR1?: number;
  dailyPivotR2?: number;
  dailyPivotR3?: number;
  dailyPivotS1?: number;
  dailyPivotS2?: number;
  dailyPivotS3?: number;
  cprTC?: number;
  cprBC?: number;
  cprWidthPercent?: number;
  cprStatus?: 'NARROW_TIGHT_CPR' | 'BALANCED_CPR' | 'WIDE_RANGE_CPR';
  atr14?: number;
  atr14Percent?: number;
  atr5dTo20dRatio?: number;
  dailyHigh?: number;
  dailyLow?: number;
  dailyRangePercent?: number;
  volatilityStatus?: 'ULTRA_TIGHT_COIL' | 'MODERATE_COMPRESSION' | 'EXPANDING_VOLATILITY' | 'HIGH_CHAOS';
  volatilityScore?: number;
  has3CCheatEntry?: boolean;
  cheatEntryPrice?: number;
  cheatStopLossPrice?: number;
  cheatRiskPercent?: number;
  nextEarningsDate?: string;
  earningsTime?: 'BMO' | 'AMC';
  daysToEarnings?: number;
  epsEstimate?: number;
  epsActualLastQ?: number;
  epsYoYGrowthLastQ?: number;
  revYoYGrowthLastQ?: number;
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
  triggerProximityPercent: number;
  currentPrice: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'MUTED';
  createdAt: string;
  triggeredAt?: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE' | 'MCX';
  notes?: string;
  volatilityTightnessTargetPct?: number;
  volatilityVolumeDryUpTargetPct?: number;
  targetRRRatio?: number;
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
  trendScore?: number;
  sma50?: number;
  sma200?: number;
  vcpStage?: string;
}

export type EmotionalState = 'CONFIDENT' | 'CALM' | 'ANXIOUS' | 'FOMO' | 'DISCIPLINED' | 'IMPATIENT' | 'EUPHORIC' | 'REGRETFUL' | 'PATIENT';
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
  rating: number;
  chartSnapshotUrl?: string;
}
