export function calculatePositionSize(capital:number,entryPrice:number,stopPrice:number,riskPercent:number,maxAllocationPercent=20){
 if(capital<=0||entryPrice<=stopPrice||stopPrice<=0||riskPercent<=0)return {quantity:0,riskAmount:0,positionValue:0};
 const riskAmount=capital*riskPercent/100;
 const byRisk=Math.floor(riskAmount/(entryPrice-stopPrice));
 const byAllocation=Math.floor(capital*maxAllocationPercent/100/entryPrice);
 const quantity=Math.max(0,Math.min(byRisk,byAllocation));
 return {quantity,riskAmount,positionValue:quantity*entryPrice};
}
