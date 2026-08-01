import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup } from '../types';
import { calculatePositionSize, calculateBreakoutProbability, formatCurrency, formatVolume, getCurrencySymbol } from '../utils/sepaCalculator';
import { exportTradePlansToCsv } from '../utils/csvExport';
import { ExitSignals } from './ExitSignals';
import { BreakoutProbabilityEngine } from './BreakoutProbabilityEngine';
import { Target, ShieldAlert, ArrowUpRight, Droplets, DollarSign, Calculator, Layers, Flame, Zap, Sparkles, TrendingUp, BarChart3, ShieldCheck, FileText, Save, Check, Trash2, Clock, StickyNote, FileSpreadsheet, LogOut, AlertTriangle, ArrowRightCircle, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';

function getArcPath(cx: number, cy: number, r: number, startAngleDeg: number, endAngleDeg: number) {
  const rad1 = (startAngleDeg * Math.PI) / 180;
  const rad2 = (endAngleDeg * Math.PI) / 180;
  const x1 = cx - r * Math.cos(rad1);
  const y1 = cy - r * Math.sin(rad1);
  const x2 = cx - r * Math.cos(rad2);
  const y2 = cy - r * Math.sin(rad2);
  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

interface RiskRewardGaugeProps {
  ratio: number;
  pivotEntry: number;
  stopLoss: number;
  targetPrice: number;
  currencySymbol: string;
}

export const RiskRewardGauge: React.FC<RiskRewardGaugeProps> = ({
  ratio,
  pivotEntry,
  stopLoss,
  targetPrice,
  currencySymbol,
}) => {
  const riskPerShare = Math.max(0.01, pivotEntry - stopLoss);
  const rewardPerShare = Math.max(0, targetPrice - pivotEntry);
  const riskPct = pivotEntry > 0 ? ((pivotEntry - stopLoss) / pivotEntry) * 100 : 0;
  const rewardPct = pivotEntry > 0 ? ((targetPrice - pivotEntry) / pivotEntry) * 100 : 0;

  const cx = 120;
  const cy = 110;
  const r = 80;

  const clampedR = Math.min(6, Math.max(0, ratio));
  const needleAngleDeg = (clampedR / 6) * 180;
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLen = 68;
  const nx = cx - needleLen * Math.cos(needleRad);
  const ny = cy - needleLen * Math.sin(needleRad);

  let statusBadge = {
    label: 'SUBPAR RISK/REWARD',
    sub: 'Under 2:1 ratio — High downside risk relative to potential gain.',
    color: 'bg-red-100 text-red-900 border-red-300',
    textColor: 'text-red-600',
    badgeText: '🔴 High Risk',
  };

  if (ratio >= 5.0) {
    statusBadge = {
      label: 'CHAMPION ASYMMETRIC GRADE',
      sub: '5:1+ ratio — Exceptional reward potential relative to tight risk.',
      color: 'bg-purple-100 text-purple-900 border-purple-300',
      textColor: 'text-purple-600',
      badgeText: '🚀 Champion Grade',
    };
  } else if (ratio >= 3.0) {
    statusBadge = {
      label: 'MINERVINI SEPA STANDARD',
      sub: '3:1 to 5:1 ratio — Optimal Mark Minervini asymmetric entry setup.',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      textColor: 'text-emerald-600',
      badgeText: '🟢 SEPA Standard',
    };
  } else if (ratio >= 2.0) {
    statusBadge = {
      label: 'ACCEPTABLE MINIMUM THRESHOLD',
      sub: '2:1 ratio — Passable minimum, but 3:1+ preferred for maximum edge.',
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-600',
      badgeText: '🟡 Acceptable Min',
    };
  }

  return (
    <div className="bg-white border border-[#e5e4e1] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-2">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-emerald-600" />
          <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
            Dynamic Risk / Reward Gauge
          </h5>
        </div>
        <span className={`px-2.5 py-0.5 border text-xs font-mono font-black uppercase ${statusBadge.color}`}>
          {statusBadge.badgeText} ({ratio.toFixed(2)} : 1)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column: Visual Arc Gauge Meter */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-[#f9f8f5] border border-[#e5e4e1]">
          <svg viewBox="0 0 240 145" className="w-full max-w-[220px] overflow-visible">
            {/* Background Arc Track */}
            <path
              d={getArcPath(cx, cy, r, 0, 180)}
              fill="none"
              stroke="#e5e4e1"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Colored Zones */}
            {/* Red: 0:1 to 2:1 */}
            <path
              d={getArcPath(cx, cy, r, 2, 58)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="14"
            />
            {/* Yellow: 2:1 to 3:1 */}
            <path
              d={getArcPath(cx, cy, r, 62, 88)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="14"
            />
            {/* Green: 3:1 to 5:1 */}
            <path
              d={getArcPath(cx, cy, r, 92, 148)}
              fill="none"
              stroke="#10b981"
              strokeWidth="14"
            />
            {/* Purple: 5:1 to 6:1+ */}
            <path
              d={getArcPath(cx, cy, r, 152, 178)}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="14"
            />

            {/* Tick Markers */}
            {[
              { rVal: 0, deg: 0, label: '0:1' },
              { rVal: 2, deg: 60, label: '2:1' },
              { rVal: 3, deg: 90, label: '3:1' },
              { rVal: 5, deg: 150, label: '5:1' },
              { rVal: 6, deg: 180, label: '6:1+' },
            ].map((tick) => {
              const tickRad = (tick.deg * Math.PI) / 180;
              const innerX = cx - (r - 12) * Math.cos(tickRad);
              const innerY = cy - (r - 12) * Math.sin(tickRad);
              const outerX = cx - (r + 12) * Math.cos(tickRad);
              const outerY = cy - (r + 12) * Math.sin(tickRad);

              const labelR = r + 22;
              const lx = cx - labelR * Math.cos(tickRad);
              const ly = cy - labelR * Math.sin(tickRad);

              return (
                <g key={tick.label}>
                  <line
                    x1={innerX}
                    y1={innerY}
                    x2={outerX}
                    y2={outerY}
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                  />
                  <text
                    x={lx}
                    y={ly + 3}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill="#4b5563"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* Dynamic Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke="#1a1a1a"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            <circle cx={cx} cy={cy} r="6" fill="#1a1a1a" stroke="#ffffff" strokeWidth="2" />
            <circle cx={nx} cy={ny} r="3" fill="#10b981" />
          </svg>

          {/* Central Digital Display */}
          <div className="mt-[-10px] text-center space-y-0.5">
            <div className={`text-2xl font-black font-mono tracking-tight ${statusBadge.textColor}`}>
              {ratio.toFixed(2)} : 1
            </div>
            <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
              Risk-to-Reward Ratio
            </div>
          </div>
        </div>

        {/* Right Column: Key Metric Breakdown & Minervini Rule Context */}
        <div className="md:col-span-7 space-y-3 font-mono text-xs">
          <div className="bg-[#f9f8f5] p-2.5 border border-[#e5e4e1] space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#b5a68d] flex justify-between">
              <span>Setup Rating:</span>
              <span className={`font-bold ${statusBadge.textColor}`}>{statusBadge.label}</span>
            </div>
            <p className="text-[11px] text-gray-700 font-sans leading-relaxed">
              {statusBadge.sub}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Risk Box */}
            <div className="bg-red-50/70 border border-red-200 p-2.5 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-red-700 block">
                Defined Risk (1R)
              </span>
              <div className="text-base font-black text-red-600 font-mono">
                {formatCurrency(riskPerShare, currencySymbol)} <span className="text-[10px] font-normal">/ sh</span>
              </div>
              <div className="text-[10px] text-red-800 font-bold">
                -{riskPct.toFixed(1)}% Stop Loss ({formatCurrency(stopLoss, currencySymbol)})
              </div>
            </div>

            {/* Reward Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                Expected Reward
              </span>
              <div className="text-base font-black text-emerald-700 font-mono">
                {formatCurrency(rewardPerShare, currencySymbol)} <span className="text-[10px] font-normal">/ sh</span>
              </div>
              <div className="text-[10px] text-emerald-800 font-bold">
                +{rewardPct.toFixed(1)}% Target ({formatCurrency(targetPrice, currencySymbol)})
              </div>
            </div>
          </div>

          {/* Ratio Comparison Progress Bar */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-red-700">Risk: 1.0 Unit</span>
              <span className="text-emerald-700">Reward: {ratio.toFixed(2)} Units</span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 flex overflow-hidden rounded border border-gray-300">
              <div
                className="bg-red-500 h-full text-[9px] text-white font-bold flex items-center justify-center transition-all"
                style={{ width: `${Math.min(35, (1 / (1 + ratio)) * 100)}%` }}
              >
                1R
              </div>
              <div
                className="bg-emerald-600 h-full text-[9px] text-white font-bold flex items-center justify-center transition-all border-l border-white/40"
                style={{ width: `${Math.max(25, (ratio / (1 + ratio)) * 100)}%` }}
              >
                {ratio.toFixed(2)}R Reward
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

interface SmartStopAdjusterProps {
  stock: MinerviniTradeSetup;
  customStopPrice: number;
  onUpdateStopPrice: (newStopPrice: number) => void;
}

export const SmartStopAdjuster: React.FC<SmartStopAdjusterProps> = ({
  stock,
  customStopPrice,
  onUpdateStopPrice,
}) => {
  const currencySymbol = getCurrencySymbol(stock.exchange);
  const pivotEntry = stock.pivotPrice;
  const currentPrice = stock.currentPrice;

  // 1. Breakeven Stop Level (+8% to +10% Gain Rule)
  const breakevenStop = pivotEntry;
  const breakevenGainPct = ((currentPrice - pivotEntry) / pivotEntry) * 100;
  const isBreakevenEligible = breakevenGainPct >= 8.0;

  // 2. 2.0x ATR Volatility Stop Level
  const estimatedAtr = currentPrice * 0.025;
  const atrStop = Number((currentPrice - 2.0 * estimatedAtr).toFixed(2));

  // 3. 20-Day EMA Trailing Stop
  const ema20Stop = Number((currentPrice * 0.97).toFixed(2));

  // 4. 50% Profit Locking Stop Level
  const profitLockStop = Number((pivotEntry + Math.max(0, currentPrice - pivotEntry) * 0.5).toFixed(2));
  const isProfitLockEligible = breakevenGainPct >= 10.0;

  return (
    <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
            ⚡ Smart Stop Loss Adjuster & Dynamic Trailing Traps
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5">
          Active Stop: {formatCurrency(customStopPrice, currencySymbol)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Option 1: Breakeven Stop */}
        <div
          className={`p-3 border transition-all flex flex-col justify-between ${
            Math.abs(customStopPrice - breakevenStop) < 0.01
              ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-white border-[#e5e4e1] hover:border-emerald-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase">
              <span>Breakeven Stop</span>
              {isBreakevenEligible && (
                <span className="bg-emerald-600 text-white px-1 py-0.2 font-mono text-[9px]">
                  RECOMMENDED
                </span>
              )}
            </div>
            <div className="text-xl font-bold font-mono text-[#1a1a1a] mt-1">
              {formatCurrency(breakevenStop, currencySymbol)}
            </div>
            <p className="text-[10px] text-gray-500 font-sans mt-1">
              {isBreakevenEligible
                ? 'Stock gained +8%+! Move stop to entry to eliminate downside risk.'
                : 'Moves stop loss to initial pivot entry price when stock advances +8%+.'}
            </p>
          </div>
          <button
            onClick={() => onUpdateStopPrice(breakevenStop)}
            className="mt-3 w-full py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10px] uppercase tracking-wider border border-emerald-900 transition-all cursor-pointer"
          >
            Apply Breakeven Stop
          </button>
        </div>

        {/* Option 2: 2.0x ATR Volatility Stop */}
        <div
          className={`p-3 border transition-all flex flex-col justify-between ${
            Math.abs(customStopPrice - atrStop) < 0.01
              ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
              : 'bg-white border-[#e5e4e1] hover:border-blue-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-blue-800 uppercase">
              <span>2.0x ATR Volatility Stop</span>
              <span className="text-[9px] text-gray-400 font-mono">
                ATR: {formatCurrency(estimatedAtr, currencySymbol)}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#1a1a1a] mt-1">
              {formatCurrency(atrStop, currencySymbol)}
            </div>
            <p className="text-[10px] text-gray-500 font-sans mt-1">
              Trails price with a 2.0x ATR volatility cushion below live price.
            </p>
          </div>
          <button
            onClick={() => onUpdateStopPrice(atrStop)}
            className="mt-3 w-full py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-[10px] uppercase tracking-wider border border-blue-900 transition-all cursor-pointer"
          >
            Apply ATR Volatility Stop
          </button>
        </div>

        {/* Option 3: 20-Day EMA Trailing Stop */}
        <div
          className={`p-3 border transition-all flex flex-col justify-between ${
            Math.abs(customStopPrice - ema20Stop) < 0.01
              ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
              : 'bg-white border-[#e5e4e1] hover:border-purple-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-purple-900 uppercase">
              <span>20-Day EMA Stop</span>
              <span className="text-[9px] text-purple-700 font-mono">Trend Line</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#1a1a1a] mt-1">
              {formatCurrency(ema20Stop, currencySymbol)}
            </div>
            <p className="text-[10px] text-gray-500 font-sans mt-1">
              Minervini institutional trend-following stop hugging 20-day EMA.
            </p>
          </div>
          <button
            onClick={() => onUpdateStopPrice(ema20Stop)}
            className="mt-3 w-full py-1.5 bg-purple-900 hover:bg-black text-white font-bold text-[10px] uppercase tracking-wider border border-black transition-all cursor-pointer"
          >
            Apply 20-EMA Stop
          </button>
        </div>

        {/* Option 4: 50% Profit Locking Stop */}
        <div
          className={`p-3 border transition-all flex flex-col justify-between ${
            Math.abs(customStopPrice - profitLockStop) < 0.01
              ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500'
              : 'bg-white border-[#e5e4e1] hover:border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 uppercase">
              <span>50% Profit Lock Stop</span>
              {isProfitLockEligible && (
                <span className="bg-amber-500 text-black px-1 py-0.2 font-mono text-[9px] font-bold">
                  50% LOCKED
                </span>
              )}
            </div>
            <div className="text-xl font-bold font-mono text-[#1a1a1a] mt-1">
              {formatCurrency(profitLockStop, currencySymbol)}
            </div>
            <p className="text-[10px] text-gray-500 font-sans mt-1">
              Guarantees locking in at least 50% of peak open unrealized profits.
            </p>
          </div>
          <button
            onClick={() => onUpdateStopPrice(profitLockStop)}
            className="mt-3 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[10px] uppercase tracking-wider border border-amber-600 transition-all cursor-pointer"
          >
            Apply Profit Lock Stop
          </button>
        </div>
      </div>
    </div>
  );
};

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

      {/* Dynamic Risk-Reward Ratio Engine & Visual Upside vs. Stop Loss Calculator */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-[#1a1a1a]" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
              Visual Risk / Reward Ratio (RRR) Calculator & Potential Upside Engine
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
                ? '🚀 CHAMPION GRADE (>= 5:1 R/R)'
                : dynamicCustomRRRatio >= 3.0
                ? '🟢 MINERVINI STANDARD (>= 3:1 R/R)'
                : dynamicCustomRRRatio >= 2.0
                ? '🟡 ACCEPTABLE MINIMUM (>= 2:1 R/R)'
                : '🔴 SUBPAR RISK-REWARD (< 2:1 R/R)'}
            </span>
          </div>
        </div>

        {/* Dynamic Interactive Risk/Reward Ratio Visual Gauge Dial */}
        <RiskRewardGauge
          ratio={dynamicCustomRRRatio}
          pivotEntry={pivotEntry}
          stopLoss={currentStopLoss}
          targetPrice={customTargetPrice}
          currencySymbol={currencySymbol}
        />

        {/* Quick RRR Preset Buttons & Slider */}
        <div className="space-y-3 bg-white p-4 border border-[#e5e4e1]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b5a68d] flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-slate-800" />
              <span>Select Desired Risk-Reward Ratio (RRR) Target Preset:</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#1a1a1a] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5">
              Active Ratio: <strong className="text-emerald-800 text-sm">1 : {desiredRRR.toFixed(1)}</strong>
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

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono border-t border-gray-100">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-gray-500 whitespace-nowrap">Custom RRR Slider:</span>
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

        {/* Visual Upside Potential vs Defined Downside Risk Comparison Breakdown */}
        <div className="bg-white border border-[#e5e4e1] p-4 space-y-4 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Potential Upside vs Defined Stop Loss Risk Matrix ({posSize.shareQuantity.toLocaleString()} shares)</span>
            </span>
            <span className="text-[10px] text-gray-500 font-sans">
              Quantifying dollar return per $1 dollar risked
            </span>
          </div>

          {/* 3 Metric Upside Cards vs Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            
            {/* Downside Risk Card */}
            <div className="bg-red-50/50 border border-red-200 p-3 space-y-1.5">
              <div className="flex justify-between items-center text-red-700 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Defined Stop Loss Risk</span>
                </span>
                <span className="bg-red-100 text-red-800 px-1.5 py-0.5 border border-red-300 text-[9px]">1.0x (1R)</span>
              </div>
              <div>
                <span className="text-2xl font-black text-red-600 block">
                  -{formatCurrency(posSize.riskAmount, currencySymbol)}
                </span>
                <span className="text-[11px] text-red-700 block font-bold">
                  -{riskPercentFromPivot.toFixed(1)}% Downside ({formatCurrency(riskPerShare, currencySymbol)}/sh)
                </span>
              </div>
              <p className="text-[10px] text-gray-600 font-sans border-t border-red-200 pt-1">
                Max account loss capped at <strong>{riskPercent}%</strong> of portfolio capital.
              </p>
            </div>

            {/* Target 1 Upside Card */}
            <div className="bg-emerald-50/50 border border-emerald-200 p-3 space-y-1.5">
              <div className="flex justify-between items-center text-emerald-800 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target 1 Potential Upside</span>
                </span>
                <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 border border-emerald-300 text-[9px] font-black">
                  {dynamicRRRatioT1.toFixed(1)}x ({dynamicRRRatioT1.toFixed(1)}R)
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-700 block">
                  +{formatCurrency(rewardT1 * posSize.shareQuantity, currencySymbol)}
                </span>
                <span className="text-[11px] text-emerald-800 block font-bold">
                  +{stock.target1Percent}% Upside ({formatCurrency(rewardT1, currencySymbol)}/sh)
                </span>
              </div>
              <p className="text-[10px] text-gray-600 font-sans border-t border-emerald-200 pt-1">
                50% partial scale-out target price at <strong className="text-emerald-800">{formatCurrency(stock.target1Price, currencySymbol)}</strong>.
              </p>
            </div>

            {/* Target 2 / Custom Upside Card */}
            <div className="bg-purple-50/50 border border-purple-200 p-3 space-y-1.5">
              <div className="flex justify-between items-center text-purple-900 text-[10px] uppercase font-bold">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Target 2 / Custom Upside</span>
                </span>
                <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 border border-purple-300 text-[9px] font-black">
                  {dynamicCustomRRRatio.toFixed(1)}x ({dynamicCustomRRRatio.toFixed(1)}R)
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-purple-900 block">
                  +{formatCurrency(rewardCustom * posSize.shareQuantity, currencySymbol)}
                </span>
                <span className="text-[11px] text-purple-900 block font-bold">
                  +{(((customTargetPrice - pivotEntry) / pivotEntry) * 100).toFixed(1)}% Upside ({formatCurrency(rewardCustom, currencySymbol)}/sh)
                </span>
              </div>
              <p className="text-[10px] text-gray-600 font-sans border-t border-purple-200 pt-1">
                Target exit price set at <strong className="text-purple-900">{formatCurrency(customTargetPrice, currencySymbol)}</strong>.
              </p>
            </div>

          </div>

          {/* Visual Progress / Ratio Comparison Bar */}
          <div className="space-y-1.5 pt-1 font-mono text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-red-700 font-bold">Downside Risk: {formatCurrency(posSize.riskAmount, currencySymbol)} (-1.0R)</span>
              <span className="text-emerald-700 font-bold">Target 1 Upside: +{formatCurrency(rewardT1 * posSize.shareQuantity, currencySymbol)} (+{dynamicRRRatioT1.toFixed(1)}R)</span>
              <span className="text-purple-900 font-bold">Custom Upside: +{formatCurrency(rewardCustom * posSize.shareQuantity, currencySymbol)} (+{dynamicCustomRRRatio.toFixed(1)}R)</span>
            </div>
            <div className="w-full bg-gray-200 h-4 flex overflow-hidden rounded border border-gray-300">
              <div
                className="bg-red-600 h-full text-[10px] text-white font-bold flex items-center justify-center transition-all"
                style={{ width: `${Math.min(25, (1 / (1 + dynamicCustomRRRatio)) * 100)}%` }}
                title={`Max Downside Risk: ${formatCurrency(posSize.riskAmount, currencySymbol)}`}
              >
                1R Risk
              </div>
              <div
                className="bg-emerald-600 h-full text-[10px] text-white font-bold flex items-center justify-center transition-all border-l border-white/30"
                style={{ width: `${Math.min(45, (dynamicRRRatioT1 / (1 + dynamicCustomRRRatio)) * 100)}%` }}
                title={`Target 1 Reward: +${formatCurrency(rewardT1 * posSize.shareQuantity, currencySymbol)}`}
              >
                {dynamicRRRatioT1.toFixed(1)}R T1
              </div>
              <div
                className="bg-purple-700 h-full text-[10px] text-white font-bold flex items-center justify-center transition-all border-l border-white/30"
                style={{ width: `${Math.max(30, (dynamicCustomRRRatio / (1 + dynamicCustomRRRatio)) * 100)}%` }}
                title={`Custom Target Reward: +${formatCurrency(rewardCustom * posSize.shareQuantity, currencySymbol)}`}
              >
                {dynamicCustomRRRatio.toFixed(1)}R Custom Upside
              </div>
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

      {/* Smart Stop Loss Adjuster & Dynamic Trailing Traps */}
      <SmartStopAdjuster
        stock={stock}
        customStopPrice={customStopPrice}
        onUpdateStopPrice={(newStop) => setCustomStopPrice(newStop)}
      />

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

      {/* Mark Minervini Exit Signals Component */}
      <ExitSignals stock={stock} />

      {/* Breakout Success Probability Engine */}
      <BreakoutProbabilityEngine stock={stock} />

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

