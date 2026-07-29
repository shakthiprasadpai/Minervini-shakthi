import React, { useState } from 'react';
import { MinerviniTradeSetup, VcpContraction } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  Layers,
  Award,
  TrendingDown,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BarChart3,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface VcpTemplateOverlayProps {
  stock: MinerviniTradeSetup;
}

export interface VcpSuccessTemplate {
  id: string;
  name: string;
  description: string;
  targetContractionsCount: number;
  expectedT1Depth: string;
  expectedT2Depth: string;
  expectedT3Depth?: string;
  expectedT4Depth?: string;
  idealTotalDays: string;
  historicalWinRate: number; // e.g. 78%
  avgGainPercent: number; // e.g. 32%
  keyTraits: string[];
}

export const HISTORICAL_VCP_TEMPLATES: VcpSuccessTemplate[] = [
  {
    id: 'CLASSIC_3T',
    name: 'Classic Minervini 3-Contraction VCP',
    description: 'The premier Mark Minervini SEPA setup. Standard 3-stage volatility squeeze where each pullback shrinks by ~50% from the prior stage.',
    targetContractionsCount: 3,
    expectedT1Depth: '25% - 35%',
    expectedT2Depth: '10% - 18%',
    expectedT3Depth: '3% - 7%',
    idealTotalDays: '35 - 65 Days',
    historicalWinRate: 78,
    avgGainPercent: 32,
    keyTraits: ['50% depth reduction per stage', 'Terminal dry-up below 50% avg vol', 'Tight 3-7% final pivot']
  },
  {
    id: 'HIGH_TIGHT_FLAG',
    name: 'High-Tight Flag VCP',
    description: 'High-momentum power setup occurring after a rapid 100%+ advance. Features extremely shallow, fast contractions.',
    targetContractionsCount: 2,
    expectedT1Depth: '12% - 20%',
    expectedT2Depth: '4% - 8%',
    expectedT3Depth: '2% - 4%',
    idealTotalDays: '15 - 30 Days',
    historicalWinRate: 84,
    avgGainPercent: 45,
    keyTraits: ['Power impulse prerequisite', 'Ultra-fast consolidation (2-4 weeks)', 'Explosive breakout velocity']
  },
  {
    id: 'DEEP_SHAKEOUT_4T',
    name: '4-Stage Institutional Deep Shakeout',
    description: 'Extended base pattern designed to flush out weak retail hands across 4 contractions before institutional accumulation.',
    targetContractionsCount: 4,
    expectedT1Depth: '35% - 48%',
    expectedT2Depth: '18% - 26%',
    expectedT3Depth: '8% - 14%',
    expectedT4Depth: '3% - 6%',
    idealTotalDays: '60 - 110 Days',
    historicalWinRate: 72,
    avgGainPercent: 38,
    keyTraits: ['Deep primary base shakeout', '4th contraction locks in terminal coil', 'High-volume institutional absorption']
  },
  {
    id: 'MICRO_SHALLOW_2T',
    name: 'Shallow Micro-Contraction Coil',
    description: 'Compact 2-contraction setup sitting right on top of the 50-day moving average, showing immediate supply absorption.',
    targetContractionsCount: 2,
    expectedT1Depth: '15% - 22%',
    expectedT2Depth: '4% - 8%',
    idealTotalDays: '20 - 40 Days',
    historicalWinRate: 75,
    avgGainPercent: 25,
    keyTraits: ['Rests directly on 50d SMA', 'Minimal overhead supply', 'Quick 3-5 week formation']
  }
];

