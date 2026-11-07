import type { Request, Response } from 'express';
import { fivePaisaAuth } from './fivePaisaAuthService';
import crypto from 'node:crypto';
import { renderAuthResultPage } from './authResultPage';
const oauthStates = new Map<string, number>();

export function registerFivePaisaOAuth(app:any,onTokenReady:()=>Promise<void>|void){
  app.get('/api/5paisa/auth/login',(_req:Request,res:Response)=>{
    const vendorKey=process.env.FIVEPAISA_VENDOR_KEY||process.env.FIVEPAISA_APP_KEY;
    const callback=process.env.FIVEPAISA_OAUTH_CALLBACK_URL;
    if(!vendorKey||!callback) return res.status(503).json({error:'FIVEPAISA_OAUTH_NOT_CONFIGURED'});
    const state=crypto.randomBytes(32).toString('hex'); oauthStates.set(state, Date.now()+10*60*1000); const url='https://dev-openapi.5paisa.com/WebVendorLogin/VLogin/Index?VendorKey='+encodeURIComponent(vendorKey)+'&ResponseURL='+encodeURIComponent(callback)+'&State='+encodeURIComponent(state);
    res.redirect(url);
  });

  app.get('/api/5paisa/auth/callback',async(req:Request,res:Response)=>{
    const page=(status:number,ok:boolean,message:string)=>res.status(status).type('html').send(renderAuthResultPage(ok,message));
    try{
      // Query names are matched without regard to case; 5paisa has used both State and state.
      const q=(name:string)=>{const k=Object.keys(req.query).find(x=>x.toLowerCase()===name.toLowerCase());return k===undefined?'':String(req.query[k]||'');};
      const received=Object.keys(req.query).join(', ')||'nothing';
      const requestToken=q('RequestToken');
      const state=q('State');
      console.warn(`5paisa callback received: ${received}`);
      if(!state) return page(400,false,`5paisa did not send back the sign-in check value (State). It sent: ${received}. Start again from the dashboard.`);
      const expiresAt=oauthStates.get(state); oauthStates.delete(state);
      if(!expiresAt) return page(403,false,'This sign-in was not started by this server run. If you restarted the app after clicking Sign in, or opened this page twice, start again from the dashboard.');
      if(expiresAt<Date.now()) return page(403,false,'This sign-in link expired after 10 minutes. Start again from the dashboard.');
      if(!requestToken) return page(400,false,`5paisa did not send a sign-in token (RequestToken). It sent: ${received}. Start again from the dashboard.`);
      await fivePaisaAuth.exchangeRequestToken(requestToken);
      await onTokenReady();
      page(200,true,'You are connected. This window closes by itself.');
    }catch(error:any){page(503,false,'5paisa sign-in failed: '+(error?.message||String(error)));}
  });

  app.get('/api/5paisa/auth/status',(_req:Request,res:Response)=>res.json(fivePaisaAuth.status()));
}
