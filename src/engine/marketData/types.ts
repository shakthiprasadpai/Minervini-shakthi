import { PricePoint } from '../../types';
export interface MarketDataProvider {
  getDailyCandles(ticker:string, exchange:'NSE'|'BSE'): Promise<PricePoint[]>;
  getQuote(ticker:string, exchange:'NSE'|'BSE'): Promise<{close:number; volume:number; changePercent?:number}>;
}
