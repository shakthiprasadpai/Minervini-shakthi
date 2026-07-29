import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  ShieldAlert,
  Target,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRightCircle,
  Zap,
  Flame,
  HelpCircle,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  Activity,
  Award,
  Layers,
  Clock
} from 'lucide-react';

interface ExitSignalsProps {
  stock: MinerviniTradeSetup;
}

export const ExitSignals: React.FC<ExitSignalsProps> = ({ stock }) => {
  const currencySymbol = getCurrencySymbol(stock.exchange);
  const [testPrice, setTestPrice] = useState<number>(stock.currentPrice);

  const pivotEntry = stock.pivotPrice;
  const stopLoss = stock.stopLossPrice;
  const target1 = stock.target1Price;
  const target2 = stock.target2Price;
  const breakevenTrigger = Number((pivotEntry * 1.08).toFixed(2)); // +8% gain trigger

  // Gain/Loss percent calculations relative to pivot entry
  const currentGainPercent = ((stock.currentPrice - pivotEntry) / pivotEntry) * 100;
  const testGainPercent = ((testPrice - pivotEntry) / pivotEntry) * 100;

  // Determine current active status signal
  const getExitStatus = (price: number) => {
    const gainPct = ((price - pivotEntry) / pivotEntry) * 100;
    if (price <= stopLoss) {
      return {
        badge: '🔴 HARD STOP LOSS EXECUTED',
        badgeBg: 'bg-rose-950 text-white border-rose-600',
        cardBg: 'bg-rose-50/80 border-rose-300',
        actionTitle: 'ACTION: CUT LOSS IMMEDIATELY',
        actionColor: 'text-rose-700',
        detail: `Price (${formatCurrency(price, currencySymbol)}) has breached your maximum risk threshold of ${formatCurrency(stopLoss, currencySymbol)} (-${stock.stopLossPercent}%). Cut the loss with zero hesitation. Capital preservation is priority #1.`,
        suggestedSharesToSellPct: 100,
        stopLevelStr: formatCurrency(stopLoss, currencySymbol)
      };
    } else if (price < pivotEntry) {
      return {
        badge: '🟡 BELOW PIVOT ENTRY (SHAKEOUT WATCH)',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-600',
        cardBg: 'bg-amber-50/80 border-amber-300',
        actionTitle: 'ACTION: HOLD INITIAL TIGHT STOP',
        actionColor: 'text-amber-800',
        detail: `Price is pulling back below the pivot entry (${formatCurrency(pivotEntry, currencySymbol)}). Maintain your hard stop loss at ${formatCurrency(stopLoss, currencySymbol)}. If volume expands heavily on the decline or time stop passes (3 days), cut early.`,
        suggestedSharesToSellPct: 0,
        stopLevelStr: formatCurrency(stopLoss, currencySymbol)
      };
    } else if (gainPct < 8) {
      return {
        badge: '🟢 IN TRADE — MONITORING FOLLOW-THROUGH',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-600',
        cardBg: 'bg-emerald-50/60 border-emerald-300',
        actionTitle: 'ACTION: HOLD POSITION (INITIAL STOP ACTIVE)',
        actionColor: 'text-emerald-800',
        detail: `Trade is in positive territory (+${gainPct.toFixed(1)}%). Maintain hard stop loss at ${formatCurrency(stopLoss, currencySymbol)}. Look for institutional volume follow-through over the next 2–5 sessions.`,
        suggestedSharesToSellPct: 0,
        stopLevelStr: formatCurrency(stopLoss, currencySymbol)
      };
    } else if (gainPct < stock.target1Percent) {
      return {
        badge: '🔷 BACKSTOP RULE ACTIVATED (+8% TO +10%)',
        badgeBg: 'bg-blue-950 text-cyan-300 border-blue-600',
        cardBg: 'bg-blue-50/80 border-blue-300',
        actionTitle: 'ACTION: RAISE STOP LOSS TO BREAKEVEN',
        actionColor: 'text-blue-800',
        detail: `Stock reached +8%+ profit threshold (${formatCurrency(breakevenTrigger, currencySymbol)}). Immediately raise hard stop loss to ${formatCurrency(pivotEntry, currencySymbol)}. This converts ${stock.ticker} into a ZERO-RISK trade!`,
        suggestedSharesToSellPct: 0,
        stopLevelStr: formatCurrency(pivotEntry, currencySymbol)
      };
    } else if (gainPct < stock.target2Percent) {
      return {
        badge: '🎯 PROFIT TARGET 1 REACHED (+20%)',
        badgeBg: 'bg-purple-950 text-amber-300 border-purple-600',
        cardBg: 'bg-purple-50/80 border-purple-300',
        actionTitle: 'ACTION: TAKE PARTIAL PROFIT (SELL 50%)',
        actionColor: 'text-purple-900',
        detail: `Stock reached Target 1 at ${formatCurrency(target1, currencySymbol)} (+${stock.target1Percent}% gain). Sell 50% of position into strength to lock in 3:1 R/R gains. Trail remaining 50% shares along 20-day SMA.`,
        suggestedSharesToSellPct: 50,
        stopLevelStr: `${formatCurrency(pivotEntry, currencySymbol)} (or 10d EMA)`
      };
    } else {
      return {
        badge: '🚀 EXTENDED RUNNER / CLIMAX TARGET (+35%+)',
        badgeBg: 'bg-purple-950 text-white border-purple-500',
        cardBg: 'bg-purple-100/90 border-purple-400',
        actionTitle: 'ACTION: CLIMAX TOP WATCH / TRAIL 10D EMA',
        actionColor: 'text-purple-950',
        detail: `Stock is up +${gainPct.toFixed(1)}% from pivot entry. Watch for climax sell signals: 3-5 consecutive gap-ups, widest daily range bar, or heavy volume distribution day. Trail stop tightly to 10d EMA.`,
        suggestedSharesToSellPct: 100,
        stopLevelStr: '10-Day EMA or Prev Day Low'
      };
    }
  };

  const currentStatus = getExitStatus(stock.currentPrice);
  const testStatus = getExitStatus(testPrice);

  return (
    <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-950 text-amber-400 flex items-center justify-center font-serif italic font-bold text-lg shadow-2xs">
            X
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">SEPA Rules Engine</span>
              <span className="bg-purple-100 text-purple-900 text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 border border-purple-300">
                Mark Minervini Rules
              </span>
            </div>
            <h3 className="text-lg font-serif font-black text-[#1a1a1a] leading-tight">
              Exit Signals & Selling Protocol — {stock.ticker}
            </h3>
          </div>
        </div>

        {/* Selected Stock Quick Summary Pill */}
        <div className="flex items-center space-x-3 text-xs font-mono bg-white p-2 border border-[#e5e4e1] shadow-2xs">
          <div>
            <span className="text-gray-400 text-[9px] uppercase block font-sans">Current Price</span>
            <span className="font-bold text-[#1a1a1a]">{formatCurrency(stock.currentPrice, currencySymbol)}</span>
          </div>
          <div className="border-l border-gray-200 pl-2">
            <span className="text-gray-400 text-[9px] uppercase block font-sans">Gain/Loss</span>
            <span className={`font-bold ${currentGainPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {currentGainPercent >= 0 ? '+' : ''}{currentGainPercent.toFixed(1)}%
            </span>
          </div>
          <div className="border-l border-gray-200 pl-2">
            <span className="text-gray-400 text-[9px] uppercase block font-sans">Stop Loss</span>
            <span className="font-bold text-rose-600">{formatCurrency(stopLoss, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Live Status Directive for Current Stock Price */}
      <div className={`p-4 border font-mono space-y-2 transition-all ${currentStatus.cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
          <div className="flex items-center space-x-2">
            <LogOut className="w-4 h-4 text-purple-800" />
            <span className="text-xs font-extrabold uppercase text-[#1a1a1a]">
              Active Live Exit Status for {stock.ticker}
            </span>
          </div>
          <span className={`px-2.5 py-0.5 text-[10px] font-extrabold font-mono border ${currentStatus.badgeBg}`}>
            {currentStatus.badge}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="space-y-1">
            <h4 className={`text-sm font-black uppercase ${currentStatus.actionColor}`}>
              {currentStatus.actionTitle}
            </h4>
            <p className="text-xs text-gray-800 font-sans leading-relaxed">
              {currentStatus.detail}
            </p>
          </div>

          <div className="shrink-0 bg-white p-3 border border-[#e5e4e1] font-mono text-center space-y-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Suggested Action</span>
            <span className="text-sm font-extrabold text-[#1a1a1a] block">
              {currentStatus.suggestedSharesToSellPct === 0
                ? '0% (HOLD ALL)'
                : currentStatus.suggestedSharesToSellPct === 50
                ? 'SELL 50% SHARES'
                : 'EXIT 100% SHARES'}
            </span>
            <span className="text-[10px] text-purple-900 font-bold block bg-purple-50 px-2 py-0.5 border border-purple-200">
              Active Stop: {currentStatus.stopLevelStr}
            </span>
          </div>
        </div>
      </div>

      {/* The 4 Core Pillars of Minervini Exit Strategy */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
            Minervini Specific Rules for Cutting Losses & Profit Taking
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          
          {/* Pillar 1: 5% - 10% Initial Hard Stop Loss */}
          <div className="bg-white border border-[#e5e4e1] p-4 space-y-2 relative group hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-mono text-[11px] font-extrabold text-rose-700 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>1. Cut Losses Fast (5%–10%)</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-rose-50 text-rose-800 px-1.5 py-0.5 border border-rose-200">
                MAX -{stock.stopLossPercent}%
              </span>
            </div>
            <div className="font-mono text-xs">
              Stop Price: <strong className="text-rose-700 font-bold text-sm">{formatCurrency(stopLoss, currencySymbol)}</strong>
            </div>
            <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 leading-normal">
              <li><strong>The 8% Cap:</strong> Never allow any position to lose more than 8% (absolute max 10%).</li>
              <li><strong>3-Day Time Stop:</strong> If stock fails to move within 2–3 days or drops back into base on heavy volume, exit early before full stop.</li>
              <li>Keep average losses small (3%–5%) so a 15%–20% gain easily covers 3 to 4 losing trades.</li>
            </ul>
          </div>

          {/* Pillar 2: Breakeven Backstop Rule (+8% Gain) */}
          <div className="bg-white border border-[#e5e4e1] p-4 space-y-2 relative group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-mono text-[11px] font-extrabold text-blue-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Backstop Rule (+8% Gain)</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-900 px-1.5 py-0.5 border border-blue-200">
                Trigger: +8%
              </span>
            </div>
            <div className="font-mono text-xs">
              Breakeven Trigger: <strong className="text-blue-800 font-bold text-sm">{formatCurrency(breakevenTrigger, currencySymbol)}</strong>
            </div>
            <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 leading-normal">
              <li><strong>Zero-Risk Guarantee:</strong> When stock advances +8% to +10% above pivot, raise stop loss to <strong className="text-black">{formatCurrency(pivotEntry, currencySymbol)}</strong>.</li>
              <li>Never allow a good profit (+8%+) to turn into a net loss.</li>
              <li>Protects your mental capital & eliminates anxiety during standard pullbacks.</li>
            </ul>
          </div>

          {/* Pillar 3: Profit Target 1 (+15% to +20%) */}
          <div className="bg-white border border-[#e5e4e1] p-4 space-y-2 relative group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-mono text-[11px] font-extrabold text-emerald-800 flex items-center space-x-1">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Profit Target (+20%)</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 border border-emerald-200">
                Target 1: +{stock.target1Percent}%
              </span>
            </div>
            <div className="font-mono text-xs">
              Target 1 Price: <strong className="text-emerald-700 font-bold text-sm">{formatCurrency(target1, currencySymbol)}</strong>
            </div>
            <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 leading-normal">
              <li><strong>Sell 50% into Strength:</strong> Lock in gains at 20% or 2.5x to 3x your average loss.</li>
              <li>"Banking profits creates compounded interest and stabilizes win rates."</li>
              <li>Trail remaining 50% runner along 10d EMA or 20d SMA for super-performance.</li>
            </ul>
          </div>

          {/* Pillar 4: Climax Top & Technical Exit Signals */}
          <div className="bg-white border border-[#e5e4e1] p-4 space-y-2 relative group hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-mono text-[11px] font-extrabold text-purple-900 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-purple-700" />
                <span>4. Climax Top / Sell Signals</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-purple-50 text-purple-900 px-1.5 py-0.5 border border-purple-200">
                Extended: +35%+
              </span>
            </div>
            <div className="font-mono text-xs">
              Target 2 Runner: <strong className="text-purple-900 font-bold text-sm">{formatCurrency(target2, currencySymbol)}</strong>
            </div>
            <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 leading-normal">
              <li><strong>Climax Run:</strong> 3-5 gap-ups or largest daily range bar after extended run.</li>
              <li><strong>Volume Churn:</strong> Heavy volume with no price gain (distribution).</li>
              <li><strong>MA Violation:</strong> Decisive close below 20d SMA or 50d SMA on heavy volume.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Interactive Price Point Simulator */}
      <div className="bg-white border border-[#e5e4e1] p-4 space-y-4 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-purple-700" />
            <h4 className="text-xs font-bold uppercase text-[#1a1a1a]">
              Interactive Exit Scenario Simulator ({stock.ticker})
            </h4>
          </div>
          <span className="text-[10px] text-gray-500 font-sans">
            Test any price level to get instant Minervini exit directive
          </span>
        </div>

        {/* Quick Price Scenario Preset Buttons */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            Select Preset Scenario Price Point:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTestPrice(stopLoss)}
              className={`p-2 border text-center transition-all cursor-pointer ${
                testPrice === stopLoss
                  ? 'bg-rose-900 text-white border-rose-900 font-bold'
                  : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="text-[9px] block text-rose-700 uppercase">Stop Loss</span>
              <span>{formatCurrency(stopLoss, currencySymbol)}</span>
            </button>

            <button
              type="button"
              onClick={() => setTestPrice(pivotEntry)}
              className={`p-2 border text-center transition-all cursor-pointer ${
                testPrice === pivotEntry
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-gray-50 text-slate-800 border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="text-[9px] block text-gray-500 uppercase">Pivot Entry</span>
              <span>{formatCurrency(pivotEntry, currencySymbol)}</span>
            </button>

            <button
              type="button"
              onClick={() => setTestPrice(breakevenTrigger)}
              className={`p-2 border text-center transition-all cursor-pointer ${
                testPrice === breakevenTrigger
                  ? 'bg-blue-900 text-white border-blue-900 font-bold'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span className="text-[9px] block text-blue-700 uppercase">+8% Breakeven</span>
              <span>{formatCurrency(breakevenTrigger, currencySymbol)}</span>
            </button>

            <button
              type="button"
              onClick={() => setTestPrice(target1)}
              className={`p-2 border text-center transition-all cursor-pointer ${
                testPrice === target1
                  ? 'bg-emerald-900 text-white border-emerald-900 font-bold'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="text-[9px] block text-emerald-700 uppercase">Target 1 (+20%)</span>
              <span>{formatCurrency(target1, currencySymbol)}</span>
            </button>

            <button
              type="button"
              onClick={() => setTestPrice(target2)}
              className={`p-2 border text-center transition-all cursor-pointer ${
                testPrice === target2
                  ? 'bg-purple-900 text-white border-purple-900 font-bold'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span className="text-[9px] block text-purple-700 uppercase">Target 2 (+35%)</span>
              <span>{formatCurrency(target2, currencySymbol)}</span>
            </button>

            <button
              type="button"
              onClick={() => setTestPrice(Number((pivotEntry * 1.5).toFixed(2)))}
              className={`p-2 border text-center transition-all cursor-pointer ${
                testPrice === Number((pivotEntry * 1.5).toFixed(2))
                  ? 'bg-amber-900 text-white border-amber-900 font-bold'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="text-[9px] block text-amber-700 uppercase">Climax Run (+50%)</span>
              <span>{formatCurrency(pivotEntry * 1.5, currencySymbol)}</span>
            </button>
          </div>
        </div>

        {/* Custom Price Slider / Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-[#f9f8f5] p-3 border border-[#e5e4e1]">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 block">
              Simulated Stock Price ({currencySymbol}):
            </label>
            <input
              type="number"
              step="0.10"
              value={testPrice}
              onChange={(e) => setTestPrice(Number(e.target.value) || pivotEntry)}
              className="w-full bg-white border border-[#e5e4e1] p-1.5 font-bold text-[#1a1a1a] text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
              <span>Adjust Price Slider:</span>
              <span className={testGainPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                {testGainPercent >= 0 ? '+' : ''}{testGainPercent.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={Number((stopLoss * 0.9).toFixed(2))}
              max={Number((pivotEntry * 1.6).toFixed(2))}
              step="0.25"
              value={testPrice}
              onChange={(e) => setTestPrice(Number(e.target.value))}
              className="w-full accent-purple-800 cursor-pointer"
            />
          </div>

          <div className="text-center md:text-right font-sans">
            <span className="text-[10px] uppercase font-bold text-gray-500 block font-mono">
              Simulated Gain / Loss vs Pivot Entry:
            </span>
            <span className={`text-xl font-black font-mono ${testGainPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {testGainPercent >= 0 ? '+' : ''}{testGainPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Simulated Action Directive Result Card */}
        <div className={`p-4 border font-mono space-y-2 ${testStatus.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 text-[10px] font-bold border ${testStatus.badgeBg}`}>
              {testStatus.badge}
            </span>
            <span className="text-xs font-bold text-gray-700">
              Simulated Price: <strong>{formatCurrency(testPrice, currencySymbol)}</strong>
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h5 className={`text-sm font-black uppercase ${testStatus.actionColor}`}>
              {testStatus.actionTitle}
            </h5>
            <p className="text-xs text-gray-800 font-sans leading-relaxed">
              {testStatus.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Rules Matrix: Professional Minervini Exit Discipline vs Amateur Trader Mistakes */}
      <div className="bg-white border border-[#e5e4e1] p-4 space-y-3 font-sans">
        <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-2 font-mono">
          <Award className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
            Minervini Professional Exit Discipline vs Common Retail Mistakes
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {/* Professional Rules */}
          <div className="bg-emerald-50/50 border border-emerald-200 p-3 space-y-2">
            <div className="font-mono text-xs font-bold text-emerald-900 uppercase flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark Minervini SEPA Rules</span>
            </div>
            <ul className="space-y-1.5 text-gray-700 text-[11px] list-disc pl-4">
              <li><strong>Pre-determined Risk:</strong> Set hard stop loss before entering every single trade.</li>
              <li><strong>Sell into Strength:</strong> Take 50% profits at +15% to +20% when buyers are eager.</li>
              <li><strong>Breakeven Protection:</strong> Raise stop to entry price after stock moves up +8% to +10%.</li>
              <li><strong>Cut Losses Quickly:</strong> Average loss kept strictly around 3% to 5%.</li>
              <li><strong>Trail Winners:</strong> Let remaining 50% runner ride along 20-day SMA or 10-day EMA.</li>
            </ul>
          </div>

          {/* Retail Mistakes */}
          <div className="bg-rose-50/50 border border-rose-200 p-3 space-y-2">
            <div className="font-mono text-xs font-bold text-rose-900 uppercase flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Retail Trader Mistakes to Avoid</span>
            </div>
            <ul className="space-y-1.5 text-gray-700 text-[11px] list-disc pl-4">
              <li><strong>Hoping & Holding:</strong> Holding a stock as it drops -20%, turning a short trade into an involuntary long-term investment.</li>
              <li><strong>Greed at Top:</strong> Round-tripping a +25% profit all the way back down to a loss.</li>
              <li><strong>Selling Winners Early:</strong> Panic-selling a fast winner at +3% while holding a -15% loser.</li>
              <li><strong>Averaging Down:</strong> Buying more shares of a falling stock below stop loss level.</li>
              <li><strong>Ignoring Moving Averages:</strong> Holding through major 50-day SMA breakdowns on huge volume.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
