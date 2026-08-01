import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateRefinedSepaScreener, REFINED_MINERVINI_FORMULA_TEXT } from '../utils/refinedSepaScreener';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Zap,
  TrendingUp,
  BarChart3,
  Award,
  Layers,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface RefinedSepaScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
}

export const RefinedSepaScreenerModal: React.FC<RefinedSepaScreenerModalProps> = ({
  isOpen,
  onClose,
  stocks,
  onSelectStock
}) => {
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'LIVE_SCREENER' | 'FORMULA'>('ANALYSIS');
  const [copied, setCopied] = useState(false);
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>(stocks[0]?.ticker || '');
  const [filterOnlyFullyQualified, setFilterOnlyFullyQualified] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStock = stocks.find(s => s.ticker === selectedStockTicker) || stocks[0];
  const evalResult = currentStock ? evaluateRefinedSepaScreener(currentStock) : null;

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(REFINED_MINERVINI_FORMULA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const screenedStocks = stocks.map(stock => {
    const res = evaluateRefinedSepaScreener(stock);
    return { stock, res };
  });

  const filteredStocks = filterOnlyFullyQualified
    ? screenedStocks.filter(item => item.res.passedCount >= 14)
    : screenedStocks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border-2 border-[#1a1a1a] max-w-5xl w-full my-8 shadow-2xl space-y-6 relative text-[#1a1a1a] overflow-hidden rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#10141d] text-white p-6 border-b border-[#232936] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-widest">
                SEPA ENHANCED ENGINE
              </span>
              <span className="text-amber-400 font-serif italic text-xs">
                Precision Screener Refinement
              </span>
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tight text-white flex items-center space-x-2">
              <span>Refined Mark Minervini Strategy Screener</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Updated with 18-point institutional criteria: 25%+ earnings growth, sales acceleration, margin expansion, PEG &lt; 1.2, RSI 50–70, &amp; volume confirmation.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-700 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="px-6 flex flex-wrap items-center justify-between border-b border-[#e5e4e1] bg-[#f9f8f5]">
          <div className="flex items-center space-x-2 py-2">
            <button
              onClick={() => setActiveTab('ANALYSIS')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'ANALYSIS'
                  ? 'bg-[#1a1a1a] text-amber-300 shadow-xs'
                  : 'text-gray-700 hover:text-black hover:bg-gray-200/50'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Strategy Evaluation</span>
            </button>

            <button
              onClick={() => setActiveTab('LIVE_SCREENER')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'LIVE_SCREENER'
                  ? 'bg-[#1a1a1a] text-amber-300 shadow-xs'
                  : 'text-gray-700 hover:text-black hover:bg-gray-200/50'
              }`}
            >
              <Filter className="w-4 h-4 text-emerald-400" />
              <span>Live 18-Point Screener ({stocks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('FORMULA')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'FORMULA'
                  ? 'bg-[#1a1a1a] text-amber-300 shadow-xs'
                  : 'text-gray-700 hover:text-black hover:bg-gray-200/50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Enhanced Formula</span>
            </button>
          </div>

          <button
            onClick={handleCopyFormula}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Formula Copied!' : 'Copy 18-Point Code'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">

          {/* TAB 1: STRATEGY EVALUATION & IMPROVEMENTS */}
          {activeTab === 'ANALYSIS' && (
            <div className="space-y-6">
              
              {/* Introduction Card */}
              <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-mono text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Mark Minervini Strategy Screener Evaluation</span>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed font-sans">
                  Your screener captures core Minervini SEPA principles effectively—including moving average trend structure (50MA &gt; 200MA), 52-week price range criteria (within 25% of high, &gt;30% off low), and low leverage. Below are the 6 strategic refinements to align precisely with Minervini&apos;s institutional standards.
                </p>
              </div>

              {/* 6 Strategic Improvement Areas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Area 1 */}
                <div className="border border-[#e5e4e1] p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">01</span>
                    <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">Earnings Growth Criteria Refinement</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Minervini requires minimum 25% YoY quarterly EPS growth (preferably 30–50%+) and 25%+ 3-year CAGR rather than conservative 15% limits.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 font-mono text-[11px] font-bold text-emerald-900">
                    Rule: Profit growth 3Years &gt; 25 AND YOY Quarterly profit growth &gt; 25
                  </div>
                </div>

                {/* Area 2 */}
                <div className="border border-[#e5e4e1] p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">02</span>
                    <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">Sales Growth &amp; Acceleration</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Requires 20%+ 3-year sales growth and YoY quarterly growth, plus a sequential sales acceleration pattern where latest quarter exceeds preceding quarter by 20%+.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 font-mono text-[11px] font-bold text-emerald-900">
                    Rule: Sales latest quarter &gt; Sales preceding quarter * 1.20
                  </div>
                </div>

                {/* Area 3 */}
                <div className="border border-[#e5e4e1] p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">03</span>
                    <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">Net Profit Margin Optimization</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Focuses on expanding margins over time to ensure profit growth originates from operational leverage rather than temporary accounting adjustments.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 font-mono text-[11px] font-bold text-emerald-900">
                    Rule: NPM last year &gt; 8 AND NPM latest quarter &gt; NPM preceding quarter
                  </div>
                </div>

                {/* Area 4 */}
                <div className="border border-[#e5e4e1] p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">04</span>
                    <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">PEG Ratio Refinement</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Tightens PEG ratio threshold from legacy 1.5 down to &lt; 1.2 to ensure high-growth stock valuation remains sustainable relative to earnings speed.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 font-mono text-[11px] font-bold text-emerald-900">
                    Rule: PEG Ratio &lt; 1.2
                  </div>
                </div>

                {/* Area 5 */}
                <div className="border border-[#e5e4e1] p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">05</span>
                    <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">RSI Momentum Sweet Spot</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Filters for RSI values between 50 and 70 to capture strong upward momentum while avoiding overbought exhaustion or weak laggards.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 font-mono text-[11px] font-bold text-emerald-900">
                    Rule: RSI &gt; 50 AND RSI &lt; 70
                  </div>
                </div>

                {/* Area 6 */}
                <div className="border border-[#e5e4e1] p-4 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">06</span>
                    <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">Volume Analysis Addition</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Mandates volume confirmation during breakout moves—requiring current volume to exceed 1.2x (20% above) its 50-day average volume.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 font-mono text-[11px] font-bold text-emerald-900">
                    Rule: Volume &gt; Volume 50-day average * 1.2
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE 18-POINT SCREENER RESULTS */}
          {activeTab === 'LIVE_SCREENER' && evalResult && (
            <div className="space-y-6">
              
              {/* Stock Selector & Filter Toolbar */}
              <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-gray-600">Select Stock:</span>
                  <select
                    value={selectedStockTicker}
                    onChange={(e) => setSelectedStockTicker(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#e5e4e1] font-mono font-bold text-xs cursor-pointer focus:outline-none focus:border-black"
                  >
                    {stocks.map(s => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer font-mono text-xs text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={filterOnlyFullyQualified}
                      onChange={(e) => setFilterOnlyFullyQualified(e.target.checked)}
                      className="h-3.5 w-3.5 text-emerald-600 rounded-none border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Only High Alignment Setups (&ge;14/18)</span>
                  </label>

                  <button
                    onClick={() => {
                      onSelectStock(currentStock);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-black text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Load {currentStock.ticker} in Workbench</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stock Evaluation Score Card Header */}
              <div className="bg-[#10141d] text-white border border-[#232936] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-serif font-black">{currentStock.ticker}</span>
                      <span className="text-xs text-gray-400 font-serif italic">({currentStock.name})</span>
                    </div>
                    <p className="text-xs font-mono text-gray-400">
                      Sector: {currentStock.sector} | Industry: {currentStock.industry} | Exchange: {currentStock.exchange}
                    </p>
                  </div>

                  <div className={`px-4 py-2 border font-mono font-bold text-xs uppercase tracking-wider ${evalResult.qualityGrade.bgBadge}`}>
                    <span>18-Point Score: {evalResult.passedCount} / 18 ({evalResult.scorePercent}%)</span>
                  </div>
                </div>

                {/* 6 Strategic Improvement Check Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 font-mono text-[10px]">
                  {Object.entries(evalResult.improvementAreaScores).map(([key, item]) => (
                    <div
                      key={key}
                      className={`p-2 border text-center font-bold ${
                        item.passed ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        {item.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        <span>{item.passed ? 'PASSED' : 'REJECTED'}</span>
                      </div>
                      <span className="block truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 18 Rules Grid Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-gray-600">
                  Full 18-Rule Parameter Evaluation Breakdown for {currentStock.ticker}:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evalResult.rules.map(rule => (
                    <div
                      key={rule.id}
                      className={`p-3 border text-xs space-y-1.5 transition-colors ${
                        rule.passed
                          ? 'bg-[#f9f8f5] border-[#e5e4e1]'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                          {rule.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="font-bold text-[#1a1a1a]">{rule.title}</span>
                        </div>

                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 font-bold uppercase shrink-0">
                          {rule.strategicImprovementArea}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 leading-tight">
                        {rule.description}
                      </p>

                      <div className="flex items-center justify-between font-mono text-[10px] pt-1 border-t border-gray-200/60">
                        <span className="text-gray-500">
                          Formula: <code className="text-amber-900 bg-amber-50 px-1 py-0.5 border border-amber-200 font-bold">{rule.codeFormula}</code>
                        </span>
                        <span className="text-gray-700 font-bold">
                          Actual: <strong className={rule.passed ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>{rule.actualValueStr}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ENHANCED FORMULA CODE & IMPLEMENTATION */}
          {activeTab === 'FORMULA' && (
            <div className="space-y-6">
              
              <div className="bg-[#0e1117] text-white border border-gray-800 p-5 space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                      Enhanced Refined Minervini Screener Formula
                    </span>
                  </div>

                  <button
                    onClick={handleCopyFormula}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Formula'}</span>
                  </button>
                </div>

                <pre className="text-xs text-emerald-300 bg-black/60 p-4 border border-gray-800 whitespace-pre-wrap break-all leading-relaxed font-mono">
                  {REFINED_MINERVINI_FORMULA_TEXT}
                </pre>

                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Use this formula directly in custom screener tools (e.g., Chartink, Screener.in, MarketInOut, or custom Python/PineScript backtesters).
                </p>
              </div>

              {/* Implementation Roadmap Strategy */}
              <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-3">
                <h4 className="text-sm font-bold font-serif text-[#1a1a1a] flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>3-Phase Implementation Strategy</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="bg-white border border-[#e5e4e1] p-3 space-y-1">
                    <span className="font-mono text-[10px] font-bold text-amber-800 uppercase block">Phase 1: Gradual Integration</span>
                    <p className="text-gray-700 leading-relaxed">
                      Implement 1 or 2 refined filters at a time (e.g. EPS growth &gt; 25% and PEG &lt; 1.2) to observe candidate quality changes.
                    </p>
                  </div>

                  <div className="bg-white border border-[#e5e4e1] p-3 space-y-1">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase block">Phase 2: Performance Tracking</span>
                    <p className="text-gray-700 leading-relaxed">
                      Monitor candidate breakout completion rates and track subsequent 20–35% move success probability.
                    </p>
                  </div>

                  <div className="bg-white border border-[#e5e4e1] p-3 space-y-1">
                    <span className="font-mono text-[10px] font-bold text-teal-800 uppercase block">Phase 3: Fine-Tuning &amp; Adaptability</span>
                    <p className="text-gray-700 leading-relaxed">
                      Fine-tune volume thresholds and RSI bands according to broader market regime (Stage 2 bullish vs choppy consolidation).
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f9f8f5] border-t border-[#e5e4e1] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 text-gray-600">
            <Info className="w-4 h-4 text-amber-600" />
            <span>Mark Minervini SEPA Strategy Refinement Module</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a1a1a] hover:bg-black text-amber-300 font-bold uppercase tracking-wider cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
