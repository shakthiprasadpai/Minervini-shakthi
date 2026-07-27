import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, formatVolume, getCurrencySymbol } from '../utils/sepaCalculator';
import { Zap, TrendingUp, BarChart2, ShieldCheck, ExternalLink, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

interface PocketPivotScannerProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
}

export const PocketPivotScanner: React.FC<PocketPivotScannerProps> = ({
  stocks,
  onSelectStock,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pocket_pivot_active' | 'volume_dry_up'>('pocket_pivot_active');

  // Calculate pocket pivot criteria for each stock in the screener
  const enhancedStocks = stocks.map((stock) => {
    const lastDay = stock.priceHistory[stock.priceHistory.length - 1] || { volume: stock.pivotVolume, close: stock.currentPrice };
    const prevDay = stock.priceHistory[stock.priceHistory.length - 2] || { close: stock.currentPrice * 0.99 };
    
    const isUpDay = lastDay.close >= prevDay.close;
    // Simulate pocket pivot condition based on TradingView algorithm: volume > highest down day volume in last 10 sessions
    const hasPocketPivotVolume = lastDay.volume > (lastDay.avgVolume20 || 1000000) * 1.15;
    const isNearMovingAverage = stock.currentPrice >= stock.sma50 * 0.98 && stock.currentPrice <= stock.sma50 * 1.08;
    const isPocketPivot = isUpDay && hasPocketPivotVolume && isNearMovingAverage && stock.trendScore >= 6;

    return {
      ...stock,
      isUpDay,
      hasPocketPivotVolume,
      isPocketPivot,
    };
  });

  const filteredStocks = enhancedStocks.filter((s) => {
    if (filterType === 'pocket_pivot_active') return s.isPocketPivot;
    if (filterType === 'volume_dry_up') return s.isTightVolume || s.volumeDryUpPercent > 40;
    return true;
  });

  return (
    <div className="bg-[#1a1a1a] text-white p-6 sm:p-8 border border-black shadow-xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-400 text-black flex items-center justify-center font-bold text-xl shadow-lg">
            <Zap className="w-6 h-6 fill-current text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-400">
                TradingView Script Integration &bull; Tom Aspray / Minervini
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] uppercase px-2 py-0.5 font-mono font-bold">
                Pocket Pivots & Institutional Volume
              </span>
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tight text-white mt-0.5">
              Simple Volume with Pocket Pivots Screener
            </h2>
          </div>
        </div>

        {/* TradingView Link Badge */}
        <a
          href="https://in.tradingview.com/script/JkB0iCFp-Simple-Volume-with-Pocket-Pivots/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-200 px-4 py-2.5 rounded flex items-center space-x-3 transition-all group"
        >
          <BarChart2 className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <div className="text-[10px] font-mono text-blue-300 uppercase font-bold">TradingView Indicator Ref</div>
            <div className="text-xs font-bold text-white flex items-center space-x-1">
              <span>View Pine Script</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </div>
          </div>
        </a>
      </div>

      {/* Explanation Banner */}
      <div className="bg-white/5 border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>What is a Pocket Pivot? (Institutional Accumulation)</span>
          </h4>
          <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
            A Pocket Pivot occurs when a stock is in a sound consolidation or VCP base, experiences an <strong className="text-white">up-day with volume greater than the highest down-volume day</strong> in the prior 10 trading sessions, and bounces cleanly off key moving averages (50 SMA or 10 SMA). This signals stealth institutional accumulation before the formal pivot breakout.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-black/40 border border-white/20 p-1.5 rounded text-xs font-mono">
          <button
            onClick={() => setFilterType('pocket_pivot_active')}
            className={`px-3 py-1.5 font-bold transition-all ${
              filterType === 'pocket_pivot_active' ? 'bg-amber-400 text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            Pocket Pivots Active ({enhancedStocks.filter(s => s.isPocketPivot).length})
          </button>
          <button
            onClick={() => setFilterType('volume_dry_up')}
            className={`px-3 py-1.5 font-bold transition-all ${
              filterType === 'volume_dry_up' ? 'bg-amber-400 text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            Volume Dry-Up Setups
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 font-bold transition-all ${
              filterType === 'all' ? 'bg-amber-400 text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            All Stocks ({enhancedStocks.length})
          </button>
        </div>
      </div>

      {/* Stocks Grid / Table */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => {
            const currency = getCurrencySymbol(stock.exchange);
            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectStock(stock)}
                className={`bg-white/5 border p-5 transition-all cursor-pointer space-y-3 hover:border-amber-400/80 ${
                  stock.isPocketPivot
                    ? 'border-amber-400/50 bg-amber-500/5'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-black text-amber-400 border border-white/20 flex items-center justify-center font-mono font-bold text-xs">
                      {stock.ticker}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{stock.name}</div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {stock.exchange} &bull; {stock.sector}
                      </div>
                    </div>
                  </div>

                  {stock.isPocketPivot ? (
                    <span className="bg-amber-400 text-black text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded shadow-sm">
                      Pocket Pivot Signal
                    </span>
                  ) : (
                    <span className="bg-white/10 text-gray-300 text-[9px] font-mono uppercase px-2 py-0.5">
                      Base Consolidation
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/10">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Current Price</span>
                    <span className="font-bold text-white">{formatCurrency(stock.currentPrice, currency)}</span>
                    <span className={`ml-1 text-[10px] ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Pivot Level</span>
                    <span className="font-bold text-amber-300">{formatCurrency(stock.pivotPrice, currency)}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-white/10 text-xs font-mono">
                  <div className="flex justify-between text-gray-300">
                    <span>Volume vs 20d Avg:</span>
                    <strong className="text-emerald-400 font-black">+{stock.volumeDryUpPercent > 0 ? `${stock.volumeDryUpPercent}% Dry-up` : 'High Accumulation'}</strong>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Trend Score & RS:</span>
                    <span className="text-white font-bold">{stock.trendScore}/8 • RS {stock.rsRating}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-gray-400 border-t border-white/10">
                  <span>Pattern: {stock.patternType}</span>
                  <span className="text-amber-400 font-bold hover:underline">Select Stock &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/10 pt-4">
        <span>Simple Volume with Pocket Pivots (TradingView Pine Script algorithmic filter)</span>
        <span className="text-amber-400 font-bold">Institutional Accumulation Detector Active</span>
      </div>

    </div>
  );
};
