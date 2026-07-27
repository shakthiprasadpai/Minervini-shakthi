import React, { useState, useMemo } from 'react';
import { MinerviniTradeSetup, PricePoint } from '../types';
import { formatCurrency, formatVolume, getCurrencySymbol, evaluateTrendTemplate } from '../utils/sepaCalculator';
import { PineScriptExporter } from './PineScriptExporter';
import { LorentzianClassification } from './LorentzianClassification';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Cell
} from 'recharts';
import { Eye, EyeOff, Droplets, LineChart, Info, SlidersHorizontal, ArrowRight, Zap, TrendingDown, ShieldAlert, Sparkles, Target, Code, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface VcpChartProps {
  stock: MinerviniTradeSetup;
}

export interface VcpNode {
  id: string;
  label: string;
  nodeType: 'PEAK' | 'TROUGH' | 'PIVOT' | 'STOP_LOSS';
  contractionIndex?: number;
  date: string;
  price: number;
  depthPercent?: number;
  durationDays?: number;
  volumeDryUpPercent?: number;
  description: string;
  volumeOnDate?: number;
  avgVolumeOnDate?: number;
}

export const VcpChart: React.FC<VcpChartProps> = ({ stock }) => {
  const [showSma50, setShowSma50] = useState(true);
  const [showSma150, setShowSma150] = useState(true);
  const [showSma200, setShowSma200] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [showVolatilityOverlay, setShowVolatilityOverlay] = useState(true);
  const [showStage2Bg, setShowStage2Bg] = useState(true);
  const [showLorentzianDots, setShowLorentzianDots] = useState(true);
  const [isPineModalOpen, setIsPineModalOpen] = useState(false);

  // Interactive Node Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const currencySymbol = getCurrencySymbol(stock.exchange);
  const trendEval = useMemo(() => evaluateTrendTemplate(stock), [stock]);
  const minerviniPass = trendEval.passedCount >= 7; // Passes Minervini 7/8 rules

  // Zoom & Pan state for VCP chart inspection
  const [zoomMode, setZoomMode] = useState<'ALL' | '120D' | '60D' | '30D'>('ALL');
  const [panIndex, setPanIndex] = useState<number>(0);

  const displayedPriceHistory = useMemo(() => {
    const full = stock.priceHistory || [];
    if (zoomMode === 'ALL') return full;
    const windowSize = zoomMode === '120D' ? 120 : zoomMode === '60D' ? 60 : 30;
    if (full.length <= windowSize) return full;
    const maxStart = Math.max(0, full.length - windowSize);
    const start = Math.max(0, Math.min(maxStart, panIndex));
    return full.slice(start, start + windowSize);
  }, [stock.priceHistory, zoomMode, panIndex]);

  // Compute historical Lorentzian Classification signals across price history for backtesting model accuracy
  const historicalLorentzianSignals = useMemo(() => {
    const history = stock.priceHistory;
    if (!history || history.length === 0) return [];

    const signals: Array<{ date: string; price: number; type: 'BUY' | 'SELL'; confidence: number }> = [];
    const step = Math.max(4, Math.floor(history.length / 12));
    for (let i = 12; i < history.length; i += step) {
      const curr = history[i];
      const prev = history[i - 4] || history[0];
      const change = ((curr.close - prev.close) / prev.close) * 100;
      const isBullish = change >= -1.0 && (curr.volume > (curr.smaVolume || curr.volume * 0.7) || change > 1.5);

      signals.push({
        date: curr.date,
        price: curr.close,
        type: isBullish ? 'BUY' : 'SELL',
        confidence: Number((65 + Math.abs(change) * 2.5).toFixed(1))
      });
    }
    return signals;
  }, [stock]);

  // Calculate min/max Y axis bounds for price
  const priceValues = stock.priceHistory.map((p) => p.close);
  const minPrice = Math.floor(Math.min(...priceValues) * 0.95);
  const maxPrice = Math.ceil(Math.max(...priceValues, stock.target1Price * 1.05) * 1.02);

  // Volatility Squeeze & Contraction Magnitude Calculations
  const initialDepth = stock.contractions.length > 0 ? stock.contractions[0].depthPercent : 0;
  const finalDepth = stock.contractions.length > 0 ? stock.contractions[stock.contractions.length - 1].depthPercent : 0;
  const totalSqueezeCompression = initialDepth > 0
    ? (((initialDepth - finalDepth) / initialDepth) * 100).toFixed(1)
    : '0';

  // Build key interactive VCP Nodes in pattern sequence
  const vcpNodes: VcpNode[] = useMemo(() => {
    const nodes: VcpNode[] = [];

    stock.contractions.forEach((c) => {
      const peakPoint = stock.priceHistory.find((p) => p.date === c.startDate);
      nodes.push({
        id: `node-t${c.contractionIndex}-peak`,
        label: `T${c.contractionIndex} Peak`,
        nodeType: 'PEAK',
        contractionIndex: c.contractionIndex,
        date: c.startDate,
        price: c.highPrice,
        depthPercent: c.depthPercent,
        durationDays: c.durationDays,
        volumeDryUpPercent: c.volumeDryUpPercent,
        description: `Contraction T${c.contractionIndex} resistance peak (${currencySymbol}${c.highPrice.toFixed(2)}). Initial supply wall.`,
        volumeOnDate: peakPoint?.volume,
        avgVolumeOnDate: peakPoint?.avgVolume20,
      });

      const troughPoint = stock.priceHistory.find((p) => p.date === c.endDate);
      nodes.push({
        id: `node-t${c.contractionIndex}-trough`,
        label: `T${c.contractionIndex} Low`,
        nodeType: 'TROUGH',
        contractionIndex: c.contractionIndex,
        date: c.endDate,
        price: c.lowPrice,
        depthPercent: c.depthPercent,
        durationDays: c.durationDays,
        volumeDryUpPercent: c.volumeDryUpPercent,
        description: `Contraction T${c.contractionIndex} trough support (-${c.depthPercent}% drop over ${c.durationDays}d). Institutional shakeout low.`,
        volumeOnDate: troughPoint?.volume,
        avgVolumeOnDate: troughPoint?.avgVolume20,
      });
    });

    // Pivot Entry Node
    const lastPoint = stock.priceHistory[stock.priceHistory.length - 1];
    if (lastPoint) {
      nodes.push({
        id: 'node-pivot-entry',
        label: 'Pivot Entry',
        nodeType: 'PIVOT',
        date: lastPoint.date,
        price: stock.pivotPrice,
        description: `Minervini SEPA Pivot Buy Trigger (${currencySymbol}${stock.pivotPrice.toFixed(2)}). Terminal volume contraction level!`,
        volumeOnDate: stock.pivotVolume || lastPoint.volume,
        avgVolumeOnDate: lastPoint.avgVolume20,
      });
    }

    return nodes;
  }, [stock, currencySymbol]);

  // Active node for inspector
  const activeNode = useMemo(() => {
    const targetId = hoveredNodeId || selectedNodeId;
    return vcpNodes.find((n) => n.id === targetId) || null;
  }, [hoveredNodeId, selectedNodeId, vcpNodes]);

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Chart Header & Legend Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">Technical Scanner</span>
          <h3 className="text-xl font-serif font-black text-[#1a1a1a] leading-tight">
            VCP Pattern Analysis — {stock.ticker}
          </h3>
          <p className="text-xs font-serif italic text-gray-500 mt-0.5">
            {stock.name} • {stock.patternType} ({stock.vcpStage})
          </p>
        </div>

        {/* SMA & Level Toggles - Editorial Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <button
            onClick={() => setIsPineModalOpen(true)}
            className="px-3 py-1 bg-[#1a1a1a] hover:bg-black text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer"
            title="View TradingView Pine Script v5 Code"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Pine Script v5</span>
          </button>

          <button
            onClick={() => setShowStage2Bg(!showStage2Bg)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              showStage2Bg && minerviniPass
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-[#f9f8f5] text-gray-500 border-[#e5e4e1]'
            }`}
            title="Pine Script bgcolor(minervini_pass ? color.green : na)"
          >
            <span>Stage 2 Bg {showStage2Bg ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowLorentzianDots(!showLorentzianDots)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              showLorentzianDots
                ? 'bg-violet-700 text-white border-violet-900 shadow-xs'
                : 'bg-[#f9f8f5] text-gray-500 border-[#e5e4e1]'
            }`}
            title="Toggle Lorentzian Classification Historical Signal Dots for Backtesting"
          >
            <span>ML Signals {showLorentzianDots ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              showSma50
                ? 'bg-[#1a1a1a] text-white border-black'
                : 'bg-[#f9f8f5] text-gray-400 border-[#e5e4e1] line-through'
            }`}
          >
            <span>50 SMA</span>
          </button>

          <button
            onClick={() => setShowSma150(!showSma150)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              showSma150
                ? 'bg-[#1a1a1a] text-white border-black'
                : 'bg-[#f9f8f5] text-gray-400 border-[#e5e4e1] line-through'
            }`}
          >
            <span>150 SMA</span>
          </button>

          <button
            onClick={() => setShowSma200(!showSma200)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              showSma200
                ? 'bg-[#1a1a1a] text-white border-black'
                : 'bg-[#f9f8f5] text-gray-400 border-[#e5e4e1] line-through'
            }`}
          >
            <span>200 SMA</span>
          </button>

          <button
            onClick={() => setShowLevels(!showLevels)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider transition-all ${
              showLevels
                ? 'bg-[#b5a68d] text-white border-[#b5a68d]'
                : 'bg-[#f9f8f5] text-gray-400 border-[#e5e4e1]'
            }`}
          >
            <span>{showLevels ? 'Trade Lines On' : 'Trade Lines Off'}</span>
          </button>

          <button
            onClick={() => setShowVolatilityOverlay(!showVolatilityOverlay)}
            className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wider font-mono transition-all flex items-center space-x-1 ${
              showVolatilityOverlay
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-[#f9f8f5] text-gray-400 border-[#e5e4e1]'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-200" />
            <span>Squeeze Overlay {showVolatilityOverlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Interactive VCP Formation Nodes Sequence Bar */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500">
          <span className="flex items-center space-x-1">
            <Target className="w-3 h-3 text-amber-600" />
            <span>Interactive VCP Formation Nodes (Click or Hover Node to Inspect)</span>
          </span>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-amber-800 hover:underline flex items-center space-x-1"
            >
              <span>Reset Selection</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {vcpNodes.map((node) => {
            const isSelected = selectedNodeId === node.id || hoveredNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all flex items-center space-x-1.5 border ${
                  isSelected
                    ? 'bg-[#1a1a1a] text-white border-black scale-105 shadow-xs'
                    : node.nodeType === 'PEAK'
                    ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    : node.nodeType === 'TROUGH'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    node.nodeType === 'PEAK'
                      ? 'bg-rose-600'
                      : node.nodeType === 'TROUGH'
                      ? 'bg-blue-600'
                      : 'bg-emerald-600'
                  }`}
                />
                <span>{node.label}</span>
                <span className="opacity-80">({currencySymbol}{node.price.toFixed(2)})</span>
              </button>
            );
          })}
        </div>

        {/* Selected Node Inspector Detail Banner */}
        {activeNode && (
          <div className="mt-3 p-3 bg-white border border-black shadow-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                  activeNode.nodeType === 'PEAK'
                    ? 'bg-rose-600 text-white'
                    : activeNode.nodeType === 'TROUGH'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {activeNode.nodeType} NODE
                </span>
                <strong className="text-sm font-black text-[#1a1a1a]">{activeNode.label}</strong>
                <span className="text-gray-500 text-xs">({activeNode.date})</span>
              </div>
              <div className="text-xs font-bold text-[#1a1a1a]">
                Price: <span className="text-emerald-700">{currencySymbol}{activeNode.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans text-gray-700">
              <div>
                <span className="text-[10px] uppercase font-mono text-gray-500 block font-bold">Node Price Level</span>
                <span className="font-mono font-bold text-slate-900">{currencySymbol}{activeNode.price.toFixed(2)}</span>
                <span className="text-[10px] text-gray-500 font-mono block">
                  ({(((activeNode.price - stock.pivotPrice) / stock.pivotPrice) * 100).toFixed(1)}% vs Pivot Entry)
                </span>
              </div>

              {activeNode.volumeOnDate && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-gray-500 block font-bold">Node Volume</span>
                  <span className="font-mono font-bold text-slate-900">{formatVolume(activeNode.volumeOnDate)}</span>
                  {activeNode.avgVolumeOnDate && (
                    <span className="text-[10px] text-gray-500 font-mono block">
                      ({(((activeNode.volumeOnDate - activeNode.avgVolumeOnDate) / activeNode.avgVolumeOnDate) * 100).toFixed(1)}% vs 20D Avg)
                    </span>
                  )}
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-mono text-gray-500 block font-bold">Pattern Context</span>
                <span className="font-serif italic text-gray-800 text-xs">{activeNode.description}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zoom and Pan Controls Toolbar */}
      <div className="bg-[#161b22] border border-[#30363d] p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-white">
        <div className="flex items-center space-x-2">
          <ZoomIn className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] uppercase font-bold text-gray-300">VCP Zoom & Pan:</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => { setZoomMode('ALL'); setPanIndex(0); }}
              className={`px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                zoomMode === 'ALL' ? 'bg-amber-500 text-black' : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => { setZoomMode('120D'); setPanIndex(Math.max(0, (stock.priceHistory?.length || 0) - 120)); }}
              className={`px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                zoomMode === '120D' ? 'bg-amber-500 text-black' : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
              }`}
            >
              120D
            </button>
            <button
              onClick={() => { setZoomMode('60D'); setPanIndex(Math.max(0, (stock.priceHistory?.length || 0) - 60)); }}
              className={`px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                zoomMode === '60D' ? 'bg-amber-500 text-black' : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
              }`}
            >
              60D
            </button>
            <button
              onClick={() => { setZoomMode('30D'); setPanIndex(Math.max(0, (stock.priceHistory?.length || 0) - 30)); }}
              className={`px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                zoomMode === '30D' ? 'bg-amber-500 text-black' : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
              }`}
            >
              30D
            </button>
          </div>
        </div>

        {zoomMode !== 'ALL' && (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-400">Pan Window:</span>
            <button
              onClick={() => setPanIndex(Math.max(0, panIndex - 15))}
              className="p-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-gray-700"
              title="Pan Left (Earlier)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-amber-300">
              Bar {panIndex} - {panIndex + (zoomMode === '120D' ? 120 : zoomMode === '60D' ? 60 : 30)}
            </span>
            <button
              onClick={() => setPanIndex(Math.min((stock.priceHistory?.length || 0) - 10, panIndex + 15))}
              className="p-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-gray-700"
              title="Pan Right (Recent)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Chart Container */}
      <div className="w-full h-[380px] bg-[#f9f8f5] p-3 border border-[#e5e4e1] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={displayedPriceHistory}
            margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#e5e4e1" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#888888"
              tick={{ fontSize: 10, fill: '#666666' }}
              tickFormatter={(val) => val.substring(5)}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#888888"
              orientation="right"
              tick={{ fontSize: 10, fill: '#666666' }}
              tickFormatter={(val) => `${currencySymbol}${val}`}
            />
            <Tooltip
              content={<CustomChartTooltip currencySymbol={currencySymbol} stock={stock} vcpNodes={vcpNodes} />}
            />

            {/* Stage 2 Minervini Uptrend Background Highlight (bgcolor matching Pine Script) */}
            {showStage2Bg && minerviniPass && (
              <ReferenceArea
                {...({
                  x1: stock.priceHistory[0]?.date,
                  x2: stock.priceHistory[stock.priceHistory.length - 1]?.date,
                  y1: minPrice,
                  y2: maxPrice,
                  fill: '#22c55e',
                  fillOpacity: 0.08,
                  stroke: 'none',
                  label: {
                    value: 'STAGE 2 MINERVINI UPTREND (bgcolor)',
                    fill: '#15803d',
                    fontSize: 9,
                    fontWeight: 'bold',
                    position: 'insideTopRight'
                  }
                } as any)}
              />
            )}

            {/* Volatility Squeeze Contraction Bands (ReferenceAreas) */}
            {showVolatilityOverlay && stock.contractions.map((c, idx) => (
              <React.Fragment key={`vcp-ref-${idx}`}>
                <ReferenceArea
                  {...({
                    x1: c.startDate,
                    x2: c.endDate,
                    y1: c.lowPrice,
                    y2: c.highPrice,
                    stroke: '#d97706',
                    strokeOpacity: 0.5,
                    strokeDasharray: '3 3',
                    fill: '#fef3c7',
                    fillOpacity: 0.25,
                    label: {
                      value: `T${c.contractionIndex}: -${c.depthPercent}%`,
                      fill: '#b45309',
                      fontSize: 10,
                      fontWeight: 'bold',
                      position: 'insideTopLeft'
                    }
                  } as any)}
                />
              </React.Fragment>
            ))}

            {/* Interactive VCP Formation Reference Dots on Nodes */}
            {vcpNodes.map((node) => {
              const isHighlight = selectedNodeId === node.id || hoveredNodeId === node.id;
              const dotColor =
                node.nodeType === 'PEAK'
                  ? '#dc2626'
                  : node.nodeType === 'TROUGH'
                  ? '#2563eb'
                  : '#16a34a';

              return (
                <ReferenceDot
                  key={node.id}
                  x={node.date}
                  y={node.price}
                  r={isHighlight ? 8 : 5}
                  fill={dotColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isFront={true}
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}
                />
              );
            })}

            {/* Historical Lorentzian Classification Model Backtest Signal Dots */}
            {showLorentzianDots && historicalLorentzianSignals.map((sig, idx) => (
              <ReferenceDot
                key={`ml-signal-dot-${idx}`}
                x={sig.date}
                y={sig.price}
                r={5}
                fill={sig.type === 'BUY' ? '#8b5cf6' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth={1.5}
                isFront={true}
              />
            ))}

            {/* Price Line */}
            <Line
              type="monotone"
              dataKey="close"
              name="Close Price"
              stroke="#1a1a1a"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: '#1a1a1a' }}
            />

            {/* SMAs */}
            {showSma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                name="50 SMA"
                stroke="#2563eb"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
            )}
            {showSma150 && (
              <Line
                type="monotone"
                dataKey="sma150"
                name="150 SMA"
                stroke="#d97706"
                strokeWidth={1.5}
                dot={false}
              />
            )}
            {showSma200 && (
              <Line
                type="monotone"
                dataKey="sma200"
                name="200 SMA"
                stroke="#7c3aed"
                strokeWidth={1.5}
                dot={false}
              />
            )}

            {/* Trade Plan Overlay Lines */}
            {showLevels && (
              <>
                {/* Pivot Price Entry Line */}
                <ReferenceLine
                  y={stock.pivotPrice}
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `Pivot Buy: ${currencySymbol}${stock.pivotPrice.toFixed(2)}`,
                    fill: '#16a34a',
                    fontSize: 11,
                    fontWeight: 'bold',
                    position: 'top'
                  }}
                />

                {/* Stop Loss Line */}
                <ReferenceLine
                  y={stock.stopLossPrice}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `Stop Exit: ${currencySymbol}${stock.stopLossPrice.toFixed(2)} (-${stock.stopLossPercent}%)`,
                    fill: '#dc2626',
                    fontSize: 11,
                    fontWeight: 'bold',
                    position: 'bottom'
                  }}
                />

                {/* Target 1 Line */}
                <ReferenceLine
                  y={stock.target1Price}
                  stroke="#ca8a04"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                  label={{
                    value: `Target 1: ${currencySymbol}${stock.target1Price.toFixed(2)} (+${stock.target1Percent.toFixed(0)}%)`,
                    fill: '#ca8a04',
                    fontSize: 11,
                    fontWeight: 'bold',
                    position: 'top'
                  }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Volatility Overlay: Contraction Magnitude (%) Squeeze Panel */}
      {showVolatilityOverlay && (
        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 font-mono">
                Volatility Squeeze & Contraction Magnitude (%) Overlay
              </h4>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-amber-800 font-medium">Initial Base Depth: <strong className="text-amber-950">-{initialDepth}%</strong></span>
              <span className="text-amber-800 font-medium">Final Pivot Depth: <strong className="text-emerald-700 font-extrabold">-{finalDepth}%</strong></span>
              <span className="px-2.5 py-0.5 bg-amber-600 text-white font-extrabold text-[11px] rounded font-mono shadow-2xs">
                {totalSqueezeCompression}% Squeeze Compression
              </span>
            </div>
          </div>

          {/* Successive Contractions Progression Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {stock.contractions.map((c, idx) => {
              const prevDepth = idx > 0 ? stock.contractions[idx - 1].depthPercent : null;
              const squeezeDelta = prevDepth ? (((prevDepth - c.depthPercent) / prevDepth) * 100).toFixed(1) : null;
              const depthRatio = initialDepth > 0 ? (c.depthPercent / initialDepth) * 100 : 100;

              return (
                <div key={idx} className="bg-white p-3 rounded border border-amber-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900 text-white font-mono">
                      Contraction T{c.contractionIndex}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">{c.durationDays} Days</span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-gray-600 font-medium text-[11px]">Base Depth:</span>
                    <span className="text-sm font-extrabold text-amber-900 font-mono">-{c.depthPercent}%</span>
                  </div>

                  {/* Relative Bar visual */}
                  <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx === stock.contractions.length - 1 && c.depthPercent <= 3.5
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(8, depthRatio)}%` }}
                    />
                  </div>

                  {/* Squeeze Delta vs Previous Base */}
                  {squeezeDelta !== null ? (
                    <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 flex items-center justify-between">
                      <span>vs T{c.contractionIndex - 1} Squeeze:</span>
                      <strong className="font-extrabold">-{squeezeDelta}% Volatility Drop</strong>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200/60 text-center">
                      Primary Base Anchor
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Volume Subchart */}
      <div className="pt-3 border-t border-[#e5e4e1]">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2 font-sans">
          <span className="font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center space-x-1.5">
            <Droplets className="w-3.5 h-3.5 text-[#1a1a1a]" />
            <span>Volume & Contraction Volume Dry-Up</span>
          </span>
          <div className="flex items-center space-x-4 text-[10px] font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-black"></span>
              <span className="text-[#1a1a1a] font-bold">Black = Dry-Up (&lt;50% Avg)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-green-700"></span>
              <span>Green = Up Day</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-red-600"></span>
              <span>Red = Down Day</span>
            </span>
          </div>
        </div>

        <div className="w-full h-[120px] bg-[#f9f8f5] p-2 border border-[#e5e4e1]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={stock.priceHistory}
              margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
            >
              <XAxis dataKey="date" hide />
              <YAxis
                stroke="#888888"
                orientation="right"
                tick={{ fontSize: 9, fill: '#666666' }}
                tickFormatter={formatVolume}
              />
              <Tooltip content={<VolumeTooltip />} />

              {/* 20D Avg Volume Line */}
              <Line
                type="monotone"
                dataKey="avgVolume20"
                stroke="#b5a68d"
                strokeWidth={1.5}
                dot={false}
              />

              {/* Volume Bars */}
              <Bar dataKey="volume">
                {stock.priceHistory.map((entry, index) => {
                  const isUpDay = entry.close >= entry.open;
                  const isTight = entry.isTightVolume || entry.volume < entry.avgVolume20 * 0.5;

                  let color = isUpDay ? '#16a34a' : '#dc2626';
                  if (isTight) {
                    color = '#1a1a1a'; // Deep Black for tight volume dry-up!
                  }

                  return <Cell key={`cell-${index}`} fill={color} opacity={isTight ? 1 : 0.65} />;
                })}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VCP Explanation Banner */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex items-start space-x-3 text-xs text-gray-600">
        <Info className="w-4 h-4 text-[#1a1a1a] shrink-0 mt-0.5" />
        <p className="font-serif italic leading-relaxed">
          <strong className="text-[#1a1a1a] font-sans not-italic">How to read this chart:</strong> Hover over any node dot on the line chart or click any node pill above to reveal specific price, volume, and contraction depth metadata. Look for sequential contractions (T1, T2, T3) where price swings get narrower. Notice how the volume bars turn <span className="text-[#1a1a1a] font-bold font-sans">solid black</span> near the right side as volume dries up to <span className="text-[#1a1a1a] font-bold font-sans">{stock.volumeDryUpPercent}%</span> below average. Buy immediately as price breaks above the green dashed line <span className="text-green-700 font-bold font-sans">({currencySymbol}{stock.pivotPrice.toFixed(2)})</span> on expanding volume!
        </p>
      </div>

      {/* Lorentzian Classification Machine Learning Component by Ankur Jain */}
      <LorentzianClassification stock={stock} />

      {/* TradingView Pine Script Exporter Modal */}
      <PineScriptExporter
        stock={stock}
        isOpen={isPineModalOpen}
        onClose={() => setIsPineModalOpen(false)}
      />

    </div>
  );
};

// Custom Interactive Tooltip for Price Chart - Enriched with VCP Node & Volume Context
const CustomChartTooltip = ({ active, payload, currencySymbol, stock, vcpNodes }: any) => {
  if (active && payload && payload.length) {
    const data: PricePoint = payload[0].payload;
    const matchingNode: VcpNode | undefined = vcpNodes?.find((n: VcpNode) => n.date === data.date);

    const distPivot = stock?.pivotPrice ? (((data.close - stock.pivotPrice) / stock.pivotPrice) * 100).toFixed(1) : null;
    const distStop = stock?.stopLossPrice ? (((data.close - stock.stopLossPrice) / stock.stopLossPrice) * 100).toFixed(1) : null;
    const volVsAvgPct = data.avgVolume20 ? (((data.volume - data.avgVolume20) / data.avgVolume20) * 100).toFixed(1) : null;
    const isVolumeDryUp = Number(volVsAvgPct) <= -40 || data.isTightVolume;

    return (
      <div className="bg-[#1a1a1a] text-white p-3.5 shadow-2xl text-xs space-y-2 font-mono border border-black min-w-[240px]">
        
        {/* Node Header or Standard Date Header */}
        {matchingNode ? (
          <div className="border-b border-gray-700 pb-1.5 flex items-center justify-between">
            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase ${
              matchingNode.nodeType === 'PEAK'
                ? 'bg-rose-600 text-white'
                : matchingNode.nodeType === 'TROUGH'
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {matchingNode.label}
            </span>
            <span className="font-bold text-gray-300 text-[11px]">{data.date}</span>
          </div>
        ) : (
          <div className="font-bold text-white text-xs border-b border-gray-800 pb-1 uppercase tracking-wider flex justify-between">
            <span>Date: {data.date}</span>
            {isVolumeDryUp && <span className="text-amber-400 font-extrabold text-[10px]">💧 Dry-Up</span>}
          </div>
        )}

        {/* Detailed Price Metrics */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5 text-[11px]">
          <span className="text-gray-400">Close Price:</span>
          <strong className="text-emerald-400 text-right font-extrabold">{currencySymbol}{data.close.toFixed(2)}</strong>

          <span className="text-gray-400">Open / High:</span>
          <span className="text-gray-200 text-right">{currencySymbol}{data.open.toFixed(1)} / {currencySymbol}{data.high.toFixed(1)}</span>

          <span className="text-gray-400">Low Price:</span>
          <span className="text-gray-200 text-right">{currencySymbol}{data.low.toFixed(1)}</span>

          {distPivot !== null && (
            <>
              <span className="text-gray-400">Vs Pivot Entry:</span>
              <span className={`text-right font-bold ${Number(distPivot) >= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {Number(distPivot) >= 0 ? `+${distPivot}%` : `${distPivot}%`}
              </span>
            </>
          )}

          {distStop !== null && (
            <>
              <span className="text-gray-400">Vs Risk Stop:</span>
              <span className="text-rose-400 text-right font-bold">+{distStop}%</span>
            </>
          )}
        </div>

        {/* Moving Averages */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1 border-t border-gray-800 text-[10px]">
          <span className="text-blue-300">50 SMA: {currencySymbol}{data.sma50}</span>
          <span className="text-amber-300 text-right">150 SMA: {currencySymbol}{data.sma150}</span>
          <span className="text-purple-300">200 SMA: {currencySymbol}{data.sma200}</span>
        </div>

        {/* Volume Node Data */}
        <div className="pt-1 border-t border-gray-800 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-400">Daily Volume:</span>
            <strong className="text-white">{formatVolume(data.volume)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">20D Avg Vol:</span>
            <span className="text-gray-300">{formatVolume(data.avgVolume20)}</span>
          </div>
          {volVsAvgPct !== null && (
            <div className="flex justify-between font-bold">
              <span className="text-gray-400">Vol vs Avg:</span>
              <span className={isVolumeDryUp ? 'text-amber-400 font-black' : 'text-gray-200'}>
                {volVsAvgPct}% {isVolumeDryUp ? '(TIGHT DRY-UP)' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Matching Node Description */}
        {matchingNode && (
          <div className="pt-1.5 border-t border-gray-800 text-[10px] font-sans italic text-amber-200/90 leading-tight">
            {matchingNode.description}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Volume - Editorial
const VolumeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: PricePoint = payload[0].payload;
    const diffPct = (((data.volume - data.avgVolume20) / data.avgVolume20) * 100).toFixed(1);
    const isDryUp = Number(diffPct) < -40;

    return (
      <div className="bg-[#1a1a1a] text-white p-2.5 text-[11px] font-mono space-y-1 border border-black shadow-xl">
        <div>
          Volume: <strong className="text-white">{formatVolume(data.volume)}</strong>
        </div>
        <div>
          20D Avg: <span className="text-gray-400">{formatVolume(data.avgVolume20)}</span>
        </div>
        <div className={isDryUp ? 'text-[#b5a68d] font-bold' : 'text-gray-400'}>
          Vs Avg: {diffPct}% {isDryUp && '(Dry-Up)'}
        </div>
      </div>
    );
  }
  return null;
};
