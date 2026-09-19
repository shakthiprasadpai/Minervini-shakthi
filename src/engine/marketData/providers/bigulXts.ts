import { MarketDataProvider } from '../types';
export interface BigulXtsConfig { baseUrl:string; apiKey:string; secretKey?:string; accessToken?:string; }
export class BigulXtsProvider implements MarketDataProvider {
 constructor(private config:BigulXtsConfig){}
 private async request(path:string,init:RequestInit={}){const headers:Record<string,string>={'Content-Type':'application/json','Authorization':this.config.accessToken?'Bearer '+this.config.accessToken:this.config.apiKey};const r=await fetch(this.config.baseUrl+path,{...init,headers:{...headers,...(init.headers as Record<string,string>|undefined)}});if(!r.ok)throw new Error('Market data request failed: '+r.status);return r.json();}
 async getDailyCandles(ticker:string,exchange:'NSE'|'BSE'|'MCX'){const x=await this.request('/marketdata/candles?exchange='+encodeURIComponent(exchange)+'&symbol='+encodeURIComponent(ticker)+'&interval=1d');return x.data as any;}
 async getQuote(ticker:string,exchange:'NSE'|'BSE'){const x=await this.request('/marketdata/quote?exchange='+encodeURIComponent(exchange)+'&symbol='+encodeURIComponent(ticker));return x.data;}
}