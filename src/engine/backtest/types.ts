export interface BacktestConfig { initialCapital:number; riskPerTradePercent:number; commissionPercent?:number; slippagePercent?:number; maxPositions?:number; }
export interface BacktestTrade { ticker:string; entryDate:string; exitDate:string; entryPrice:number; exitPrice:number; quantity:number; pnl:number; returnPercent:number; reason:'TARGET'|'STOP'|'EXIT_SIGNAL'|'END_OF_TEST'; }
export interface BacktestResult { initialCapital:number; finalCapital:number; trades:BacktestTrade[]; winRate:number; maxDrawdownPercent:number; }
