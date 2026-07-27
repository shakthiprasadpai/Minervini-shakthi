import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  BarChart2,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { BseSensexChart } from './BseSensexChart';

export type MarketRegime = 'CONFIRMED_UPTREND' | 'UNDER_PRESSURE' | 'CORRECTION' | 'RALLY_ATTEMPT';

export interface MarketIndexData {
  name: string;
  symbol: string;
  value: number;
  changePercent: number;
  distributionDays: number;
  statusAbove50Sma: boolean;
  statusAbove21Ema: boolean;
}

export const MarketSentimentRibbon: React.FC = () => {
  const [regime, setRegime] = useState<MarketRegime>('CONFIRMED_UPTREND');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Simulated live market index feed data
  const [indices, setIndices] = useState<MarketIndexData[]>([
    {
      name: 'S&P 500',
      symbol: '^GSPC',
      value: 5592.1,
      changePercent: 0.54,
      distributionDays: 1,
      statusAbove50Sma: true,
      statusAbove21Ema: true,
    },
    {
      name: 'Nasdaq 100',
      symbol: '^NDX',
      value: 19850.3,
      changePercent: 0.88,
      distributionDays: 0,
      statusAbove50Sma: true,
      statusAbove21Ema: true,
    },
    {
      name: 'Nifty 50',
      symbol: '^NSEI',
      value: 24420.8,
      changePercent: 0.32,
      distributionDays: 2,
      statusAbove50Sma: true,
      statusAbove21Ema: true,
    },
    {
      name: 'BSE Sensex',
      symbol: '^BSESN',
      value: 79850.4,
      changePercent: 0.45,
      distributionDays: 1,
      statusAbove50Sma: true,
      statusAbove21Ema: true,
    },
    {
      name: 'Russell 2000',
      symbol: '^RUT',
      value: 2240.15,
      changePercent: 1.15,
      distributionDays: 2,
      statusAbove50Sma: true,
      statusAbove21Ema: false,
    },
  ]);

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIndices((prev) =>
        prev.map((idx) => {
          const delta = (Math.random() - 0.48) * 0.4;
          const newChange = Number((idx.changePercent + delta).toFixed(2));
          const newValue = Number((idx.value * (1 + delta / 100)).toFixed(2));
          return {
            ...idx,
            changePercent: newChange,
            value: newValue,
          };
        })
      );
      setIsRefreshing(false);
    }, 600);
  };

  // Regime configuration mapping
  const regimeConfig = {
    CONFIRMED_UPTREND: {
      title: 'Confirmed Uptrend',
      subtitle: 'Market environment ideal for Stage 2 VCP breakouts. Offense mode active.',
      bgColor: 'bg-emerald-950 text-emerald-50 border-emerald-800',
      ribbonBg: 'bg-emerald-900/90 border-emerald-700',
      badgeBg: 'bg-emerald-500 text-black',
      dotColor: 'bg-emerald-400',
      pulseGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      icon: TrendingUp,
      actionAdvice: 'Full Position Sizing (100%) • Focus on 3-T / 4-T VCP breakouts with volume dry-ups.',
      healthScore: 92,
    },
    UNDER_PRESSURE: {
      title: 'Uptrend Under Pressure',
      subtitle: 'Elevated distribution days observed in major market indices. Caution advised.',
      bgColor: 'bg-amber-950 text-amber-50 border-amber-800',
      ribbonBg: 'bg-amber-900/90 border-amber-700',
      badgeBg: 'bg-amber-400 text-black',
      dotColor: 'bg-amber-400',
      pulseGlow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      icon: AlertTriangle,
      actionAdvice: 'Reduce Position Sizing (50%) • Tighten stop-losses to 4-5% • Pass on marginal setups.',
      healthScore: 58,
    },
    CORRECTION: {
      title: 'Market in Correction',
      subtitle: 'Indices below key 50-day moving averages. Defense mode active. Cash is king.',
      bgColor: 'bg-rose-950 text-rose-50 border-rose-800',
      ribbonBg: 'bg-rose-900/90 border-rose-700',
      badgeBg: 'bg-rose-500 text-white',
      dotColor: 'bg-rose-400',
      pulseGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.5)]',
      icon: ShieldAlert,
      actionAdvice: 'Avoid New Breakout Buys • Raise Cash • Build Watchlists for Next Market Cycle.',
      healthScore: 24,
    },
    RALLY_ATTEMPT: {
      title: 'Rally Attempt (Day 4+)',
      subtitle: 'Indices attempting bottom reversal. Awaiting heavy-volume Follow-Through Day (FTD).',
      bgColor: 'bg-sky-950 text-sky-50 border-sky-800',
      ribbonBg: 'bg-sky-900/90 border-sky-700',
      badgeBg: 'bg-sky-400 text-black',
      dotColor: 'bg-sky-400',
      pulseGlow: 'shadow-[0_0_12px_rgba(56,189,248,0.5)]',
      icon: Activity,
      actionAdvice: 'Small Pilot Positions (25%) • Wait for FTD signal before scaling into positions.',
      healthScore: 45,
    },
  };

  const currentConfig = regimeConfig[regime];
  const IconComponent = currentConfig.icon;

  return (
    <div className={`border shadow-sm transition-all duration-300 ${currentConfig.bgColor}`}>
      
      {/* Top Banner Ribbon */}
      <div className="px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Status & Severity Indicator */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center">
            <span className={`w-3.5 h-3.5 rounded-full ${currentConfig.dotColor} animate-ping absolute opacity-75`} />
            <span className={`w-3.5 h-3.5 rounded-full ${currentConfig.dotColor} relative ${currentConfig.pulseGlow}`} />
          </div>

          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-xs ${currentConfig.badgeBg}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-gray-300">
                  Market Health Status
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 uppercase ${currentConfig.badgeBg}`}>
                  {currentConfig.title}
                </span>
              </div>
              <p className="text-xs font-serif italic text-gray-200 mt-0.5">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Center Live Indices Feed */}
        <div className="hidden lg:flex items-center space-x-4 font-mono text-xs border-x border-white/10 px-4 py-1">
          {indices.map((idx) => (
            <div key={idx.symbol} className="flex items-center space-x-2 bg-black/30 px-2.5 py-1 border border-white/10">
              <span className="font-bold text-gray-300 text-[11px]">{idx.name}:</span>
              <span className="font-semibold text-white">{idx.value.toLocaleString()}</span>
              <span
                className={`text-[10px] font-bold px-1 ${
                  idx.changePercent >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {idx.changePercent >= 0 ? '+' : ''}
                {idx.changePercent}%
              </span>
            </div>
          ))}

          <button
            onClick={handleRefreshFeed}
            title="Refresh Market Feed"
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>

        {/* Right Actionable Guidance & Toggle Details */}
        <div className="flex items-center space-x-3 text-xs font-sans ml-auto">
          {/* Regime Switcher Dropdown / Buttons */}
          <div className="flex items-center space-x-1 bg-black/40 p-1 border border-white/10">
            {(['CONFIRMED_UPTREND', 'UNDER_PRESSURE', 'CORRECTION', 'RALLY_ATTEMPT'] as MarketRegime[]).map((r) => {
              const labelMap = {
                CONFIRMED_UPTREND: '🟢 Uptrend',
                UNDER_PRESSURE: '🟡 Pressure',
                CORRECTION: '🔴 Correction',
                RALLY_ATTEMPT: '🔵 Rally',
              };
              return (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={`px-2 py-1 text-[10px] font-mono uppercase font-bold transition-all ${
                    regime === r
                      ? 'bg-white text-black shadow-xs'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {labelMap[r]}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 text-xs font-mono font-bold transition-all"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide Diagnostics' : 'Market Pulse'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Action Guidance Bar */}
      <div className="bg-black/50 border-t border-white/10 px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-gray-400 uppercase text-[10px] tracking-wider font-bold">
            Minervini Execution Rule:
          </span>
          <span className="text-white font-bold">{currentConfig.actionAdvice}</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-gray-300">
          <span className="flex items-center space-x-1">
            <span className="text-gray-400 font-sans">Market Health Index:</span>
            <strong className="text-emerald-400 font-mono font-bold">{currentConfig.healthScore}/100</strong>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span className="text-gray-400 font-sans">Institutional Distribution:</span>
            <strong className="text-white font-mono font-bold">Low (1-2 Days)</strong>
          </span>
        </div>
      </div>

      {/* Expanded Diagnostics Drawer */}
      {isExpanded && (
        <div className="bg-black/80 border-t border-white/10 p-5 space-y-4 font-mono text-xs text-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {indices.map((idx) => (
              <div key={idx.symbol} className="bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <span className="font-bold text-white text-sm">{idx.name}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold ${
                      idx.changePercent >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent}%
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="font-bold">{idx.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distribution Days:</span>
                    <span className="font-bold text-amber-300">{idx.distributionDays} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Above 50 SMA:</span>
                    <span className={idx.statusAbove50Sma ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {idx.statusAbove50Sma ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Above 21 EMA:</span>
                    <span className={idx.statusAbove21Ema ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {idx.statusAbove21Ema ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          </div>

          {/* BSE Sensex Performance Trend Chart */}
          <div className="pt-2">
            <BseSensexChart />
          </div>

          <div className="bg-white/5 p-3 border border-white/10 text-gray-300 font-serif italic text-xs leading-relaxed flex items-start space-x-2">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Mark Minervini Market Trend Rule:</strong> 3 out of 4 growth stock breakout failures occur during market corrections or heavy distribution periods. Always ensure the general market trend is in a Confirmed Uptrend before taking full 100% position size in VCP setups.
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
