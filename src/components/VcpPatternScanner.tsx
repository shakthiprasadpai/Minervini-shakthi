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
}

export const VcpPatternScanner: React.FC<VcpPatternScannerProps> = ({
  stocks,
  onSelectStock,
  onViewChart,
}) => {
  const [filterTightness, setFilterTightness] = useState<'all' | 'ultra_tight' | 'moderate'>('all');
  const [sortBy, setSortBy] = useState<'tightness' | 'rs_rating' | 'price'>('tightness');

  // Scan stocks and calculate 20-bar local high/low contraction
  const scannedStocks: VcpScanResult[] = useMemo(() => {
    return stocks.map((stock) => {
      const history = stock.priceHistory || [];
      const slice20 = history.slice(-20);
      const highs = slice20.length > 0 ? slice20.map((h) => h.high || h.close) : [stock.currentPrice * 1.05];
      const lows = slice20.length > 0 ? slice20.map((l) => l.low || l.close) : [stock.currentPrice * 0.95];

      const last20High = Math.max(...highs);
      const last20Low = Math.min(...lows);
      const contractionPercent = Number((((last20High - last20Low) / last20High) * 100).toFixed(2));

      let tightnessLevel: 'Ultra-Tight (<3%)' | 'Moderate (3-6%)' | 'Wide (>6%)' = 'Wide (>6%)';
      if (contractionPercent <= 3.0) {
        tightnessLevel = 'Ultra-Tight (<3%)';
      } else if (contractionPercent <= 6.0) {
        tightnessLevel = 'Moderate (3-6%)';
      }

      return {
        ...stock,
        last20High,
        last20Low,
        contractionPercent,
        tightnessLevel,
        barCount: slice20.length
      };
    });
  }, [stocks]);

  const filteredAndSortedStocks = useMemo(() => {
    let result = [...scannedStocks];
    if (filterTightness === 'ultra_tight') {
      result = result.filter((s) => s.contractionPercent <= 3.0);
    } else if (filterTightness === 'moderate') {
      result = result.filter((s) => s.contractionPercent > 3.0 && s.contractionPercent <= 6.0);
    }

    result.sort((a, b) => {
      if (sortBy === 'tightness') return a.contractionPercent - b.contractionPercent; // tightest first
      if (sortBy === 'rs_rating') return b.rsRating - a.rsRating;
      return b.currentPrice - a.currentPrice;
    });

    return result;
  }, [scannedStocks, filterTightness, sortBy]);

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
            onClick={() => setFilterTightness('ultra_tight')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
              filterTightness === 'ultra_tight'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-[#161b22] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
            }`}
          >
            Ultra-Tight &le;3% ({ultraTightCount})
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
            <option value="tightness">Contraction % (Tightest First)</option>
            <option value="rs_rating">RS Rating (Highest First)</option>
            <option value="price">Current Price</option>
          </select>
        </div>
      </div>

      {/* Scanned Stocks Table */}
      <div className="overflow-x-auto border border-[#30363d]">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#0e1117] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#30363d]">
              <th className="py-3 px-4 font-bold text-white">Stock / Ticker</th>
              <th className="py-3 px-4 font-bold">20-Bar High</th>
              <th className="py-3 px-4 font-bold">20-Bar Low</th>
              <th className="py-3 px-4 font-bold">Contraction Range</th>
              <th className="py-3 px-4 font-bold">Tightness Classification</th>
              <th className="py-3 px-4 font-bold">RS Rating</th>
              <th className="py-3 px-4 font-bold text-right">Action / Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d] bg-[#161b22]">
            {filteredAndSortedStocks.map((stock) => {
              const currency = getCurrencySymbol(stock.exchange);
              const isUltraTight = stock.contractionPercent <= 3.0;

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

                  <td className="py-3.5 px-4 font-bold text-gray-200">
                    {formatCurrency(stock.last20High, currency)}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-gray-200">
                    {formatCurrency(stock.last20Low, currency)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <strong className={`font-bold ${isUltraTight ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {stock.contractionPercent}%
                      </strong>
                      <div className="w-20 bg-gray-800 h-2 rounded overflow-hidden">
                        <div
                          className={`h-full ${isUltraTight ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, stock.contractionPercent * 10)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${
                      isUltraTight
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950/60 text-amber-300 border-amber-800'
                    }`}>
                      {stock.tightnessLevel}
                    </span>
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
