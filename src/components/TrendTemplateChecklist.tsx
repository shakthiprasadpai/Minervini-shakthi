import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateTrendTemplate } from '../utils/sepaCalculator';
import { CheckCircle2, XCircle, ShieldCheck, AlertCircle, Info, Code, Copy, Check, ChevronDown, ChevronUp, Award, Zap } from 'lucide-react';
import { PineScriptExporter, PINE_SCRIPT_CODE } from './PineScriptExporter';
import { HistoricalBacktestPanel } from './HistoricalBacktestPanel';
import { AutomatedScoreCard } from './AutomatedScoreCard';

interface TrendTemplateChecklistProps {
  stock: MinerviniTradeSetup;
}

export const TrendTemplateChecklist: React.FC<TrendTemplateChecklistProps> = ({ stock }) => {
  const { rules, passedCount } = evaluateTrendTemplate(stock);
  const isPerfectScore = passedCount === 8;
  const setupQualityScore = Math.round((passedCount / rules.length) * 100);

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

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 border transition-all ${
              rule.passed
                ? 'bg-[#f9f8f5] border-[#e5e4e1] hover:border-gray-400'
                : 'bg-red-50/30 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-3">
                {rule.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#1a1a1a] leading-tight">
                    {rule.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Math Breakdown Row */}
            <div className="mt-3 pt-2 border-t border-[#e5e4e1] flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-500">Actual: <strong className={rule.passed ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>{rule.actualValueStr}</strong></span>
              <span className="text-gray-500">Target: <span className="text-[#1a1a1a]">{rule.requiredConditionStr}</span></span>
            </div>
          </div>
        ))}
      </div>

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


