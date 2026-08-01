import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { Target, ShieldAlert, Sliders, TrendingUp, DollarSign, Layers, ArrowUpRight, BarChart3, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts';

interface RiskRewardChartProps {
  stock: MinerviniTradeSetup;
  accountCapital?: number;
}

export const RiskRewardChart: React.FC<RiskRewardChartProps> = ({
  stock,
  accountCapital = 100000,
}) => {
  const currencySymbol = getCurrencySymbol(stock?.exchange);
  const entryPrice = stock?.pivotPrice || stock?.currentPrice || 100;

  // Sliders state
  const [stopLossPct, setStopLossPct] = useState<number>(5.0);
  const [targetRR, setTargetRR] = useState<number>(3.0);
  const [shareQuantity, setShareQuantity] = useState<number>(() => {
    // Default position size ~ 10-15% of account capital
    const posCapital = accountCapital * 0.15;
    return entryPrice > 0 ? Math.max(1, Math.floor(posCapital / entryPrice)) : 100;
  });

  // Derived Calculations
  const stopLossPrice = Number((entryPrice * (1 - stopLossPct / 100)).toFixed(2));
  const riskPerShare = Math.max(0.01, entryPrice - stopLossPrice);
  
  const target1R = Number((entryPrice + riskPerShare * 1.0).toFixed(2));
  const target2R = Number((entryPrice + riskPerShare * 2.0).toFixed(2));
  const target3R = Number((entryPrice + riskPerShare * 3.0).toFixed(2));
  const targetCustomR = Number((entryPrice + riskPerShare * targetRR).toFixed(2));
  const target5R = Number((entryPrice + riskPerShare * 5.0).toFixed(2));

  const totalDollarRisk = Number((riskPerShare * shareQuantity).toFixed(2));
  const totalDollarReward = Number((riskPerShare * targetRR * shareQuantity).toFixed(2));

  const positionValue = Number((entryPrice * shareQuantity).toFixed(2));
  const portfolioWeightPct = accountCapital > 0 ? (positionValue / accountCapital) * 100 : 0;
  const portfolioRiskPct = accountCapital > 0 ? (totalDollarRisk / accountCapital) * 100 : 0;
  const portfolioRewardPct = accountCapital > 0 ? (totalDollarReward / accountCapital) * 100 : 0;

  // Multi-tier scale out calculations (33% @ 1.5R, 33% @ 3R, 34% @ Target R)
  const tier1Price = Number((entryPrice + riskPerShare * 1.5).toFixed(2));
  const tier1Shares = Math.floor(shareQuantity * 0.33);
  const tier1Profit = Number((riskPerShare * 1.5 * tier1Shares).toFixed(2));

  const tier2Price = Number((entryPrice + riskPerShare * 3.0).toFixed(2));
  const tier2Shares = Math.floor(shareQuantity * 0.33);
  const tier2Profit = Number((riskPerShare * 3.0 * tier2Shares).toFixed(2));

  const tier3Shares = Math.max(0, shareQuantity - tier1Shares - tier2Shares);
  const tier3Profit = Number((riskPerShare * targetRR * tier3Shares).toFixed(2));

  const totalScaleOutProfit = Number((tier1Profit + tier2Profit + tier3Profit).toFixed(2));

  // Build chart dataset for Recharts visual mapping
  // Map price levels from Stop Loss (-100% R) to 5R (+500% R)
  const chartData = [
    { label: 'Max Stop (-1R)', price: stopLossPrice, rMultiple: -1.0, zone: 'RISK', dollarImpact: -totalDollarRisk, color: '#dc2626' },
    { label: 'Pivot Entry', price: entryPrice, rMultiple: 0.0, zone: 'ENTRY', dollarImpact: 0, color: '#2563eb' },
    { label: 'Target 1.5R (T1 Lock)', price: tier1Price, rMultiple: 1.5, zone: 'REWARD_PARTIAL', dollarImpact: tier1Profit, color: '#16a34a' },
    { label: 'Target 3.0R (T2 Lock)', price: tier2Price, rMultiple: 3.0, zone: 'REWARD_PARTIAL', dollarImpact: tier2Profit, color: '#059669' },
    { label: `Target ${targetRR.toFixed(1)}R (Runner)`, price: targetCustomR, rMultiple: targetRR, zone: 'REWARD_CUSTOM', dollarImpact: totalDollarReward, color: '#047857' },
    { label: 'Moonshot 5.0R', price: target5R, rMultiple: 5.0, zone: 'REWARD_MAX', dollarImpact: Number((riskPerShare * 5 * shareQuantity).toFixed(2)), color: '#065f46' },
  ];

  return (
    <div id="risk-reward-charting-module" className="bg-white border border-[#e5e4e1] p-6 space-y-6 text-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-700" />
            <h3 className="text-xl font-serif font-black text-[#1a1a1a]">
              Interactive Risk-Reward & Profit Chart
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-serif italic mt-0.5">
            Visual SEPA Risk/Reward mapping for <strong className="not-italic text-[#1a1a1a]">{stock.ticker}</strong> ({stock.stockName})
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="bg-red-100 text-red-900 border border-red-300 font-bold px-3 py-1">
            Risk: -{stopLossPct.toFixed(1)}% ({formatCurrency(totalDollarRisk, currencySymbol)})
          </span>
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-1">
            Reward: +{(targetRR * stopLossPct).toFixed(1)}% ({formatCurrency(totalDollarReward, currencySymbol)})
          </span>
        </div>
      </div>

      {/* Sliders & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#f9f8f5] p-5 border border-[#e5e4e1]">
        {/* Control 1: Stop Loss % */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-red-700 uppercase tracking-wider flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Stop Loss %</span>
            </span>
            <span className="font-mono font-black text-red-700 bg-white border border-red-200 px-2 py-0.5">
              -{stopLossPct.toFixed(1)}% ({formatCurrency(stopLossPrice, currencySymbol)})
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="12.0"
            step="0.1"
            value={stopLossPct}
            onChange={(e) => setStopLossPct(Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer h-2 bg-gray-200"
          />
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>1% (Tight)</span>
            <span>5-8% (Minervini)</span>
            <span>12% (Wide)</span>
          </div>
        </div>

        {/* Control 2: Target R:R Ratio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 text-emerald-700" />
              <span>Target R:R Ratio</span>
            </span>
            <span className="font-mono font-black text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5">
              {targetRR.toFixed(1)} : 1 ({formatCurrency(targetCustomR, currencySymbol)})
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.1"
            value={targetRR}
            onChange={(e) => setTargetRR(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-gray-200"
          />
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>1:1</span>
            <span>3:1 (Ideal)</span>
            <span>8:1 (Super)</span>
          </div>
        </div>

        {/* Control 3: Position Shares */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-blue-700" />
              <span>Position Shares</span>
            </span>
            <span className="font-mono font-black text-blue-800 bg-white border border-blue-200 px-2 py-0.5">
              {shareQuantity.toLocaleString()} Sh ({formatCurrency(positionValue, currencySymbol)})
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="100000"
            value={shareQuantity}
            onChange={(e) => setShareQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white border border-[#e5e4e1] px-3 py-1 font-mono text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-black"
          />
          <div className="text-[10px] font-mono text-gray-500 flex justify-between">
            <span>Portfolio Weight: {portfolioWeightPct.toFixed(1)}%</span>
            <span>Risk/Acct: {portfolioRiskPct.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Graphic Area */}
      <div className="bg-[#10141d] border border-[#232936] p-5 rounded space-y-4 text-white">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 border-b border-gray-800 pb-2">
          <span className="uppercase tracking-widest text-amber-400 font-bold flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>SEPA Risk vs Reward Level Visualization</span>
          </span>
          <span>Pivot Entry: <strong className="text-white">{formatCurrency(entryPrice, currencySymbol)}</strong></span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3245" />
              <XAxis dataKey="label" stroke="#8892b0" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 10']}
                stroke="#8892b0"
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                tickFormatter={(val) => formatCurrency(val, currencySymbol)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 text-xs font-mono text-white shadow-xl space-y-1">
                        <div className="font-bold text-amber-400">{data.label}</div>
                        <div>Price: <span className="font-bold">{formatCurrency(data.price, currencySymbol)}</span></div>
                        <div>R-Multiple: <span className="font-bold">{data.rMultiple > 0 ? `+${data.rMultiple}R` : `${data.rMultiple}R`}</span></div>
                        <div>Estimated P&L: <span className={data.dollarImpact >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {data.dollarImpact >= 0 ? '+' : ''}{formatCurrency(data.dollarImpact, currencySymbol)}
                        </span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={entryPrice} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'PIVOT ENTRY', fill: '#60a5fa', fontSize: 11, position: 'right' }} />
              <ReferenceLine y={stopLossPrice} stroke="#ef4444" strokeWidth={2} label={{ value: 'STOP LOSS', fill: '#f87171', fontSize: 11, position: 'right' }} />
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-red-50 border border-red-200 p-4 space-y-1">
          <span className="text-[10px] text-red-800 uppercase font-bold block">Defined Risk (-1R)</span>
          <div className="text-xl font-black text-red-700">
            -{formatCurrency(totalDollarRisk, currencySymbol)}
          </div>
          <span className="text-[10px] text-red-600 block">
            -{stopLossPct.toFixed(1)}% stop loss | {formatCurrency(riskPerShare, currencySymbol)} / share
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 space-y-1">
          <span className="text-[10px] text-emerald-800 uppercase font-bold block">Target Reward (+{targetRR}R)</span>
          <div className="text-xl font-black text-emerald-800">
            +{formatCurrency(totalDollarReward, currencySymbol)}
          </div>
          <span className="text-[10px] text-emerald-700 block">
            +{(targetRR * stopLossPct).toFixed(1)}% gain target | {formatCurrency(riskPerShare * targetRR, currencySymbol)} / share
          </span>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-4 space-y-1">
          <span className="text-[10px] text-purple-900 uppercase font-bold block">Staged Scale-Out Total</span>
          <div className="text-xl font-black text-purple-900">
            +{formatCurrency(totalScaleOutProfit, currencySymbol)}
          </div>
          <span className="text-[10px] text-purple-800 block">
            Locked across 1.5R, 3R & Runner
          </span>
        </div>

        <div className="bg-[#1a1a1a] text-white p-4 space-y-1 border border-black">
          <span className="text-[10px] text-amber-400 uppercase font-bold block">Breakeven Win Rate</span>
          <div className="text-xl font-black text-amber-400">
            {((1 / (1 + targetRR)) * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-gray-300 block">
            You only need to win {((1 / (1 + targetRR)) * 100).toFixed(1)}% of trades at {targetRR.toFixed(1)}:1 R:R!
          </span>
        </div>
      </div>
    </div>
  );
};
