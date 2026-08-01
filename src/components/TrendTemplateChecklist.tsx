import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateTrendTemplate } from '../utils/sepaCalculator';
import { evaluateRefinedSepaScreener } from '../utils/refinedSepaScreener';
import { CheckCircle2, XCircle, ShieldCheck, AlertCircle, Info, Code, Copy, Check, ChevronDown, ChevronUp, Award, Zap, X, RotateCcw, Sparkles, ArrowUpRight } from 'lucide-react';
import { PineScriptExporter, PINE_SCRIPT_CODE } from './PineScriptExporter';
import { HistoricalBacktestPanel } from './HistoricalBacktestPanel';
import { AutomatedScoreCard } from './AutomatedScoreCard';

interface Stage2Explanation {
  summary: string;
  rationale: string;
  minerviniInsight: string;
}

const STAGE_2_EXPLANATIONS: Record<string, Stage2Explanation> = {
  rule_1: {
    summary: 'Establishes Macro Bullish Trend Baseline',
    rationale: 'Trading above the 150-day and 200-day SMAs confirms long-term institutional accumulation. Big funds defend these key levels, preventing overhead supply from causing persistent selling pressure.',
    minerviniInsight: 'Never buy stocks trading below long-term moving averages; Stage 2 requires sustained institutional support above key baseline trendlines.'
  },
  rule_2: {
    summary: 'Validates Intermediate Momentum over Baseline',
    rationale: 'When the 150-day SMA trades above the 200-day SMA, it confirms a "Golden Cross" alignment. Short-to-intermediate buying pressure is outpacing long-term baseline trends.',
    minerviniInsight: 'Moving average alignment (150 > 200) ensures you are trading with the path of least resistance, avoiding choppy or declining stocks.'
  },
  rule_3: {
    summary: 'Guarantees Macro Trend Slope is Upward',
    rationale: 'A flat or declining 200-day SMA indicates Stage 1 consolidation or Stage 4 distribution. An upward-sloping 200-day SMA for at least 1–2 months provides a strong tailwind.',
    minerviniInsight: 'A rising 200-day SMA is a non-negotiable benchmark of Stage 2. It proves the stock has sustained long-term institutional backing.'
  },
  rule_4: {
    summary: 'Establishes Perfect Bullish Moving Average Hierarchy',
    rationale: 'Stacking moving averages (50 > 150 > 200) creates optimal trend hierarchy. Short-term buying demand is accelerating faster than medium and long-term averages.',
    minerviniInsight: 'Multiple moving average stacking confirms multi-timeframe alignment, eliminating laggy stocks and targeting high-momentum market leaders.'
  },
  rule_5: {
    summary: 'Confirms Short-Term Institutional Demand',
    rationale: 'The 50-day SMA is the primary level where institutions step in to buy pullbacks. Trading above the 50-day SMA indicates healthy short-term buying interest.',
    minerviniInsight: 'Staying above the 50-day SMA keeps you positioned in stocks with active accumulation and prevents entering during deep pullbacks.'
  },
  rule_6: {
    summary: 'Verifies Stage 1 to Stage 2 Base Breakout',
    rationale: 'Superperformers make initial powerful moves out of Stage 1 bottoming bases. Requiring at least +30% above the 52-week low filters out dead-money bottom fishing.',
    minerviniInsight: 'Market leaders bounce strongly off their lows before entering massive Stage 2 advances. Avoid bottom-picking and wait for price power.'
  },
  rule_7: {
    summary: 'Ensures Proximity to Leadership Highs',
    rationale: 'True market leaders trade near new 52-week highs, not bargain lows. Trading within 25% of highs minimizes overhead resistance from trapped sellers.',
    minerviniInsight: 'Buy strength, not weakness. Stocks near 52-week highs have clear skies ahead with minimal overhead supply.'
  },
  rule_8: {
    summary: 'Filters for Market-Leading Outperformance',
    rationale: 'An RS Rating of 70+ confirms the stock is outperforming at least 70% of all stocks in the market, highlighting institutional sponsorship.',
    minerviniInsight: 'Focus exclusively on top-tier relative strength leaders. High RS ratings are the hallmark of future Stage 2 Superperformers.'
  }
};

