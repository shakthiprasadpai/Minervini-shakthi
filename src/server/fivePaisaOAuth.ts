import type { Request, Response } from 'express';
import { fivePaisaAuth } from './fivePaisaAuthService';

export function registerFivePaisaOAuth(app:any,onTokenReady:()=>Promise<void>|void){
  app.get('/api/5paisa/auth/login',(_req:Request,res:Response)=>{
    const vendorKey=process.env.FIVEPAISA_VENDOR_KEY||process.env.FIVEPAISA_APP_KEY;
    const callback=process.env.FIVEPAISA_OAUTH_CALLBACK_URL;
    if(!vendorKey||!callback) return res.status(503).json({error:'FIVEPAISA_OAUTH_NOT_CONFIGURED'});
    const url='https://dev-openapi.5paisa.com/WebVendorLogin/VLogin/Index?VendorKey='+encodeURIComponent(vendorKey)+'&ResponseURL='+encodeURIComponent(callback)+'&State=minervini';
    res.redirect(url);
  });

  app.get('/api/5paisa/auth/callback',async(req:Request,res:Response)=>{
    try{
      const requestToken=String(req.query.RequestToken||'');
      if(!requestToken) return res.status(400).send('Missing RequestToken');
      await fivePaisaAuth.exchangeRequestToken(requestToken);
      await onTokenReady();
      res.send('5Paisa authentication successful. You can close this window.');
    }catch(error:any){res.status(503).send('5Paisa authentication failed: '+(error?.message||String(error)));}
  });

  app.get('/api/5paisa/auth/status',(_req:Request,res:Response)=>res.json(fivePaisaAuth.status()));
}
