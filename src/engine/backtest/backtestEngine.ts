import { PricePoint } from '../../types';
import { calculatePositionSize } from '../risk/positionSizer';
import { runMinerviniEngine } from '../minervini/minerviniEngine';
import { BacktestConfig, BacktestResult, BacktestTrade } from './types';

export function backtestMinervini(ticker:string,candles:PricePoint[],config:BacktestConfig):BacktestResult{
 let capital=config.initialCapital, peak=capital, maxDD=0; const trades:BacktestTrade[]=[];
 for(let i=220;i<candles.length-1;i++){
  const history=candles.slice(0,i+1), c=candles[i];
  const analysis=runMinerviniEngine({ticker,currentPrice:c.close,priceHistory:history});
  if(analysis.entryStatus!=='READY'||!analysis.pivotPrice||!analysis.stopLoss) continue;
  const q=calculatePositionSize(capital,analysis.pivotPrice,analysis.stopLoss,config.riskPerTradePercent);
  if(!q.quantity) continue;
  const entry=analysis.pivotPrice*(1+(config.slippagePercent??0)/100);
  let exit=candles[i+1], reason:BacktestTrade['reason']='END_OF_TEST';
  for(let j=i+1;j<candles.length;j++){const bar=candles[j]; if(bar.low<=analysis.stopLoss){exit=bar;reason='STOP';break;} if(analysis.target1&&bar.high>=analysis.target1){exit=bar;reason='TARGET';break;}}
  const exitPrice=exit.close*(1-(config.slippagePercent??0)/100), gross=(exitPrice-entry)*q.quantity, fees=Math.abs(entry*q.quantity)*((config.commissionPercent??0)/100)+Math.abs(exitPrice*q.quantity)*((config.commissionPercent??0)/100);
  const pnl=gross-fees; capital+=pnl; peak=Math.max(peak,capital); maxDD=Math.max(maxDD,(peak-capital)/peak*100);
  trades.push({ticker,entryDate:c.date,exitDate:exit.date,entryPrice:entry,exitPrice,quantity:q.quantity,pnl,returnPercent:pnl/(entry*q.quantity)*100,reason});
  i=Math.max(i+1,candles.indexOf(exit));
 }
 return {initialCapital:config.initialCapital,finalCapital:capital,trades,winRate:trades.length?trades.filter(t=>t.pnl>0).length/trades.length*100:0,maxDrawdownPercent:maxDD};
}
