export interface MarketCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  getDailyHistory(ticker: string, exchange: 'NSE' | 'BSE', days: number): Promise<MarketCandle[]>;
  getQuote(ticker: string, exchange: 'NSE' | 'BSE'): Promise<{ price: number; changePercent: number }>;
}

export class HttpMarketDataProvider implements MarketDataProvider {
  constructor(private readonly baseUrl: string, private readonly token?: string) {}

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
    });
    if (!response.ok) throw new Error(`Market data provider returned HTTP ${response.status}`);
    return response.json() as Promise<T>;
  }

  getDailyHistory(ticker: string, exchange: 'NSE' | 'BSE', days: number) {
    return this.request<MarketCandle[]>(
      `/history?exchange=${encodeURIComponent(exchange)}&ticker=${encodeURIComponent(ticker)}&days=${days}`
    );
  }

  getQuote(ticker: string, exchange: 'NSE' | 'BSE') {
    return this.request<{ price: number; changePercent: number }>(
      `/quote?exchange=${encodeURIComponent(exchange)}&ticker=${encodeURIComponent(ticker)}`
    );
  }
}
