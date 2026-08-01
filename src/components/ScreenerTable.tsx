import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, calculateTrendStrengthMeter, getCurrencySymbol, calculateTrendReadinessScore, calculateDailyPivotPoints, calculateDailyVolatilityMetrics } from '../utils/sepaCalculator';
import { exportTradePlansToCsv } from '../utils/csvExport';
import { SectorStrengthView } from './SectorStrengthView';
import { SectorPerformanceWidget } from './SectorPerformanceWidget';
import { RefinedSepaScreenerModal } from './RefinedSepaScreenerModal';
import { evaluateRefinedSepaScreener } from '../utils/refinedSepaScreener';
import {
  Search,
  Droplets,
  CheckCircle2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Flame,
  LayoutGrid,
  List,
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  Gauge,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Award
} from 'lucide-react';

interface ScreenerTableProps {
  stocks: MinerviniTradeSetup[];
  selectedTicker: string;
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart: (stock: MinerviniTradeSetup) => void;
}

export interface VcpHeatmapInfo {
  score: number; // 0 - 100
  level: 'ULTRA' | 'HIGH' | 'MODERATE' | 'NORMAL';
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  rowHighlightBg: string;
  barColor: string;
  label: string;
}

export type SortField =
  | 'VCP_INTENSITY'
  | 'TREND_SLOPE'
  | 'DRY_UP'
  | 'SEPA_SCORE'
  | 'TICKER'
  | 'RS_RATING'
  | 'PRICE'
  | 'CHANGE_PERCENT';

