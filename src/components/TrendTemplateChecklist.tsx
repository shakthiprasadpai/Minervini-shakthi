import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateTrendTemplate } from '../utils/sepaCalculator';
import { CheckCircle2, XCircle, ShieldCheck, AlertCircle, Info, Code, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { PineScriptExporter, PINE_SCRIPT_CODE } from './PineScriptExporter';
import { HistoricalBacktestPanel } from './HistoricalBacktestPanel';

interface TrendTemplateChecklistProps {
  stock: MinerviniTradeSetup;
}

export const TrendTemplateChecklist: React.FC<TrendTemplateChecklistProps> = ({ stock }) => {
  const { rules, passedCount } = evaluateTrendTemplate(stock);
  const isPerfectScore = passedCount === 8;
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


