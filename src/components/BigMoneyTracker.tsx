import React, { useState, useMemo } from 'react';
import { MinerviniTradeSetup, PricePoint } from '../types';
import { formatCurrency, formatVolume, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Flame,
  ShieldAlert,
  Zap,
  Activity,
  BarChart3,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sliders
} from 'lucide-react';

interface BigMoneyTrackerProps {
  stock: MinerviniTradeSetup;
  onViewChart?: (stock: MinerviniTradeSetup) => void;
}

export type VolumeFilterMode = 'ALL' | 'ACCUMULATION_ONLY' | 'DISTRIBUTION_ONLY' | 'POCKET_PIVOT';

export interface VolumeSpikeEvent {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  priceChangePct: number;
  volume: number;
  avgVolume50: number;
  volumeRatio: number; // e.g., 2.45x average
  isUpDay: boolean;
  eventType: 'INSTITUTIONAL_ACCUMULATION' | 'INSTITUTIONAL_DISTRIBUTION' | 'POCKET_PIVOT' | 'DRY_UP' | 'NORMAL';
  eventLabel: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
}

export const BigMoneyTracker: React.FC<BigMoneyTrackerProps> = ({ stock, onViewChart }) => {
  const [filterMode, setFilterMode] = useState<VolumeFilterMode>('ALL');
  const [volumeThreshold, setVolumeThreshold] = useState<number>(1.5); // 1.5x average threshold
  const [hoveredEvent, setHoveredEvent] = useState<VolumeSpikeEvent | null>(null);

  const currencySymbol = getCurrencySymbol(stock.exchange);

  // Process price history into Big Money Volume Events
  const { volumeEvents, summaryStats, chartData } = useMemo(() => {
    const rawHistory = stock.priceHistory || [];
    if (rawHistory.length === 0) {
      return {
        volumeEvents: [],
        summaryStats: {
          accumulationDays: 0,
          distributionDays: 0,
          pocketPivotDays: 0,
          netFootprint: 0,
          maxSpikeRatio: 0,
          maxSpikeDate: 'N/A',
          institutionalScore: 50,
          institutionalStatus: 'Neutral Volume Activity',
          avg50dVol: stock.avgVolume20d || 1000000
        },
        chartData: []
      };
    }

    // Calculate rolling 50-day average volume for each day (fallback to 20-day if history < 50)
    const processedEvents: VolumeSpikeEvent[] = [];

    rawHistory.forEach((point, idx) => {
      // 50-day rolling average volume calculation up to current day
      const startIdx = Math.max(0, idx - 49);
      const windowPoints = rawHistory.slice(startIdx, idx + 1);
      const sumVol = windowPoints.reduce((sum, p) => sum + p.volume, 0);
      const avgVolume50 = Math.round(sumVol / (windowPoints.length || 1));

      const volumeRatio = Number((point.volume / (avgVolume50 || 1)).toFixed(2));
      const priceChangePct = point.open > 0 ? Number((((point.close - point.open) / point.open) * 100).toFixed(2)) : 0;
      const isUpDay = point.close >= point.open;

      // Pocket Pivot Detection: volume > max down-day volume in last 10 days
      const last10Start = Math.max(0, idx - 10);
      const last10 = rawHistory.slice(last10Start, idx);
      const maxDownDayVol10 = Math.max(...last10.filter((p) => p.close < p.open).map((p) => p.volume), 0);
      const isPocketPivot = isUpDay && point.volume > maxDownDayVol10 && point.volume >= avgVolume50 * 1.3 && idx >= 10;

      let eventType: VolumeSpikeEvent['eventType'] = 'NORMAL';
      let eventLabel = 'Normal Volume';
      let badgeBg = 'bg-slate-100 border-slate-300 text-slate-700';
      let badgeText = 'text-slate-700';
      let barColor = isUpDay ? '#94a3b8' : '#cbd5e1'; // neutral slate

      if (isPocketPivot) {
        eventType = 'POCKET_PIVOT';
        eventLabel = '⚡ Pocket Pivot Accumulation';
        badgeBg = 'bg-teal-100 border-teal-300 text-teal-900';
        badgeText = 'text-teal-800';
        barColor = '#0d9488'; // teal
      } else if (isUpDay && volumeRatio >= volumeThreshold) {
        eventType = 'INSTITUTIONAL_ACCUMULATION';
        eventLabel = `🟢 Big Money Accumulation (${volumeRatio}x Avg)`;
        badgeBg = 'bg-emerald-100 border-emerald-300 text-emerald-900';
        badgeText = 'text-emerald-800';
        barColor = volumeRatio >= 2.5 ? '#047857' : '#10b981'; // dark emerald or bright green
      } else if (!isUpDay && volumeRatio >= volumeThreshold) {
        eventType = 'INSTITUTIONAL_DISTRIBUTION';
        eventLabel = `🔴 Big Money Distribution (${volumeRatio}x Avg)`;
        badgeBg = 'bg-rose-100 border-rose-300 text-rose-900';
        badgeText = 'text-rose-800';
        barColor = '#e11d48'; // rose red
      } else if (volumeRatio <= 0.5) {
        eventType = 'DRY_UP';
        eventLabel = '🟡 VCP Volume Dry-Up (<0.5x Avg)';
        badgeBg = 'bg-amber-100 border-amber-300 text-amber-900';
        badgeText = 'text-amber-800';
        barColor = '#f59e0b'; // amber gold
      }

      processedEvents.push({
        date: point.date,
        close: point.close,
        open: point.open,
        high: point.high,
        low: point.low,
        priceChangePct,
        volume: point.volume,
        avgVolume50,
        volumeRatio,
        isUpDay,
        eventType,
        eventLabel,
        badgeBg,
        badgeText,
        barColor
      });
    });

    // Compute Summary Stats
    const accumulationDays = processedEvents.filter((e) => e.eventType === 'INSTITUTIONAL_ACCUMULATION').length;
    const distributionDays = processedEvents.filter((e) => e.eventType === 'INSTITUTIONAL_DISTRIBUTION').length;
    const pocketPivotDays = processedEvents.filter((e) => e.eventType === 'POCKET_PIVOT').length;
    const netFootprint = accumulationDays + pocketPivotDays - distributionDays;

    let maxSpikeRatio = 0;
    let maxSpikeDate = 'N/A';
    processedEvents.forEach((e) => {
      if (e.volumeRatio > maxSpikeRatio) {
        maxSpikeRatio = e.volumeRatio;
        maxSpikeDate = e.date;
      }
    });

    // Score from 0 to 100 representing institutional buying footprint
    const baseScore = 50 + (netFootprint * 8) + (pocketPivotDays * 5);
    const institutionalScore = Math.min(99, Math.max(10, Math.round(baseScore)));

    let institutionalStatus = 'Neutral Institutional Interest';
    if (institutionalScore >= 80) {
      institutionalStatus = '🟢 Heavy Institutional Accumulation (A+ Footprint)';
    } else if (institutionalScore >= 65) {
      institutionalStatus = '🔵 Positive Institutional Buying Bias';
    } else if (institutionalScore <= 35) {
      institutionalStatus = '🔴 Heavy Institutional Distribution Warning';
    }

    const latestAvg50dVol = processedEvents[processedEvents.length - 1]?.avgVolume50 || stock.avgVolume20d;

    // Filter chart data according to active mode
    const chartData = processedEvents.map((e) => ({
      date: e.date,
      close: e.close,
      volume: e.volume,
      avgVolume50: e.avgVolume50,
      volumeRatio: e.volumeRatio,
      normalizedVolRatio: e.volumeRatio, // for 1.0 baseline line
      barColor: e.barColor,
      eventType: e.eventType,
      eventLabel: e.eventLabel,
      priceChangePct: e.priceChangePct,
      rawEvent: e
    }));

    return {
      volumeEvents: processedEvents,
      summaryStats: {
        accumulationDays,
        distributionDays,
        pocketPivotDays,
        netFootprint,
        maxSpikeRatio,
        maxSpikeDate,
        institutionalScore,
        institutionalStatus,
        avg50dVol: latestAvg50dVol
      },
      chartData
    };
  }, [stock.priceHistory, stock.avgVolume20d, volumeThreshold]);

  // Filtered log of spike events for the table breakdown
  const filteredEventsLog = useMemo(() => {
    let filtered = volumeEvents.filter((e) => e.eventType !== 'NORMAL');
    if (filterMode === 'ACCUMULATION_ONLY') {
      filtered = volumeEvents.filter((e) => e.eventType === 'INSTITUTIONAL_ACCUMULATION');
    } else if (filterMode === 'DISTRIBUTION_ONLY') {
      filtered = volumeEvents.filter((e) => e.eventType === 'INSTITUTIONAL_DISTRIBUTION');
    } else if (filterMode === 'POCKET_PIVOT') {
      filtered = volumeEvents.filter((e) => e.eventType === 'POCKET_PIVOT');
    }
    return filtered.slice().reverse(); // newest first
  }, [volumeEvents, filterMode]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] p-6 text-white space-y-6 shadow-xl font-mono">
      
      {/* Component Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#30363d] pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-bold block">
                Smart Money & Institutional Footprint Monitor
              </span>
              <span className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[9px] px-2 py-0.5 font-bold uppercase">
                {stock.ticker} Volume Spikes
              </span>
            </div>
            <h3 className="text-xl font-serif font-black tracking-tight text-white mt-0.5">
              'Big Money' Institutional Volume Tracker
            </h3>
          </div>
        </div>

        {/* Executive Institutional Status Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#0e1117] border border-[#30363d] px-4 py-2 space-y-0.5 text-right">
            <span className="text-gray-400 text-[10px] uppercase block">Institutional Buying Score</span>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-2xl font-black text-emerald-400">{summaryStats.institutionalScore}/100</span>
              <span className="text-[10px] text-gray-400">Footprint</span>
            </div>
          </div>
          {onViewChart && (
            <button
              onClick={() => onViewChart(stock)}
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-4 py-2 text-xs uppercase tracking-wider border border-emerald-500 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Inspect Full Chart</span>
              <ArrowUpRight className="w-4 h-4 text-amber-300" />
            </button>
          )}
        </div>
      </div>

      {/* Big Money 4-Pillar Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Card 1: Accumulation Days */}
        <div className="bg-[#0e1117] border border-emerald-900/80 p-4 space-y-2 relative group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
            <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Heavy Buying Days</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 border border-emerald-800">
              ≥{volumeThreshold}x 50D Avg
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-400 block font-mono">
              {summaryStats.accumulationDays} Days
            </span>
            <span className="text-[10px] text-gray-400 block font-sans mt-0.5">
              Heavy volume up-days in last 50 trading sessions
            </span>
          </div>
        </div>

        {/* Card 2: Pocket Pivot Signals */}
        <div className="bg-[#0e1117] border border-teal-900/80 p-4 space-y-2 relative group hover:border-teal-500 transition-all">
          <div className="flex items-center justify-between border-b border-teal-900/50 pb-2">
            <span className="text-[10px] font-bold uppercase text-teal-400 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>Pocket Pivots</span>
            </span>
            <span className="text-[10px] font-bold text-teal-300 bg-teal-950 px-1.5 py-0.5 border border-teal-800">
              10-Day Volume Max
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-teal-300 block font-mono">
              {summaryStats.pocketPivotDays} Signals
            </span>
            <span className="text-[10px] text-gray-400 block font-sans mt-0.5">
              Institutional entry signals inside base consolidation
            </span>
          </div>
        </div>

        {/* Card 3: Distribution Days */}
        <div className="bg-[#0e1117] border border-rose-900/80 p-4 space-y-2 relative group hover:border-rose-500 transition-all">
          <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
            <span className="text-[10px] font-bold uppercase text-rose-400 flex items-center space-x-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Heavy Selling Days</span>
            </span>
            <span className="text-[10px] font-bold text-rose-300 bg-rose-950 px-1.5 py-0.5 border border-rose-800">
              ≥{volumeThreshold}x Down
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-rose-400 block font-mono">
              {summaryStats.distributionDays} Days
            </span>
            <span className="text-[10px] text-gray-400 block font-sans mt-0.5">
              Institutional exit / profit-taking down-days
            </span>
          </div>
        </div>

        {/* Card 4: Net Institutional Footprint */}
        <div className="bg-[#0e1117] border border-purple-900/80 p-4 space-y-2 relative group hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between border-b border-purple-900/50 pb-2">
            <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Net A/D Footprint</span>
            </span>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 border border-purple-800">
              Peak {summaryStats.maxSpikeRatio}x
            </span>
          </div>
          <div>
            <span className={`text-3xl font-black block font-mono ${summaryStats.netFootprint >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summaryStats.netFootprint >= 0 ? `+${summaryStats.netFootprint}` : summaryStats.netFootprint} Net Days
            </span>
            <span className="text-[10px] text-gray-400 block font-sans mt-0.5">
              Highest spike: <strong className="text-white">{summaryStats.maxSpikeRatio}x Avg</strong> on {summaryStats.maxSpikeDate}
            </span>
          </div>
        </div>

      </div>

      {/* RECHARTS VISUAL VOLUME SPIKE BAR CHART */}
      <div className="bg-[#0e1117] border border-[#30363d] p-5 space-y-4">
        
        {/* Chart Header & Threshold Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-3 text-xs">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              Daily Volume Relative to 50-Day Moving Average Baseline
            </h4>
          </div>

          {/* Interactive Threshold Selector */}
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-gray-400 uppercase font-bold flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Spike Threshold:</span>
            </span>
            <div className="flex border border-[#30363d] bg-[#161b22] p-0.5">
              {[1.3, 1.5, 2.0, 2.5].map((t) => (
                <button
                  key={t}
                  onClick={() => setVolumeThreshold(t)}
                  className={`px-2.5 py-1 font-bold uppercase transition-all cursor-pointer ${
                    volumeThreshold === t ? 'bg-emerald-900 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}x Avg
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] bg-[#161b22] border border-[#30363d] p-2.5">
          <span className="text-gray-400 uppercase font-bold">Chart Colors:</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-emerald-500 inline-block border border-emerald-300" />
            <span className="text-emerald-300 font-bold">Accumulation (≥{volumeThreshold}x Up)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-teal-600 inline-block border border-teal-300" />
            <span className="text-teal-300 font-bold">Pocket Pivot</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-rose-600 inline-block border border-rose-300" />
            <span className="text-rose-300 font-bold">Distribution (≥{volumeThreshold}x Down)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-amber-500 inline-block border border-amber-300" />
            <span className="text-amber-300 font-bold">Dry-Up (≤0.5x)</span>
          </div>
          <div className="flex items-center space-x-1.5 ml-auto text-gray-400 font-sans">
            <span>Dashed Line = 1.0x 50-Day Moving Average Volume</span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#6e7681"
                tick={{ fontSize: 9, fill: '#8b949e', fontFamily: 'monospace' }}
                interval={Math.ceil(chartData.length / 10)}
              />
              <YAxis
                stroke="#6e7681"
                tick={{ fontSize: 9, fill: '#8b949e', fontFamily: 'monospace' }}
                domain={[0, (dataMax: number) => Math.max(3.0, Math.ceil(dataMax * 1.15))]}
                tickFormatter={(val) => `${val}x`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    const event = data.rawEvent as VolumeSpikeEvent;
                    const currency = getCurrencySymbol(stock.exchange);

                    return (
                      <div className="bg-[#161b22] border-2 border-purple-500 p-3 shadow-2xl font-mono text-xs text-white space-y-1.5 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
                          <span className="text-amber-400 font-bold">{data.date}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${event.badgeBg}`}>
                            {event.eventLabel}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Close Price:</span>
                            <strong className="text-white">{formatCurrency(data.close, currency)} ({data.priceChangePct >= 0 ? '+' : ''}{data.priceChangePct}%)</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Daily Volume:</span>
                            <strong className="text-emerald-400">{formatVolume(data.volume)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">50D Avg Vol:</span>
                            <strong className="text-gray-300">{formatVolume(data.avgVolume50)}</strong>
                          </div>
                          <div className="flex justify-between border-t border-[#30363d] pt-1 mt-1">
                            <span className="text-gray-400">Volume Spike Ratio:</span>
                            <strong className={`font-black text-sm ${data.volumeRatio >= volumeThreshold ? (event.isUpDay ? 'text-emerald-400' : 'text-rose-400') : 'text-amber-300'}`}>
                              {data.volumeRatio}x 50D Avg
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Baseline 1.0x Average Volume Reference Line */}
              <ReferenceLine
                y={1.0}
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '1.0x 50D Baseline',
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'top'
                }}
              />

              {/* Dynamic Colored Bar Series */}
              <Bar dataKey="volumeRatio" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.barColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FILTERABLE BIG MONEY EVENTS LOG TABLE */}
      <div className="bg-[#0e1117] border border-[#30363d] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-2 text-xs">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              Significant Institutional Volume Spike Log ({filteredEventsLog.length} Events)
            </h4>
          </div>

          {/* Filter Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 uppercase font-bold border transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-purple-900 text-white border-purple-500'
                  : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:text-white'
              }`}
            >
              All Spikes
            </button>
            <button
              onClick={() => setFilterMode('ACCUMULATION_ONLY')}
              className={`px-2.5 py-1 uppercase font-bold border transition-all cursor-pointer ${
                filterMode === 'ACCUMULATION_ONLY'
                  ? 'bg-emerald-900 text-white border-emerald-500'
                  : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:text-white'
              }`}
            >
              Accumulation Spikes
            </button>
            <button
              onClick={() => setFilterMode('POCKET_PIVOT')}
              className={`px-2.5 py-1 uppercase font-bold border transition-all cursor-pointer ${
                filterMode === 'POCKET_PIVOT'
                  ? 'bg-teal-900 text-white border-teal-500'
                  : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:text-white'
              }`}
            >
              Pocket Pivots
            </button>
            <button
              onClick={() => setFilterMode('DISTRIBUTION_ONLY')}
              className={`px-2.5 py-1 uppercase font-bold border transition-all cursor-pointer ${
                filterMode === 'DISTRIBUTION_ONLY'
                  ? 'bg-rose-900 text-white border-rose-500'
                  : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:text-white'
              }`}
            >
              Distribution Spikes
            </button>
          </div>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] text-[10px] uppercase text-gray-400 font-bold bg-[#161b22]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Classification Signal</th>
                <th className="py-2.5 px-3 text-right">Close Price</th>
                <th className="py-2.5 px-3 text-right">Price Change %</th>
                <th className="py-2.5 px-3 text-right">Daily Volume</th>
                <th className="py-2.5 px-3 text-right">50D Avg Volume</th>
                <th className="py-2.5 px-3 text-center">Spike Multiple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {filteredEventsLog.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 italic">
                    No volume spike events matching the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEventsLog.map((ev, idx) => {
                  const currency = getCurrencySymbol(stock.exchange);
                  return (
                    <tr key={idx} className="hover:bg-[#161b22] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-amber-300">
                        {ev.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase inline-block ${ev.badgeBg}`}>
                          {ev.eventLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatCurrency(ev.close, currency)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${ev.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ev.priceChangePct >= 0 ? '+' : ''}{ev.priceChangePct}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {formatVolume(ev.volume)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">
                        {formatVolume(ev.avgVolume50)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black">
                        <span className={`px-2 py-0.5 text-[11px] ${ev.volumeRatio >= volumeThreshold ? (ev.isUpDay ? 'text-emerald-300 font-bold bg-emerald-950 border border-emerald-700' : 'text-rose-300 font-bold bg-rose-950 border border-rose-800') : 'text-amber-300 bg-amber-950 border border-amber-800'}`}>
                          {ev.volumeRatio}x 50D
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
