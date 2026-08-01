import React from 'react';
import { MinerviniTradeSetup } from '../types';
import {
  calculateDailyPivotPoints,
  calculateDailyVolatilityMetrics,
  formatCurrency,
  getCurrencySymbol
} from '../utils/sepaCalculator';
import {
  Target,
  Activity,
  Zap,
  TrendingUp,
  Layers,
  Gauge,
  Sliders,
  Shield,
  BarChart2,
  Compass,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

interface DailyPivotAndVolatilityPanelProps {
  stock: MinerviniTradeSetup;
}

export const DailyPivotAndVolatilityPanel: React.FC<DailyPivotAndVolatilityPanelProps> = ({ stock }) => {
  const currencySymbol = getCurrencySymbol(stock.exchange);

  const pivotData = calculateDailyPivotPoints(stock);
  const volData = calculateDailyVolatilityMetrics(stock);

  return (
    <div className="bg-white border-2 border-[#1a1a1a] shadow-xl overflow-hidden rounded-none my-6">
      
      {/* Header */}
      <div className="bg-[#10141d] text-white p-6 border-b border-[#232936] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-widest">
              DAILY TECHNICAL METRICS
            </span>
            <span className="text-amber-400 font-serif italic text-xs">
              SEPA Floor Pivots &amp; ATR Volatility Matrix
            </span>
          </div>
          <h2 className="text-2xl font-serif font-black tracking-tight text-white flex items-center space-x-2">
            <span>Daily Pivots &amp; Volatility Engine</span>
            <Compass className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Real-time calculation of Daily Floor Pivot Points, Central Pivot Range (CPR), VCP Breakout Trigger Levels, and 14-day ATR Volatility Contraction metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-gray-900 border border-gray-700 text-white font-mono text-xs flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase">Stock Price</span>
            <strong className="text-amber-300 text-sm font-bold">{formatCurrency(stock.currentPrice, currencySymbol)}</strong>
          </div>

          <div className={`px-3.5 py-2 border font-mono text-xs ${volData.badgeBg} flex flex-col items-end`}>
            <span className="text-[10px] uppercase opacity-80">Volatility Status</span>
            <strong className="text-xs font-bold">{volData.volatilityLabel}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Daily Pivots & CPR, Right = Volatility & ATR Compression */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: DAILY FLOOR PIVOTS & CPR */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-serif font-black text-[#1a1a1a]">
                Daily Floor Pivot Levels &amp; CPR
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 text-gray-700 font-bold uppercase">
              {pivotData.cprStatusLabel}
            </span>
          </div>

          {/* VCP Pivot Highlight Card */}
          <div className="p-4 bg-[#10141d] text-white border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>SEPA VCP Breakout Pivot Entry</span>
              </span>

              <span className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                pivotData.vcpPivotStatus === 'BREAKOUT_ACTIVE' ? 'bg-emerald-500 text-black' :
                pivotData.vcpPivotStatus === 'IN_BUY_ZONE' ? 'bg-amber-400 text-black' :
                pivotData.vcpPivotStatus === 'COILING_AT_PIVOT' ? 'bg-cyan-400 text-black' : 'bg-gray-700 text-gray-200'
              }`}>
                {pivotData.vcpPivotStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
              <div className="bg-gray-900/80 p-2.5 border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 block uppercase">VCP Pivot Entry</span>
                <strong className="text-sm font-bold text-amber-300">{formatCurrency(pivotData.vcpPivotPrice, currencySymbol)}</strong>
              </div>

              <div className="bg-gray-900/80 p-2.5 border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 block uppercase">Max Buy Zone (+2%)</span>
                <strong className="text-sm font-bold text-emerald-400">{formatCurrency(pivotData.buyZoneMax, currencySymbol)}</strong>
              </div>

              <div className="bg-gray-900/80 p-2.5 border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 block uppercase">Proximity to Pivot</span>
                <strong className={`text-sm font-bold ${pivotData.vcpPivotProximityPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pivotData.vcpPivotProximityPct >= 0 ? '+' : ''}{pivotData.vcpPivotProximityPct}%
                </strong>
              </div>
            </div>
          </div>

          {/* Central Pivot Range (CPR) Card */}
          <div className="p-4 bg-[#f9f8f5] border border-[#e5e4e1] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-gray-600" />
                <span>Central Pivot Range (CPR) Width:</span>
              </span>
              <strong className="text-black font-black">{pivotData.cprWidthPct}% CPR Width</strong>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
              <div className="bg-white p-2 border border-gray-200 text-center">
                <span className="text-[9px] text-gray-500 block uppercase">Top Central (TC)</span>
                <strong className="text-gray-900 font-bold">{formatCurrency(pivotData.tc, currencySymbol)}</strong>
              </div>
              <div className="bg-white p-2 border border-amber-300 text-center font-bold">
                <span className="text-[9px] text-amber-800 block uppercase">Pivot (P)</span>
                <strong className="text-amber-900 font-bold">{formatCurrency(pivotData.p, currencySymbol)}</strong>
              </div>
              <div className="bg-white p-2 border border-gray-200 text-center">
                <span className="text-[9px] text-gray-500 block uppercase">Bottom Central (BC)</span>
                <strong className="text-gray-900 font-bold">{formatCurrency(pivotData.bc, currencySymbol)}</strong>
              </div>
            </div>
          </div>

          {/* Floor Pivot Support & Resistance Table */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              Floor Resistance &amp; Support Matrix (Daily Range):
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-rose-50 border border-rose-200 text-rose-900 font-bold">
                <span>Resistance 3 (R3)</span>
                <span>{formatCurrency(pivotData.r3, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-rose-50/60 border border-rose-200 text-rose-800">
                <span>Resistance 2 (R2)</span>
                <span className="font-bold">{formatCurrency(pivotData.r2, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-rose-50/30 border border-rose-150 text-rose-700">
                <span>Resistance 1 (R1)</span>
                <span className="font-bold">{formatCurrency(pivotData.r1, currencySymbol)}</span>
              </div>

              {/* Central Floor Pivot */}
              <div className="flex items-center justify-between p-2.5 bg-amber-400 text-black font-black border border-black shadow-xs">
                <span className="flex items-center space-x-1.5">
                  <Compass className="w-4 h-4" />
                  <span>Central Floor Pivot (P)</span>
                </span>
                <span>{formatCurrency(pivotData.p, currencySymbol)}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-emerald-50/30 border border-emerald-150 text-emerald-700">
                <span>Support 1 (S1)</span>
                <span className="font-bold">{formatCurrency(pivotData.s1, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-200 text-emerald-800">
                <span>Support 2 (S2)</span>
                <span className="font-bold">{formatCurrency(pivotData.s2, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                <span>Support 3 (S3)</span>
                <span>{formatCurrency(pivotData.s3, currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DAILY VOLATILITY & ATR COMPRESSION */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-serif font-black text-[#1a1a1a]">
                Daily Volatility &amp; ATR Compression Engine
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold uppercase">
              Score: {volData.volatilityCompressionScore} / 100
            </span>
          </div>

          {/* Volatility Compression Score Visual Gauge Meter */}
          <div className="p-4 bg-[#10141d] text-white border border-gray-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-bold flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Volatility Contraction Score:</span>
              </span>
              <strong className="text-amber-400 text-sm font-black">{volData.volatilityCompressionScore}% Tightness</strong>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-gray-800 h-3 border border-gray-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  volData.volatilityCompressionScore >= 80 ? 'bg-emerald-400' :
                  volData.volatilityCompressionScore >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${volData.volatilityCompressionScore}%` }}
              />
            </div>

            <p className="text-[11px] text-gray-400 leading-tight font-sans">
              High score indicates ultra-tight daily ATR compression and extreme volume dry-up, preparing for explosive Stage 2 breakout expansion.
            </p>
          </div>

          {/* ATR & Daily Volatility Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            
            <div className="p-3 bg-[#f9f8f5] border border-[#e5e4e1] space-y-1">
              <span className="text-[10px] text-gray-500 block uppercase">14-Day ATR ($)</span>
              <strong className="text-base text-black font-bold">{formatCurrency(volData.atr14, currencySymbol)}</strong>
              <span className="text-[10px] text-gray-600 block">Average True Range</span>
            </div>

            <div className="p-3 bg-[#f9f8f5] border border-[#e5e4e1] space-y-1">
              <span className="text-[10px] text-gray-500 block uppercase">Daily ATR % of Price</span>
              <strong className={`text-base font-bold ${volData.atr14Percent <= 3.5 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {volData.atr14Percent}%
              </strong>
              <span className="text-[10px] text-gray-600 block">Expected Daily Range</span>
            </div>

            <div className="p-3 bg-[#f9f8f5] border border-[#e5e4e1] space-y-1">
              <span className="text-[10px] text-gray-500 block uppercase">Volatility Ratio (5d/20d)</span>
              <strong className={`text-base font-bold ${volData.volatilityContractionRatio <= 0.65 ? 'text-emerald-700' : 'text-gray-800'}`}>
                {volData.volatilityContractionRatio.toFixed(2)}x
              </strong>
              <span className="text-[10px] text-gray-600 block">Compression Ratio (&lt;0.65 Tight)</span>
            </div>

            <div className="p-3 bg-[#f9f8f5] border border-[#e5e4e1] space-y-1">
              <span className="text-[10px] text-gray-500 block uppercase">Daily High / Low Range</span>
              <strong className="text-base text-black font-bold">{volData.dailyRangePercent}%</strong>
              <span className="text-[10px] text-gray-600 block">
                {formatCurrency(volData.dailyLow, currencySymbol)} – {formatCurrency(volData.dailyHigh, currencySymbol)}
              </span>
            </div>

          </div>

          {/* Volume Dry-Up Alignment */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-emerald-900">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pre-Breakout Volume Dry-Up:</span>
              </span>
              <span>{volData.dryUpPercent}% Volume Contraction</span>
            </div>
            <p className="text-[11px] text-gray-700 font-sans leading-relaxed">
              When daily price volatility tightens concurrently with volume drying up below average, institutional supply is exhausted and sellers have evaporated.
            </p>
          </div>

        </div>

      </div>

      {/* Footer Info */}
      <div className="p-4 bg-[#f9f8f5] border-t border-[#e5e4e1] flex items-center justify-between text-xs font-mono text-gray-600">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-600" />
          <span>Daily Floor Pivots and ATR Volatility updated in real-time for {stock.ticker}.</span>
        </div>
        <span className="font-bold text-black">{stock.ticker} — SEPA Volatility Engine</span>
      </div>

    </div>
  );
};