interface TrendTemplateChecklistProps {
  stock: MinerviniTradeSetup;
}

export const TrendTemplateChecklist: React.FC<TrendTemplateChecklistProps> = ({ stock }) => {
  // Local state tracking for manually marked/overridden rules
  const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`vcp_trend_checklist_${stock.ticker}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Re-sync overrides when stock.ticker changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`vcp_trend_checklist_${stock.ticker}`);
      setUserOverrides(saved ? JSON.parse(saved) : {});
    } catch {
      setUserOverrides({});
    }
  }, [stock.ticker]);

  const { rules: calculatedRules } = evaluateTrendTemplate(stock);

  // Combine calculated rule output with user manual overrides
  const rules = calculatedRules.map((rule) => {
    const isOverridden = userOverrides[rule.id] !== undefined;
    const passed = isOverridden ? userOverrides[rule.id] : rule.passed;
    return {
      ...rule,
      passed,
      isOverridden,
      calculatedPassed: rule.passed
    };
  });

  const passedCount = rules.filter((r) => r.passed).length;
  const isPerfectScore = passedCount === 8;
  const setupQualityScore = Math.round((passedCount / rules.length) * 100);
  const overriddenCount = Object.keys(userOverrides).length;
  const hasOverrides = overriddenCount > 0;

  const toggleRulePassed = (ruleId: string, currentPassed: boolean) => {
    setUserOverrides((prev) => {
      const next = { ...prev, [ruleId]: !currentPassed };
      try {
        localStorage.setItem(`vcp_trend_checklist_${stock.ticker}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleResetChecklist = () => {
    setUserOverrides({});
    try {
      localStorage.removeItem(`vcp_trend_checklist_${stock.ticker}`);
    } catch (e) {
      console.error(e);
    }
  };

  const getQualityGrade = (score: number) => {
    if (score === 100) return { grade: 'A+', label: 'Institutional Stage 2', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500' };
    if (score >= 87) return { grade: 'A', label: 'High Probability Setup', color: 'text-emerald-300 bg-emerald-900/60 border-emerald-500' };
    if (score >= 75) return { grade: 'B', label: 'Developing Trend', color: 'text-amber-300 bg-amber-950/80 border-amber-500' };
    if (score >= 50) return { grade: 'C', label: 'Sub-Optimal Trend', color: 'text-orange-300 bg-orange-950/80 border-orange-500' };
    return { grade: 'F', label: 'Unqualified / High Risk', color: 'text-rose-300 bg-rose-950/80 border-rose-500' };
  };

  const qualityInfo = getQualityGrade(setupQualityScore);

  const [isPineModalOpen, setIsPineScriptModalOpen] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PINE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">Stage 2 Verification</span>
          <div className="flex items-center space-x-2 mt-0.5">
            <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
              Mark Minervini 8-Point Trend Template
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-serif italic mt-0.5">
            Uptrend criteria evaluation for <span className="font-bold text-[#1a1a1a] not-italic">{stock.ticker}</span>
          </p>
        </div>

        {/* Action Buttons & Score Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {hasOverrides && (
            <button
              onClick={handleResetChecklist}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
              title="Reset all manual checklist overrides to calculated defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>Reset Checklist ({overriddenCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsPineScriptModalOpen(true)}
            className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-black text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>TradingView Pine Script (v5)</span>
          </button>

          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 border text-xs font-bold uppercase tracking-wider ${
              isPerfectScore
                ? 'bg-[#1a1a1a] text-white border-black'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {isPerfectScore ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-700" />
            )}
            <span>
              {isPerfectScore ? 'QUALIFIED STAGE 2 (8/8)' : `PASSES ${passedCount}/8 CRITERIA`}
            </span>
          </div>
        </div>
      </div>

      {/* Setup Quality Score Card */}
      <div className="bg-[#0f141c] text-white border border-gray-800 p-5 space-y-4 font-mono shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-bold text-amber-400 block">
                SEPA Quantitative Evaluation
              </span>
              <h4 className="text-base font-serif font-black text-white mt-0.5">
                Setup Quality Score
              </h4>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                0–100 Rating calculated from 8 Minervini Trend Template rules
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Numeric Score Readout */}
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-mono">Quality Score</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-amber-400 font-mono leading-none">{setupQualityScore}</span>
                <span className="text-sm text-gray-400 font-bold">/ 100</span>
              </div>
            </div>

            {/* Quality Grade Badge */}
            <div className={`px-3.5 py-2 border text-center font-bold ${qualityInfo.color}`}>
              <span className="text-lg font-black block leading-none">{qualityInfo.grade}</span>
              <span className="text-[9px] font-sans tracking-wider uppercase block mt-1">{qualityInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Rule Count Status */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-300">
            <span className="font-sans text-gray-400">Rule Pass Rate: <strong className="text-white font-mono">{passedCount} / {rules.length} Criteria Passed</strong></span>
            <span className="font-mono font-bold text-amber-300">{setupQualityScore}% Quality Score</span>
          </div>

          <div className="w-full bg-gray-800 h-2.5 rounded-none overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-500 ${
                setupQualityScore === 100
                  ? 'bg-emerald-400'
                  : setupQualityScore >= 87
                  ? 'bg-emerald-500'
                  : setupQualityScore >= 75
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${setupQualityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Automated Setup Scorecard */}
      <AutomatedScoreCard stock={stock} />

      {/* Checklist Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e5e4e1]">
        <div className="flex items-center space-x-2">
          <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#1a1a1a]">
            Interactive 8-Point Trend Template Rules ({passedCount}/8 Passed)
          </span>
          {hasOverrides && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase tracking-wider">
              {overriddenCount} {overriddenCount === 1 ? 'rule' : 'rules'} manually modified
            </span>
          )}
        </div>

        <button
          onClick={handleResetChecklist}
          disabled={!hasOverrides}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all border ${
            hasOverrides
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 shadow-2xs cursor-pointer'
              : 'bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed'
          }`}
          title={hasOverrides ? 'Reset all manual rule edits back to calculated defaults' : 'Checklist is currently matching calculated defaults'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Checklist</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 border transition-all ${
              rule.passed
                ? 'bg-[#f9f8f5] border-[#e5e4e1] hover:border-gray-400'
                : 'bg-red-50/30 border-red-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-3">
                {/* Clickable Pass/Fail Status Circle */}
                <button
                  type="button"
                  onClick={() => toggleRulePassed(rule.id, rule.passed)}
                  className="mt-0.5 shrink-0 focus:outline-none cursor-pointer group"
                  title={rule.passed ? "Click to toggle rule as Failed" : "Click to toggle rule as Passed"}
                >
                  {rule.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#1a1a1a] leading-tight">
                      {rule.title}
                    </h4>

                    <button
                      type="button"
                      id={`info-rule-${rule.id}`}
                      onClick={() => setSelectedRuleId(rule.id)}
                      title="Why is this rule important for Stage 2 analysis?"
                      className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100/60 rounded transition-colors cursor-pointer shrink-0"
                      aria-label={`Explanation for ${rule.title}`}
                    >
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                    </button>

                    {rule.isOverridden && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                        Manual Override
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>

              {/* Manual Override Checkbox Toggle */}
              <div className="flex items-center shrink-0">
                <label
                  className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-mono text-gray-600 hover:text-black select-none bg-white/80 px-2 py-1 border border-gray-200 hover:border-gray-400 transition-colors"
                  title="Toggle manual pass/fail state for this rule"
                >
                  <input
                    type="checkbox"
                    checked={rule.passed}
                    onChange={() => toggleRulePassed(rule.id, rule.passed)}
                    className="h-3.5 w-3.5 text-emerald-600 rounded-none border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className={`font-bold uppercase text-[9px] ${rule.passed ? 'text-emerald-700' : 'text-red-600'}`}>
                    {rule.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </label>
              </div>
            </div>

            {/* Math Breakdown Row */}
            <div className="mt-3 pt-2 border-t border-[#e5e4e1] flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-500">
                Actual: <strong className={rule.passed ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>{rule.actualValueStr}</strong>
              </span>
              <span className="text-gray-500">
                Target: <span className="text-[#1a1a1a]">{rule.requiredConditionStr}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stage 2 Rule Explanation Popup Modal */}
      {selectedRuleId && STAGE_2_EXPLANATIONS[selectedRuleId] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedRuleId(null)}
        >
          <div 
            className="bg-white border-2 border-[#1a1a1a] max-w-lg w-full p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-150 text-[#1a1a1a]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedRuleId(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-300"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-3 pr-8">
              <span className="p-1.5 bg-amber-100 text-amber-800 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-300">
                Stage 2 Analysis
              </span>
              <h3 className="text-sm font-bold font-serif text-[#1a1a1a]">
                {rules.find(r => r.id === selectedRuleId)?.title}
              </h3>
            </div>

            {/* Summary Tag */}
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-2.5 font-mono text-xs font-bold text-amber-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{STAGE_2_EXPLANATIONS[selectedRuleId].summary}</span>
            </div>

            {/* Rationale Section */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] font-mono block">
                Why This Rule is Crucial for Stage 2
              </span>
              <p className="text-gray-800 leading-relaxed font-sans">
                {STAGE_2_EXPLANATIONS[selectedRuleId].rationale}
              </p>
            </div>

            {/* Minervini Insight Box */}
            <div className="bg-[#1a1a1a] text-amber-300 p-3.5 border border-black space-y-1 font-mono text-xs">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest block">
                Minervini Stage 2 Rule
              </span>
              <p className="text-amber-200 text-[11px] font-serif italic leading-relaxed">
                &quot;{STAGE_2_EXPLANATIONS[selectedRuleId].minerviniInsight}&quot;
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRuleId(null)}
                className="px-4 py-1.5 bg-[#1a1a1a] hover:bg-black text-amber-300 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border border-black"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Pine Script Code Banner */}
      <div className="bg-[#0e1117] text-white border border-gray-800 p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              TradingView Indicator Integration Code
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider flex items-center space-x-1 transition-all"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={() => setShowCodePreview(!showCodePreview)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {showCodePreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showCodePreview && (
          <div className="mt-2 p-3 bg-[#010409] border border-gray-800 text-[11px] text-emerald-300/90 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
            <pre>{PINE_SCRIPT_CODE}</pre>
          </div>
        )}
      </div>

      {/* Enhanced 18-Point SEPA Strategy Evaluation Summary */}
      {(() => {
        const refinedRes = evaluateRefinedSepaScreener(stock);
        return (
          <div className="bg-[#10141d] text-white border border-[#232936] p-5 space-y-4 rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-serif font-black text-white">
                  Refined 18-Point SEPA Strategy Assessment
                </h4>
              </div>

              <div className="px-3 py-1 bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider">
                Refined Score: {refinedRes.passedCount} / 18 ({refinedRes.scorePercent}%)
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] font-mono">
              {Object.entries(refinedRes.improvementAreaScores).map(([k, item]) => (
                <div
                  key={k}
                  className={`p-2 border text-center font-bold ${
                    item.passed ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {item.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                    <span>{item.passed ? 'PASSED' : 'REJECTED'}</span>
                  </div>
                  <span className="block truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Footer Info Box */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex items-start space-x-3 text-xs text-gray-600">
        <Info className="w-4 h-4 text-[#1a1a1a] shrink-0 mt-0.5" />
        <p className="font-serif italic leading-relaxed">
          <strong className="text-[#1a1a1a] font-sans not-italic">Minervini Principle:</strong> Never buy a stock that fails the Trend Template. Stage 2 provides the structural backbone where major institutional accumulation and massive price moves occur.
        </p>
      </div>

      {/* Historical Breakout Backtest Panel */}
      <HistoricalBacktestPanel stock={stock} />

      {/* Pine Script Exporter Modal */}
      <PineScriptExporter
        stock={stock}
        isOpen={isPineModalOpen}
        onClose={() => setIsPineScriptModalOpen(false)}
      />
    </div>
  );
};