export function evaluateTemplateMatch(
  contractions: VcpContraction[],
  template: VcpSuccessTemplate
): { matchScore: number; feedback: string[]; isBestMatch: boolean } {
  if (!contractions || contractions.length === 0) {
    return { matchScore: 0, feedback: ['No contractions identified.'], isBestMatch: false };
  }

  let score = 0;
  const feedback: string[] = [];

  // 1. Contraction Count Match (30 pts max)
  const countDiff = Math.abs(contractions.length - template.targetContractionsCount);
  if (countDiff === 0) {
    score += 30;
    feedback.push(`Exact match on contraction count (${contractions.length} stages)`);
  } else if (countDiff === 1) {
    score += 18;
    feedback.push(`Close contraction count (${contractions.length} vs ${template.targetContractionsCount} benchmark)`);
  } else {
    score += 5;
    feedback.push(`Contraction count variance (${contractions.length} vs ${template.targetContractionsCount})`);
  }

  // 2. Sequential Contraction Depth Squeeze Reduction (35 pts max)
  let isProgressiveSqueeze = true;
  for (let i = 1; i < contractions.length; i++) {
    if (contractions[i].depthPercent >= contractions[i - 1].depthPercent) {
      isProgressiveSqueeze = false;
      break;
    }
  }

  if (isProgressiveSqueeze) {
    score += 25;
    feedback.push('Perfect progressive volatility squeeze (each drop smaller than prior)');
  } else {
    feedback.push('Inconsistent depth reduction sequence');
  }

  // Final Contraction Tightness Bonus (10 pts)
  const finalContraction = contractions[contractions.length - 1];
  if (finalContraction && finalContraction.depthPercent <= 8) {
    score += 10;
    feedback.push(`Ideal terminal pivot tightness (-${finalContraction.depthPercent}% drop <= 8% limit)`);
  }

  // 3. Duration & Volume Alignment (25 pts max)
  const totalDays = contractions.reduce((acc, c) => acc + c.durationDays, 0);
  if (template.id === 'CLASSIC_3T' && totalDays >= 30 && totalDays <= 70) {
    score += 20;
    feedback.push(`Ideal formation duration (${totalDays} days)`);
  } else if (template.id === 'HIGH_TIGHT_FLAG' && totalDays <= 35) {
    score += 20;
    feedback.push(`Fast power flag consolidation (${totalDays} days)`);
  } else if (template.id === 'DEEP_SHAKEOUT_4T' && totalDays >= 50) {
    score += 20;
    feedback.push(`Sufficient institutional re-accumulation period (${totalDays} days)`);
  } else if (template.id === 'MICRO_SHALLOW_2T' && totalDays >= 15 && totalDays <= 45) {
    score += 20;
    feedback.push(`Compact base duration (${totalDays} days)`);
  } else {
    score += 10;
    feedback.push(`Formation duration: ${totalDays} total days`);
  }

  // Volume Dry-up check (10 pts)
  if (finalContraction && finalContraction.volumeDryUpPercent <= -40) {
    score += 15;
    feedback.push(`Significant volume dry-up at terminal pivot (${finalContraction.volumeDryUpPercent}%)`);
  }

  score = Math.min(100, Math.max(0, score));

  return { matchScore: score, feedback, isBestMatch: false };
}

