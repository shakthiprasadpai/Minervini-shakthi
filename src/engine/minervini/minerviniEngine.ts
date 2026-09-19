import type { PricePoint } from '../../types';
import type { MinerviniEngineResult, MinerviniInput } from './types';
import { evaluateTrendTemplate } from './trendTemplate';
import { analyzeVcp } from './vcpDetector';
import { detectBreakout } from './breakoutDetector';
import { relativeStrengthScore } from './rsRating';
import { detectStage2 } from './stageAnalysis';
import { calculateAtrStop } from './atrStop';

export function runMinerviniEngine(input: MinerviniInput, benchmark?: PricePoint[]): MinerviniEngineResult {
  const history=input.priceHistory;
  const trend=evaluateTrendTemplate(history);
  const vcp=analyzeVcp(history);
  const stage=detectStage2(history);
  const breakout=detectBreakout(history);
  const rs=benchmark ? relativeStrengthScore(history,benchmark) : input.rsRating;
  const pivot=input.pivotPrice ?? breakout.pivotPrice ?? undefined;
  const atrStop=pivot ? calculateAtrStop(pivot,history, input.atrMultiple ?? 1.5) : null;
  const stop=atrStop?.stop;
  const buyZoneMax=pivot ? pivot*1.02 : undefined;
  const risk=pivot&&stop ? pivot-stop : undefined;
  const target1=pivot&&risk ? pivot+risk*3 : undefined;
  const target2=pivot&&risk ? pivot+risk*5 : undefined;
  const rr=risk&&target2 ? (target2-pivot)/risk : undefined;
  const current=input.currentPrice;
  const breakoutStatus=pivot ? (current>buyZoneMax!?'ABOVE_PIVOT':current>=pivot?'IN_BUY_ZONE':'BELOW_PIVOT') : 'NO_PIVOT';
  const entryStatus=stage.confirmed&&trend.score>=7&&vcp.score>=60&&breakoutStatus!=='BELOW_PIVOT'?'READY':stage.confirmed?'WATCH':'INVALID';
  const exitStatus=stop&&current<=stop?'EXIT':current<(trend.sma50??0)?'REDUCE':'HOLD';
  const overallScore=Math.round(trend.score/8*40+vcp.score*.25+(rs??50)/99*20+(stage.confirmed?15:0));
  return {ticker:input.ticker,trendTemplateScore:trend.score,trendTemplatePassed:trend.passed,rsRating:rs??undefined,stage:stage.stage==='STAGE_2'?'STAGE_2':stage.stage==='UNKNOWN'?'UNKNOWN':'NOT_STAGE_2',vcpDetected:vcp.detected,vcpScore:vcp.score,contractions:vcp.contractions,volumeScore:100-vcp.contractions.slice(-1).reduce((s,x)=>s+Math.max(0,x.volumeDryUpPercent),0),breakoutStatus,pivotPrice:pivot,buyZoneMax,stopLoss:stop,target1,target2,riskReward:rr,entryStatus,exitStatus,overallScore,reasons:[`Trend Template: ${trend.score}/8`,`Stage: ${stage.stage}`,`VCP score: ${vcp.score}/100`,`RS Rating: ${rs??'unavailable'}`,`Pivot: ${pivot??'unavailable'}`,atrStop? `ATR stop: ${atrStop.stop.toFixed(2)} (ATR ${atrStop.atr.toFixed(2)})`:'ATR stop unavailable']};
}
export type { PricePoint };
