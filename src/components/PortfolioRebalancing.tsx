import React, { useState } from 'react';
import { PortfolioHolding, MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { PieChart, Sliders, RefreshCw, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight, DollarSign, ShieldAlert, Download } from 'lucide-react';

interface PortfolioRebalancingProps {
  holdings: PortfolioHolding[];
  stocksList: MinerviniTradeSetup[];
  onApplyRebalance?: (updatedHoldings: PortfolioHolding[]) => void;
}

export const PortfolioRebalancing: React.FC<PortfolioRebalancingProps> = ({
  holdings,
  stocksList,
  onApplyRebalance,
}) => {
  // Account parameters
  const [totalCapital, setTotalCapital] = useState<number>(100000);
  const [maxPositionWeightPct, setMaxPositionWeightPct] = useState<number>(20.0); // Minervini recommends max 20-25%
  const [maxAccountRiskPerTradePct, setMaxAccountRiskPerTradePct] = useState<number>(1.25); // Max 1.25% equity risk per stop loss

  // Calculate current portfolio metrics
  const totalInvestedValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
  const cashBalance = Math.max(0, totalCapital - totalInvestedValue);

  // Analyze each position against SEPA rebalancing rules
  const rebalanceAnalysis = holdings.map((h) => {
    const currencySymbol = getCurrencySymbol(h.exchange);
    const currentValue = h.shares * h.currentPrice;
    const currentWeightPct = totalCapital > 0 ? (currentValue / totalCapital) * 100 : 0;
    
    // Risk calculations
    const stopPrice = h.stopLossPrice || h.currentPrice * 0.95;
    const riskPerShare = Math.max(0.01, h.currentPrice - stopPrice);
    const totalPositionDollarRisk = riskPerShare * h.shares;
    const currentAccountRiskPct = totalCapital > 0 ? (totalPositionDollarRisk / totalCapital) * 100 : 0;

    // Target Weight % based on SEPA cap
    const targetWeightPct = Math.min(currentWeightPct, maxPositionWeightPct);
    const targetValue = (targetWeightPct / 100) * totalCapital;
    const targetShares = Math.max(0, Math.floor(targetValue / h.currentPrice));

    // Rebalance Action
    const shareDifference = targetShares - h.shares;
    const dollarDifference = Math.abs(shareDifference * h.currentPrice);

    let status: 'BALANCED' | 'OVERWEIGHT' | 'UNDERWEIGHT' | 'HIGH_RISK' = 'BALANCED';
    let actionText = 'HOLD - Properly Sized';
    let actionType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    if (currentAccountRiskPct > maxAccountRiskPerTradePct * 1.2) {
      status = 'HIGH_RISK';
      actionType = 'SELL';
      actionText = `TRIM - Stop-loss risk (${currentAccountRiskPct.toFixed(2)}%) exceeds ${maxAccountRiskPerTradePct}% equity cap`;
    } else if (currentWeightPct > maxPositionWeightPct + 2) {
      status = 'OVERWEIGHT';
      actionType = 'SELL';
      actionText = `TRIM ${Math.abs(shareDifference)} shares to hit ${maxPositionWeightPct}% cap`;
    } else if (currentWeightPct < maxPositionWeightPct * 0.5 && cashBalance > 5000) {
      status = 'UNDERWEIGHT';
      actionType = 'BUY';
      actionText = `ADD ${Math.abs(shareDifference)} shares (Under-allocated)`;
    }

    return {
      holding: h,
      currencySymbol,
      currentValue,
      currentWeightPct,
      targetWeightPct,
      currentAccountRiskPct,
      status,
      actionType,
      actionText,
      shareDifference,
      dollarDifference,
      targetShares,
    };
  });

  const totalRebalanceTradesCount = rebalanceAnalysis.filter(r => r.actionType !== 'HOLD').length;

  const handleApplyAllRebalances = () => {
    if (!onApplyRebalance) return;
    const newHoldings = holdings.map((h) => {
      const item = rebalanceAnalysis.find(r => r.holding.id === h.id);
      if (item && item.actionType === 'SELL') {
        return {
          ...h,
          shares: item.targetShares,
        };
      }
      return h;
    });
    onApplyRebalance(newHoldings);
  };

  return (
    <div id="portfolio-rebalancing-module" className="bg-white border border-[#e5e4e1] p-6 space-y-6 text-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-purple-700" />
            <h3 className="text-xl font-serif font-black text-[#1a1a1a]">
              Institutional Portfolio Rebalancer
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-serif italic mt-0.5">
            Automated SEPA position capping, equity risk alignment & order generator
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {totalRebalanceTradesCount > 0 && (
            <button
              onClick={handleApplyAllRebalances}
              className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-black text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Apply Rebalance Orders ({totalRebalanceTradesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Control Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f9f8f5] p-4 border border-[#e5e4e1] font-mono text-xs">
        <div>
          <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
            Total Account Capital ($)
          </label>
          <input
            type="number"
            step="5000"
            value={totalCapital}
            onChange={(e) => setTotalCapital(Math.max(1000, Number(e.target.value)))}
            className="w-full bg-white border border-[#e5e4e1] px-3 py-1.5 font-bold text-[#1a1a1a] focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
            Max Position Cap (% Equity)
          </label>
          <input
            type="number"
            step="1"
            min="5"
            max="50"
            value={maxPositionWeightPct}
            onChange={(e) => setMaxPositionWeightPct(Number(e.target.value))}
            className="w-full bg-white border border-[#e5e4e1] px-3 py-1.5 font-bold text-[#1a1a1a] focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
            Max Risk Cap (% Equity / Trade)
          </label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            max="5.0"
            value={maxAccountRiskPerTradePct}
            onChange={(e) => setMaxAccountRiskPerTradePct(Number(e.target.value))}
            className="w-full bg-white border border-[#e5e4e1] px-3 py-1.5 font-bold text-[#1a1a1a] focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Rebalance Analysis Table */}
      <div className="overflow-x-auto border border-[#e5e4e1]">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-[#1a1a1a] text-white text-[10px] uppercase tracking-wider">
              <th className="p-3">Holding</th>
              <th className="p-3 text-right">Shares</th>
              <th className="p-3 text-right">Current Value</th>
              <th className="p-3 text-right">Weight %</th>
              <th className="p-3 text-right">Account Risk %</th>
              <th className="p-3 text-center">SEPA Status</th>
              <th className="p-3 text-right">Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e4e1] bg-white">
            {rebalanceAnalysis.map((item) => {
              const h = item.holding;
              return (
                <tr key={h.id} className="hover:bg-[#f9f8f5] transition">
                  <td className="p-3">
                    <div className="font-bold text-[#1a1a1a] text-sm">{h.ticker}</div>
                    <div className="text-[10px] text-gray-500">{h.stockName}</div>
                  </td>

                  <td className="p-3 text-right font-bold text-gray-800">
                    {h.shares.toLocaleString()} Sh
                  </td>

                  <td className="p-3 text-right font-bold text-[#1a1a1a]">
                    {formatCurrency(item.currentValue, item.currencySymbol)}
                  </td>

                  <td className="p-3 text-right">
                    <span className={`font-bold ${item.currentWeightPct > maxPositionWeightPct ? 'text-red-600' : 'text-gray-800'}`}>
                      {item.currentWeightPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-gray-400 block">Cap: {maxPositionWeightPct}%</span>
                  </td>

                  <td className="p-3 text-right">
                    <span className={`font-bold ${item.currentAccountRiskPct > maxAccountRiskPerTradePct ? 'text-red-600' : 'text-emerald-700'}`}>
                      {item.currentAccountRiskPct.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-gray-400 block">Cap: {maxAccountRiskPerTradePct}%</span>
                  </td>

                  <td className="p-3 text-center">
                    {item.status === 'BALANCED' && (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 inline-block">
                        BALANCED
                      </span>
                    )}
                    {item.status === 'OVERWEIGHT' && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 inline-block">
                        OVERWEIGHT
                      </span>
                    )}
                    {item.status === 'HIGH_RISK' && (
                      <span className="bg-red-100 text-red-900 border border-red-300 text-[10px] font-bold px-2 py-0.5 inline-block">
                        EXCESS RISK
                      </span>
                    )}
                    {item.status === 'UNDERWEIGHT' && (
                      <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold px-2 py-0.5 inline-block">
                        UNDERWEIGHT
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <span className={`text-[11px] font-bold ${
                      item.actionType === 'SELL' ? 'text-red-700' : item.actionType === 'BUY' ? 'text-emerald-700' : 'text-gray-500'
                    }`}>
                      {item.actionText}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
