import { createHttpProvider } from './httpProvider';
export function createBigulProvider(){
 const baseUrl=process.env.BIGUL_API_BASE_URL||process.env.MARKET_DATA_BASE_URL;
 if(!baseUrl) throw new Error('BIGUL_API_BASE_URL is not configured');
 return createHttpProvider({baseUrl,token:process.env.BIGUL_API_TOKEN||process.env.MARKET_DATA_TOKEN,quotePath:process.env.BIGUL_QUOTE_PATH||'/market/quote',historyPath:process.env.BIGUL_HISTORY_PATH||'/market/history'});
}
