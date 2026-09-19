import { createHttpProvider } from './httpProvider';
export function createXtsProvider(){
 const baseUrl=process.env.XTS_MARKET_DATA_BASE_URL||process.env.MARKET_DATA_BASE_URL;
 if(!baseUrl) throw new Error('XTS_MARKET_DATA_BASE_URL is not configured');
 return createHttpProvider({baseUrl,token:process.env.XTS_ACCESS_TOKEN||process.env.MARKET_DATA_TOKEN,quotePath:process.env.XTS_QUOTE_PATH||'/instruments/quotes',historyPath:process.env.XTS_HISTORY_PATH||'/instruments/candles'});
}
