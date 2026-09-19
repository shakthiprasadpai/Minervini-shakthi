import { PricePoint, VcpContraction } from '../../types';

export function analyzeVcp(candles: PricePoint[]) {
  if(candles.length<60) return {detected:false,score:0,contractions:[] as VcpContraction[]};
  const windows=[40,20,10,5];
  const contractions:VcpContraction[]=[];
  for(let i=0;i<windows.length;i++){
    const w=windows[i], data=candles.slice(-w);
    const high=Math.max(...data.map(x=>x.high)), low=Math.min(...data.map(x=>x.low));
    const depth=high>0?(high-low)/high*100:0;
    const avgVol=data.reduce((s,x)=>s+x.volume,0)/data.length;
    const previous=candles.slice(-(w*2),-w);
    const prevVol=previous.length?previous.reduce((s,x)=>s+x.volume,0)/previous.length:avgVol;
    contractions.push({
      contractionIndex:i+1, depthPercent:-Number(depth.toFixed(2)), durationDays:w,
      volumeDryUpPercent:prevVol?Number(((avgVol/prevVol-1)*100).toFixed(2)):0,
      startDate:data[0]?.date||'', endDate:data[data.length-1]?.date||'', highPrice:high, lowPrice:low
    });
  }
  let improving=0;
  for(let i=1;i<contractions.length;i++) if(Math.abs(contractions[i].depthPercent)<=Math.abs(contractions[i-1].depthPercent)) improving++;
  const volumeDry=contractions[contractions.length-1].volumeDryUpPercent<=-20;
  const score=Math.round(Math.min(100,improving/3*60+(volumeDry?40:0)));
  return {detected:improving>=2&&volumeDry,score,contractions};
}
