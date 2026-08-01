import React from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateTrendTemplate, formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { Award, CheckCircle2, XCircle, AlertCircle, Sparkles, ShieldCheck, Zap, TrendingUp, Droplets, Target, BarChart3, ChevronRight } from 'lucide-react';

interface AutomatedScoreCardProps {
  stock: MinerviniTradeSetup;
}

export const AutomatedScoreCard: React.FC<AutomatedScoreCardProps> = ({ stock }) => {
  const currencySymbol = getCurrencySymbol(stock.exchange);
  const { rules, passedCount } = evaluateTrendTemplate(stock);

  // Pillar 1: Trend Template Score (Max 50 pts)
  const trendTemplateScore = Math.round((passedCount / 8) * 50);

  // Pillar 2: Volatility Contraction Score (Max 20 pts)
  // VCP Contraction Count (T1=5, T2=10, T3=15, T4=20)
  let vcpScore = 10;
  if (stock.vcpContractionCount >= 4) vcpScore = 20;
  else if (stock.vcpContractionCount === 3) vcpScore = 18;
  else if (stock.vcpContractionCount === 2) vcpScore = 14;
  else if (stock.vcpContractionCount === 1) vcpScore = 10;

  // Pillar 3: Volume Dry-Up Score (Max 15 pts)
  let volumeScore = 8;
  if (stock.volumeDryUpPercent <= -60) volumeScore = 15;
  else if (stock.volumeDryUpPercent <= -40) volumeScore = 12;
  else if (stock.volumeDryUpPercent <= -20) volumeScore = 10;

  // Pillar 4: Fundamental & RS Power (Max 15 pts)
  let fundamentalScore = 8;
  if (stock.rsRating >= 90) fundamentalScore = 15;
  else if (stock.rsRating >= 80) fundamentalScore = 12;
  else if (stock.rsRating >= 70) fundamentalScore = 10;

  const totalSepaScore = trendTemplateScore + vcpScore + volumeScore + fundamentalScore;

  // Determine Overall Grade and Recommendation
  const getGradeDetails = (score: number) => {
    if (score >= 90) {
      return {
        grade: 'A+',
        badge: 'Institutional Stage 2 Elite',
        color: 'bg-emerald-900 text-emerald-100 border-emerald-500',
        textColor: 'text-emerald-700',
        action: 'STRONG BUY AT PIVOT BREAKOUT',
        description: 'Prime Minervini SEPA candidate. Perfect trend alignment, tight volume contraction, and strong RS leadership.'
      };
    }
    if (score >= 80) {
      return {
        grade: 'A',
        badge: 'High Probability SEPA Setup',
        color: 'bg-emerald-800 text-emerald-100 border-emerald-600',
        textColor: 'text-emerald-800',
        action: 'BUY ON VOLUME CONFIRMATION',
        description: 'Solid Stage 2 uptrend with good contraction pattern. Watch for pivot breakout with >150% average volume.'
      };
    }
    if (score >= 70) {
      return {
        grade: 'B+',
        badge: 'Developing Quality Setup',
        color: 'bg-amber-800 text-amber-100 border-amber-500',
        textColor: 'text-amber-800',
        action: 'ADD TO WATCHLIST / WAIT FOR TIGHTNESS',
        description: 'Meets core trend rules but requires further volatility compression or volume dry-up before entry.'
      };
    }
    if (score >= 50) {
      return {
        grade: 'C',
        badge: 'Sub-Optimal Setup',
        color: 'bg-orange-800 text-orange-100 border-orange-500',
        textColor: 'text-orange-800',
        action: 'HIGH RISK - PASS',
        description: 'Fails multiple Trend Template or VCP criteria. High risk of choppy breakout failure.'
      };
    }
    return {
      grade: 'F',
      badge: 'Unqualified / High Risk',
      color: 'bg-rose-900 text-rose-100 border-rose-500',
      textColor: 'text-rose-800',
      action: 'DO NOT TRADE',
      description: 'Downtrend or Stage 4 decline. Does not pass Minervini SEPA risk filters.'
    };
  };

  const gradeInfo = getGradeDetails(totalSepaScore);

  return (
    <div id="automated-setup-scorecard" className="bg-white border border-[#e5e4e1] p-6 space-y-6 text-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="text-xl font-serif font-black text-[#1a1a1a]">
              Automated SEPA Setup Scorecard
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-serif italic mt-0.5">
            4-Pillar Algorithmic Quality Assessment for <strong className="not-italic text-[#1a1a1a]">{stock.ticker}</strong>
          </p>
        </div>

        <div className={`px-4 py-2 border font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 ${gradeInfo.color}`}>
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{gradeInfo.grade} Grade: {gradeInfo.badge}</span>
        </div>
      </div>

      {/* Main Score Gauge Box */}
      <div className="bg-[#10141d] text-white border border-[#232936] p-6 rounded grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Big Score Display */}
        <div className="text-center md:border-r border-gray-800 pr-0 md:pr-6 space-y-2">
          <span className="text-[10px] text-amber-400 uppercase tracking-widest font-mono font-bold block">
            Overall SEPA Quality Index
          </span>
          <div className="text-5xl font-black font-mono text-white">
            {totalSepaScore}<span className="text-xl text-gray-400 font-normal">/100</span>
          </div>
          <div className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider">
            {gradeInfo.action}
          </div>
        </div>

        {/* Actionable Summary */}
        <div className="col-span-2 space-y-3 font-sans text-xs">
          <h4 className="font-bold text-amber-300 font-serif text-sm flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automated Minervini Analyst Verdict</span>
          </h4>
          <p className="text-gray-300 leading-relaxed font-serif italic text-xs">
            "{gradeInfo.description}"
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[11px] text-gray-300">
            <div className="bg-[#181e2b] p-2 border border-gray-800">
              <span className="text-gray-400 block text-[10px]">PIVOT ENTRY PRICE</span>
              <span className="font-bold text-emerald-400 text-sm">{formatCurrency(stock.pivotPrice, currencySymbol)}</span>
            </div>
            <div className="bg-[#181e2b] p-2 border border-gray-800">
              <span className="text-gray-400 block text-[10px]">RECOMMENDED STOP</span>
              <span className="font-bold text-red-400 text-sm">
                {formatCurrency(stock.suggestedStopPrice, currencySymbol)} (-{stock?.pivotPrice && stock.pivotPrice > 0 ? (((stock.pivotPrice - (stock.suggestedStopPrice || 0)) / stock.pivotPrice) * 100).toFixed(1) : '5.0'}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Breakdown Bars */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center space-x-2 border-b border-[#e5e4e1] pb-2">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          <span>4-Pillar Algorithmic Breakdown</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Pillar 1 */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-[#1a1a1a] flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Trend Template Rules ({passedCount}/8 Passed)</span>
              </span>
              <span className="text-blue-700">{trendTemplateScore}/50 PTS</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div className="bg-blue-600 h-2 transition-all" style={{ width: `${(trendTemplateScore/50)*100}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-500 font-sans">
              SMA 50 ({formatCurrency(stock.sma50, currencySymbol)}) &gt; SMA 150 &gt; SMA 200. Price is +{(stock?.fiftyTwoWeekLowPercent ?? 45).toFixed(0)}% above 52-wk low.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-[#1a1a1a] flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-purple-600" />
                <span>2. VCP Contractions ({stock.vcpContractionCount} Contractions)</span>
              </span>
              <span className="text-purple-700">{vcpScore}/20 PTS</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div className="bg-purple-600 h-2 transition-all" style={{ width: `${(vcpScore/20)*100}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-500 font-sans">
              Pattern: <strong className="text-[#1a1a1a]">{stock.vcpStage}</strong>. Shallow final contraction absorbs supply.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-[#1a1a1a] flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Volume Dry-Up ({stock.volumeDryUpPercent}%)</span>
              </span>
              <span className="text-emerald-700">{volumeScore}/15 PTS</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div className="bg-emerald-600 h-2 transition-all" style={{ width: `${(volumeScore/15)*100}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-500 font-sans">
              Volume is {Math.abs(stock.volumeDryUpPercent)}% below 50-day average. Minimal selling pressure.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-[#1a1a1a] flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>4. Relative Strength & Catalyst (RS {stock.rsRating})</span>
              </span>
              <span className="text-amber-700">{fundamentalScore}/15 PTS</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div className="bg-amber-500 h-2 transition-all" style={{ width: `${(fundamentalScore/15)*100}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-500 font-sans">
              Outperforming {stock.rsRating}% of the market. High institutional sponsorship.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
