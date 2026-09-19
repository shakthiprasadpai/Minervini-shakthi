import { PricePoint } from '../../types';

const ret = (c: PricePoint[], n: number) => {
  if (c.length <= n) return null;
  const a = c[c.length - 1 - n].close, b = c[c.length - 1].close;
  return a > 0 ? b / a - 1 : null;
};

export function relativeStrengthScore(stock: PricePoint[], benchmark: PricePoint[]) {
  const periods = [63, 126, 252];
  const weights = [0.2, 0.3, 0.5];
  let score = 0;
  let used = 0;
  periods.forEach((p,i) => {
    const sr=ret(stock,p), br=ret(benchmark,p);
    if(sr!==null && br!==null){ score += ((1+sr)/(1+br)-1)*weights[i]; used += weights[i]; }
  });
  if(!used) return null;
  return Math.round(Math.max(0, Math.min(99, 50 + score * 200)));
}

export function rankRsRatings(values: number[]) {
  const sorted=[...values].sort((a,b)=>a-b);
  return values.map(v=> {
    if(!sorted.length) return 0;
    const rank=sorted.findIndex(x=>x>=v);
    return Math.round((rank / Math.max(1,sorted.length-1))*98)+1;
  });
}
