import { Router } from 'express';
import { db } from './database';
export const api=Router();
api.get('/health',(_req,res)=>res.json({ok:true,service:'minervini'}));
api.get('/portfolio',(_req,res)=>res.json(db.prepare('SELECT * FROM holdings ORDER BY id DESC').all()));
api.post('/portfolio',(req,res)=>{const x=req.body;const r=db.prepare('INSERT INTO holdings(ticker,exchange,shares,entry_price,current_price,stop_loss,created_at) VALUES(?,?,?,?,?,?,?)').run(x.ticker,x.exchange,x.shares,x.entryPrice,x.currentPrice,x.stopLoss,new Date().toISOString());res.status(201).json({id:r.lastInsertRowid});});
api.get('/trades',(_req,res)=>res.json(db.prepare('SELECT * FROM trades ORDER BY id DESC').all()));
api.get('/alerts',(_req,res)=>res.json(db.prepare('SELECT * FROM alerts ORDER BY id DESC').all()));
api.get('/journal',(_req,res)=>res.json(db.prepare('SELECT * FROM journal ORDER BY id DESC').all()));