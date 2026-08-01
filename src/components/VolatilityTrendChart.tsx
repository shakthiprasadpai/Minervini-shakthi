import React, { useState, useMemo } from 'react';
import { MinerviniTradeSetup, PricePoint } from '../types';
import { formatCurrency, formatVolume, getCurrencySymbol } from '../utils/sepaCalculator';
import { Activity, Droplets, TrendingDown, Target, Zap, Sliders, Layers, BarChart3, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';

interface VolatilityTrendChartProps {
  stock: MinerviniTradeSetup;
}

export const VolatilityTrendChart: React.FC<VolatilityTrendChartProps> = ({ stock }) => {
  const currencySymbol = getCurrencySymbol(stock.exchange);
  const priceHistory = stock.priceHistory || [];

  // ATR & Volatility Squeeze calculation over history
  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return [];

    return priceHistory.map((pt, idx) => {
      // Calculate 14-day ATR estimate (High - Low)
      const prevClose = idx > 0 ? priceHistory[idx - 1].close : pt.close;
      const trueRange = Math.max(
        pt.high - pt.low,
        Math.abs(pt.high - prevClose),
        Math.abs(pt.low - prevClose)
      );

      // Slice 14 days for ATR average
      const sliceStart = Math.max(0, idx - 14);
      const slice = priceHistory.slice(sliceStart, idx + 1);
      const atr14 = slice.reduce((sum, item, itemIdx) => {
        const itemPrev = (sliceStart + itemIdx) > 0 ? priceHistory[sliceStart + itemIdx - 1].close : item.close;
        const tr = Math.max(item.high - item.low, Math.abs(item.high - itemPrev), Math.abs(item.low - itemPrev));
        return sum + tr;
      }, 0) / Math.max(1, slice.length);

      // ATR % of Price (Volatility Contraction Index)
      const atrPercent = pt.close > 0 ? (atr14 / pt.close) * 100 : 0;

      // Volatility Squeeze Alert: ATR% < 3% indicates tight coil compression
      const isVolatilitySqueeze = atrPercent < 3.5;

      return {
        date: pt.date,
        close: pt.close,
        high: pt.high,
        low: pt.low,
        volume: pt.volume,
        atr14: Number(atr14.toFixed(2)),
        atrPercent: Number(atrPercent.toFixed(2)),
        isVolatilitySqueeze,
        sma20Vol: pt.volumeAverage || 1000000,
        volumeDryUp: pt.volume < (pt.volumeAverage || 1000000) * 0.5,
      };
    });
  }, [priceHistory]);

  const currentAtr = chartData.length > 0 ? chartData[chartData.length - 1].atr14 : 0;
  const currentAtrPct = chartData.length > 0 ? chartData[chartData.length - 1].atrPercent : 0;
  const isSqueezed = currentAtrPct < 3.5;

  return (
    <div id="volatility-trend-charting-module" className="bg-white border border-[#e5e4e1] p-6 space-y-6 text-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-700" />
            <h3 className="text-xl font-serif font-black text-[#1a1a1a]">
              Volatility Trend & ATR Contraction Chart
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-serif italic mt-0.5">
            ATR (14-day) volatility squeeze indicator & volume dry-up overlay for <strong className="not-italic text-[#1a1a1a]">{stock.ticker}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="bg-[#1a1a1a] text-white px-3 py-1 font-bold">
            ATR (14): {formatCurrency(currentAtr, currencySymbol)} ({currentAtrPct.toFixed(1)}%)
          </span>
          <span className={`px-3 py-1 font-bold border ${
            isSqueezed ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-gray-100 text-gray-800 border-gray-300'
          }`}>
            {isSqueezed ? '🔥 VOLATILITY SQUEEZE ACTIVE' : 'NORMAL VOLATILITY'}
          </span>
        </div>
      </div>

      {/* Main Interactive Recharts Chart */}
      <div className="bg-[#10141d] border border-[#232936] p-5 rounded space-y-4 text-white">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 border-b border-gray-800 pb-2">
          <span className="uppercase tracking-widest text-amber-400 font-bold flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Price (Candle/Line) vs Volatility ATR Trend Line</span>
          </span>
          <span>Last Close: <strong className="text-white">{formatCurrency(stock.currentPrice, currencySymbol)}</strong></span>
        </div>

        {/* Chart 1: Price & ATR */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3245" />
              <XAxis dataKey="date" stroke="#8892b0" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <YAxis yAxisId="price" stroke="#60a5fa" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(val) => formatCurrency(val, currencySymbol)} />
              <YAxis yAxisId="atr" orientation="right" stroke="#f59e0b" tick={{ fill: '#f59e0b', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 text-xs font-mono text-white shadow-xl space-y-1">
                        <div className="font-bold text-amber-400">{data.date}</div>
                        <div>Price: <span className="font-bold">{formatCurrency(data.close, currencySymbol)}</span></div>
                        <div>ATR (14): <span className="font-bold text-amber-300">{formatCurrency(data.atr14, currencySymbol)} ({data.atrPercent}%)</span></div>
                        <div>Volume: <span className="font-bold">{formatVolume(data.volume)}</span></div>
                        {data.isVolatilitySqueeze && (
                          <div className="text-emerald-400 font-bold text-[10px]">🔥 Volatility Squeeze Point</div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} name="Stock Price" />
              <Line yAxisId="atr" type="monotone" dataKey="atrPercent" stroke="#f59e0b" strokeWidth={2} dot={false} name="ATR Volatility %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Volume Dry-Up Bars */}
        <div className="h-28 w-full border-t border-gray-800 pt-2">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
            Volume & Dry-Up Detection
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <Bar dataKey="volume">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`vol-cell-${index}`}
                    fill={entry.volumeDryUp ? '#10b981' : '#475569'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explanation Footer */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 font-mono text-xs text-gray-700 space-y-1">
        <div className="font-bold text-[#1a1a1a] flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-700" />
          <span>Why Volatility Contraction (ATR Squeeze) Drives Explosive Breakouts</span>
        </div>
        <p className="text-[11px] font-sans leading-relaxed text-gray-600">
          Mark Minervini's SEPA strategy relies on identifying stocks where daily price volatility compresses dramatically (ATR % drops below 3.5%). When supply is absorbed by institutional buyers, volume dries up and price moves sideways in tight ranges (T1 → T2 → T3). This coiled spring effect creates asymmetrical risk/reward entries right at the pivot price.
        </p>
      </div>
    </div>
  );
};
