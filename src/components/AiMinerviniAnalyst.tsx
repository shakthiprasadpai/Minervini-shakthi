import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { Sparkles, Bot, RefreshCw, AlertCircle } from 'lucide-react';

interface AiMinerviniAnalystProps {
  stock: MinerviniTradeSetup;
}

export const AiMinerviniAnalyst: React.FC<AiMinerviniAnalystProps> = ({ stock }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1a1a1a] text-white flex items-center justify-center font-serif italic font-bold">
            AI
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">Quantitative Audit</span>
              <span className="bg-[#1a1a1a] text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-bold">
                Gemini 2.5
              </span>
            </div>
            <h3 className="text-lg font-serif font-black text-[#1a1a1a] leading-tight mt-0.5">
              Minervini AI Trade Desk Analysis — {stock.ticker}
            </h3>
          </div>
        </div>

        <button
          id="btn-ai-analyze"
          onClick={handleFetchAiAnalysis}
          disabled={loading}
          className="bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-[0.15em] px-4 py-2.5 flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Setup...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{analysis ? 'Re-Audit Setup' : 'Generate AI Audit'}</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Output */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-start space-x-3 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Audit Warning:</strong> {error}
          </div>
        </div>
      )}

      {analysis ? (
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] border-l-4 border-l-[#1a1a1a] p-5 text-xs text-[#1a1a1a] leading-relaxed space-y-3 font-serif italic whitespace-pre-line">
          {analysis}
        </div>
      ) : (
        !loading && (
          <div className="bg-[#f9f8f5] border border-dashed border-[#e5e4e1] p-8 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-[#b5a68d] mx-auto" />
            <h4 className="text-sm font-serif font-bold text-[#1a1a1a]">
              Request Gemini AI Trade Desk Audit
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto font-serif italic">
              Analyze {stock.ticker}'s Stage 2 Trend Template rules, VCP contraction progression, tight volume dry-up status, and exact risk/reward setup directly using Gemini.
            </p>
          </div>
        )
      )}
    </div>
  );
};

