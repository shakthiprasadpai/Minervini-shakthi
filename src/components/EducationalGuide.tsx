import React, { useState } from 'react';
import { BookOpen, ShieldCheck, TrendingUp, Droplets, Target, ShieldAlert, Award, Layers, Sliders, Zap } from 'lucide-react';
import { TrendTemplateTutor } from './TrendTemplateTutor';
import { ThinkTradeChampionModule } from './ThinkTradeChampionModule';

export const EducationalGuide: React.FC = () => {
  const [guideTab, setGuideTab] = useState<'playbook' | 'champion' | 'tutor'>('playbook');

  return (
    <div className="bg-white border border-[#e5e4e1] p-8 shadow-xs space-y-8 text-[#1a1a1a]">
      
      {/* Header & Sub-Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center font-serif italic font-bold text-lg">
            M
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">Quantitative Methodology</span>
            <h2 className="text-2xl font-serif font-black text-[#1a1a1a] tracking-tight leading-tight mt-0.5">
              Mark Minervini SEPA & VCP Masterclass Playbook
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#f9f8f5] p-1 border border-[#e5e4e1] font-mono text-xs">
          <button
            onClick={() => setGuideTab('playbook')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
              guideTab === 'playbook'
                ? 'bg-[#1a1a1a] text-amber-300 shadow-xs'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Masterclass Playbook</span>
          </button>

          <button
            onClick={() => setGuideTab('champion')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
              guideTab === 'champion'
                ? 'bg-[#1a1a1a] text-amber-300 shadow-xs'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Think & Trade Like a Champion</span>
          </button>

          <button
            onClick={() => setGuideTab('tutor')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
              guideTab === 'tutor'
                ? 'bg-[#1a1a1a] text-amber-300 shadow-xs'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>Interactive Trend Tutor & Quiz</span>
          </button>
        </div>
      </div>

      {guideTab === 'tutor' ? (
        <TrendTemplateTutor />
      ) : guideTab === 'champion' ? (
        <ThinkTradeChampionModule />
      ) : (
        <>

      {/* Section 1: The 8-Point Trend Template */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-2">
          <ShieldCheck className="w-5 h-5 text-[#1a1a1a]" />
          <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
            1. Mark Minervini's 8-Point Trend Template (Stage 2 Uptrend)
          </h3>
        </div>
        <p className="text-xs text-gray-600 font-serif italic leading-relaxed">
          Before evaluating chart patterns or volume dry-up, a stock must pass all 8 non-negotiable Trend Template filters to ensure it is in a confirmed Stage 2 Advancing Phase:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
            <span className="font-bold text-[#1a1a1a] block uppercase tracking-wider text-[10px]">Rule 1 & 2: Moving Average Stack</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Stock Price &gt; 150-day & 200-day SMA. Furthermore, 150-day SMA &gt; 200-day SMA.
            </p>
          </div>

          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
            <span className="font-bold text-[#1a1a1a] block uppercase tracking-wider text-[10px]">Rule 3 & 4: Uptrend Slope</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              200-day SMA is sloped upward for at least 1-4 months. 50-day SMA &gt; 150-day & 200-day SMA.
            </p>
          </div>

          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
            <span className="font-bold text-[#1a1a1a] block uppercase tracking-wider text-[10px]">Rule 5 & 6: Price Momentum</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Current Price &gt; 50-day SMA. Price is at least 30% above its 52-week low (often +100% to +300%).
            </p>
          </div>

          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1">
            <span className="font-bold text-[#1a1a1a] block uppercase tracking-wider text-[10px]">Rule 7 & 8: High Ground & Leadership</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Current Price is within 25% of its 52-week high. RS Rating is 70 or higher (ideally 80s or 90s).
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: VCP Anatomy & Tight Volume */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-2">
          <Droplets className="w-5 h-5 text-[#1a1a1a]" />
          <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
            2. Volatility Contraction Pattern (VCP) & Tight Volume Dry-Up
          </h3>
        </div>

        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 text-xs space-y-4">
          <p className="text-gray-700 leading-relaxed font-serif italic">
            The <strong className="font-sans not-italic font-bold text-[#1a1a1a]">Volatility Contraction Pattern (VCP)</strong> occurs when supply is absorbed by institutional investors. As the stock consolidates, each subsequent price pullback is shallower than the previous one (e.g., -20% → -10% → -4%).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-sans">
            <div className="bg-white p-4 border border-[#e5e4e1]">
              <span className="font-bold text-[#1a1a1a] block mb-1 uppercase tracking-wider text-[10px]">Step 1: Volatility Shrinks</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Price contractions contract sequentially (T1: 15-25%, T2: 7-12%, T3: 2-5%).
              </p>
            </div>

            <div className="bg-white p-4 border border-[#e5e4e1]">
              <span className="font-bold text-[#1a1a1a] block mb-1 uppercase tracking-wider text-[10px]">Step 2: Tight Volume Dry-Up</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Volume drops sharply (-50% to -80% below 20-day avg). Sellers are completely exhausted!
              </p>
            </div>

            <div className="bg-white p-4 border border-[#e5e4e1]">
              <span className="font-bold text-[#1a1a1a] block mb-1 uppercase tracking-wider text-[10px]">Step 3: Pivot Point Breakout</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Buy instantly as price breaks above pivot resistance on a massive volume expansion surge!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Minervini Golden Risk Management Rules */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
            3. Minervini's Golden Rules of Risk Management
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          <div className="bg-red-50/40 border border-red-200 p-4 space-y-1.5">
            <span className="font-bold text-red-800 block uppercase tracking-wider text-[10px]">Strict 7-8% Hard Stop Loss</span>
            <p className="text-red-900/80 text-[11px] leading-relaxed">
              Never allow any loss to exceed 7-8% under any circumstances. On tight VCP pivots, average stop losses should be between 3% to 6%.
            </p>
          </div>

          <div className="bg-emerald-50/40 border border-emerald-200 p-4 space-y-1.5">
            <span className="font-bold text-emerald-800 block uppercase tracking-wider text-[10px]">3:1 Minimum Reward/Risk Ratio</span>
            <p className="text-emerald-900/80 text-[11px] leading-relaxed">
              Target at least 3x to 4x your risk. If risking 5%, lock in initial profits at +15% to +20%.
            </p>
          </div>

          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1.5">
            <span className="font-bold text-[#1a1a1a] block uppercase tracking-wider text-[10px]">Never Average Down</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Amateurs average down on losing trades; professionals scale in only when trades are working in profit!
            </p>
          </div>
        </div>
      </div>

        </>
      )}

    </div>
  );
};

