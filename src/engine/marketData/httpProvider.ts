import { PricePoint } from '../../types';
import { MarketDataProvider } from './types';

type Config={baseUrl:string;token?:string;quotePath:string;historyPath:string};

async function request(url:string,token?:string,init:RequestInit={}){const r=await fetch(url,{...init,headers:{...(init.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})}});if(!r.ok)throw new Error(`Market data HTTP ${r.status}`);return r.json();}

export function createHttpProvider(config:Config):MarketDataProvider{
 const normalize=(x:any):PricePoint=>({date:String(x.date??x.timestamp??''),open:+(x.open??0),high:+(x.high??0),low:+(x.low??0),close:+(x.close??x.ltp??0),volume:+(x.volume??0),avgVolume20:+(x.avgVolume20??0),sma50:+(x.sma50??0),sma150:+(x.sma150??0),sma200:+(x.sma200??0)});
 return {
  async getDailyCandles(ticker,exchange){const d=await request(`${config.baseUrl}${config.historyPath}?symbol=${encodeURIComponent(ticker)}&exchange=${exchange}&interval=1d`,config.token);const rows=d.candles??d.data??d.result??d;return (Array.isArray(rows)?rows:[]).map(normalize);},
  async getQuote(ticker,exchange){const d=await request(`${config.baseUrl}${config.quotePath}?symbol=${encodeURIComponent(ticker)}&exchange=${exchange}`,config.token);const x=d.data??d.result??d;return {close:+(x.close??x.ltp??0),volume:+(x.volume??0),changePercent:x.changePercent==null?undefined:+x.changePercent};}
 };
}
