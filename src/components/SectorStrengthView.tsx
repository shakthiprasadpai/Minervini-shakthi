import React, { useMemo } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { Layers, TrendingUp, TrendingDown, ArrowUpRight, Flame, ShieldCheck, ChevronRight, Activity, BarChart2 } from 'lucide-react';

interface SectorStrengthViewProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart: (stock: MinerviniTradeSetup) => void;
  onFilterBySector: (sectorName: string) => void;
}

export interface SectorAggregate {
  sector: string;
  stockCount: number;
  avgChange: number;
  avgDryUp: number;
  avgSepaScore: number;
  qualifiedCount: number;
  topStock: MinerviniTradeSetup;
  relativeStrength: 'Outperforming' | 'In-Line' | 'Underperforming';
  rsScore: number; // 0 - 100
  badgeBg: string;
}

export const SectorStrengthView: React.FC<SectorStrengthViewProps> = ({
  stocks,
  onSelectStock,
  onViewChart,
  onFilterBySector
}) => {
  // Aggregate stocks by sector
  const sectorAggregates = useMemo(() => {
    const map = new Map<string, MinerviniTradeSetup[]>();
    stocks.forEach((s) => {
      const sec = s.sector || 'General Market';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(s);
    });

    const result: SectorAggregate[] = [];
    map.forEach((secStocks, sector) => {
      const stockCount = secStocks.length;
      const totalChange = secStocks.reduce((sum, s) => sum + s.changePercent, 0);
      const avgChange = totalChange / (stockCount || 1);

      const totalDryUp = secStocks.reduce((sum, s) => sum + s.volumeDryUpPercent, 0);
      const avgDryUp = totalDryUp / (stockCount || 1);

      const totalSepa = secStocks.reduce((sum, s) => sum + s.trendScore, 0);
      const avgSepaScore = totalSepa / (stockCount || 1);

      const qualifiedCount = secStocks.filter((s) => s.trendScore === 8 || s.isTightVolume).length;

      // Find top performing stock in sector by price change & RS rating
      const sortedByPerformance = [...secStocks].sort((a, b) => b.changePercent - a.changePercent);
      const topStock = sortedByPerformance[0];

      // Relative strength vs broader BSE market
      const rsScore = Math.min(99, Math.max(30, Math.round(50 + avgChange * 4 + (qualifiedCount * 5))));
      const relativeStrength: 'Outperforming' | 'In-Line' | 'Underperforming' =
        rsScore >= 70 ? 'Outperforming' : rsScore >= 50 ? 'In-Line' : 'Underperforming';

      const badgeBg =
        rsScore >= 70
          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
          : rsScore >= 50
          ? 'bg-teal-950/40 border-teal-800/60 text-teal-300'
          : 'bg-amber-950/40 border-amber-800/60 text-amber-300';

      result.push({
        sector,
        stockCount,
        avgChange: Number(avgChange.toFixed(2)),
        avgDryUp: Number(avgDryUp.toFixed(1)),
        avgSepaScore: Number(avgSepaScore.toFixed(1)),
        qualifiedCount,
        topStock,
        relativeStrength,
        rsScore,
        badgeBg
      });
    });

    // Sort by RS score descending (industry leadership rotation)
    return result.sort((a, b) => b.rsScore - a.rsScore);
  }, [stocks]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-emerald-400 font-bold block">
              BSE / NSE Industry Group Rotation
            </span>
            <h3 className="text-lg font-serif font-black tracking-tight text-white">
              Sector Strength & Relative Leadership Dashboard
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono bg-[#0e1117] px-4 py-2 border border-[#30363d]">
          <span className="text-gray-400">Total Sectors Monitored:</span>
          <span className="text-emerald-400 font-bold">{sectorAggregates.length} Industry Groups</span>
        </div>
      </div>

      {/* Grid of Sector Strength Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sectorAggregates.map((sec) => {
          const currency = getCurrencySymbol(sec.topStock?.exchange || 'NSE');

          return (
            <div
              key={sec.sector}
              className="bg-[#161b22] border border-[#30363d] p-5 space-y-4 hover:border-emerald-500/60 transition-all shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Sector Title & Relative Strength Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                      {sec.stockCount} Indian Stocks
                    </span>
                    <h4 className="text-base font-serif font-bold text-white leading-tight mt-0.5">
                      {sec.sector}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border shrink-0 ${sec.badgeBg}`}>
                    RS {sec.rsScore} ({sec.relativeStrength})
                  </span>
                </div>

                {/* Aggregate Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-[#0e1117] p-2.5 border border-[#30363d] text-center font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 block uppercase">Avg Change</span>
                    <strong className={`font-bold ${sec.avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sec.avgChange >= 0 ? '+' : ''}{sec.avgChange}%
                    </strong>
                  </div>

                  <div>
                    <span className="text-[9px] text-gray-400 block uppercase">Avg Dry-Up</span>
                    <strong className="text-teal-400 font-bold">{sec.avgDryUp}%</strong>
                  </div>

                  <div>
                    <span className="text-[9px] text-gray-400 block uppercase">8/8 Qualified</span>
                    <strong className="text-amber-400 font-bold">{sec.qualifiedCount} Stocks</strong>
                  </div>
                </div>

                {/* Top Constituent Stock */}
                {sec.topStock && (
                  <div className="bg-[#0e1117]/60 p-2.5 border border-[#2d3748] text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block">Sector Leader</span>
                      <strong className="text-white">{sec.topStock.ticker} ({sec.topStock.name})</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">
                        {formatCurrency(sec.topStock.currentPrice, currency)}
                      </span>
                      <span className="text-[10px] text-emerald-500">
                        +{sec.topStock.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button to Filter Screener */}
              <div className="pt-2 border-t border-[#30363d] flex items-center justify-between">
                <button
                  onClick={() => onFilterBySector(sec.sector)}
                  className="w-full bg-[#21262d] hover:bg-[#30363d] text-emerald-300 hover:text-emerald-200 font-mono text-xs font-bold uppercase tracking-wider py-2 px-3 border border-gray-700 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <span>Filter Screener by Sector</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
