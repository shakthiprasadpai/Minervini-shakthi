import React, { useState } from 'react';
import {
  BookOpen,
  TrendingUp,
  Target,
  ShieldAlert,
  Award,
  Zap,
  Layers,
  ArrowUpRight,
  Droplets,
  Download,
  Info,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

export interface PatternInfo {
  id: string;
  name: string;
  shortCode: string;
  category: 'CONSOLIDATION' | 'BREAKOUT' | 'EARLY_ENTRY' | 'MOMENTUM';
  winRatePct: number;
  avgProfitPct: number;
  typicalDuration: string;
  riskRewardRatio: string;
  description: string;
  minerviniRules: string[];
  volumeCharacteristics: string;
  stopLossGuidance: string;
  idealMarketStage: string;
  keyVisualElements: {
    contractions?: string[];
    pivotLevel: string;
    stopLevel: string;
    volumeSurge: string;
  };
}

export const PATTERN_LIBRARY: PatternInfo[] = [
  {
    id: 'vcp',
    name: 'Volatility Contraction Pattern (VCP)',
    shortCode: 'VCP 1T-4T',
    category: 'CONSOLIDATION',
    winRatePct: 78,
    avgProfitPct: 28.5,
    typicalDuration: '3 to 12 Weeks',
    riskRewardRatio: '3.5 : 1',
    description:
      "Mark Minervini's signature setup. Represents progressive supply absorption by institutional buyers. As the stock consolidates, each pullback is shallower than the previous one (e.g. -20% → -10% → -4%), culminating in tight volume dry-up at the pivot point.",
    minerviniRules: [
      'Stock must pass 8/8 Trend Template criteria (Stage 2 Uptrend).',
      'Series of 2 to 4 contractions (T1 to T4), with each pullback smaller than the last.',
      'Volume MUST drop dramatically (-50% to -80% below 20-day avg) on the final tight contraction.',
      'Buy immediately as price crosses pivot resistance on expanding volume (+100% to +300% surge).',
    ],
    volumeCharacteristics: 'Dry-up during base right side; massive multi-month volume spike on pivot breakout day.',
    stopLossGuidance: 'Tight stop 3% - 5% placed just below the low of the final tight contraction (T3/T4).',
    idealMarketStage: 'Early to mid Bull Market / Confirmed Market Uptrend',
    keyVisualElements: {
      contractions: ['T1: -18% (Depth)', 'T2: -9% (Depth)', 'T3: -4% (Depth & Volume Dry-Up)'],
      pivotLevel: 'Pivot Breakout Line @ Highest Point of Final Contraction',
      stopLevel: 'Hard Stop Loss Zone @ Low of Final Contraction',
      volumeSurge: 'Volume Dry-Up (-65%) followed by Breakout Volume Spike (+180%)',
    },
  },
  {
    id: 'cup_handle',
    name: 'Cup with Handle (CWH)',
    shortCode: 'CWH Base',
    category: 'CONSOLIDATION',
    winRatePct: 74,
    avgProfitPct: 24.0,
    typicalDuration: '7 to 24 Weeks',
    riskRewardRatio: '3.2 : 1',
    description:
      'A classic bullish continuation base featuring a rounded U-shaped cup followed by a short, tight handle drift in the upper half of the pattern. The handle shakes out weak hands before institutional expansion.',
    minerviniRules: [
      'Prior uptrend of at least +30% preceding the cup formation.',
      'Cup depth should be 12% to 33% (up to 50% in severe bear markets).',
      'Handle MUST form in the upper half of the cup base and drift downward on light volume.',
      'Pivot entry is the peak of the handle, NOT the absolute peak of the cup rim.',
    ],
    volumeCharacteristics: 'Volume dries up to near zero in the bottom of the cup and during handle formation.',
    stopLossGuidance: 'Stop loss placed 3% to 6% below the lowest point of the handle.',
    idealMarketStage: 'Market Bottom Reversals & Early Bull Rallies',
    keyVisualElements: {
      contractions: ['Rounded U-Cup Base (-22%)', 'Tight Handle Drift (-6%)'],
      pivotLevel: 'Handle High Resistance Line',
      stopLevel: 'Handle Low Support Zone',
      volumeSurge: 'Extreme Dry-Up at Handle Bottom; Heavy Institutional Surge on Breakout',
    },
  },
  {
    id: 'htf',
    name: 'High Tight Flag (HTF)',
    shortCode: 'HTF Flag',
    category: 'MOMENTUM',
    winRatePct: 82,
    avgProfitPct: 45.0,
    typicalDuration: '3 to 5 Weeks',
    riskRewardRatio: '4.5 : 1',
    description:
      'The most explosive pattern in growth stock history. Occurs when a stock skyrockets +100% to +200% in under 8 weeks, then consolidates sideways in a tight flag range of no more than 10% to 25%.',
    minerviniRules: [
      'Stock must surge +100%+ in less than 8 weeks (Flag Pole).',
      'Consolidation must remain extremely tight (maximum 10%-25% correction).',
      'Flag base forms quickly over 3 to 5 weeks.',
      'Extremely high win rate when bought as price breaks above the top line of the flag.',
    ],
    volumeCharacteristics: 'Monster volume during the flag pole ascent, followed by dry-up during sideways flag.',
    stopLossGuidance: 'Place stop 4% to 6% below the flag support level or 20-day EMA.',
    idealMarketStage: 'Strong Bull Market Momentum Phase',
    keyVisualElements: {
      contractions: ['Massive Pole Surge (+120%)', 'Tight Flag Range (-12%)'],
      pivotLevel: 'Flag Upper Boundary Resistance',
      stopLevel: 'Flag Lower Boundary Support',
      volumeSurge: 'Monster Pole Volume → Dry-Up → Breakout Surge',
    },
  },
  {
    id: 'pocket_pivot',
    name: 'Pocket Pivot Volume Breakout',
    shortCode: 'Pocket Pivot',
    category: 'EARLY_ENTRY',
    winRatePct: 76,
    avgProfitPct: 22.0,
    typicalDuration: '1 to 2 Weeks',
    riskRewardRatio: '3.0 : 1',
    description:
      'An early entry signal pioneered by Gil Morales & Chris Kacher and refined by Minervini. Buying occurs WITHIN a base or along the 10-day/50-day moving average on volume greater than the largest down-volume day of the prior 10 days.',
    minerviniRules: [
      'Stock must be in or emerging from a proper SEPA base.',
      'Up-day volume MUST be larger than the highest DOWN-day volume in the previous 10 trading days.',
      'Price must be near or touching the 10-day EMA or 50-day SMA.',
      'Allows accumulation BEFORE the public breakout above the main pivot.',
    ],
    volumeCharacteristics: 'Surge in up-volume that exceeds any selling volume seen over the previous 10 sessions.',
    stopLossGuidance: 'Stop loss placed 2% to 4% below the 10-day EMA or pocket pivot candle low.',
    idealMarketStage: 'Base Building & Moving Average Bounce Phases',
    keyVisualElements: {
      contractions: ['Base Consolidation / MA Pullback', '10-Day Volume Comparison'],
      pivotLevel: '10-EMA Touch / Pocket Pivot Candle High',
      stopLevel: 'Pocket Candle Low / 10-EMA Line',
      volumeSurge: 'Volume > Highest Down-Day Volume of Past 10 Days',
    },
  },
  {
    id: 'three_c',
    name: '3C Pattern (Cup Completion Cheat)',
    shortCode: '3C Cheat',
    category: 'EARLY_ENTRY',
    winRatePct: 72,
    avgProfitPct: 32.0,
    typicalDuration: '4 to 8 Weeks',
    riskRewardRatio: '3.8 : 1',
    description:
      'A specialized early-entry technique developed by Mark Minervini to buy stocks near the bottom of a base before the handle or main cup breakout forms. Reduces risk and improves entry price.',
    minerviniRules: [
      'Stock creates a sharp low in a base, turns up, then forms a miniature pause/tightness (the "Cheat").',
      'The "Cheat" occurs on the right side of the base near or below the midpoint.',
      'Volume dries up during the pause, then expands as price breaks above the cheat pivot.',
      'Enables buying 5% to 15% lower than the standard handle breakout level.',
    ],
    volumeCharacteristics: 'Volume contracts during the cheat pause, followed by expansion on the cheat pivot breakout.',
    stopLossGuidance: 'Place stop 3% to 5% below the cheat low.',
    idealMarketStage: 'Market Turning Points & Base Recovery',
    keyVisualElements: {
      contractions: ['Base Left Wall & Bottom', 'Cheat Pause (-4% to -8%)'],
      pivotLevel: 'Cheat Pause High Resistance',
      stopLevel: 'Cheat Pause Low Support',
      volumeSurge: 'Volume Dry-Up in Cheat → Expansion on Early Breakout',
    },
  },
  {
    id: 'shakeout_recovery',
    name: 'Shakeout & Recovery (Spring)',
    shortCode: 'Shakeout Spring',
    category: 'EARLY_ENTRY',
    winRatePct: 75,
    avgProfitPct: 26.0,
    typicalDuration: '2 to 4 Weeks',
    riskRewardRatio: '3.4 : 1',
    description:
      'A bear trap pattern where price briefly breaks below a key support level or 50-day SMA to trigger retail stop losses, then immediately recovers back above the support line on heavy institutional buying.',
    minerviniRules: [
      'Stock undercuts a visible support pivot or 50-day SMA for 1 to 3 days.',
      'Sellers fail to push price lower; heavy buyers step in aggressively.',
      'Price closes back above the broken support level within 1-3 days.',
      'Buy as price re-claims the breakdown level on expanding volume.',
    ],
    volumeCharacteristics: 'Light volume on the undercut, followed by heavy volume accumulation on the recovery.',
    stopLossGuidance: 'Stop loss placed 1% to 3% below the undercut swing low.',
    idealMarketStage: 'Market Pullbacks & Institutional Shakeout Days',
    keyVisualElements: {
      contractions: ['Support Line Touch', 'Brief Bear Trap Undercut', 'Immediate Re-Claim'],
      pivotLevel: 'Re-Claimed Support Level',
      stopLevel: 'Undercut Swing Low',
      volumeSurge: 'Heavy Institutional Buying Volume on Support Recovery',
    },
  },
  {
    id: 'power_play',
    name: 'Power Play / Catalyst Earnings Gap',
    shortCode: 'Power Play',
    category: 'MOMENTUM',
    winRatePct: 80,
    avgProfitPct: 35.0,
    typicalDuration: '2 to 6 Weeks',
    riskRewardRatio: '4.0 : 1',
    description:
      'Occurs when a company reports blowout quarterly earnings or a major game-changing catalyst, causing a massive gap up on 3x-10x average volume, followed by a tight 2-3 week consolidation base before the second leg up.',
    minerviniRules: [
      'Stock gaps up +10% to +30%+ on huge earnings or catalyst volume.',
      'Stock holds at least 80% of its gap gain and does NOT fill the gap.',
      'Forms a tight horizontal range or VCP over 10 to 20 sessions.',
      'Buy as price breaks out of the post-gap consolidation high.',
    ],
    volumeCharacteristics: 'Gigantic volume gap day (300%+ avg), followed by low volume drift, then breakout volume.',
    stopLossGuidance: 'Place stop 3% to 5% below post-gap consolidation low or gap day opening price.',
    idealMarketStage: 'Earnings Season / Fundamental Growth Cycles',
    keyVisualElements: {
      contractions: ['Catalyst Gap Up (+22%)', 'Post-Gap Consolidation (-6%)'],
      pivotLevel: 'Post-Gap Consolidation High',
      stopLevel: 'Post-Gap Consolidation Low',
      volumeSurge: 'Gigantic Gap Volume → Low Consolidation Volume → Breakout Volume',
    },
  },
];

export const PatternVisualsLibrary: React.FC = () => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('vcp');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const selectedPattern = PATTERN_LIBRARY.find((p) => p.id === selectedPatternId) || PATTERN_LIBRARY[0];

  const filteredPatterns = PATTERN_LIBRARY.filter((p) => {
    if (activeCategory === 'ALL') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] p-6 shadow-xl space-y-6 text-white font-mono">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-amber-400 font-bold block">
                Visual Technical Playbook
              </span>
              <span className="bg-amber-400 text-black text-[9px] font-mono px-2 py-0.5 font-bold uppercase">
                Mark Minervini Patterns
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white mt-0.5">
              SEPA Pattern Visuals Library & Chart Cheat Sheet
            </h3>
          </div>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-[#0e1117] border border-[#30363d] px-3.5 py-2">
            <span className="text-gray-400 text-[10px] uppercase block">Cataloged Patterns:</span>
            <strong className="text-amber-400 font-bold text-sm">{PATTERN_LIBRARY.length} Core Setups</strong>
          </div>
          <div className="bg-[#0e1117] border border-[#30363d] px-3.5 py-2">
            <span className="text-gray-400 text-[10px] uppercase block">Avg Win Rate:</span>
            <strong className="text-emerald-400 font-bold text-sm">77.8% Historical</strong>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e1117] p-2 border border-[#30363d] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mr-1">Pattern Category:</span>
          {(['ALL', 'CONSOLIDATION', 'BREAKOUT', 'EARLY_ENTRY', 'MOMENTUM'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all border cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                  : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:text-white'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pattern Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredPatterns.map((pat) => {
          const isSelected = pat.id === selectedPatternId;
          return (
            <div
              key={pat.id}
              onClick={() => setSelectedPatternId(pat.id)}
              className={`p-4 border transition-all cursor-pointer relative space-y-2.5 ${
                isSelected
                  ? 'bg-[#1f242d] border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                  : 'bg-[#0e1117] border-[#30363d] hover:border-gray-500 hover:bg-[#161b22]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-black/50 px-2 py-0.5 border border-amber-400/30">
                  {pat.shortCode}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {pat.winRatePct}% Win Rate
                </span>
              </div>

              <h4 className="text-sm font-serif font-bold text-white leading-tight group-hover:text-amber-300">
                {pat.name}
              </h4>

              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Avg Gain: <strong className="text-emerald-300">+{pat.avgProfitPct}%</strong></span>
                <span>R:R <strong className="text-amber-300">{pat.riskRewardRatio}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED VISUAL DIAGRAM & SPECIFICATION PANEL */}
      <div className="bg-[#0e1117] border-2 border-amber-400/80 p-6 space-y-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#30363d] pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2 py-0.5">
                {selectedPattern.shortCode}
              </span>
              <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-widest">
                Category: {selectedPattern.category}
              </span>
            </div>
            <h3 className="text-2xl font-serif font-black text-white mt-1">
              {selectedPattern.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-[#161b22] border border-[#30363d] px-3 py-1.5 text-center">
              <span className="text-[9px] text-gray-400 uppercase block">Historical Win Rate</span>
              <strong className="text-emerald-400 font-black text-base">{selectedPattern.winRatePct}%</strong>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] px-3 py-1.5 text-center">
              <span className="text-[9px] text-gray-400 uppercase block">Avg Gain / Trade</span>
              <strong className="text-amber-300 font-black text-base">+{selectedPattern.avgProfitPct}%</strong>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] px-3 py-1.5 text-center">
              <span className="text-[9px] text-gray-400 uppercase block">Reward-to-Risk</span>
              <strong className="text-teal-300 font-black text-base">{selectedPattern.riskRewardRatio}</strong>
            </div>
          </div>
        </div>

        {/* CUSTOM INTERACTIVE SVG / CANVAS VISUAL SCHEMATIC */}
        <div className="bg-[#161b22] border border-[#30363d] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
            <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>Pattern Visual Diagram & Execution Levels</span>
            </span>
            <span className="text-[10px] text-gray-400">
              Interactive Execution Blueprint (Minervini SEPA Spec)
            </span>
          </div>

          {/* Render Vector Diagram */}
          <div className="bg-[#0a0d12] border border-white/10 p-4 relative overflow-hidden min-h-[220px] flex items-center justify-center">
            {selectedPattern.id === 'vcp' && (
              <svg viewBox="0 0 800 220" className="w-full h-auto">
                {/* Background Grid */}
                <line x1="0" y1="50" x2="800" y2="50" stroke="#1f2937" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="800" y2="110" stroke="#1f2937" strokeDasharray="3 3" />
                <line x1="0" y1="170" x2="800" y2="170" stroke="#1f2937" strokeDasharray="3 3" />

                {/* VCP Contraction Waves */}
                <path
                  d="M 50 160 Q 110 30 180 60 Q 250 160 320 80 Q 380 140 440 90 Q 490 120 530 95 L 560 95 L 720 20"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />

                {/* Pivot Breakout Line */}
                <line x1="50" y1="60" x2="750" y2="60" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 5" />
                <text x="580" y="52" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  PIVOT ENTRY BREAKOUT LINE
                </text>

                {/* Stop Loss Line */}
                <line x1="480" y1="125" x2="750" y2="125" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
                <text x="580" y="140" fill="#f43f5e" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  STOP LOSS ZONE (-4%)
                </text>

                {/* Contraction Markers */}
                <text x="180" y="180" fill="#9ca3af" fontSize="10" textAlign="center">T1 (-18%)</text>
                <text x="320" y="160" fill="#9ca3af" fontSize="10" textAlign="center">T2 (-9%)</text>
                <text x="440" y="140" fill="#9ca3af" fontSize="10" textAlign="center">T3 (-4%)</text>

                {/* Breakout Surge Arrow */}
                <path d="M 560 95 L 720 20" fill="none" stroke="#10b981" strokeWidth="4" />
                <polygon points="720,20 710,32 725,32" fill="#10b981" />
                <text x="640" y="30" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  BO SURGE (+28%)
                </text>

                {/* Volume Bars Section */}
                <line x1="0" y1="180" x2="800" y2="180" stroke="#374151" strokeWidth="1" />
                <rect x="100" y="185" width="20" height="25" fill="#3b82f6" opacity="0.6" />
                <rect x="240" y="195" width="20" height="15" fill="#3b82f6" opacity="0.5" />
                <rect x="380" y="202" width="20" height="8" fill="#3b82f6" opacity="0.4" />
                <rect x="480" y="206" width="20" height="4" fill="#a855f7" />
                <text x="460" y="218" fill="#a855f7" fontSize="9" fontWeight="bold">VOL DRY-UP (-68%)</text>
                <rect x="560" y="182" width="25" height="32" fill="#10b981" />
                <text x="590" y="200" fill="#10b981" fontSize="10" fontWeight="bold">+220% VOLUME SURGE</text>
              </svg>
            )}

            {selectedPattern.id !== 'vcp' && (
              <svg viewBox="0 0 800 220" className="w-full h-auto">
                <line x1="0" y1="50" x2="800" y2="50" stroke="#1f2937" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="800" y2="110" stroke="#1f2937" strokeDasharray="3 3" />
                <line x1="0" y1="170" x2="800" y2="170" stroke="#1f2937" strokeDasharray="3 3" />

                {/* Pattern Curve */}
                <path
                  d="M 50 170 Q 150 20 280 40 Q 320 160 480 140 Q 560 60 620 70 L 750 15"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />

                {/* Pivot Line */}
                <line x1="200" y1="50" x2="750" y2="50" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 5" />
                <text x="520" y="42" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  PATTERN PIVOT ENTRY @ RESISTANCE
                </text>

                {/* Stop Loss Line */}
                <line x1="450" y1="145" x2="750" y2="145" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
                <text x="520" y="160" fill="#f43f5e" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  HARD RISK STOP LOSS ZONE
                </text>

                {/* Breakout Surge */}
                <path d="M 620 70 L 750 15" fill="none" stroke="#10b981" strokeWidth="4" />
                <text x="660" y="25" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  BREAKOUT
                </text>

                {/* Volume Bars */}
                <line x1="0" y1="180" x2="800" y2="180" stroke="#374151" strokeWidth="1" />
                <rect x="250" y="195" width="20" height="15" fill="#3b82f6" opacity="0.6" />
                <rect x="450" y="206" width="20" height="4" fill="#a855f7" />
                <text x="430" y="218" fill="#a855f7" fontSize="9" fontWeight="bold">VOLATILITY DRY-UP</text>
                <rect x="620" y="182" width="25" height="32" fill="#10b981" />
                <text x="655" y="200" fill="#10b981" fontSize="10" fontWeight="bold">INSTITUTIONAL BUYING SURGE</text>
              </svg>
            )}
          </div>
        </div>

        {/* Description & Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          {/* Pattern Overview */}
          <div className="space-y-3 bg-[#161b22] p-4 border border-[#30363d]">
            <h4 className="text-sm font-serif font-black text-amber-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pattern Overview & Mechanics</span>
            </h4>
            <p className="text-gray-300 leading-relaxed font-mono text-[11px]">
              {selectedPattern.description}
            </p>

            <div className="border-t border-white/10 pt-3 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Typical Base Duration:</span>
                <strong className="text-white">{selectedPattern.typicalDuration}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ideal Market Phase:</span>
                <strong className="text-emerald-300">{selectedPattern.idealMarketStage}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume Profile:</span>
                <strong className="text-teal-300">{selectedPattern.volumeCharacteristics}</strong>
              </div>
            </div>
          </div>

          {/* Minervini Rules Checklist */}
          <div className="space-y-3 bg-[#161b22] p-4 border border-[#30363d]">
            <h4 className="text-sm font-serif font-black text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Minervini Execution Rules Checklist</span>
            </h4>
            <ul className="space-y-2 text-[11px] font-mono text-gray-200">
              {selectedPattern.minerviniRules.map((rule, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <div className="bg-rose-950/50 border border-rose-800 p-2.5 mt-3 text-[11px] font-mono">
              <span className="text-rose-300 font-bold block mb-0.5">Stop Loss & Risk Protocol:</span>
              <span className="text-gray-300">{selectedPattern.stopLossGuidance}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
