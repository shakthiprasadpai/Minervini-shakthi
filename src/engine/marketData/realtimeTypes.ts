export interface MarketTick {
  exchange: 'NSE' | 'BSE' | 'MCX';
  symbol: string;
  scripCode: number;
  price: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  changePercent: number;
  timestamp: string;
}