export function calculateVcpHeatmap(stock: MinerviniTradeSetup): VcpHeatmapInfo {
  const dryUpAbs = Math.min(100, Math.abs(stock.volumeDryUpPercent || 0));

  // Base score from dry-up % (up to 60 pts)
  let score = Math.round((dryUpAbs / 75) * 60);

  // Bonus points for VCP contraction stage
  if (stock.vcpStage === 'Breakout Pending' || stock.vcpStage === 'T4') {
    score += 25;
  } else if (stock.vcpStage === 'T3') {
    score += 18;
  } else if (stock.vcpStage === 'T2') {
    score += 10;
  }

  // Bonus for Tight Volume flag and perfect SEPA score
  if (stock.isTightVolume) score += 10;
  if (stock.trendScore === 8) score += 5;

  score = Math.min(100, Math.max(0, score));

  if (score >= 75 || stock.volumeDryUpPercent <= -60) {
    return {
      score,
      level: 'ULTRA',
      badgeBg: 'bg-[#107c41]',
      badgeText: 'text-white',
      badgeBorder: 'border-[#0d6233]',
      rowHighlightBg: 'bg-emerald-50/80 hover:bg-emerald-100/90 border-l-4 border-l-[#107c41]',
      barColor: 'bg-[#107c41]',
      label: 'ULTRA TIGHT (-60%+)',
    };
  } else if (score >= 50 || stock.volumeDryUpPercent <= -45) {
    return {
      score,
      level: 'HIGH',
      badgeBg: 'bg-teal-700',
      badgeText: 'text-white',
      badgeBorder: 'border-teal-800',
      rowHighlightBg: 'bg-teal-50/60 hover:bg-teal-100/70 border-l-4 border-l-teal-600',
      barColor: 'bg-teal-600',
      label: 'HIGH DRY-UP (-45%)',
    };
  } else if (score >= 30 || stock.volumeDryUpPercent <= -30) {
    return {
      score,
      level: 'MODERATE',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      rowHighlightBg: 'bg-amber-50/40 hover:bg-amber-100/50 border-l-4 border-l-amber-500',
      barColor: 'bg-amber-500',
      label: 'MODERATE (-30%)',
    };
  } else {
    return {
      score,
      level: 'NORMAL',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200',
      rowHighlightBg: 'hover:bg-gray-50/80',
      barColor: 'bg-gray-400',
      label: 'NORMAL VOL',
    };
  }
}

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  stocks,
  selectedTicker,
  onSelectStock,
  onViewChart
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'heatmap' | 'sector_strength'>('table');
  const [highlightRows, setHighlightRows] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<SortField>('VCP_INTENSITY');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isRefinedModalOpen, setIsRefinedModalOpen] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'TICKER' ? 'asc' : 'desc');
    }
  };

  const renderSortHeader = (label: string, field: SortField, align: 'left' | 'center' | 'right' = 'left') => {
    const isActive = sortBy === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3 px-2.5 cursor-pointer hover:bg-gray-200/80 transition-all select-none group ${
          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
        } ${isActive ? 'bg-amber-100/80 text-black font-extrabold border-b-2 border-b-amber-500' : ''}`}
        title={`Click to rank by ${label} (${isActive && sortOrder === 'desc' ? 'Ascending' : 'Descending'})`}
      >
        <div className={`inline-flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 text-amber-600 font-bold shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-amber-600 font-bold shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-700 opacity-60 group-hover:opacity-100 transition-all shrink-0" />
          )}
        </div>
      </th>
    );
  };

  // Filtering logic
  let filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(search.toLowerCase()) ||
      stock.name.toLowerCase().includes(search.toLowerCase()) ||
      stock.sector.toLowerCase().includes(search.toLowerCase()) ||
      stock.industry.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'TIER_1_POWER') return calculateTrendStrengthMeter(stock).tier === 'TIER_1_POWER';
    if (filterCategory === 'PERFECT') return stock.trendScore === 8;
    if (filterCategory === 'ULTRA_TIGHT') return stock.volumeDryUpPercent <= -60 || stock.isTightVolume;
    if (filterCategory === 'TIGHT_VOL') return stock.isTightVolume || stock.volumeDryUpPercent <= -45;
    if (filterCategory === 'NSE') return stock.exchange === 'NSE' || stock.exchange === 'BSE';
    if (filterCategory === 'US') return stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
    if (filterCategory === 'PENDING') return stock.vcpStage === 'Breakout Pending';

    return true;
  });

  // Sorting logic
  filteredStocks = [...filteredStocks].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'VCP_INTENSITY') {
      diff = calculateVcpHeatmap(b).score - calculateVcpHeatmap(a).score;
    } else if (sortBy === 'RS_RATING') {
      diff = b.rsRating - a.rsRating;
    } else if (sortBy === 'PRICE') {
      diff = b.currentPrice - a.currentPrice;
    } else if (sortBy === 'CHANGE_PERCENT') {
      diff = b.changePercent - a.changePercent;
    } else if (sortBy === 'TREND_SLOPE') {
      diff = calculateTrendStrengthMeter(b).slopePercent - calculateTrendStrengthMeter(a).slopePercent;
    } else if (sortBy === 'DRY_UP') {
      diff = a.volumeDryUpPercent - b.volumeDryUpPercent; // Tightest first when desc
    } else if (sortBy === 'SEPA_SCORE') {
      diff = b.trendScore - a.trendScore;
    } else if (sortBy === 'TICKER') {
      diff = a.ticker.localeCompare(b.ticker);
    }

    return sortOrder === 'desc' ? diff : -diff;
  });

  return (
    <>
      <div className="space-y-6">
      
      {/* Sector Performance Summary Widget */}
      <SectorPerformanceWidget
        stocks={stocks}
        onSelectStock={onSelectStock}
        onFilterSector={(sec) => setSearch(sec)}
      />

      <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Top Banner: VCP Heatmap Control Panel & Legend */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-[#1a1a1a] text-white flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">
                Visual Quantitative Heatmap
              </span>
              <h3 className="text-base font-serif font-black text-[#1a1a1a] leading-tight">
                VCP Volatility Contraction & Volume Dry-Up Heatmap
              </h3>
            </div>
          </div>

          {/* View Mode & Toggle Controls */}
          <div className="flex items-center space-x-3 text-xs">
            <label className="inline-flex items-center space-x-1.5 cursor-pointer text-gray-700 font-sans font-medium">
              <input
                type="checkbox"
                checked={highlightRows}
                onChange={(e) => setHighlightRows(e.target.checked)}
                className="accent-black w-3.5 h-3.5"
              />
              <span>Heatmap Tint Rows</span>
            </label>

            <div className="border-r border-[#e5e4e1] h-4 mx-1" />

            <div className="inline-flex border border-[#e5e4e1] bg-white p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all ${
                  viewMode === 'table' ? 'bg-[#1a1a1a] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all ${
                  viewMode === 'heatmap' ? 'bg-[#1a1a1a] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Heatmap Grid</span>
              </button>
              <button
                onClick={() => setViewMode('sector_strength')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all ${
                  viewMode === 'sector_strength' ? 'bg-[#1a1a1a] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sector Strength</span>
              </button>
            </div>

            <button
              onClick={() => setIsRefinedModalOpen(true)}
              className="bg-[#10141d] hover:bg-black text-amber-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border border-amber-500/40 shadow-xs transition-all cursor-pointer group"
              title="Open Refined 18-Point Mark Minervini SEPA Strategy Screener Analysis"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Refined SEPA Screener (18-Point)</span>
            </button>

            <button
              onClick={() => exportTradePlansToCsv(filteredStocks)}
              className="bg-[#1a1a1a] hover:bg-black text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border border-black shadow-xs transition-all cursor-pointer group"
              title="Export currently filtered trade plans to CSV for spreadsheet analysis"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Legend Bar & Sort Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-gray-500 uppercase tracking-wider font-bold">VCP Intensity Scale:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-[#107c41] border border-[#0d6233]" />
              <span className="text-[#1a1a1a] font-bold">Ultra Tight (-60%+)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-teal-600 border border-teal-800" />
              <span className="text-teal-900 font-semibold">High Dry-Up (-45%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-amber-400 border border-amber-600" />
              <span className="text-amber-900 font-semibold">Moderate (-30%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-gray-300 border border-gray-400" />
              <span className="text-gray-600">Normal</span>
            </div>
          </div>

          {/* Sort Control */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 font-bold uppercase text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e: any) => {
                setSortBy(e.target.value as SortField);
                setSortOrder('desc');
              }}
              className="bg-white border border-[#e5e4e1] p-1 text-xs font-bold text-[#1a1a1a] focus:outline-none cursor-pointer"
            >
              <option value="VCP_INTENSITY">VCP Intensity Score</option>
              <option value="RS_RATING">⭐ RS Rating (1-99 Highest)</option>
              <option value="PRICE">Current Price ($ / ₹)</option>
              <option value="CHANGE_PERCENT">Daily Change % (+/-)</option>
              <option value="TREND_SLOPE">200MA Trend Slope (Steepest First)</option>
              <option value="DRY_UP">Volume Dry-Up % (Tightest First)</option>
              <option value="SEPA_SCORE">SEPA Score (8/8)</option>
              <option value="TICKER">Ticker Symbol (A-Z)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Search & Quick Category Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e4e1] pb-5">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-screener-search"
            type="text"
            placeholder="Search symbol, stock name, sector (e.g., NVDA, SUVEN)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#f9f8f5] border border-[#e5e4e1] rounded-none pl-9 pr-4 py-2 text-xs text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:border-black font-sans transition-all"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          {[
            { id: 'ALL', label: `All Candidates (${stocks.length})` },
            { id: 'TIER_1_POWER', label: '⚡ Tier-1 Power Slope' },
            { id: 'ULTRA_TIGHT', label: '🔥 Ultra Tight (-60%+)' },
            { id: 'PERFECT', label: '⭐ Perfect 8/8 SEPA' },
            { id: 'TIGHT_VOL', label: '💧 Tight Dry-Up (-45%+)' },
            { id: 'PENDING', label: '⚡ Breakout Pending' },
            { id: 'NSE', label: '🇮🇳 India (NSE/BSE)' },
            { id: 'US', label: '🇺🇸 US Growth' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border ${
                filterCategory === cat.id
                  ? 'bg-[#1a1a1a] text-white border-black'
                  : 'bg-[#f9f8f5] text-gray-600 border-[#e5e4e1] hover:text-black hover:border-gray-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* VIEW MODE CONDITIONAL RENDERING */}
      {viewMode === 'sector_strength' ? (
        <SectorStrengthView
          stocks={stocks}
          onSelectStock={onSelectStock}
          onViewChart={onViewChart}
          onFilterBySector={(sec) => {
            setSearch(sec);
            setViewMode('table');
          }}
        />
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e5e4e1] text-[10px] uppercase tracking-[0.2em] text-[#b5a68d] font-bold bg-[#f9f8f5]">
                {renderSortHeader('Stock & Sector', 'TICKER')}
                {renderSortHeader('Price', 'PRICE')}
                {renderSortHeader('Chg %', 'CHANGE_PERCENT')}
                {renderSortHeader('RS Rating', 'RS_RATING', 'center')}
                {renderSortHeader('Trend Readiness', 'SEPA_SCORE', 'center')}
                {renderSortHeader('200MA Trend', 'TREND_SLOPE', 'center')}
                <th className="py-3 px-2.5">Pattern / Stage</th>
                {renderSortHeader('VCP Heatmap', 'VCP_INTENSITY', 'center')}
                <th className="py-3 px-2.5">Pivot Entry</th>
                <th className="py-3 px-2.5">Stop Loss</th>
                <th className="py-3 px-2.5">Target (+20%)</th>
                <th className="py-3 px-2.5 text-center">R/R</th>
                <th className="py-3 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e4e1] text-xs">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-gray-500 font-serif italic text-sm">
                    No growth setups match the selected search or SEPA filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const currency = getCurrencySymbol(stock.exchange);
                  const isSelected = stock.ticker === selectedTicker;
                  const heatmap = calculateVcpHeatmap(stock);
                  const trendMeter = calculateTrendStrengthMeter(stock);

                  return (
                    <tr
                      key={stock.ticker}
                      onClick={() => onSelectStock(stock)}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-black/5 border-l-4 border-l-black font-semibold'
                          : highlightRows
                          ? heatmap.rowHighlightBg
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Ticker & Exchange */}
                      <td className="py-3.5 px-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-[#1a1a1a] font-mono">
                            {stock.ticker}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider bg-[#1a1a1a] text-white font-mono font-semibold">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600 truncate max-w-[150px] mt-0.5 font-sans">
                          {stock.name}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-2.5 font-mono">
                        <div className="font-bold text-[#1a1a1a] text-sm">
                          {formatCurrency(stock.currentPrice, currency)}
                        </div>
                      </td>

                      {/* Daily Change % */}
                      <td className="py-3.5 px-2.5 font-mono">
                        <div
                          className={`text-xs font-bold ${
                            stock.changePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {stock.changePercent >= 0 ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </td>

                      {/* RS Rating Column */}
                      <td className="py-3.5 px-2.5 text-center font-mono">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-bold border ${
                            stock.rsRating >= 90
                              ? 'bg-purple-950 text-amber-300 border-purple-600 font-black'
                              : stock.rsRating >= 80
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>{stock.rsRating} RS</span>
                        </span>
                      </td>

                      {/* Trend Readiness Score Column */}
                      <td className="py-3.5 px-2.5 text-center">
                        {(() => {
                          const readiness = calculateTrendReadinessScore(stock);
                          return (
                            <div className="flex flex-col items-center space-y-1">
                              <span
                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-xs font-bold border ${readiness.badgeBg} ${readiness.badgeBorder}`}
                                title={`Trend Readiness: ${readiness.readinessLabel} (${readiness.passedCount} of 8 Trend Template Rules Passed)`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{readiness.passedCount}/8 ({readiness.scorePercent}%)</span>
                              </span>

                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsRefinedModalOpen(true);
                                }}
                                className="text-[9px] font-mono px-1.5 py-0.5 bg-[#10141d] text-amber-300 border border-amber-500/40 hover:border-amber-400 font-bold uppercase tracking-wider cursor-pointer"
                                title="Click to view 18-Point Refined SEPA Screener Evaluation"
                              >
                                18-Pt: {evaluateRefinedSepaScreener(stock).passedCount}/18
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 200MA Trend Strength Meter Column */}
                      <td className="py-3.5 px-2.5 text-center font-mono">
                        <div className="flex flex-col items-center space-y-1">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${trendMeter.badgeBg} ${trendMeter.badgeText} ${trendMeter.badgeBorder} inline-flex items-center space-x-1`}
                            title={trendMeter.description}
                          >
                            {trendMeter.slopePercent > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-amber-300" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-300" />
                            )}
                            <span>{trendMeter.tierLabel}</span>
                          </span>

                          {/* Meter Fill Bar */}
                          <div className="w-20 bg-gray-200 h-1.5 overflow-hidden border border-gray-300">
                            <div
                              className={`h-full ${trendMeter.meterColor} transition-all duration-500`}
                              style={{ width: `${trendMeter.meterFillPercent}%` }}
                            />
                          </div>

                          <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-700">
                            <Activity className="w-3 h-3 text-emerald-600" />
                            <span>200MA: {trendMeter.slopePercent > 0 ? '+' : ''}{trendMeter.slopePercent.toFixed(2)}%/mo</span>
                          </div>
                        </div>
                      </td>

                      {/* Pattern Type */}
                      <td className="py-3.5 px-2.5">
                        <div className="font-bold text-[#1a1a1a]">
                          {stock.patternType}
                        </div>
                        <div className="text-[10px] text-[#b5a68d] font-bold uppercase tracking-wider">
                          {stock.vcpStage}
                        </div>
                      </td>

                      {/* VCP Contraction Heatmap Column */}
                      <td className="py-3.5 px-2.5 text-center font-mono">
                        <div className="flex flex-col items-center space-y-1">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${heatmap.badgeBg} ${heatmap.badgeText} ${heatmap.badgeBorder} inline-flex items-center space-x-1`}
                          >
                            <Droplets className="w-3 h-3" />
                            <span>{stock.volumeDryUpPercent}%</span>
                          </span>

                          {/* Progress Intensity Bar */}
                          <div className="w-20 bg-gray-200 h-1.5 overflow-hidden border border-gray-300">
                            <div
                              className={`h-full ${heatmap.barColor} transition-all duration-500`}
                              style={{ width: `${heatmap.score}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-sans font-bold uppercase">
                            Intensity: {heatmap.score}/100
                          </span>
                        </div>
                      </td>

                      {/* Pivot Entry Price & Daily Pivots / Volatility */}
                      <td className="py-3.5 px-2.5 font-mono">
                        {(() => {
                          const pivotCalc = calculateDailyPivotPoints(stock);
                          const volCalc = calculateDailyVolatilityMetrics(stock);
                          return (
                            <div className="space-y-1">
                              <div className="font-bold text-[#1a1a1a] text-sm flex items-center justify-between">
                                <span>{formatCurrency(stock.pivotPrice, currency)}</span>
                                <span
                                  className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                                  title={`Floor Pivot (P): ${currency}${pivotCalc.p.toFixed(2)} | TC: ${currency}${pivotCalc.tc.toFixed(2)} | BC: ${currency}${pivotCalc.bc.toFixed(2)}`}
                                >
                                  P: {currency}{pivotCalc.p.toFixed(0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-500">Buy: {currency}{stock.pivotPrice.toFixed(0)}-{currency}{stock.buyZoneMax.toFixed(0)}</span>
                                <span
                                  className={`font-bold text-[9px] ${volCalc.atr14Percent <= 3.5 ? 'text-emerald-700' : 'text-amber-700'}`}
                                  title={`Daily 14-day ATR: ${currency}${volCalc.atr14.toFixed(2)} (${volCalc.atr14Percent}% of Price)`}
                                >
                                  ATR: {volCalc.atr14Percent}%
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Stop Loss Exit Price */}
                      <td className="py-3.5 px-2.5 font-mono">
                        <div className="font-bold text-red-600">
                          {formatCurrency(stock.stopLossPrice, currency)}
                        </div>
                        <div className="text-[10px] text-red-700/80">
                          -{stock.stopLossPercent.toFixed(1)}% Stop
                        </div>
                      </td>

                      {/* Profit Target 1 */}
                      <td className="py-3.5 px-2.5 font-mono">
                        <div className="font-bold text-emerald-700">
                          {formatCurrency(stock.target1Price, currency)}
                        </div>
                        <div className="text-[10px] text-emerald-800/80">
                          +{stock.target1Percent.toFixed(0)}% Target
                        </div>
                      </td>

                      {/* R/R Ratio */}
                      <td className="py-3.5 px-2.5 text-center font-mono font-bold text-[#1a1a1a]">
                        <span className="bg-white px-2 py-1 border border-[#e5e4e1]">
                          {stock.riskRewardRatio.toFixed(1)}x
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewChart(stock);
                          }}
                          className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition-all flex items-center space-x-1 ml-auto border border-black"
                        >
                          <span>Scan VCP</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW MODE 2: Visual VCP Heatmap Grid Tiles */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-serif italic">
              No candidates match the heatmap filters.
            </div>
          ) : (
            filteredStocks.map((stock) => {
              const currency = getCurrencySymbol(stock.exchange);
              const isSelected = stock.ticker === selectedTicker;
              const heatmap = calculateVcpHeatmap(stock);

              return (
                <div
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock)}
                  className={`border p-5 cursor-pointer transition-all space-y-4 relative ${
                    isSelected
                      ? 'border-black ring-2 ring-black bg-white shadow-md'
                      : 'border-[#e5e4e1] bg-[#f9f8f5] hover:bg-white hover:border-gray-400 shadow-2xs'
                  }`}
                >
                  {/* Top Badge Banner */}
                  <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-extrabold text-base text-[#1a1a1a]">
                        {stock.ticker}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider bg-[#1a1a1a] text-white font-mono font-bold">
                        {stock.exchange}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${heatmap.badgeBg} ${heatmap.badgeText} ${heatmap.badgeBorder} flex items-center space-x-1`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>{heatmap.label}</span>
                    </span>
                  </div>

                  {/* Stock Name & Price */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 truncate">
                      {stock.name}
                    </h4>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-mono text-lg font-black text-[#1a1a1a]">
                        {formatCurrency(stock.currentPrice, currency)}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          stock.changePercent >= 0 ? 'text-green-700' : 'text-red-600'
                        }`}
                      >
                        {stock.changePercent >= 0 ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* VCP Contraction Meter Bar */}
                  <div className="space-y-1.5 bg-white p-2.5 border border-[#e5e4e1]">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-500 uppercase tracking-wider font-bold">Vol Dry-Up:</span>
                      <span className="font-bold text-[#1a1a1a]">{stock.volumeDryUpPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 overflow-hidden border border-gray-300">
                      <div
                        className={`h-full ${heatmap.barColor} transition-all duration-500`}
                        style={{ width: `${heatmap.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                      <span>Contraction Stage: {stock.vcpStage}</span>
                      <span>Score: {heatmap.score}/100</span>
                    </div>
                  </div>

                  {/* 200MA Trend Strength Meter Bar */}
                  {(() => {
                    const trendMeter = calculateTrendStrengthMeter(stock);
                    const isPos = trendMeter.slopePercent > 0;
                    return (
                      <div className="space-y-1.5 bg-white p-2.5 border border-[#e5e4e1]">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-500 uppercase tracking-wider font-bold flex items-center space-x-1">
                            <Gauge className="w-3 h-3 text-emerald-600" />
                            <span>200MA Trend Slope:</span>
                          </span>
                          <span className="font-extrabold text-[#1a1a1a]">
                            {isPos ? '+' : ''}{trendMeter.slopePercent.toFixed(2)}%/mo
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 overflow-hidden border border-gray-300">
                          <div
                            className={`h-full ${trendMeter.meterColor} transition-all duration-500`}
                            style={{ width: `${trendMeter.meterFillPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                          <span className={`px-1.5 py-0.5 font-bold ${trendMeter.badgeBg} ${trendMeter.badgeText}`}>
                            {trendMeter.tierLabel}
                          </span>
                          <span>MA Align: 50&gt;150&gt;200</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Key Execution Levels Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div className="bg-white p-2 border border-[#e5e4e1]">
                      <span className="text-[9px] text-gray-500 block uppercase">Pivot Buy:</span>
                      <strong className="text-[#1a1a1a] font-bold">
                        {formatCurrency(stock.pivotPrice, currency)}
                      </strong>
                    </div>
                    <div className="bg-white p-2 border border-red-200">
                      <span className="text-[9px] text-red-700 block uppercase">Stop Loss:</span>
                      <strong className="text-red-600 font-bold">
                        {formatCurrency(stock.stopLossPrice, currency)}
                      </strong>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewChart(stock);
                    }}
                    className="w-full bg-[#1a1a1a] hover:bg-black text-white font-bold py-2 text-xs uppercase tracking-widest flex items-center justify-center space-x-1 border border-black transition-all"
                  >
                    <span>Scan VCP Chart</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
    </div>

      {/* Refined 18-Point SEPA Strategy Screener Analysis Modal */}
      <RefinedSepaScreenerModal
        isOpen={isRefinedModalOpen}
        onClose={() => setIsRefinedModalOpen(false)}
        stocks={stocks}
        onSelectStock={onSelectStock}
      />
    </>
  );
};


