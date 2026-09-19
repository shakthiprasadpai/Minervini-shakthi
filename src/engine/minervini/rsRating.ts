import { PricePoint } from '../../types';
const ret=(c:PricePoint[],n:number)=>{if(c.length<=n)return null;const a=c[c.length-1-n].close,b=c[c.length-1].close;return a>0?b/a-1:null;};
export function relativeStrengthScore(stock:PricePoint[],benchmark:PricePoint[]){
 const ps=[63,126,252],w=[.2,.3,.5];let score=0,used=0;
 ps.forEach((p,i)=>{const sr=ret(stock,p),br=ret(benchmark,p);if(sr!==null&&br!==null){score+=(((1+sr)/(1+br))-1)*w[i];used+=w[i];}});
 return used?score:null;
}
export function rankRsRatings(scores:number[]){const sorted=[...scores].sort((a,b)=>a-b);return scores.map(v=>{const idx=sorted.findIndex(x=>x>=v);return Math.round((idx/Math.max(1,sorted.length-1))*98)+1;});}
