import React, { useState, useMemo } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, formatVolume, getCurrencySymbol } from '../utils/sepaCalculator';
import { Activity, Target, TrendingUp, ShieldCheck, Filter, ArrowUpRight, BarChart3, CheckCircle2, Flame, Layers } from 'lucide-react';

interface VcpPatternScannerProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart: (stock: MinerviniTradeSetup) => void;
}

export interface VcpScanResult extends MinerviniTradeSetup {
  last20High: number;
  last20Low: number;
  contractionPercent: number;
  tightnessLevel: 'Ultra-Tight (<3%)' | 'Moderate (3-6%)' | 'Wide (>6%)';
  barCount: number;
  // 3-Week VCP Tightness & Base Completion Metrics
  threeWeekHigh: number;
  threeWeekLow: number;
  threeWeekTightnessPct: number;
  threeWeekBaseStatus: 'PRIMED (≤3.5%)' | 'COMPLETED (≤5%)' | 'BUILDING (>5%)';
  isThreeWeekBaseCompleted: boolean;
}

export const VcpPatternScanner: React.FC<VcpPatternScannerProps> = ({
  stocks,
  onSelectStock,
  onViewChart,
}) => {
  const [filterTightness, setFilterTightness] = useState<'all' | '3week_primed' | 'ultra_tight' | 'moderate'>('all');
  const [sortBy, setSortBy] = useState<'tightness' | '3week_tightness' | 'rs_rating' | 'price'>('3week_tightness');

  // Scan stocks and calculate 20-bar local high/low contraction & 3-week base tightness
  const scannedStocks: VcpScanResult[] = useMemo(() => {
    return stocks.map((stock) => {
      const history = stock.priceHistory || [];
      const slice20 = history.slice(-20);
      const highs20 = slice20.length > 0 ? slice20.map((h) => h.high || h.close) : [stock.currentPrice * 1.05];
      const lows20 = slice20.length > 0 ? slice20.map((l) => l.low || l.close) : [stock.currentPrice * 0.95];

      const last20High = Math.max(...highs20);
      const last20Low = Math.min(...lows20);
      const contractionPercent = Number((((last20High - last20Low) / last20High) * 100).toFixed(2));

      let tightnessLevel: 'Ultra-Tight (<3%)' | 'Moderate (3-6%)' | 'Wide (>6%)' = 'Wide (>6%)';
      if (contractionPercent <= 3.0) {
        tightnessLevel = 'Ultra-Tight (<3%)';
      } else if (contractionPercent <= 6.0) {
        tightnessLevel = 'Moderate (3-6%)';
      }

      // Calculate 3-Week (15 trading days) Tightness
      const slice15 = history.slice(-15);
      const highs15 = slice15.length > 0 ? slice15.map((h) => h.high || h.close) : [stock.currentPrice * 1.04];
      const lows15 = slice15.length > 0 ? slice15.map((l) => l.low || l.close) : [stock.currentPrice * 0.96];

      const threeWeekHigh = Math.max(...highs15);
      const threeWeekLow = Math.min(...lows15);
      const threeWeekTightnessPct = Number((((threeWeekHigh - threeWeekLow) / threeWeekHigh) * 100).toFixed(2));

      const isThreeWeekBaseCompleted = threeWeekTightnessPct <= 5.0;
      let threeWeekBaseStatus: 'PRIMED (≤3.5%)' | 'COMPLETED (≤5%)' | 'BUILDING (>5%)' = 'BUILDING (>5%)';
      if (threeWeekTightnessPct <= 3.5) {
        threeWeekBaseStatus = 'PRIMED (≤3.5%)';
      } else if (threeWeekTightnessPct <= 5.0) {
        threeWeekBaseStatus = 'COMPLETED (≤5%)';
      }

      return {
        ...stock,
        last20High,
        last20Low,
        contractionPercent,
        tightnessLevel,
        barCount: slice20.length,
        threeWeekHigh,
        threeWeekLow,
        threeWeekTightnessPct,
        threeWeekBaseStatus,
        isThreeWeekBaseCompleted,
      };
    });
  }, [stocks]);

  const filteredAndSortedStocks = useMemo(() => {
    let result = [...scannedStocks];
    if (filterTightness === '3week_primed') {
      result = result.filter((s) => s.threeWeekTightnessPct <= 5.0);
    } else if (filterTightness === 'ultra_tight') {
      result = result.filter((s) => s.contractionPercent <= 3.0);
    } else if (filterTightness === 'moderate') {
      result = result.filter((s) => s.contractionPercent > 3.0 && s.contractionPercent <= 6.0);
    }

    result.sort((a, b) => {
      if (sortBy === '3week_tightness') return a.threeWeekTightnessPct - b.threeWeekTightnessPct; // tightest 3-week first
      if (sortBy === 'tightness') return a.contractionPercent - b.contractionPercent; // tightest 20-bar first
      if (sortBy === 'rs_rating') return b.rsRating - a.rsRating;
      return b.currentPrice - a.currentPrice;
    });

    return result;
  }, [scannedStocks, filterTightness, sortBy]);

  const threeWeekPrimedCount = scannedStocks.filter((s) => s.threeWeekTightnessPct <= 5.0).length;
  const ultraTightCount = scannedStocks.filter((s) => s.contractionPercent <= 3.0).length;
  const moderateCount = scannedStocks.filter((s) => s.contractionPercent > 3.0 && s.contractionPercent <= 6.0).length;

  return (
    <div className="bg-[#161b22] border border-[#30363d] p-6 sm:p-8 text-white shadow-xl space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#30363d] pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-amber-400 font-bold">
                Volatility Contraction Pattern (VCP) &bull; Mark Minervini Methodology
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] uppercase px-2 py-0.5 font-mono font-bold">
                20-Bar Price Tightness Scan
              </span>
            </div>
            <h2 className="text-2xl font-serif font-black text-white tracking-tight mt-0.5">
              VCP Tightness & Consolidation Range Scanner
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono bg-[#0e1117] px-4 py-2.5 border border-[#30363d]">
          <span className="text-gray-400">Total Scanned:</span>
          <span className="text-amber-400 font-bold">{scannedStocks.length} Indian Equities</span>
        </div>
      </div>

      {/* Filter and Metric Control Ribbon */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0e1117] p-4 border border-[#30363d]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider mr-2 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filter Tightness:
          </span>
          <button
            onClick={() => setFilterTightness('all')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
              filterTightness === 'all'
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-[#161b22] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
            }`}
          >
            All Stocks ({scannedStocks.length})
          </button>
          <button
            onClick={() => setFilterTightness('3week_primed')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
              filterTightness === '3week_primed'
                ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/20'
                : 'bg-[#161b22] text-purple-300 border-[#30363d] hover:bg-[#21262d]'
            }`}
          >
            ⚡ 3-Wk Base Primed ≤5% ({threeWeekPrimedCount})
          </button>
          <button
            onClick={() => setFilterTightness('ultra_tight')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
              filterTightness === 'ultra_tight'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-[#161b22] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
            }`}
          >
            Ultra-Tight ≤3% ({ultraTightCount})
          </button>
          <button
            onClick={() => setFilterTightness('moderate')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
              filterTightness === 'moderate'
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-[#161b22] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
            }`}
          >
            Moderate 3-6% ({moderateCount})
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-gray-400 uppercase">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#161b22] text-white border border-[#30363d] px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="3week_tightness">⚡ 3-Week Range Tightness % (Tightest First)</option>
            <option value="tightness">20-Bar Contraction % (Tightest First)</option>
            <option value="rs_rating">RS Rating (Highest First)</option>
            <option value="price">Current Price</option>
          </select>
        </div>
      </div>

      {/* 3-Week VCP Base Completion Radar Summary Card */}
      <div className="bg-[#110b24] border border-purple-800/80 p-5 space-y-4 text-white font-mono">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-900/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-950 border border-purple-500/60 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <Activity className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400">
                  3-Week Price Range Tightness Engine
                </span>
                <span className="bg-purple-950 border border-purple-600 text-purple-200 text-[9px] px-2 py-0.5 font-bold uppercase">
                  VCP Base Completion Analysis
                </span>
              </div>
              <h3 className="text-base font-serif font-black text-white mt-0.5">
                VCP Final Contraction & Base Completion Readiness
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-purple-950/80 border border-purple-700/80 px-3 py-1.5 font-bold text-amber-300">
              <span>{threeWeekPrimedCount} / {scannedStocks.length} Stocks Primed (≤5.0% 3-Wk Range)</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-purple-200/90 font-sans leading-relaxed">
          <strong className="text-amber-300 font-mono">Minervini Base Completion Rule:</strong> Prior to an explosive pivot breakout, a stock enters its final contraction (T3 or T4 phase) where price movement dries up dramatically over the last <strong className="text-white">3 weeks (15 trading days)</strong>. A 3-week range tightness <strong className="text-emerald-400 font-mono">≤ 5.0%</strong> signals that supply overhang has been completely absorbed by institutional buyers.
        </p>

        {/* Top 3-Week Tightest Base Completion Candidates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {scannedStocks
            .sort((a, b) => a.threeWeekTightnessPct - b.threeWeekTightnessPct)
            .slice(0, 3)
            .map((topStock) => {
              const currency = getCurrencySymbol(topStock.exchange);
              return (
                <div
                  key={`top-3wk-${topStock.ticker}`}
                  className="bg-[#090514] border border-purple-900 p-3 flex items-center justify-between hover:border-purple-500 transition-all cursor-pointer"
                  onClick={() => {
                    onSelectStock(topStock);
                    onViewChart(topStock);
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <strong className="text-white font-bold">{topStock.ticker}</strong>
                      <span className="text-[10px] text-purple-300/70">({topStock.exchange})</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block font-sans truncate max-w-[140px]">{topStock.name}</span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline justify-end space-x-1">
                      <strong className="text-emerald-400 text-sm font-extrabold">{topStock.threeWeekTightnessPct}%</strong>
                      <span className="text-[9px] text-gray-400 font-bold">3-Wk Range</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-amber-300 bg-purple-950 px-1.5 py-0.5 border border-purple-800 inline-block mt-0.5">
                      {topStock.threeWeekBaseStatus}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Scanned Stocks Table */}
      <div className="overflow-x-auto border border-[#30363d]">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#0e1117] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#30363d]">
              <th className="py-3 px-4 font-bold text-white">Stock / Ticker</th>
              <th className="py-3 px-4 font-bold">⚡ 3-Wk Range Tightness</th>
              <th className="py-3 px-4 font-bold">VCP Base Status</th>
              <th className="py-3 px-4 font-bold">20-Bar High / Low</th>
              <th className="py-3 px-4 font-bold">20-Bar Contraction</th>
              <th className="py-3 px-4 font-bold">RS Rating</th>
              <th className="py-3 px-4 font-bold text-right">Action / Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d] bg-[#161b22]">
            {filteredAndSortedStocks.map((stock) => {
              const currency = getCurrencySymbol(stock.exchange);
              const isUltraTight = stock.contractionPercent <= 3.0;
              const is3WkPrimed = stock.threeWeekTightnessPct <= 5.0;

              return (
                <tr key={stock.ticker} className="hover:bg-[#21262d] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#0e1117] border border-[#30363d] text-amber-400 flex items-center justify-center font-bold text-xs">
                        {stock.ticker}
                      </div>
                      <div>
                        <strong className="text-white font-bold block">{stock.name}</strong>
                        <span className="text-[10px] text-gray-400">{stock.sector}</span>
                      </div>
                    </div>
                  </td>

                  {/* 3-Week Range Tightness Column */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <strong className={`font-extrabold text-sm ${is3WkPrimed ? 'text-purple-300' : 'text-gray-300'}`}>
                          {stock.threeWeekTightnessPct}%
                        </strong>
                        <div className="w-16 bg-gray-800 h-2 rounded overflow-hidden">
                          <div
                            className={`h-full ${is3WkPrimed ? 'bg-purple-500' : 'bg-gray-600'}`}
                            style={{ width: `${Math.min(100, stock.threeWeekTightnessPct * 10)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        3-Wk High: {formatCurrency(stock.threeWeekHigh, currency)} / Low: {formatCurrency(stock.threeWeekLow, currency)}
                      </span>
                    </div>
                  </td>

                  {/* VCP Base Status Column */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${
                      stock.threeWeekTightnessPct <= 3.5
                        ? 'bg-purple-950 text-amber-300 border-purple-500 shadow-xs'
                        : is3WkPrimed
                        ? 'bg-teal-950 text-teal-300 border-teal-700'
                        : 'bg-gray-900 text-gray-400 border-gray-800'
                    }`}>
                      {stock.threeWeekBaseStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-gray-200">
                    <div className="text-[11px]">
                      <span className="text-emerald-400">H: {formatCurrency(stock.last20High, currency)}</span>
                      <br />
                      <span className="text-rose-400">L: {formatCurrency(stock.last20Low, currency)}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <strong className={`font-bold ${isUltraTight ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {stock.contractionPercent}%
                      </strong>
                      <div className="w-16 bg-gray-800 h-2 rounded overflow-hidden">
                        <div
                          className={`h-full ${isUltraTight ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, stock.contractionPercent * 10)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-[#0e1117] text-white px-2.5 py-1 font-bold border border-[#30363d]">
                      {stock.rsRating} RS
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          onSelectStock(stock);
                          onViewChart(stock);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 text-[10px] uppercase tracking-wider flex items-center space-x-1 transition-all"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Chart</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Educational Footnote */}
      <div className="bg-[#0e1117] border border-[#30363d] p-4 flex items-start space-x-3 text-xs text-gray-300 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white font-bold">Minervini VCP Rule:</strong> As a stock goes through successive price contractions (VCP), each pullback becomes progressively narrower (typically &le;3% to 5% in the final contraction). Scanning for low percentage differences between local highs and lows over the last 20 bars helps pinpoint institutional shakeouts before explosive breakouts.
        </p>
      </div>

    </div>
  );
};
