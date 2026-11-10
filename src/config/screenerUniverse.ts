export type Exchange = 'NSE' | 'BSE' | 'MCX';
export interface UniverseItem { ticker: string; exchange: Exchange }

/**
 * Large NSE stocks the screener reads by default: the Nifty 50 plus the Next 50.
 * Index membership changes, and a symbol 5paisa does not know is skipped, so edit this freely or
 * set SCREENER_SYMBOLS in .env to use your own list.
 */
export const NIFTY_100: string[] = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BEL', 'BHARTIARTL',
  'CIPLA', 'COALINDIA', 'DRREDDY', 'EICHERMOT', 'ETERNAL', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HINDALCO',
  'HINDUNILVR', 'ICICIBANK', 'INDIGO', 'INFY', 'ITC', 'JIOFIN', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'M&M',
  'MARUTI', 'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN', 'SHRIRAMFIN', 'SUNPHARMA',
  'TATACONSUM', 'TATASTEEL', 'TCS', 'TECHM', 'TITAN', 'TMPV', 'TRENT', 'ULTRACEMCO', 'WIPRO', 'MAXHEALTH',
  'ABB', 'ADANIENSOL', 'ADANIGREEN', 'ADANIPOWER', 'AMBUJACEM', 'BAJAJHLDNG', 'BANKBARODA', 'BOSCHLTD', 'BPCL', 'BRITANNIA',
  'CANBK', 'CGPOWER', 'CHOLAFIN', 'DABUR', 'DIVISLAB', 'DLF', 'DMART', 'GAIL', 'GODREJCP', 'HAL',
  'HAVELLS', 'HYUNDAI', 'ICICIGI', 'INDHOTEL', 'IOC', 'IRFC', 'JINDALSTEL', 'JSWENERGY', 'LICI', 'LODHA',
  'LTIM', 'MAZDOCK', 'MUTHOOTFIN', 'NAUKRI', 'PFC', 'PIDILITIND', 'PNB', 'RECLTD', 'SHREECEM', 'SIEMENS',
  'SWIGGY', 'TATAPOWER', 'TORNTPHARM', 'TVSMOTOR', 'UNITDSPR', 'VBL', 'VEDL', 'ZYDUSLIFE', 'POLYCAB', 'SOLARINDS'
];

/** "NSE:INFY, TCS" -> [{ INFY, NSE }, { TCS, NSE }]. Blank entries are dropped. */
export function parseSymbols(raw: string | undefined): UniverseItem[] {
  return (raw || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .map(spec => {
      const parts = spec.split(':');
      const hasExchange = parts.length > 1 && /^(NSE|BSE|MCX)$/i.test(parts[0]);
      const exchange = (hasExchange ? parts[0] : 'NSE').toUpperCase() as Exchange;
      const ticker = (hasExchange ? parts.slice(1).join(':') : spec).trim();
      return { ticker, exchange };
    })
    .filter(x => x.ticker.length > 0);
}

/**
 * Which stocks the screener reads. A list in SCREENER_SYMBOLS wins; SCREENER_FULL_MARKET=true reads every
 * stock 5paisa lists (thousands of requests, so it takes a very long time); otherwise the Nifty 100.
 */
export function screenerUniverse(env: Record<string, string | undefined>, fullMarket: () => UniverseItem[]): UniverseItem[] {
  const configured = parseSymbols(env.SCREENER_SYMBOLS);
  if (configured.length) return configured;
  if ((env.SCREENER_FULL_MARKET || '').toLowerCase() === 'true' && (env.REALTIME_MARKET_PROVIDER || '').toLowerCase() === '5paisa') return fullMarket();
  return NIFTY_100.map(ticker => ({ ticker, exchange: 'NSE' as const }));
}
