export interface BacktestConfig {
  initialCapital: number;
  riskPerTradePercent: number;
  commissionPercent?: number;
  slippagePercent?: number;
  /** Currently one position at a time per ticker; kept for API compatibility. */
  maxPositions?: number;
  /** Bars a buy-stop at the pivot stays live after the signal bar. Default 3. */
  signalExpiryBars?: number;
  /** If set, replaces the fixed target with a trailing stop at (highest close - ATR x this). */
  trailingAtrMultiple?: number;
  /** Max share of capital in one position (%). Default 20. */
  maxAllocationPercent?: number;
}
export interface BacktestTrade {
  ticker: string;
  signalDate: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  initialStop: number;
  quantity: number;
  pnl: number;
  returnPercent: number;
  /** P&L divided by the initial risk ((entry - initial stop) x quantity). */
  rMultiple: number;
  reason: 'TARGET' | 'STOP' | 'TRAILING_STOP' | 'EXIT_SIGNAL' | 'END_OF_TEST';
}
export interface BacktestResult {
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  trades: BacktestTrade[];
  winRate: number;
  /** Gross profit / gross loss; null when there are no losing trades. */
  profitFactor: number | null;
  averageRMultiple: number;
  maxDrawdownPercent: number;
}
