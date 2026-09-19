import type { Request, Response } from 'express';
import { fivePaisaAuth } from './fivePaisaAuthService';
import crypto from 'node:crypto';
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
    try{
      const requestToken=String(req.query.RequestToken||'');
      const state=String(req.query.State||''); const expiresAt=oauthStates.get(state); oauthStates.delete(state);
      if(!state || !expiresAt || expiresAt < Date.now()) return res.status(403).send('Invalid or expired OAuth state');
      if(!requestToken) return res.status(400).send('Missing RequestToken');
      await fivePaisaAuth.exchangeRequestToken(requestToken);
      await onTokenReady();
      res.send('5Paisa authentication successful. You can close this window.');
    }catch(error:any){res.status(503).send('5Paisa authentication failed: '+(error?.message||String(error)));}
  });

  app.get('/api/5paisa/auth/status',(_req:Request,res:Response)=>res.json(fivePaisaAuth.status()));
}
