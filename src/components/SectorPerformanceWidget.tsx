import React, { useState, useMemo } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  PieChart,
  BarChart3,
  Table as TableIcon,
  TrendingUp,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  Filter,
  Sparkles,
  Zap,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SectorPerformanceWidgetProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock?: (stock: MinerviniTradeSetup) => void;
  onFilterSector?: (sectorName: string) => void;
  className?: string;
}

export interface SectorRsData {
  sector: string;
  stockCount: number;
  avgRsRating: number;
  maxRsRating: number;
  minRsRating: number;
  avgChangePercent: number;
  avgDryUpPercent: number;
  sepaQualifiedCount: number;
  topStock: MinerviniTradeSetup;
  stocks: MinerviniTradeSetup[];
  tierLabel: 'SUPER_LEADER' | 'STRONG_LEADER' | 'MODERATE' | 'LAGGING';
  barColor: string;
}

export const SectorPerformanceWidget: React.FC<SectorPerformanceWidgetProps> = ({
  stocks,
  onSelectStock,
  onFilterSector,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'CHART' | 'TABLE'>('CHART');
  const [metricType, setMetricType] = useState<'AVG_RS' | 'AVG_CHANGE' | 'QUALIFIED_COUNT'>('AVG_RS');
  const [sortBy, setSortBy] = useState<'RS' | 'COUNT' | 'CHANGE' | 'NAME'>('RS');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [selectedSectorName, setSelectedSectorName] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Group stocks by sector and calculate aggregated metrics
  const sectorDataList = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];

    const map = new Map<string, MinerviniTradeSetup[]>();
    stocks.forEach((stock) => {
      const sec = stock.sector || 'Uncategorized';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(stock);
    });

    const result: SectorRsData[] = [];

    map.forEach((secStocks, sector) => {
      const count = secStocks.length;
      const totalRs = secStocks.reduce((acc, s) => acc + (s.rsRating || 50), 0);
      const avgRsRating = Number((totalRs / count).toFixed(1));

      const maxRsRating = Math.max(...secStocks.map((s) => s.rsRating || 50));
      const minRsRating = Math.min(...secStocks.map((s) => s.rsRating || 50));

      const totalChange = secStocks.reduce((acc, s) => acc + (s.changePercent || 0), 0);
      const avgChangePercent = Number((totalChange / count).toFixed(2));

      const totalDryUp = secStocks.reduce((acc, s) => acc + (s.volumeDryUpPercent || 0), 0);
      const avgDryUpPercent = Number((totalDryUp / count).toFixed(1));

      const sepaQualifiedCount = secStocks.filter((s) => s.trendScore === 8 || s.isTightVolume).length;

      // Top stock in sector by RS rating then change %
      const sortedStocks = [...secStocks].sort((a, b) => {
        if ((b.rsRating || 0) !== (a.rsRating || 0)) {
          return (b.rsRating || 0) - (a.rsRating || 0);
        }
        return b.changePercent - a.changePercent;
      });
      const topStock = sortedStocks[0];

      // Assign Tier Label & Bar Color based on Avg RS
      let tierLabel: 'SUPER_LEADER' | 'STRONG_LEADER' | 'MODERATE' | 'LAGGING' = 'MODERATE';
      let barColor = '#3b82f6'; // blue default

      if (avgRsRating >= 90) {
        tierLabel = 'SUPER_LEADER';
        barColor = '#10b981'; // emerald green
      } else if (avgRsRating >= 82) {
        tierLabel = 'STRONG_LEADER';
        barColor = '#14b8a6'; // teal
      } else if (avgRsRating >= 72) {
        tierLabel = 'MODERATE';
        barColor = '#f59e0b'; // amber
      } else {
        tierLabel = 'LAGGING';
        barColor = '#ef4444'; // rose/red
      }

      result.push({
        sector,
        stockCount: count,
        avgRsRating,
        maxRsRating,
        minRsRating,
        avgChangePercent,
        avgDryUpPercent,
        sepaQualifiedCount,
        topStock,
        stocks: sortedStocks,
        tierLabel,
        barColor
      });
    });

    // Apply Sorting
    return result.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'RS') comp = b.avgRsRating - a.avgRsRating;
      else if (sortBy === 'COUNT') comp = b.stockCount - a.stockCount;
      else if (sortBy === 'CHANGE') comp = b.avgChangePercent - a.avgChangePercent;
      else if (sortBy === 'NAME') comp = a.sector.localeCompare(b.sector);

      return sortOrder === 'DESC' ? comp : -comp;
    });
  }, [stocks, sortBy, sortOrder]);

  // Overall Market/Sector Aggregates
  const summaryStats = useMemo(() => {
    if (sectorDataList.length === 0) {
      return {
        topSector: null,
        overallAvgRs: 0,
        leadersCount: 0,
        totalSectors: 0,
        leadershipBreadthPct: 0
      };
    }

    // Top sector by Avg RS
    const sortedByRs = [...sectorDataList].sort((a, b) => b.avgRsRating - a.avgRsRating);
    const topSector = sortedByRs[0];

    const overallAvgRs = Number(
      (sectorDataList.reduce((acc, s) => acc + s.avgRsRating, 0) / sectorDataList.length).toFixed(1)
    );

    const leadersCount = sectorDataList.filter((s) => s.avgRsRating >= 85).length;
    const leadershipBreadthPct = Number(((leadersCount / sectorDataList.length) * 100).toFixed(0));

    return {
      topSector,
      overallAvgRs,
      leadersCount,
      totalSectors: sectorDataList.length,
      leadershipBreadthPct
    };
  }, [sectorDataList]);

  const handleSectorClick = (sectorName: string) => {
    if (selectedSectorName === sectorName) {
      setSelectedSectorName(null);
    } else {
      setSelectedSectorName(sectorName);
    }
    if (onFilterSector) {
      onFilterSector(sectorName);
    }
  };

  const activeSectorDetail = useMemo(() => {
    if (!selectedSectorName) return null;
    return sectorDataList.find((s) => s.sector === selectedSectorName) || null;
  }, [selectedSectorName, sectorDataList]);

  return (
    <div className={`bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6 font-sans ${className}`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">
            <PieChart className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#b5a68d] font-bold">
                SEPA Relative Strength Intelligence
              </span>
              <span className="bg-amber-100 text-amber-900 text-[9px] uppercase font-mono font-bold px-2 py-0.5 border border-amber-300">
                Sector Momentum Aggregator
              </span>
            </div>
            <h3 className="text-lg font-serif font-black text-[#1a1a1a] tracking-tight">
              Sector Performance & Relative Strength (RS) Summary
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#f9f8f5] border border-[#e5e4e1] p-1 text-xs font-mono font-bold">
            <button
              onClick={() => setViewMode('CHART')}
              className={`px-3 py-1 flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'CHART'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Chart View</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1 flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>

          {/* Metric Selector for Chart */}
          {viewMode === 'CHART' && (
            <div className="flex items-center bg-[#f9f8f5] border border-[#e5e4e1] p-1 text-xs font-mono">
              <button
                onClick={() => setMetricType('AVG_RS')}
                className={`px-2.5 py-1 transition-all cursor-pointer font-bold ${
                  metricType === 'AVG_RS'
                    ? 'bg-amber-500 text-black shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Avg RS
              </button>
              <button
                onClick={() => setMetricType('AVG_CHANGE')}
                className={`px-2.5 py-1 transition-all cursor-pointer font-bold ${
                  metricType === 'AVG_CHANGE'
                    ? 'bg-amber-500 text-black shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Change %
              </button>
              <button
                onClick={() => setMetricType('QUALIFIED_COUNT')}
                className={`px-2.5 py-1 transition-all cursor-pointer font-bold ${
                  metricType === 'QUALIFIED_COUNT'
                    ? 'bg-amber-500 text-black shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Setups
              </button>
            </div>
          )}

          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-[#f9f8f5] hover:bg-[#eae8e1] text-gray-700 border border-[#e5e4e1] transition-all cursor-pointer"
            title={isExpanded ? 'Collapse Widget' : 'Expand Widget'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            
            {/* KPI 1: Top Leading Sector */}
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="uppercase font-bold tracking-wider flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>#1 Sector Leader</span>
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5">
                  RS {summaryStats.topSector?.avgRsRating || 0}
                </span>
              </div>
              <div className="text-lg font-serif font-black text-[#1a1a1a] truncate">
                {summaryStats.topSector?.sector || 'N/A'}
              </div>
              <div className="text-[11px] text-gray-600 font-sans flex items-center justify-between pt-1">
                <span>Top Stock: <strong className="font-mono text-black">{summaryStats.topSector?.topStock?.ticker || '-'}</strong></span>
                <span className="text-gray-500 font-mono text-[10px]">({summaryStats.topSector?.stockCount} stocks)</span>
              </div>
            </div>

            {/* KPI 2: Overall Screener Average RS */}
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="uppercase font-bold tracking-wider flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Screener Avg RS Rating</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5">
                  TARGET &ge; 80
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#1a1a1a]">{summaryStats.overallAvgRs}</span>
                <span className="text-xs font-bold text-emerald-700 font-sans">
                  / 99 Max Score
                </span>
              </div>
              <div className="text-[11px] text-gray-600 font-sans leading-tight pt-0.5">
                Strong general market RS baseline across all screened sectors.
              </div>
            </div>

            {/* KPI 3: RS Leadership Breadth */}
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="uppercase font-bold tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>RS Leadership Breadth</span>
                </span>
                <span className="text-[10px] text-cyan-800 font-bold bg-cyan-100 px-1.5 py-0.5">
                  RS &ge; 85
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-cyan-900">{summaryStats.leadersCount}</span>
                <span className="text-xs font-bold text-cyan-800">
                  / {summaryStats.totalSectors} Sectors ({summaryStats.leadershipBreadthPct}%)
                </span>
              </div>
              <div className="text-[11px] text-gray-600 font-sans leading-tight pt-0.5">
                Sectors meeting Mark Minervini high-momentum leader criteria.
              </div>
            </div>

            {/* KPI 4: Total Sectors Covered */}
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="uppercase font-bold tracking-wider flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Sectors Analyzed</span>
                </span>
                <span className="text-[10px] text-purple-800 font-bold bg-purple-100 px-1.5 py-0.5">
                  COVERAGE
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#1a1a1a]">{summaryStats.totalSectors}</span>
                <span className="text-xs font-bold text-gray-500 font-sans">
                  Industry Groups
                </span>
              </div>
              <div className="text-[11px] text-gray-600 font-sans leading-tight pt-0.5">
                {stocks.length} growth stocks grouped by industry sector.
              </div>
            </div>

          </div>

          {/* MAIN CHART VIEW */}
          {viewMode === 'CHART' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-[#f9f8f5] p-3 border border-[#e5e4e1]">
                <div className="flex items-center space-x-2 text-gray-700">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold uppercase tracking-wider text-[#1a1a1a]">
                    Sector {metricType === 'AVG_RS' ? 'Average Relative Strength (RS)' : metricType === 'AVG_CHANGE' ? 'Average Price Change %' : 'Qualified SEPA Setups'} Distribution
                  </span>
                </div>

                {/* Legend Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-600">RS &ge; 90 (Super Leader)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    <span className="text-gray-600">RS 82-89 (Leader)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-gray-600">RS 72-81 (Moderate)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-gray-600">RS &lt; 72 (Lagging)</span>
                  </span>
                </div>
              </div>

              {/* Recharts Bar Chart */}
              <div className="w-full h-[320px] bg-[#f9f8f5] p-3 border border-[#e5e4e1] relative font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectorDataList}
                    margin={{ top: 20, right: 30, left: 10, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e4e1" vertical={false} />
                    <XAxis
                      dataKey="sector"
                      stroke="#475569"
                      tick={{ fontSize: 10, fill: '#1a1a1a', fontWeight: 'bold' }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      domain={metricType === 'AVG_RS' ? [50, 100] : ['auto', 'auto']}
                    />
                    <Tooltip content={<CustomSectorTooltip metricType={metricType} />} />

                    {metricType === 'AVG_RS' && (
                      <>
                        {/* Reference line for Minervini Market Leader threshold (RS 80) */}
                        <ReferenceLine
                          y={80}
                          stroke="#14b8a6"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          label={{
                            value: 'Minervini Leader Threshold (80 RS)',
                            fill: '#0d9488',
                            fontSize: 10,
                            position: 'insideTopLeft'
                          }}
                        />

                        {/* Reference line for Super Leader (RS 90) */}
                        <ReferenceLine
                          y={90}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          label={{
                            value: 'Super Leader (90 RS)',
                            fill: '#047857',
                            fontSize: 10,
                            position: 'insideTopRight'
                          }}
                        />
                      </>
                    )}

                    <Bar
                      dataKey={
                        metricType === 'AVG_RS'
                          ? 'avgRsRating'
                          : metricType === 'AVG_CHANGE'
                          ? 'avgChangePercent'
                          : 'sepaQualifiedCount'
                      }
                      radius={[4, 4, 0, 0]}
                      onClick={(data) => handleSectorClick(data.sector)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {sectorDataList.map((entry, index) => (
                        <Cell
                          key={`sector-cell-${index}`}
                          fill={entry.barColor}
                          stroke={selectedSectorName === entry.sector ? '#000000' : 'none'}
                          strokeWidth={selectedSectorName === entry.sector ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* MAIN TABLE VIEW */}
          {viewMode === 'TABLE' && (
            <div className="space-y-3 font-mono">
              
              {/* Sorting Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f9f8f5] p-3 border border-[#e5e4e1] text-xs">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="font-bold text-[#1a1a1a] uppercase tracking-wider">Sort Sectors By:</span>
                  
                  <button
                    onClick={() => { setSortBy('RS'); setSortOrder(sortBy === 'RS' && sortOrder === 'DESC' ? 'ASC' : 'DESC'); }}
                    className={`px-2.5 py-1 transition-all cursor-pointer border ${sortBy === 'RS' ? 'bg-[#1a1a1a] text-white border-black font-bold' : 'bg-white text-gray-700 border-[#e5e4e1]'}`}
                  >
                    Avg RS Rating {sortBy === 'RS' && (sortOrder === 'DESC' ? '↓' : '↑')}
                  </button>

                  <button
                    onClick={() => { setSortBy('COUNT'); setSortOrder(sortBy === 'COUNT' && sortOrder === 'DESC' ? 'ASC' : 'DESC'); }}
                    className={`px-2.5 py-1 transition-all cursor-pointer border ${sortBy === 'COUNT' ? 'bg-[#1a1a1a] text-white border-black font-bold' : 'bg-white text-gray-700 border-[#e5e4e1]'}`}
                  >
                    Stock Count {sortBy === 'COUNT' && (sortOrder === 'DESC' ? '↓' : '↑')}
                  </button>

                  <button
                    onClick={() => { setSortBy('CHANGE'); setSortOrder(sortBy === 'CHANGE' && sortOrder === 'DESC' ? 'ASC' : 'DESC'); }}
                    className={`px-2.5 py-1 transition-all cursor-pointer border ${sortBy === 'CHANGE' ? 'bg-[#1a1a1a] text-white border-black font-bold' : 'bg-white text-gray-700 border-[#e5e4e1]'}`}
                  >
                    Avg Change % {sortBy === 'CHANGE' && (sortOrder === 'DESC' ? '↓' : '↑')}
                  </button>

                  <button
                    onClick={() => { setSortBy('NAME'); setSortOrder(sortBy === 'NAME' && sortOrder === 'ASC' ? 'DESC' : 'ASC'); }}
                    className={`px-2.5 py-1 transition-all cursor-pointer border ${sortBy === 'NAME' ? 'bg-[#1a1a1a] text-white border-black font-bold' : 'bg-white text-gray-700 border-[#e5e4e1]'}`}
                  >
                    Sector Name {sortBy === 'NAME' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </button>
                </div>

                <span className="text-[11px] text-gray-500 font-sans">
                  Click a sector row to filter or expand top stocks.
                </span>
              </div>

              {/* Sector Summary Table */}
              <div className="overflow-x-auto border border-[#e5e4e1]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-white text-[10px] uppercase border-b border-[#e5e4e1]">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Sector Name</th>
                      <th className="p-3 text-center">Stock Count</th>
                      <th className="p-3 text-right">Avg RS Rating</th>
                      <th className="p-3 text-center">RS Tier</th>
                      <th className="p-3 text-right">Avg Price Chg %</th>
                      <th className="p-3 text-right">Avg Vol Dry-Up %</th>
                      <th className="p-3">Top Sector Stock</th>
                      <th className="p-3 text-center">SEPA Qualified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e4e1] bg-white">
                    {sectorDataList.map((sec, idx) => {
                      const isSelected = selectedSectorName === sec.sector;

                      return (
                        <tr
                          key={sec.sector}
                          onClick={() => handleSectorClick(sec.sector)}
                          className={`hover:bg-[#f9f8f5] transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-50/80 border-l-4 border-l-amber-500' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-gray-400">#{idx + 1}</td>
                          <td className="p-3 font-bold text-[#1a1a1a] flex items-center space-x-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-500" />
                            <span>{sec.sector}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-gray-700">
                            {sec.stockCount} {sec.stockCount === 1 ? 'stock' : 'stocks'}
                          </td>
                          <td className="p-3 text-right font-black text-sm">
                            <span
                              className={`px-2 py-0.5 rounded text-white ${
                                sec.avgRsRating >= 90
                                  ? 'bg-emerald-600'
                                  : sec.avgRsRating >= 82
                                  ? 'bg-teal-600'
                                  : sec.avgRsRating >= 72
                                  ? 'bg-amber-600'
                                  : 'bg-rose-600'
                              }`}
                            >
                              {sec.avgRsRating}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${
                                sec.tierLabel === 'SUPER_LEADER'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : sec.tierLabel === 'STRONG_LEADER'
                                  ? 'bg-teal-100 text-teal-900 border-teal-300'
                                  : sec.tierLabel === 'MODERATE'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-rose-100 text-rose-900 border-rose-300'
                              }`}
                            >
                              {sec.tierLabel.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-bold ${
                            sec.avgChangePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {sec.avgChangePercent >= 0 ? '+' : ''}{sec.avgChangePercent}%
                          </td>
                          <td className="p-3 text-right font-bold text-cyan-800">
                            {sec.avgDryUpPercent}%
                          </td>
                          <td className="p-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectStock) onSelectStock(sec.topStock);
                              }}
                              className="flex items-center space-x-1.5 hover:underline text-black font-bold group"
                            >
                              <span>{sec.topStock.ticker}</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 font-mono">
                                RS {sec.topStock.rsRating}
                              </span>
                              <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-black transition-colors" />
                            </button>
                          </td>
                          <td className="p-3 text-center font-bold text-[#1a1a1a]">
                            {sec.sepaQualifiedCount} / {sec.stockCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Selected Sector Drilldown Card */}
          {activeSectorDetail && (
            <div className="bg-[#f9f8f5] border-2 border-amber-400 p-5 space-y-4 font-mono animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-serif font-black text-[#1a1a1a]">
                        Sector Drilldown: {activeSectorDetail.sector}
                      </h4>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 border border-amber-300">
                        {activeSectorDetail.stockCount} Stocks
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-sans">
                      Sector Avg RS: <strong className="text-black">{activeSectorDetail.avgRsRating}</strong> | Avg Change: <strong className={activeSectorDetail.avgChangePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{activeSectorDetail.avgChangePercent >= 0 ? '+' : ''}{activeSectorDetail.avgChangePercent}%</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSectorName(null)}
                  className="text-xs text-gray-500 hover:text-black underline cursor-pointer"
                >
                  Close Drilldown
                </button>
              </div>

              {/* Stocks inside selected sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSectorDetail.stocks.map((stock) => (
                  <div
                    key={stock.ticker}
                    onClick={() => {
                      if (onSelectStock) onSelectStock(stock);
                    }}
                    className="bg-white border border-[#e5e4e1] hover:border-black p-3 space-y-2 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-serif font-black text-sm text-[#1a1a1a]">{stock.ticker}</span>
                      <span className="bg-[#1a1a1a] text-white text-[10px] font-bold px-2 py-0.5">
                        RS {stock.rsRating}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 truncate font-sans">
                      {stock.name}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-[#e5e4e1]">
                      <span className="text-gray-500">Price: {formatCurrency(stock.currentPrice, getCurrencySymbol(stock.exchange))}</span>
                      <span className={`font-bold ${stock.changePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational SEPA Takeaway */}
          <div className="p-4 bg-[#f9f8f5] border border-[#e5e4e1] text-xs font-mono space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>MINERVINI SEPA SECTOR MOMENTUM PRINCIPLE</span>
            </div>
            <p className="text-gray-700 font-sans leading-relaxed text-[11px]">
              Mark Minervini SEPA methodology highlights that <strong className="text-black">over 50% of a growth stock&apos;s price move is directly driven by sector and industry group strength</strong>. Concentrating long setups in sectors with <strong className="text-emerald-800">Average RS Ratings &ge; 82</strong> significantly increases pivot breakout success rates and minimizes false breakout shakeouts.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

// Custom Tooltip for Sector RS Chart
const CustomSectorTooltip = ({ active, payload, metricType }: any) => {
  if (active && payload && payload.length) {
    const data: SectorRsData = payload[0].payload;

    return (
      <div className="bg-[#1a1a1a] text-white p-3 text-xs font-mono space-y-2 border border-black shadow-2xl min-w-[220px]">
        <div className="flex justify-between items-center border-b border-gray-800 pb-1">
          <span className="font-bold text-amber-400 font-serif">{data.sector}</span>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
            data.tierLabel === 'SUPER_LEADER' ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
          }`}>
            {data.tierLabel.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Sector Avg RS:</span>
            <strong className="text-emerald-400 text-sm font-black">{data.avgRsRating} / 99</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Max RS in Sector:</span>
            <strong className="text-white font-bold">{data.maxRsRating}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Avg Price Change:</span>
            <strong className={data.avgChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {data.avgChangePercent >= 0 ? '+' : ''}{data.avgChangePercent}%
            </strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Total Stocks:</span>
            <strong className="text-white">{data.stockCount}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">SEPA Setups:</span>
            <strong className="text-amber-300">{data.sepaQualifiedCount} qualified</strong>
          </div>
        </div>

        <div className="pt-1 border-t border-gray-800 text-[10px] text-gray-300">
          Top Stock: <strong className="text-white font-bold">{data.topStock.ticker}</strong> (RS {data.topStock.rsRating})
        </div>
      </div>
    );
  }
  return null;
};
