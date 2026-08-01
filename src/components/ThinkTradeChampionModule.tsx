import React, { useState } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Zap, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Sliders, 
  BookOpen, 
  Award, 
  ArrowUpRight, 
  ShieldCheck,
  BarChart3,
  Layers,
  HelpCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/sepaCalculator';

export const ThinkTradeChampionModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'risk_drawdown' | 'cheat_entries' | 'climax_tops' | 'preflight_checklist'>('risk_drawdown');

  // --- State for Risk & Position Size Calculator ---
  const [accountCapital, setAccountCapital] = useState<number>(100000);
  const [recentWinRate, setRecentWinRate] = useState<number>(45); // Win rate %
  const [avgWinPct, setAvgWinPct] = useState<number>(15); // Avg gain %
  const [avgLossPct, setAvgLossPct] = useState<number>(5); // Avg loss %
  const [isInDrawdown, setIsInDrawdown] = useState<boolean>(false);

  // Calculated Risk Values
  const riskRewardRatio = avgLossPct > 0 ? (avgWinPct / avgLossPct) : 3;
  const breakevenWinRate = (1 / (1 + riskRewardRatio)) * 100;
  
  // Minervini Position Sizing Rules:
  // Standard Max Position: 25% of equity (4 positions max concentration)
  // Standard Max Risk per Trade: 1.25% - 1.5% of total account capital
  // In Drawdown: Cut position sizes by 50% (12.5% max position, max risk 0.5 - 0.75% per trade)
  const maxPositionPct = isInDrawdown ? 12.5 : 25;
  const maxAccountRiskPct = isInDrawdown ? 0.75 : 1.5;
  const recommendedStopLossPct = isInDrawdown ? Math.min(avgLossPct, 4) : Math.min(avgLossPct, 7);

  const maxPositionDollars = (accountCapital * maxPositionPct) / 100;
  const maxDollarRiskPerTrade = (accountCapital * maxAccountRiskPct) / 100;

  // --- State for 3-C / Low Cheat Calculator ---
  const [stockPrice, setStockPrice] = useState<number>(100);
  const [baseHigh, setBaseHigh] = useState<number>(120);
  const [baseLow, setBaseLow] = useState<number>(80);

  // Low Cheat Entry calculations (in bottom 1/3 of base)
  const baseRange = baseHigh - baseLow;
  const lowCheatEntry = baseLow + (baseRange * 0.35); // lower third pivot
  const lowCheatStop = lowCheatEntry * 0.96; // 4% stop
  const lowCheatRiskPct = 4.0;
  const lowCheatRewardToHigh = ((baseHigh - lowCheatEntry) / lowCheatEntry) * 100;
  const lowCheatRR = lowCheatRewardToHigh / lowCheatRiskPct;

  // 3-C / Cheat Entry calculations (in top 1/3 / handle)
  const cheat3CEntry = baseHigh * 0.94; // slightly below pivot high
  const cheat3CStop = cheat3CEntry * 0.95; // 5% stop
  const cheat3CRiskPct = 5.0;
  const cheat3CRewardToTarget1 = 15; // 15% move post-breakout
  const cheat3CRR = cheat3CRewardToTarget1 / cheat3CRiskPct;

  // Standard Breakout
  const standardEntry = baseHigh;
  const standardStop = baseHigh * 0.93; // 7% stop
  const standardRiskPct = 7.0;
  const standardRR = 15 / standardRiskPct;

  // --- State for Pre-flight Checklist ---
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, label: 'Stage 2 Uptrend Confirmed: Stock > 150-day & 200-day SMA, 200-day sloped up.', checked: true },
    { id: 2, label: 'VCP Structure: Contractions tightening sequentially (e.g. -20% → -10% → -4%).', checked: true },
    { id: 3, label: 'Volume Dry-Up: Trading volume drops -50% to -80% below 20-day average near pivot.', checked: true },
    { id: 4, label: 'Pivot Point Identified: Buying exactly at pivot price, NOT chasing > 3-5% above.', checked: true },
    { id: 5, label: 'Hard Stop-Loss Defined: Placed under nearest swing low (Max 7-8%, ideal 3-5%).', checked: true },
    { id: 6, label: 'Risk/Reward Ratio ≥ 3:1: Upside target is at least 3x the stop distance.', checked: true },
    { id: 7, label: 'Account Risk Cap: Total dollar risk is ≤ 1.25% - 1.5% of overall equity.', checked: true },
    { id: 8, label: 'Earnings Safety Window: No earnings release scheduled within the next 5-7 days.', checked: true },
    { id: 9, label: 'Contingency Plan Active: Pre-set limit order or stop order set in broker system.', checked: true },
    { id: 10, label: 'Mental Discipline: Unemotional execution with zero averaging down on losses.', checked: true },
  ]);

  const toggleChecklistItem = (id: number) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const checkedCount = checklistItems.filter(i => i.checked).length;
  const isAllChecked = checkedCount === checklistItems.length;

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 sm:p-8 shadow-xs space-y-8 text-[#1a1a1a]">
      
      {/* Header */}
      <div className="border-b border-[#e5e4e1] pb-6 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="bg-[#1a1a1a] text-amber-300 font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest">
            MARK MINERVINI MASTERCLASS
          </span>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
            Think & Trade Like a Champion
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1a1a1a] tracking-tight">
          Think & Trade Like a Champion: Core Strategy Engine
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 font-serif italic max-w-3xl leading-relaxed">
          Comprehensive actionable tools, risk contingency guidelines, early 3-C / Low Cheat setups, and climax exit frameworks direct from Mark Minervini’s championship methodology.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e4e1] pb-4">
        <button
          onClick={() => setActiveTab('risk_drawdown')}
          className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 border ${
            activeTab === 'risk_drawdown'
              ? 'bg-[#1a1a1a] text-amber-300 border-black shadow-xs'
              : 'bg-[#f9f8f5] text-gray-700 border-[#e5e4e1] hover:bg-gray-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>1. Risk & Drawdown Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('cheat_entries')}
          className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 border ${
            activeTab === 'cheat_entries'
              ? 'bg-[#1a1a1a] text-amber-300 border-black shadow-xs'
              : 'bg-[#f9f8f5] text-gray-700 border-[#e5e4e1] hover:bg-gray-100'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>2. 3-C & Low Cheat Entries</span>
        </button>

        <button
          onClick={() => setActiveTab('climax_tops')}
          className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 border ${
            activeTab === 'climax_tops'
              ? 'bg-[#1a1a1a] text-amber-300 border-black shadow-xs'
              : 'bg-[#f9f8f5] text-gray-700 border-[#e5e4e1] hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>3. Climax Tops & Profit Locking</span>
        </button>

        <button
          onClick={() => setActiveTab('preflight_checklist')}
          className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 border ${
            activeTab === 'preflight_checklist'
              ? 'bg-[#1a1a1a] text-amber-300 border-black shadow-xs'
              : 'bg-[#f9f8f5] text-gray-700 border-[#e5e4e1] hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>4. Pre-Flight Champion Checklist</span>
        </button>
      </div>

      {/* TAB 1: RISK & DRAWDOWN ENGINE */}
      {activeTab === 'risk_drawdown' && (
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] text-white p-6 border border-black space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-serif font-bold text-white uppercase tracking-wider">
                  Minervini Dynamic Risk & Position Size Calculator
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 uppercase font-bold">
                Rule: Protect Capital First
              </span>
            </div>

            <p className="text-xs text-gray-300 font-serif italic leading-relaxed">
              &quot;Determine your risk boundaries based on solid trading results instead of allowing feelings to control them. If you observe a downturn in results, enforce tighter risk control and cut position size.&quot; — Mark Minervini
            </p>

            {/* Inputs & Drawdown Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs font-mono">
              <div className="bg-[#242424] p-3 border border-gray-700 space-y-1">
                <label className="text-gray-400 block text-[10px] uppercase font-bold">Account Capital ($)</label>
                <input
                  type="number"
                  value={accountCapital}
                  onChange={(e) => setAccountCapital(Number(e.target.value) || 0)}
                  className="w-full bg-[#121212] border border-gray-600 text-amber-300 font-bold px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="bg-[#242424] p-3 border border-gray-700 space-y-1">
                <label className="text-gray-400 block text-[10px] uppercase font-bold">Recent Win Rate (%)</label>
                <input
                  type="number"
                  value={recentWinRate}
                  onChange={(e) => setRecentWinRate(Number(e.target.value) || 0)}
                  className="w-full bg-[#121212] border border-gray-600 text-white font-bold px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="bg-[#242424] p-3 border border-gray-700 space-y-1">
                <label className="text-gray-400 block text-[10px] uppercase font-bold">Avg Win (%) / Avg Loss (%)</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={avgWinPct}
                    onChange={(e) => setAvgWinPct(Number(e.target.value) || 0)}
                    className="w-1/2 bg-[#121212] border border-gray-600 text-emerald-400 font-bold px-2 py-1"
                    title="Avg Win %"
                  />
                  <span className="text-gray-500">/</span>
                  <input
                    type="number"
                    value={avgLossPct}
                    onChange={(e) => setAvgLossPct(Number(e.target.value) || 0)}
                    className="w-1/2 bg-[#121212] border border-gray-600 text-red-400 font-bold px-2 py-1"
                    title="Avg Loss %"
                  />
                </div>
              </div>

              <div className="bg-[#242424] p-3 border border-gray-700 flex flex-col justify-between">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Trading Regimen Status</span>
                <button
                  onClick={() => setIsInDrawdown(!isInDrawdown)}
                  className={`w-full py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition border cursor-pointer ${
                    isInDrawdown
                      ? 'bg-red-900/80 text-red-200 border-red-600 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {isInDrawdown ? '⚠️ In Drawdown Phase (Halve Position)' : '✅ Normal Regimen (25% Max Position)'}
                </button>
              </div>
            </div>

            {/* Calculated Output Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-800 text-xs font-mono">
              <div className="bg-black/60 p-3 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px] block uppercase">Reward / Risk Ratio</span>
                <span className="text-lg font-bold text-amber-400">{riskRewardRatio.toFixed(2)} : 1</span>
                <span className="text-[9px] text-gray-500 block">Required Win Rate: {breakevenWinRate.toFixed(1)}%</span>
              </div>

              <div className="bg-black/60 p-3 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px] block uppercase">Max Position Size</span>
                <span className="text-lg font-bold text-white">{maxPositionPct}% ({formatCurrency(maxPositionDollars, '$')})</span>
                <span className="text-[9px] text-gray-400 block">{isInDrawdown ? 'Reduced due to Drawdown' : 'Max 4 Concentrated Positions'}</span>
              </div>

              <div className="bg-black/60 p-3 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px] block uppercase">Max Account Risk / Trade</span>
                <span className="text-lg font-bold text-red-400">{maxAccountRiskPct}% ({formatCurrency(maxDollarRiskPerTrade, '$')})</span>
                <span className="text-[9px] text-gray-400 block">Never risk &gt; 1.5% total capital</span>
              </div>

              <div className="bg-black/60 p-3 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px] block uppercase">Max Recommended Stop</span>
                <span className="text-lg font-bold text-amber-300">{recommendedStopLossPct.toFixed(1)}%</span>
                <span className="text-[9px] text-gray-400 block">Strict hard stop limit</span>
              </div>
            </div>
          </div>

          {/* Contingency Rules Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-serif font-black text-[#1a1a1a] uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Minervini Unforeseen Event Contingency Matrix</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
                <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px]">Broker Outage Emergency</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Maintain a backup secondary brokerage account and phone order hotline saved in contacts. Always keep hard stop orders residing on the exchange server rather than local client software.
                </p>
              </div>

              <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
                <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px]">Re-Entry After Stop-Out</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  If stopped out on normal market noise, only re-enter if the stock resets a clean tight VCP base or 3-C pattern with volume dry-up. Never re-enter on pure impulse without a fresh pivot setup.
                </p>
              </div>

              <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
                <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-1.5">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px]">Breakeven Stop Adjustment</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Once a stock advances +2R (e.g. +10-12% on a 5% stop), immediately raise your stop loss to breakeven (entry price). Rule: Never allow a solid gain to turn into a losing trade!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3-C & LOW CHEAT ENTRIES */}
      {activeTab === 'cheat_entries' && (
        <div className="space-y-6">
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-700 tracking-wider">
                  ADVANCED ENTRY METHODOLOGY
                </span>
                <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
                  The 3-C Pattern (Cheat) & Low Cheat Early Entries
                </h3>
              </div>
              <span className="bg-[#1a1a1a] text-amber-300 font-mono text-[10px] font-bold px-2.5 py-1 uppercase">
                Minervini Entry Edge
              </span>
            </div>

            <p className="text-xs text-gray-700 font-serif italic leading-relaxed">
              The 3-C (Cup-Completion-Cheat) and Low Cheat setups allow disciplined traders to initiate positions in the handle or lower third of a base BEFORE the traditional breakout, sharply lowering risk and boosting R:R!
            </p>

            {/* Interactive Calculator Comparison */}
            <div className="bg-white border border-[#e5e4e1] p-4 space-y-3">
              <span className="font-bold text-xs font-mono uppercase text-gray-500 block">
                Interactive Entry Price & Risk Simulator
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block">Base Low ($)</label>
                  <input
                    type="number"
                    value={baseLow}
                    onChange={(e) => setBaseLow(Number(e.target.value) || 0)}
                    className="w-full border border-[#e5e4e1] bg-[#f9f8f5] p-1.5 font-bold text-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block">Base High / Pivot ($)</label>
                  <input
                    type="number"
                    value={baseHigh}
                    onChange={(e) => setBaseHigh(Number(e.target.value) || 0)}
                    className="w-full border border-[#e5e4e1] bg-[#f9f8f5] p-1.5 font-bold text-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block">Current Stock Price ($)</label>
                  <input
                    type="number"
                    value={stockPrice}
                    onChange={(e) => setStockPrice(Number(e.target.value) || 0)}
                    className="w-full border border-[#e5e4e1] bg-[#f9f8f5] p-1.5 font-bold text-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-xs font-sans">
                
                {/* Low Cheat Card */}
                <div className="bg-emerald-50/50 border-2 border-emerald-500 p-4 space-y-2 relative">
                  <span className="absolute -top-3 right-3 bg-emerald-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase">
                    Lowest Risk Entry
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900 uppercase font-mono text-xs">1. Low Cheat Entry</h4>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-relaxed">
                    Executed in the lower 1/3 of an extensive base when volume dries up completely.
                  </p>
                  <div className="space-y-1 font-mono text-[11px] bg-white p-2 border border-emerald-200">
                    <div className="flex justify-between text-gray-700">
                      <span>Entry Price:</span>
                      <strong className="text-emerald-700">${lowCheatEntry.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Stop Price (4%):</span>
                      <strong className="text-red-600">${lowCheatStop.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>R:R to Base High:</span>
                      <strong className="text-emerald-700">{lowCheatRR.toFixed(1)} : 1</strong>
                    </div>
                  </div>
                </div>

                {/* 3-C Cheat Card */}
                <div className="bg-amber-50/50 border-2 border-amber-500 p-4 space-y-2 relative">
                  <span className="absolute -top-3 right-3 bg-amber-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase">
                    Handle / Pivot Cheat
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-amber-900 uppercase font-mono text-xs">2. 3-C Cheat Entry</h4>
                  </div>
                  <p className="text-[11px] text-amber-950 leading-relaxed">
                    Executed in the handle or upper third pivot before full breakout above base high.
                  </p>
                  <div className="space-y-1 font-mono text-[11px] bg-white p-2 border border-amber-200">
                    <div className="flex justify-between text-gray-700">
                      <span>Entry Price:</span>
                      <strong className="text-amber-700">${cheat3CEntry.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Stop Price (5%):</span>
                      <strong className="text-red-600">${cheat3CStop.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>R:R Potential:</span>
                      <strong className="text-amber-700">{cheat3CRR.toFixed(1)} : 1</strong>
                    </div>
                  </div>
                </div>

                {/* Standard Breakout Card */}
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <h4 className="font-bold text-gray-800 uppercase font-mono text-xs">3. Standard Breakout</h4>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Traditional buy order placed exactly at base high breakout resistance.
                  </p>
                  <div className="space-y-1 font-mono text-[11px] bg-white p-2 border border-gray-200">
                    <div className="flex justify-between text-gray-700">
                      <span>Entry Price:</span>
                      <strong className="text-gray-800">${standardEntry.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Stop Price (7%):</span>
                      <strong className="text-red-600">${standardStop.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>R:R Potential:</span>
                      <strong className="text-gray-800">{standardRR.toFixed(1)} : 1</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLIMAX TOPS & PROFIT LOCKING */}
      {activeTab === 'climax_tops' && (
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] text-white p-6 border border-black space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-serif font-bold text-white uppercase tracking-wider">
                  Climax Tops & Profit Preservation Rules
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 uppercase font-bold">
                Selling Into Strength
              </span>
            </div>

            <p className="text-xs text-gray-300 font-serif italic leading-relaxed">
              &quot;To maximize profits, it&apos;s crucial to lock in gains prior to any reversal of the upward price trend. Never let a big gain slip away!&quot; — Mark Minervini
            </p>

            {/* Warning Signs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans pt-2">
              <div className="bg-[#242424] border border-gray-700 p-4 space-y-2">
                <span className="font-bold text-amber-400 uppercase font-mono text-xs block border-b border-gray-700 pb-1">
                  🚨 Climax Top Warning Signals
                </span>
                <ul className="space-y-1.5 text-gray-300 text-[11px] list-disc list-inside">
                  <li><strong>Parabolic Surge:</strong> Rapid price increase over 1-3 weeks with gap-ups after an extended advance.</li>
                  <li><strong>Largest Daily/Weekly Volume:</strong> Massive volume climax occurring near peak prices.</li>
                  <li><strong>7 to 10 Consecutive Up Days:</strong> Extreme overbought momentum with no pullbacks.</li>
                  <li><strong>Price &gt; 100% Above 200-Day SMA:</strong> Extreme extension from long-term moving averages.</li>
                  <li><strong>Exhaustion Gap:</strong> Stock gaps up on heavy volume but closes in the lower half of the daily bar.</li>
                </ul>
              </div>

              <div className="bg-[#242424] border border-gray-700 p-4 space-y-2">
                <span className="font-bold text-emerald-400 uppercase font-mono text-xs block border-b border-gray-700 pb-1">
                  💡 Profit Locking Execution Rules
                </span>
                <ul className="space-y-1.5 text-gray-300 text-[11px] list-disc list-inside">
                  <li><strong>Lock Half at Double Risk:</strong> If risking 5%, sell 50% of position at +10% to +15% gain to eliminate psychological stress.</li>
                  <li><strong>Trail 50-Day SMA:</strong> Once stock reaches initial target, move trailing stop to the 50-day SMA.</li>
                  <li><strong>3 Consecutive Heavy Down Days:</strong> Liquidate immediately if stock falls 3 straight days on expanding volume.</li>
                  <li><strong>Close Below Short-Term MA:</strong> Exit if price drops below 20-day SMA shortly after hitting new high.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRE-FLIGHT CHAMPION CHECKLIST */}
      {activeTab === 'preflight_checklist' && (
        <div className="space-y-6">
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-blue-700 tracking-wider">
                  PRE-ORDER EXECUTION AUDIT
                </span>
                <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
                  10-Point Champion Trade Checklist
                </h3>
              </div>
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className={`px-2.5 py-1 font-bold ${isAllChecked ? 'bg-emerald-600 text-white' : 'bg-[#1a1a1a] text-amber-300'}`}>
                  {checkedCount} / {checklistItems.length} PASSED
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-serif italic leading-relaxed">
              Before placing any trade order with your broker, verify that every single item below meets Minervini&apos;s strict criteria.
            </p>

            {/* Interactive Checklist */}
            <div className="space-y-2 font-sans text-xs">
              {checklistItems.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`flex items-start space-x-3 p-3 border transition cursor-pointer select-none ${
                    item.checked
                      ? 'bg-white border-emerald-300 text-gray-900 shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="mt-0.5 h-4 w-4 text-emerald-600 rounded-none border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className={`font-medium leading-tight ${item.checked ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>
                      {item.id}. {item.label}
                    </span>
                  </div>
                  {item.checked && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </label>
              ))}
            </div>

            {/* Status Summary Banner */}
            <div className={`p-4 border font-mono text-xs flex items-center justify-between ${
              isAllChecked
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="font-bold uppercase">
                  {isAllChecked ? 'APPROVED FOR EXECUTION: High-Probability Champion Setup!' : 'WARNING: Complete all 10 pre-flight checks before placing trade order.'}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