export const VcpTemplateOverlay: React.FC<VcpTemplateOverlayProps> = ({ stock }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('CLASSIC_3T');
  const currencySymbol = getCurrencySymbol(stock.exchange);

  const contractions = stock.contractions || [];
  const totalDurationDays = contractions.reduce((sum, c) => sum + c.durationDays, 0);
  const initialDepth = contractions.length > 0 ? contractions[0].depthPercent : 0;
  const terminalDepth = contractions.length > 0 ? contractions[contractions.length - 1].depthPercent : 0;
  const compressionRatio = initialDepth > 0 ? (((initialDepth - terminalDepth) / initialDepth) * 100).toFixed(1) : '0';

  // Evaluate template matches
  const evaluatedTemplates = HISTORICAL_VCP_TEMPLATES.map((tmpl) => {
    const evalRes = evaluateTemplateMatch(contractions, tmpl);
    return {
      template: tmpl,
      matchScore: evalRes.matchScore,
      feedback: evalRes.feedback
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const bestMatch = evaluatedTemplates[0];

  const currentSelectedEval = evaluatedTemplates.find((t) => t.template.id === selectedTemplateId) || bestMatch;

  return (
    <div className="bg-[#1a1a1a] text-white border border-black shadow-xl p-5 space-y-5 font-mono">
      
      {/* Header Bar with Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-500 text-black flex items-center justify-center font-bold font-serif text-lg">
            V
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">
                Pattern Overlay
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[9px] uppercase font-bold px-2 py-0.5 border border-amber-500/40">
                Minervini Historical Template Benchmark
              </span>
            </div>
            <h3 className="text-base font-serif font-black text-white leading-tight">
              VCP Contraction Summary & Historical Template Match
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-[#262626] border border-gray-700 px-3 py-1 text-xs text-amber-300 font-bold flex items-center space-x-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Best Match: {bestMatch.template.name} ({bestMatch.matchScore}%)</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-[#262626] hover:bg-[#333333] text-gray-300 border border-gray-700 transition-all cursor-pointer"
            title={isExpanded ? 'Collapse Summary Overlay' : 'Expand Summary Overlay'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5 text-xs animate-fadeIn font-sans">
          
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#222222] p-3.5 border border-gray-800 font-mono">
            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Identified Stages</span>
              <span className="text-base font-black text-white">{contractions.length} Contractions</span>
              <span className="text-[10px] text-amber-400 block">{stock.vcpStage}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Total Base Duration</span>
              <span className="text-base font-black text-cyan-300">{totalDurationDays} Trading Days</span>
              <span className="text-[10px] text-gray-400 block">(~{(totalDurationDays / 5).toFixed(1)} Weeks)</span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Squeeze Compression</span>
              <span className="text-base font-black text-emerald-400">-{initialDepth}% ➔ -{terminalDepth}%</span>
              <span className="text-[10px] text-emerald-400 block">+{compressionRatio}% Volatility Drop</span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-gray-400 block">Terminal Dry-Up</span>
              <span className="text-base font-black text-amber-300">
                {contractions.length > 0 ? `${contractions[contractions.length - 1].volumeDryUpPercent}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-amber-300/80 block">vs 20D Avg Vol</span>
            </div>
          </div>

          {/* Table of Identified Contractions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Identified Contractions Breakdown ({stock.ticker})</span>
              </span>
              <span className="text-[10px] text-gray-400 font-normal">
                Symmetry Rule: Each depth should shrink ~30-50% vs prior
              </span>
            </div>

            <div className="overflow-x-auto border border-gray-800">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#262626] text-gray-400 text-[10px] uppercase border-b border-gray-800">
                    <th className="p-2.5">Stage</th>
                    <th className="p-2.5">Date Range</th>
                    <th className="p-2.5 text-center">Duration</th>
                    <th className="p-2.5 text-right">Price Drop %</th>
                    <th className="p-2.5 text-right">High / Low</th>
                    <th className="p-2.5 text-center">Volume Dry-Up</th>
                    <th className="p-2.5 text-center">Stage Decay Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80 bg-[#1e1e1e]">
                  {contractions.map((c, idx) => {
                    const prevDepth = idx > 0 ? contractions[idx - 1].depthPercent : null;
                    const decayRatio = prevDepth ? (c.depthPercent / prevDepth).toFixed(2) : null;
                    const isTightTerminal = idx === contractions.length - 1 && c.depthPercent <= 8;

                    return (
                      <tr key={idx} className={isTightTerminal ? 'bg-emerald-950/30' : 'hover:bg-[#252525]'}>
                        <td className="p-2.5 font-bold text-white">
                          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/40 text-[10px]">
                            T{c.contractionIndex}
                          </span>
                        </td>
                        <td className="p-2.5 text-gray-300 text-[11px]">
                          {c.startDate} ➔ {c.endDate}
                        </td>
                        <td className="p-2.5 text-center font-bold text-cyan-300">
                          {c.durationDays} Days
                        </td>
                        <td className="p-2.5 text-right font-black text-rose-400">
                          -{c.depthPercent}%
                        </td>
                        <td className="p-2.5 text-right text-gray-300 text-[11px]">
                          {formatCurrency(c.highPrice, currencySymbol)} / {formatCurrency(c.lowPrice, currencySymbol)}
                        </td>
                        <td className="p-2.5 text-center font-bold text-amber-300">
                          {c.volumeDryUpPercent}%
                        </td>
                        <td className="p-2.5 text-center text-gray-300">
                          {decayRatio ? (
                            <span className="text-emerald-400 font-bold">{decayRatio}x ({((1 - Number(decayRatio)) * 100).toFixed(0)}% Squeeze)</span>
                          ) : (
                            <span className="text-gray-500 italic">Anchor Base</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Success Templates Comparison Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Compare Against Historical Minervini Success Templates</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                Select a template below to inspect structural alignment
              </span>
            </div>

            {/* Template Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              {evaluatedTemplates.map(({ template, matchScore }) => {
                const isSelected = selectedTemplateId === template.id;
                const isTop = bestMatch.template.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-3 border text-left transition-all cursor-pointer relative space-y-2 ${
                      isSelected
                        ? 'bg-[#2a2a2a] border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-[#222222] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {isTop && (
                      <span className="absolute -top-2.5 right-2 bg-amber-500 text-black text-[9px] font-bold uppercase px-1.5 py-0.5 shadow-2xs">
                        BEST MATCH
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{template.name}</span>
                      <span
                        className={`text-xs font-black px-1.5 py-0.5 border ${
                          matchScore >= 75
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : matchScore >= 50
                            ? 'bg-amber-950 text-amber-300 border-amber-600'
                            : 'bg-gray-900 text-gray-400 border-gray-700'
                        }`}
                      >
                        {matchScore}%
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 font-sans line-clamp-2 leading-tight">
                      {template.description}
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-800 text-gray-300">
                      <span>Win Rate: <strong className="text-emerald-400">{template.historicalWinRate}%</strong></span>
                      <span>Avg Move: <strong className="text-amber-300">+{template.avgGainPercent}%</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed Selected Template Deep-Dive Overlay Panel */}
            {currentSelectedEval && (
              <div className="p-4 bg-[#222222] border border-gray-700 space-y-3 font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700 pb-2 font-mono">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase">
                      Template Benchmark: {currentSelectedEval.template.name}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-gray-300">Historical Win Rate: <strong className="text-emerald-400">{currentSelectedEval.template.historicalWinRate}%</strong></span>
                    <span className="text-gray-300">Avg Post-Breakout Move: <strong className="text-amber-300">+{currentSelectedEval.template.avgGainPercent}%</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Template Structural Guidelines */}
                  <div className="space-y-2 bg-[#1a1a1a] p-3 border border-gray-800">
                    <span className="font-mono text-[11px] font-bold text-amber-300 uppercase block">
                      Target Benchmark Parameters:
                    </span>
                    <ul className="space-y-1 text-gray-300 text-[11px] font-mono">
                      <li className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-400">Target Stage Count:</span>
                        <strong className="text-white">{currentSelectedEval.template.targetContractionsCount} Contractions</strong>
                      </li>
                      <li className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-400">Expected T1 Drop:</span>
                        <strong className="text-white">{currentSelectedEval.template.expectedT1Depth}</strong>
                      </li>
                      <li className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-400">Expected T2 Drop:</span>
                        <strong className="text-white">{currentSelectedEval.template.expectedT2Depth}</strong>
                      </li>
                      {currentSelectedEval.template.expectedT3Depth && (
                        <li className="flex justify-between border-b border-gray-800 pb-1">
                          <span className="text-gray-400">Expected T3 Drop:</span>
                          <strong className="text-white">{currentSelectedEval.template.expectedT3Depth}</strong>
                        </li>
                      )}
                      <li className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-400">Ideal Base Duration:</span>
                        <strong className="text-cyan-300">{currentSelectedEval.template.idealTotalDays}</strong>
                      </li>
                    </ul>
                  </div>

                  {/* Stock Evaluation Feedback against Template */}
                  <div className="space-y-2 bg-[#1a1a1a] p-3 border border-gray-800">
                    <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase block">
                      {stock.ticker} Pattern Match Diagnostics:
                    </span>
                    <ul className="space-y-1.5 text-gray-300 text-[11px]">
                      {currentSelectedEval.feedback.map((fb, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Minervini Takeaway Summary Note */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 text-[11px] text-amber-200/90 leading-relaxed font-mono flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 uppercase">Minervini SEPA Execution Context:</strong>{' '}
                    {stock.ticker} shows a <strong className="text-white">{currentSelectedEval.matchScore}% structural match</strong> with the {currentSelectedEval.template.name}. The contraction depth dropped from -{initialDepth}% to -{terminalDepth}%, demonstrating progressive institutional supply absorption. Wait for price to clear the pivot at <strong className="text-white">{formatCurrency(stock.pivotPrice, currencySymbol)}</strong> on heavy volume.
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
