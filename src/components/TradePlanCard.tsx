import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup } from '../types';
import { calculatePositionSize, calculateBreakoutProbability, formatCurrency, formatVolume, getCurrencySymbol } from '../utils/sepaCalculator';
import { exportTradePlansToCsv } from '../utils/csvExport';
import { Target, ShieldAlert, ArrowUpRight, Droplets, DollarSign, Calculator, Layers, Flame, Zap, Sparkles, TrendingUp, BarChart3, ShieldCheck, FileText, Save, Check, Trash2, Clock, StickyNote, FileSpreadsheet, LogOut, AlertTriangle, ArrowRightCircle, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';

interface TradePlanCardProps {
  stock: MinerviniTradeSetup;
}

export const TradePlanCard: React.FC<TradePlanCardProps> = ({ stock }) => {
  const [accountCapital, setAccountCapital] = useState<number>(50000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0); // 1% account risk default
  const [desiredRRR, setDesiredRRR] = useState<number>(3.0); // User-defined RRR target (e.g. 1:2, 1:3)
  const [customStopPrice, setCustomStopPrice] = useState<number>(stock.stopLossPrice);

  // Exit Strategy Scenario Simulator State
  const [currentTradeStage, setCurrentTradeStage] = useState<'JUST_ENTERED' | 'IN_PROFIT_8' | 'HIT_TARGET1' | 'EXTENDED_30' | 'THREATENED'>('JUST_ENTERED');
  const [customCurrentPrice, setCustomCurrentPrice] = useState<number>(stock.currentPrice);

  useEffect(() => {
    setCustomCurrentPrice(stock.currentPrice);
  }, [stock.currentPrice, stock.ticker]);

  // User Trade Insights & Post-Mortem Notes state with LocalStorage persistence
  const [notes, setNotes] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const currencySymbol = getCurrencySymbol(stock.exchange);

  // Load persisted notes for ticker from LocalStorage on mount or ticker change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sepa_trade_notes_${stock.ticker}`);
      if (saved !== null) {
        setNotes(saved);
        setSavedStatus('Loaded saved insights');
      } else {
        setNotes('');
        setSavedStatus(null);
      }
    } catch (err) {
      console.error('Failed to read notes from localStorage', err);
    }
  }, [stock.ticker]);

  const handleSaveNotes = (textToSave?: string) => {
    const content = textToSave !== undefined ? textToSave : notes;
    try {
      localStorage.setItem(`sepa_trade_notes_${stock.ticker}`, content);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSavedStatus(`Saved at ${timeStr}`);
    } catch (err) {
      console.error('Failed to save notes to localStorage', err);
      setSavedStatus('Error saving');
    }
  };

  const handleClearNotes = () => {
    try {
      localStorage.removeItem(`sepa_trade_notes_${stock.ticker}`);
      setNotes('');
      setSavedStatus('Cleared');
    } catch (err) {
      console.error('Failed to clear notes', err);
    }
  };

  const handleInsertTemplate = () => {
    const template = `• Entry Setup Hypothesis: Tight VCP contraction near ${currencySymbol}${stock.pivotPrice.toFixed(2)} with volume dry-up.
• Risk Management: Stop loss set at ${currencySymbol}${stock.stopLossPrice.toFixed(2)} (-${stock.stopLossPercent}%).
• Post-Mortem Analysis:
  - What went well:
  - Execution Grade: A / B / C
  - Key Lessons:`;

    const newNotes = notes ? `${notes}\n\n${template}` : template;
    setNotes(newNotes);
    handleSaveNotes(newNotes);
  };

  // Breakout Probability Score Calculation
  const breakoutProb = calculateBreakoutProbability(stock);

  // Dynamic Risk-Reward calculations based on Pivot Entry, Target & Stop Loss
  const pivotEntry = stock.pivotPrice;
  const currentStopLoss = customStopPrice > 0 ? customStopPrice : stock.stopLossPrice;
  const riskPerShare = Math.max(0.01, pivotEntry - currentStopLoss);
  const riskPercentFromPivot = ((pivotEntry - currentStopLoss) / pivotEntry) * 100;

  // Computed Target Price based on user-defined RRR
  const computedTargetPriceFromRRR = pivotEntry + (riskPerShare * desiredRRR);
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(computedTargetPriceFromRRR);

  // Sync customTargetPrice when desiredRRR changes via quick buttons
  useEffect(() => {
    setCustomTargetPrice(Number((pivotEntry + (riskPerShare * desiredRRR)).toFixed(2)));
  }, [desiredRRR, pivotEntry, riskPerShare]);

  // Target 1 Dynamic R/R
  const rewardT1 = Math.max(0, stock.target1Price - pivotEntry);
  const dynamicRRRatioT1 = riskPerShare > 0 ? rewardT1 / riskPerShare : 0;

  // Target 2 Dynamic R/R
  const rewardT2 = Math.max(0, stock.target2Price - pivotEntry);
  const dynamicRRRatioT2 = riskPerShare > 0 ? rewardT2 / riskPerShare : 0;

  // Custom Target Dynamic R/R
  const rewardCustom = Math.max(0, customTargetPrice - pivotEntry);
  const dynamicCustomRRRatio = riskPerShare > 0 ? rewardCustom / riskPerShare : 0;

  const posSize = calculatePositionSize(
    accountCapital,
    riskPercent,
    pivotEntry,
    currentStopLoss
  );

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Title Header - Editorial Style */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1a1a1a] text-white flex items-center justify-center font-serif italic font-bold">
            P
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">Execution Protocol</span>
            <h3 className="text-lg font-serif font-black text-[#1a1a1a] leading-tight">
              Trade Execution Plan — {stock.ticker}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportTradePlansToCsv([stock])}
            className="bg-[#f9f8f5] hover:bg-black hover:text-white text-[#1a1a1a] border border-[#e5e4e1] text-[10px] uppercase tracking-[0.15em] px-3 py-1 font-bold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer group"
            title="Export this stock's trade plan parameters & saved insights to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:text-amber-400" />
            <span>Export Plan CSV</span>
          </button>

          {/* Tight Volume Badge */}
          {stock.isTightVolume ? (
            <div className="bg-[#1a1a1a] text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-semibold flex items-center space-x-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-300" />
              <span>Volume Dry-Up ({stock.volumeDryUpPercent}%)</span>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-semibold flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Breakout Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Execution Levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Pivot Entry Price & Buy Zone */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 relative group">
          <div className="absolute top-0 right-0 bg-[#1a1a1a] text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-semibold">
            Pivot
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d] flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#1a1a1a]" />
            <span>Pivot Entry</span>
          </p>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-3xl font-mono font-bold text-[#1a1a1a]">
              {formatCurrency(stock.pivotPrice, currencySymbol)}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-gray-500 border-t border-[#e5e4e1] pt-2 font-mono">
            Buy Zone: <strong className="text-[#1a1a1a]">{formatCurrency(stock.pivotPrice, currencySymbol)} - {formatCurrency(stock.buyZoneMax, currencySymbol)}</strong>
          </div>
        </div>

        {/* 2. Stop Loss Exit Price */}
        <div className="bg-red-50/40 border border-red-200 p-4 relative group">
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-semibold">
            Tight Stop
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-700 flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Exit Stop Loss</span>
          </p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-bold text-red-600">
              {formatCurrency(stock.stopLossPrice, currencySymbol)}
            </span>
            <span className="text-xs font-bold text-red-700 font-mono">
              (-{stock.stopLossPercent}%)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-red-700/80 border-t border-red-200 pt-2 font-mono">
            Risk Per Share: <strong>{formatCurrency(stock.pivotPrice - stock.stopLossPrice, currencySymbol)}</strong>
          </div>
        </div>

        {/* 3. Profit Target 1 (3:1 R/R) */}
        <div className="bg-emerald-50/40 border border-emerald-200 p-4 relative group">
          <div className="absolute top-0 right-0 bg-emerald-800 text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-semibold">
            Target 1 (R/R {dynamicRRRatioT1.toFixed(1)}:1)
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-800 flex items-center space-x-1">
            <Target className="w-3.5 h-3.5" />
            <span>Profit Target 1</span>
          </p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-bold text-emerald-800">
              {formatCurrency(stock.target1Price, currencySymbol)}
            </span>
            <span className="text-xs font-bold text-emerald-800 font-mono">
              (+{stock.target1Percent}%)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-800/80 border-t border-emerald-200 pt-2 font-mono flex justify-between">
            <span>Dynamic R/R Ratio:</span>
            <strong className="text-emerald-900 font-extrabold">{dynamicRRRatioT1.toFixed(2)} : 1</strong>
          </div>
        </div>

        {/* 4. Profit Target 2 (Extended / Runner) */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 relative group">
          <div className="absolute top-0 right-0 bg-[#1a1a1a] text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-semibold">
            Extended (R/R {dynamicRRRatioT2.toFixed(1)}:1)
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d] flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-[#1a1a1a]" />
            <span>Target 2 (Runner)</span>
          </p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-bold text-[#1a1a1a]">
              {formatCurrency(stock.target2Price, currencySymbol)}
            </span>
            <span className="text-xs font-bold text-gray-600 font-mono">
              (+{stock.target2Percent}%)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-gray-500 border-t border-[#e5e4e1] pt-2 font-mono flex justify-between">
            <span>Dynamic R/R Ratio:</span>
            <strong className="text-[#1a1a1a] font-extrabold">{dynamicRRRatioT2.toFixed(2)} : 1</strong>
          </div>
        </div>

      </div>

      {/* Dynamic Risk-Reward Ratio Engine & User-Defined RRR Target Calculator */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-[#1a1a1a]" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              Risk-Reward Ratio (RRR) Target Calculator & Engine
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-extrabold ${
              dynamicCustomRRRatio >= 5.0
                ? 'bg-emerald-600 text-white'
                : dynamicCustomRRRatio >= 3.0
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : dynamicCustomRRRatio >= 2.0
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}>
              {dynamicCustomRRRatio >= 5.0
                ? '🚀 CHAMPION GRADE (>= 5:1)'
                : dynamicCustomRRRatio >= 3.0
                ? '🟢 MINERVINI STANDARD (>= 3:1)'
                : dynamicCustomRRRatio >= 2.0
                ? '🟡 ACCEPTABLE MINIMUM (>= 2:1)'
                : '🔴 SUBPAR RISK-REWARD (< 2:1)'}
            </span>
          </div>
        </div>

        {/* Quick RRR Preset Buttons */}
        <div className="space-y-2 bg-white p-4 border border-[#e5e4e1]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b5a68d]">
              Select Desired Risk-Reward Ratio (RRR) Preset:
            </span>
            <span className="text-xs font-mono font-bold text-[#1a1a1a]">
              Active Ratio: 1 : {desiredRRR.toFixed(1)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
            {[1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setDesiredRRR(ratio)}
                className={`py-2 px-3 border font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  desiredRRR === ratio
                    ? 'bg-[#1a1a1a] text-white border-black shadow-sm'
                    : 'bg-[#f9f8f5] text-slate-800 border-[#e5e4e1] hover:bg-gray-100'
                }`}
              >
                <span className="text-[10px] text-gray-400 uppercase">Target RRR</span>
                <span className="text-sm">1 : {ratio}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-gray-500 whitespace-nowrap">Custom RRR:</span>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.25"
                value={desiredRRR}
                onChange={(e) => setDesiredRRR(Number(e.target.value))}
                className="w-48 accent-[#1a1a1a] cursor-pointer"
              />
              <span className="font-bold text-slate-900 bg-[#f9f8f5] px-2 py-0.5 border border-[#e5e4e1]">
                1:{desiredRRR.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-3 py-1 border border-emerald-200">
              Computed Target Price: <span className="text-sm font-black font-mono">{formatCurrency(pivotEntry + (riskPerShare * desiredRRR), currencySymbol)}</span> (+{(((pivotEntry + (riskPerShare * desiredRRR) - pivotEntry) / pivotEntry) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Dynamic Inputs & Live Calculation Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          
          {/* Custom Target Price Input */}
          <div className="bg-white p-3 border border-[#e5e4e1] space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 block">
              Adjust Target Price ({currencySymbol}):
            </label>
            <input
              type="number"
              step="0.10"
              value={customTargetPrice}
              onChange={(e) => setCustomTargetPrice(Number(e.target.value) || stock.target1Price)}
              className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-1.5 font-bold text-slate-900 text-sm focus:outline-none focus:border-slate-800"
            />
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Target Gain:</span>
              <span className="font-bold text-emerald-700">
                +{(((customTargetPrice - pivotEntry) / pivotEntry) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Custom Stop Loss Price Input */}
          <div className="bg-white p-3 border border-[#e5e4e1] space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 block">
              Adjust Stop Loss ({currencySymbol}):
            </label>
            <input
              type="number"
              step="0.10"
              value={customStopPrice}
              onChange={(e) => setCustomStopPrice(Number(e.target.value) || stock.stopLossPrice)}
              className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-1.5 font-bold text-red-600 text-sm focus:outline-none focus:border-slate-800"
            />
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Risk Per Share:</span>
              <span className="font-bold text-red-600">
                -{riskPercentFromPivot.toFixed(1)}% ({formatCurrency(riskPerShare, currencySymbol)})
              </span>
            </div>
          </div>

          {/* Calculated Dynamic R/R Ratio Display */}
          <div className="bg-[#1a1a1a] text-white p-3 border border-black flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#b5a68d] font-bold">
              Dynamic Risk-Reward Ratio:
            </span>
            <div className="text-3xl font-bold font-mono text-emerald-400 my-1">
              {dynamicCustomRRRatio.toFixed(2)} : 1
            </div>
            <p className="text-[10px] text-gray-400 leading-tight font-sans">
              Expected Reward: <strong className="text-white">{formatCurrency(rewardCustom, currencySymbol)}</strong> vs Risk: <strong className="text-red-400">{formatCurrency(riskPerShare, currencySymbol)}</strong> per share.
            </p>
          </div>

        </div>

        {/* Visual Progress / Ratio Comparison Bar */}
        <div className="space-y-1.5 pt-1 font-mono text-xs">
          <div className="flex justify-between text-[11px]">
            <span className="text-red-700 font-bold">Risk (1.0 Unit = {formatCurrency(riskPerShare, currencySymbol)})</span>
            <span className="text-emerald-700 font-bold">Reward ({dynamicCustomRRRatio.toFixed(2)} Units = {formatCurrency(rewardCustom, currencySymbol)})</span>
          </div>
          <div className="w-full bg-gray-200 h-3 flex overflow-hidden rounded">
            <div className="bg-red-600 h-full text-[9px] text-white font-bold flex items-center justify-center" style={{ width: `${Math.min(30, (1 / (1 + dynamicCustomRRRatio)) * 100)}%` }}>
              1R
            </div>
            <div className="bg-emerald-600 h-full text-[9px] text-white font-bold flex items-center justify-center transition-all duration-300" style={{ width: `${Math.max(70, (dynamicCustomRRRatio / (1 + dynamicCustomRRRatio)) * 100)}%` }}>
              {dynamicCustomRRRatio.toFixed(1)}R
            </div>
          </div>
        </div>
      </div>

      {/* Volume Contraction Analysis Box */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-[#1a1a1a]" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              VCP Contraction Contractions & Volume Contraction Timeline
            </h4>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            Pivot Vol: <span className="text-[#1a1a1a] font-bold">{formatVolume(stock.pivotVolume)}</span> vs 20D Avg: <span className="text-gray-700 font-bold">{formatVolume(stock.avgVolume20d)}</span>
          </div>
        </div>

        {/* Contraction Steps Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stock.contractions.map((c) => (
            <div
              key={c.contractionIndex}
              className="bg-white border border-[#e5e4e1] p-3 text-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif italic font-bold text-[#1a1a1a]">
                  Contraction T{c.contractionIndex}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {c.durationDays} Days
                </span>
              </div>
              <div className="my-2 flex items-baseline space-x-2">
                <span className="text-xl font-serif font-black text-[#1a1a1a]">
                  -{c.depthPercent}%
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Depth</span>
              </div>
              <div className="text-[10px] text-gray-500 border-t border-[#e5e4e1] pt-1.5 flex justify-between font-mono">
                <span>Vol Dry-up:</span>
                <strong className={c.volumeDryUpPercent < -50 ? 'text-cyan-800 font-bold' : 'text-gray-700'}>
                  {c.volumeDryUpPercent}%
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position Sizing Calculator Module */}
      <div className="bg-white border border-[#e5e4e1] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-[#1a1a1a]" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              Minervini Position Sizing Calculator (1% - 2% Account Risk Rule)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-gray-500">
            Account Risk Cap: <strong className="text-red-600">{formatCurrency(posSize.riskAmount, currencySymbol)}</strong>
          </span>
        </div>

        {/* Capital Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b5a68d] mr-1">
            Quick Capital Presets:
          </span>
          {[10000, 25000, 50000, 100000, 250000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAccountCapital(preset)}
              className={`px-2.5 py-1 text-[11px] font-bold border transition ${
                accountCapital === preset
                  ? 'bg-[#1a1a1a] text-white border-black'
                  : 'bg-[#f9f8f5] text-slate-800 border-[#e5e4e1] hover:bg-gray-200'
              }`}
            >
              {formatCurrency(preset, currencySymbol, 0)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          
          {/* Inputs Column */}
          <div className="space-y-3 bg-[#f9f8f5] p-4 border border-[#e5e4e1]">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#b5a68d] mb-1">
                Total Portfolio Capital ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-500 font-mono text-xs">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={accountCapital}
                  onChange={(e) => setAccountCapital(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-[#e5e4e1] rounded-none pl-7 pr-3 py-1.5 text-[#1a1a1a] font-mono text-xs font-bold focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#b5a68d]">
                  Risk Per Trade (%)
                </label>
                <span className="font-mono text-[#1a1a1a] font-extrabold bg-white px-2 py-0.5 border border-[#e5e4e1] text-[11px]">
                  {riskPercent.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="2.5"
                step="0.25"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full accent-[#1a1a1a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
                <span>0.25% (Conservative)</span>
                <span>1.0% (Standard)</span>
                <span>2.5% (Max Champion)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5e4e1] text-[11px] font-mono space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Entry Price:</span>
                <strong className="text-slate-900">{formatCurrency(pivotEntry, currencySymbol)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Stop Loss Price:</span>
                <strong className="text-red-600">{formatCurrency(currentStopLoss, currencySymbol)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Distance to Stop:</span>
                <strong className="text-red-600">-{riskPercentFromPivot.toFixed(2)}%</strong>
              </div>
            </div>
          </div>

          {/* Capital Risk Breakdown */}
          <div className="bg-[#f9f8f5] p-4 border border-[#e5e4e1] flex flex-col justify-between space-y-3 font-mono">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-bold">
                Max Dollar Risk Allowed ({riskPercent}%):
              </span>
              <span className="text-2xl font-bold text-red-600 block mt-1">
                {formatCurrency(posSize.riskAmount, currencySymbol)}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-bold">
                Risk Per Share:
              </span>
              <span className="text-sm font-bold text-[#1a1a1a] block">
                {formatCurrency(posSize.riskPerShare, currencySymbol)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#e5e4e1]">
              <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-bold">
                Portfolio Allocation:
              </span>
              <span className="text-sm font-bold text-slate-900">
                {posSize.portfolioAllocationPercent.toFixed(1)}% of Capital
              </span>
              {posSize.portfolioAllocationPercent > 25 && (
                <div className="mt-1 text-[10px] text-amber-900 bg-amber-100 p-1.5 rounded font-sans border border-amber-300">
                  ⚠️ <strong>Over-allocation Notice:</strong> Minervini rules suggest capping any single position at 20%-25% maximum of total equity.
                </div>
              )}
            </div>
          </div>

          {/* Exact Shares & Pyramiding Execution */}
          <div className="bg-[#1a1a1a] text-white p-4 border border-black flex flex-col justify-between space-y-3 font-mono">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d] block">
                Calculated Share Quantity:
              </span>
              <span className="text-3xl font-bold text-emerald-400 mt-1 block">
                {posSize.shareQuantity.toLocaleString()} <span className="text-xs font-normal text-gray-300">shares</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-800 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Position Capital:</span>
                <strong className="text-white">{formatCurrency(posSize.totalPositionCost, currencySymbol)}</strong>
              </div>

              {/* Minervini Pyramid Plan (50% Pilot, 25% Add, 25% Add) */}
              <div className="bg-gray-900/80 p-2 rounded border border-gray-800 text-[10px] space-y-1 font-sans">
                <span className="font-bold text-[#b5a68d] block font-mono">Pyramid Sizing Execution:</span>
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>• Pilot Entry (50%):</span>
                  <strong className="text-emerald-400">{Math.floor(posSize.shareQuantity * 0.5).toLocaleString()} sh</strong>
                </div>
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>• Add #1 at +2% (25%):</span>
                  <strong className="text-white">{Math.floor(posSize.shareQuantity * 0.25).toLocaleString()} sh</strong>
                </div>
                <div className="flex justify-between text-gray-300 font-mono">
                  <span>• Add #2 at +4% (25%):</span>
                  <strong className="text-white">{Math.floor(posSize.shareQuantity * 0.25).toLocaleString()} sh</strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Estimated Breakout Probability Score Module */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              Estimated Breakout Probability Engine
            </h4>
          </div>
          <span className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-extrabold uppercase ${
            breakoutProb.score >= 88
              ? 'bg-emerald-600 text-white'
              : breakoutProb.score >= 75
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            {breakoutProb.rating}
          </span>
        </div>

        {/* Big Meter & Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Main Score Gauge */}
          <div className="lg:col-span-4 bg-white p-4 border border-[#e5e4e1] flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">
              Breakout Probability Score
            </span>
            <div className="relative flex items-center justify-center">
              <div className="text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                {breakoutProb.score}<span className="text-xl text-amber-600">%</span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  breakoutProb.score >= 88
                    ? 'bg-emerald-600'
                    : breakoutProb.score >= 75
                    ? 'bg-emerald-500'
                    : breakoutProb.score >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${breakoutProb.score}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 font-sans leading-tight">
              Calculated based on VCP final tightness, volume dry-up, RS percentile & Trend Template rules.
            </p>
          </div>

          {/* 4 Factor Cards Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            
            {/* Factor 1: VCP Tightness */}
            <div className="bg-white p-3 border border-[#e5e4e1] space-y-1">
              <div className="flex justify-between items-center text-gray-500 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>VCP Tightness</span>
                </span>
                <strong className="text-slate-900">{breakoutProb.vcpTightnessScore} / 35 pts</strong>
              </div>
              <div className="text-sm font-bold text-slate-900">
                -{breakoutProb.factors.finalContractionDepth}% Final Depth
              </div>
              <div className="text-[10px] text-gray-500">
                Squeeze Compression: <strong className="text-emerald-700">-{breakoutProb.factors.squeezeCompressionPercent}%</strong> reduction from T1 base.
              </div>
            </div>

            {/* Factor 2: Volume Dry-up */}
            <div className="bg-white p-3 border border-[#e5e4e1] space-y-1">
              <div className="flex justify-between items-center text-gray-500 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <Droplets className="w-3 h-3 text-cyan-600" />
                  <span>Volume Dry-Up Trend</span>
                </span>
                <strong className="text-slate-900">{breakoutProb.volumeDryUpScore} / 30 pts</strong>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {breakoutProb.factors.volumeDryUpPercent}% vs 20d Avg
              </div>
              <div className="text-[10px] text-gray-500">
                Status: <strong className={stock.isTightVolume ? "text-cyan-700 font-bold" : "text-gray-700"}>
                  {stock.isTightVolume ? '💧 Tight Volume Confirmed' : 'Standard Contraction'}
                </strong>
              </div>
            </div>

            {/* Factor 3: Relative Strength */}
            <div className="bg-white p-3 border border-[#e5e4e1] space-y-1">
              <div className="flex justify-between items-center text-gray-500 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>RS Leadership</span>
                </span>
                <strong className="text-slate-900">{breakoutProb.rsLeadershipScore} / 20 pts</strong>
              </div>
              <div className="text-sm font-bold text-slate-900">
                RS {breakoutProb.factors.rsRating} Percentile
              </div>
              <div className="text-[10px] text-gray-500">
                {breakoutProb.factors.rsRating >= 90 ? '🔥 Top 10% Market Leader' : 'Solid Relative Strength'}
              </div>
            </div>

            {/* Factor 4: Trend Alignment */}
            <div className="bg-white p-3 border border-[#e5e4e1] space-y-1">
              <div className="flex justify-between items-center text-gray-500 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>SEPA Trend Rules</span>
                </span>
                <strong className="text-slate-900">{breakoutProb.trendAlignmentScore} / 15 pts</strong>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {breakoutProb.factors.trendScore} / 8 Rules Passed
              </div>
              <div className="text-[10px] text-gray-500">
                Moving Averages Stage 2 Uptrend Alignment
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Upcoming Earnings Release & Minervini Gap Risk Warning */}
      {stock.nextEarningsDate && (
        <div className={`p-4 rounded-lg border text-xs flex items-start space-x-3 ${
          stock.daysToEarnings !== undefined && stock.daysToEarnings <= 5
            ? 'bg-red-50 border-red-300 text-red-900'
            : stock.daysToEarnings !== undefined && stock.daysToEarnings <= 14
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <div className="p-2 rounded bg-white shadow-xs shrink-0 font-extrabold text-xs">
            {stock.daysToEarnings !== undefined && stock.daysToEarnings <= 5 ? '🔴 HAZARD' : stock.daysToEarnings !== undefined && stock.daysToEarnings <= 14 ? '🟡 CAUTION' : '🟢 SAFE'}
          </div>
          <div className="space-y-1">
            <div className="font-bold text-sm flex items-center space-x-2">
              <span>Next Earnings Release: {stock.nextEarningsDate} ({stock.earningsTime || 'AMC'})</span>
              <span className="px-2 py-0.5 rounded bg-white/80 font-mono text-[11px] font-extrabold">
                {stock.daysToEarnings !== undefined && stock.daysToEarnings < 0
                  ? `Reported ${Math.abs(stock.daysToEarnings)}d Ago`
                  : stock.daysToEarnings === 0
                  ? 'TODAY'
                  : `In ${stock.daysToEarnings} Days`}
              </span>
            </div>
            <p className="leading-relaxed">
              <strong>Minervini SEPA Earnings Guard:</strong>{' '}
              {stock.daysToEarnings !== undefined && stock.daysToEarnings <= 5
                ? 'High danger of overnight gap volatility. Minervini rule forbids new pivot purchases <5 days before earnings unless you already hold a >10% profit cushion.'
                : stock.daysToEarnings !== undefined && stock.daysToEarnings <= 14
                ? 'Quarterly report approaching in 1 to 2 weeks. Maintain tight stop loss management and lock partial profits quickly if breakout surges.'
                : 'Earnings report is comfortably far in the future. Safe window to trade the VCP breakout pattern.'}
            </p>
          </div>
        </div>
      )}

      {/* Mark Minervini SEPA Exit Strategy & Sell Rules Matrix */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <LogOut className="w-4 h-4 text-purple-700" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              Mark Minervini SEPA Exit Strategy & Selling Rules Protocol
            </h4>
          </div>
          <span className="text-[10px] font-mono text-purple-900 bg-purple-100 border border-purple-300 font-bold px-2.5 py-0.5 uppercase">
            Capital Preservation & Profit Locking Rules
          </span>
        </div>

        {/* 4 Pillars of Minervini Exit Strategy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          
          {/* Pillar 1: Initial Hard Stop Loss */}
          <div className="bg-white border border-rose-200 p-4 space-y-2 relative group hover:border-rose-400 transition-all shadow-2xs">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>1. Initial Hard Stop</span>
              </span>
              <span className="text-[10px] font-bold text-rose-900 bg-rose-50 px-1.5 py-0.5 border border-rose-200">
                MAX -{riskPercentFromPivot.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Hard Exit Price:</span>
              <span className="text-2xl font-black text-rose-700 font-mono">
                {formatCurrency(currentStopLoss, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-sans leading-tight pt-1 border-t border-rose-100">
              <strong>Non-Negotiable Rule:</strong> Cut loss immediately if price hits this level. Maximum total account loss capped at <strong className="text-rose-700">{formatCurrency(posSize.riskAmount, currencySymbol)}</strong>.
            </p>
          </div>

          {/* Pillar 2: Breakeven Stop Adjustment */}
          <div className="bg-white border border-blue-200 p-4 space-y-2 relative group hover:border-blue-400 transition-all shadow-2xs">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Breakeven Backstop</span>
              </span>
              <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                +8% to +10% Gain
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Move Stop to Pivot:</span>
              <span className="text-2xl font-black text-blue-800 font-mono">
                {formatCurrency(pivotEntry, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-sans leading-tight pt-1 border-t border-blue-100">
              <strong>Risk-Free Trigger:</strong> When stock advances to <strong className="text-blue-800">{formatCurrency(pivotEntry * 1.08, currencySymbol)} (+8%)</strong>, automatically raise stop loss to entry price. Never let a good gain turn into a loss.
            </p>
          </div>

          {/* Pillar 3: Partial Profit Scale-Out */}
          <div className="bg-white border border-emerald-200 p-4 space-y-2 relative group hover:border-emerald-400 transition-all shadow-2xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Scale Out 50%</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                Target 1 (+{stock.target1Percent}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Sell Half ({Math.floor(posSize.shareQuantity * 0.5).toLocaleString()} sh) at:</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {formatCurrency(stock.target1Price, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-sans leading-tight pt-1 border-t border-emerald-100">
              <strong>Sell Into Strength:</strong> Lock in <strong className="text-emerald-700">{formatCurrency((stock.target1Price - pivotEntry) * Math.floor(posSize.shareQuantity * 0.5), currencySymbol)}</strong> realized profit on half position.
            </p>
          </div>

          {/* Pillar 4: Trailing Stop Runner */}
          <div className="bg-white border border-purple-200 p-4 space-y-2 relative group hover:border-purple-400 transition-all shadow-2xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                <span>4. Trailing Runner (50%)</span>
              </span>
              <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-1.5 py-0.5 border border-purple-200">
                20D SMA Trail
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Estimated 20d SMA Level:</span>
              <span className="text-2xl font-black text-purple-900 font-mono">
                {formatCurrency(stock.sma50 ? stock.sma50 : pivotEntry * 1.03, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-sans leading-tight pt-1 border-t border-purple-100">
              <strong>Let Winners Run:</strong> Trail remaining 50% shares along the 20-day SMA or 10-day EMA until a decisive close below moving average.
            </p>
          </div>

        </div>

        {/* Interactive Exit Strategy Scenario Simulator */}
        <div className="bg-white border border-[#e5e4e1] p-4 space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-700" />
              <span className="text-xs font-bold uppercase text-[#1a1a1a]">
                Interactive Trade State Scenario Simulator ({stock.ticker})
              </span>
            </div>
            <span className="text-[10px] text-gray-500">
              Select current trade stage to generate instant execution instructions
            </span>
          </div>

          {/* Trade Stage Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setCurrentTradeStage('JUST_ENTERED')}
              className={`p-2 border uppercase cursor-pointer text-center transition-all ${
                currentTradeStage === 'JUST_ENTERED'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-[#f9f8f5] text-slate-700 border-[#e5e4e1] hover:bg-slate-200'
              }`}
            >
              1. Just Entered at Pivot
            </button>
            <button
              type="button"
              onClick={() => setCurrentTradeStage('IN_PROFIT_8')}
              className={`p-2 border uppercase cursor-pointer text-center transition-all ${
                currentTradeStage === 'IN_PROFIT_8'
                  ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                  : 'bg-[#f9f8f5] text-blue-900 border-[#e5e4e1] hover:bg-blue-100'
              }`}
            >
              2. In Profit (+8% to +10%)
            </button>
            <button
              type="button"
              onClick={() => setCurrentTradeStage('HIT_TARGET1')}
              className={`p-2 border uppercase cursor-pointer text-center transition-all ${
                currentTradeStage === 'HIT_TARGET1'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-[#f9f8f5] text-emerald-900 border-[#e5e4e1] hover:bg-emerald-100'
              }`}
            >
              3. Hit Target 1 (+15%-20%)
            </button>
            <button
              type="button"
              onClick={() => setCurrentTradeStage('EXTENDED_30')}
              className={`p-2 border uppercase cursor-pointer text-center transition-all ${
                currentTradeStage === 'EXTENDED_30'
                  ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                  : 'bg-[#f9f8f5] text-purple-900 border-[#e5e4e1] hover:bg-purple-100'
              }`}
            >
              4. Extended / Climax (+30%+)
            </button>
            <button
              type="button"
              onClick={() => setCurrentTradeStage('THREATENED')}
              className={`p-2 border uppercase cursor-pointer text-center transition-all ${
                currentTradeStage === 'THREATENED'
                  ? 'bg-rose-800 text-white border-rose-800 shadow-xs'
                  : 'bg-[#f9f8f5] text-rose-900 border-[#e5e4e1] hover:bg-rose-100'
              }`}
            >
              5. Threatened / Pullback
            </button>
          </div>

          {/* Dynamic Step-by-Step Action Guidance Box */}
          <div className="p-3.5 bg-[#f9f8f5] border border-[#e5e4e1] text-xs font-sans space-y-2">
            {currentTradeStage === 'JUST_ENTERED' && (
              <div className="space-y-1">
                <div className="font-bold font-mono text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <ArrowRightCircle className="w-4 h-4 text-slate-700" />
                  <span>Protocol: Initial Position Protection</span>
                </div>
                <p className="text-gray-700 text-xs">
                  • Place hard GTC stop loss order at <strong className="font-mono text-rose-700 font-bold">{formatCurrency(currentStopLoss, currencySymbol)} (-{riskPercentFromPivot.toFixed(1)}%)</strong> with your broker immediately upon execution.
                  <br />
                  • If breakout fails within 2-3 days without volume follow-through, prepare to scratch the trade near breakeven.
                </p>
              </div>
            )}

            {currentTradeStage === 'IN_PROFIT_8' && (
              <div className="space-y-1">
                <div className="font-bold font-mono text-blue-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <ArrowRightCircle className="w-4 h-4 text-blue-700" />
                  <span>Protocol: Raise Stop to Breakeven (Backstop Rule)</span>
                </div>
                <p className="text-gray-700 text-xs">
                  • Stock has reached <strong className="font-mono text-blue-800 font-bold">{formatCurrency(pivotEntry * 1.08, currencySymbol)} (+8.0%)</strong>. Raise your hard stop loss order to <strong className="font-mono text-slate-900 font-bold">{formatCurrency(pivotEntry, currencySymbol)}</strong>.
                  <br />
                  • This converts {stock.ticker} into a <strong>zero-risk trade</strong>. You can no longer lose principal capital.
                </p>
              </div>
            )}

            {currentTradeStage === 'HIT_TARGET1' && (
              <div className="space-y-1">
                <div className="font-bold font-mono text-emerald-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <ArrowRightCircle className="w-4 h-4 text-emerald-700" />
                  <span>Protocol: Scale Out 50% Profit & Trail Runner</span>
                </div>
                <p className="text-gray-700 text-xs">
                  • Stock hit Target 1 at <strong className="font-mono text-emerald-800 font-bold">{formatCurrency(stock.target1Price, currencySymbol)} (+{stock.target1Percent}%)</strong>. Sell <strong className="font-mono font-bold text-emerald-800">{Math.floor(posSize.shareQuantity * 0.5).toLocaleString()} shares</strong> into strength.
                  <br />
                  • Move stop loss on remaining <strong className="font-mono font-bold text-slate-900">{Math.ceil(posSize.shareQuantity * 0.5).toLocaleString()} shares</strong> to the 10-day EMA or 20-day SMA to ride the trend.
                </p>
              </div>
            )}

            {currentTradeStage === 'EXTENDED_30' && (
              <div className="space-y-1">
                <div className="font-bold font-mono text-purple-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <ArrowRightCircle className="w-4 h-4 text-purple-700" />
                  <span>Protocol: Climax Top / Parabolic Exit Signal</span>
                </div>
                <p className="text-gray-700 text-xs">
                  • Stock is up <strong className="font-mono text-purple-900 font-bold">+{stock.target2Percent}%+</strong> from pivot entry. Look for climax sell signals: 3-5 consecutive exhaustion gap-ups, widest daily spread bar, or heavy volume reversal bar.
                  <br />
                  • Tighten trailing stop aggressively to the 10-day EMA or previous day's low to lock in maximum capital gains.
                </p>
              </div>
            )}

            {currentTradeStage === 'THREATENED' && (
              <div className="space-y-1">
                <div className="font-bold font-mono text-rose-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>Protocol: Pullback Defense & 50-Day Moving Average Rule</span>
                </div>
                <p className="text-gray-700 text-xs">
                  • If price drops toward <strong className="font-mono text-rose-700 font-bold">{formatCurrency(currentStopLoss, currencySymbol)}</strong>, honor your stop loss with zero hesitation or emotion.
                  <br />
                  • <strong>50-day SMA Breakdown:</strong> If price breaks below 50d SMA on volume &gt;150% above average, exit entire position immediately.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade Insights & Post-Mortem Notes (Saved to Local Storage) */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#1a1a1a]" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              Trader Insights & Post-Mortem Journal ({stock.ticker})
            </h4>
          </div>
          <div className="flex items-center space-x-2 font-mono text-xs">
            {savedStatus && (
              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200 text-[10px] font-bold flex items-center space-x-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>{savedStatus}</span>
              </span>
            )}
            <button
              onClick={handleInsertTemplate}
              type="button"
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer"
            >
              <StickyNote className="w-3 h-3 text-amber-700" />
              <span>+ Post-Mortem Template</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              handleSaveNotes(e.target.value);
            }}
            placeholder={`Record your trade setup rationale, key catalyst observations, or post-mortem lessons for ${stock.ticker} here... (Auto-saved to local storage)`}
            rows={5}
            className="w-full bg-white border border-[#e5e4e1] p-3 font-mono text-xs text-[#1a1a1a] focus:border-black focus:outline-none placeholder:text-gray-400 placeholder:font-sans"
          />

          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-500 pt-1">
            <span className="italic font-sans">
              Notes are automatically persisted in your browser's local storage specifically for <strong className="font-mono text-[#1a1a1a]">{stock.ticker}</strong>.
            </span>
            <div className="flex items-center space-x-2">
              {notes && (
                <button
                  type="button"
                  onClick={handleClearNotes}
                  className="text-red-600 hover:text-red-800 text-[10px] uppercase font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Notes</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSaveNotes()}
                className="bg-[#1a1a1a] hover:bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3 h-3 text-emerald-400" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

