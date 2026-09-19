import fs from 'node:fs/promises';
import path from 'node:path';

interface TokenState { accessToken: string; clientCode: string; expiresAt: string; obtainedAt: string; }

const TOKEN_URL='https://Openapi.5paisa.com/VendorsAPI/Service1.svc/GetAccessToken';
const STATE_FILE=process.env.FIVEPAISA_TOKEN_FILE || path.join(process.cwd(),'data','5paisa-token.json');

export class FivePaisaAuthService {
  private state: TokenState | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  async start() {
    await this.load();
    if (this.isValid()) this.scheduleRefresh();
  }

  async exchangeRequestToken(requestToken: string) {
    const appKey=process.env.FIVEPAISA_APP_KEY;
    const encryptionKey=process.env.FIVEPAISA_ENCRYPTION_KEY;
    const userId=process.env.FIVEPAISA_USER_ID;
    if(!appKey||!encryptionKey||!userId) throw new Error('5Paisa auth credentials are not configured');
    const response=await fetch(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({head:{key:appKey},body:{requestToken,EncryKey:encryptionKey,userId}})});
    if(!response.ok) throw new Error('5Paisa access-token API returned HTTP '+response.status);
    const json:any=await response.json();
    const body=json?.body||{};
    if(!body.AccessToken) throw new Error(body.Message||'5Paisa did not return an access token');
    const expires=new Date(); expires.setHours(23,59,59,999);
    this.state={accessToken:body.AccessToken,clientCode:String(body.ClientCode||process.env.FIVEPAISA_CLIENT_CODE||''),expiresAt:expires.toISOString(),obtainedAt:new Date().toISOString()};
    await this.save();
    this.scheduleRefresh();
    return this.state;
  }

  getAccessToken(){ return this.isValid()?this.state?.accessToken:null; }
  getClientCode(){ return this.state?.clientCode || process.env.FIVEPAISA_CLIENT_CODE || null; }
  status(){ return {configured:Boolean(process.env.FIVEPAISA_APP_KEY&&process.env.FIVEPAISA_ENCRYPTION_KEY&&process.env.FIVEPAISA_USER_ID),hasToken:Boolean(this.getAccessToken()),clientCode:this.getClientCode(),expiresAt:this.state?.expiresAt||null}; }

  private isValid(){ return Boolean(this.state?.accessToken && new Date(this.state.expiresAt).getTime()>Date.now()+60_000); }
  private scheduleRefresh(){ if(this.refreshTimer) clearTimeout(this.refreshTimer); const ms=Math.max(60_000,new Date(this.state!.expiresAt).getTime()-Date.now()-5*60_000); this.refreshTimer=setTimeout(()=>this.expireToken(),ms); }
  private expireToken(){ this.state=null; }
  private async load(){ try{this.state=JSON.parse(await fs.readFile(STATE_FILE,'utf8'));}catch{} }
  private async save(){ await fs.mkdir(path.dirname(STATE_FILE),{recursive:true}); await fs.writeFile(STATE_FILE,JSON.stringify(this.state,null,2),'utf8'); }
}

export const fivePaisaAuth=new FivePaisaAuthService();
