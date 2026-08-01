import React, { useState, useEffect, useRef } from 'react';
import { MinerviniTradeSetup } from '../types';
import { Sparkles, Bot, RefreshCw, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';

interface AiMinerviniAnalystProps {
  stock: MinerviniTradeSetup;
}

export const AiMinerviniAnalyst: React.FC<AiMinerviniAnalystProps> = ({ stock }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  const prevStockRef = useRef<string>('');

  const handleFetchAiAnalysis = async (isAuto = false) => {
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
      setLastUpdatedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI analysis');
    } finally {
      setLoading(false);
    }
  };

  // Automatic updation of LLM analysis whenever stock setup or ticker changes
  useEffect(() => {
    const stockKey = `${stock.ticker}-${stock.currentPrice}-${stock.vcpStage}-${stock.volumeDryUpPercent}-${stock.pivotPrice}`;
    if (autoUpdate && stockKey !== prevStockRef.current) {
      prevStockRef.current = stockKey;
      handleFetchAiAnalysis(true);
    }
  }, [stock.ticker, stock.currentPrice, stock.vcpStage, stock.volumeDryUpPercent, stock.pivotPrice, autoUpdate]);

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
              <span className={`text-[9px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider flex items-center space-x-1 ${
                autoUpdate ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <Zap className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>Auto-Update LLM: {autoUpdate ? 'ON' : 'OFF'}</span>
              </span>
            </div>
            <h3 className="text-lg font-serif font-black text-[#1a1a1a] leading-tight mt-0.5 flex items-center space-x-2">
              <span>Minervini AI Trade Desk Analysis — {stock.ticker}</span>
              {lastUpdatedTime && (
                <span className="text-[10px] font-mono font-normal text-gray-500">
                  (Updated {lastUpdatedTime})
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`text-xs font-mono px-3 py-2 border transition-all flex items-center space-x-1.5 cursor-pointer ${
              autoUpdate
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                : 'bg-gray-50 text-gray-500 border-gray-300'
            }`}
            title="Toggle automatic LLM analysis update when stock or setup parameters change"
          >
            <Zap className={`w-3.5 h-3.5 ${autoUpdate ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span>Auto-Update: {autoUpdate ? 'Active' : 'Paused'}</span>
          </button>

          <button
            id="btn-ai-analyze"
            onClick={() => handleFetchAiAnalysis(false)}
            disabled={loading}
            className="bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-[0.15em] px-4 py-2 flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating LLM...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{analysis ? 'Force Re-Audit' : 'Generate AI Audit'}</span>
              </>
            )}
          </button>
        </div>
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
        <div className="relative bg-[#f9f8f5] border border-[#e5e4e1] border-l-4 border-l-[#1a1a1a] p-5 text-xs text-[#1a1a1a] leading-relaxed space-y-3 font-serif italic whitespace-pre-line">
          {loading && (
            <div className="absolute top-2 right-2 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold px-2 py-1 flex items-center space-x-1 shadow-xs animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
              <span>Syncing LLM Updates...</span>
            </div>
          )}
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

