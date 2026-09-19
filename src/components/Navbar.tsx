import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, BarChart3, Calculator, BookOpen, SlidersHorizontal, Briefcase, Calendar, Video, Gem, Moon, Sun, Zap, Target, BookMarked, Layers, BellRing, Download, Sparkles } from 'lucide-react';

export type AppNavTab = 
  | 'screener' 
  | 'chart' 
  | 'calculator' 
  | 'custom' 
  | 'playbook' 
  | 'portfolio' 
  | 'earnings' 
  | 'masterclass' 
  | 'obsidian' 
  | 'pocket_pivot' 
  | 'vcp_scanner' 
  | 'journal'
  | 'sector_heatmap'
  | 'alert_history'
  | 'pattern_library'
  | 'export_data';

interface NavbarProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  selectedStockTicker: string;
  totalSetupsCount: number;
  tightVolumeCount: number;
  isObsidian?: boolean;
  onToggleObsidian?: () => void;
  realtimeStatus?: any;
}


export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedStockTicker,
  totalSetupsCount,
  tightVolumeCount,
  isObsidian = false,
  onToggleObsidian,
  realtimeStatus
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#e5e4e1] text-[#1a1a1a] sticky top-0 z-40 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Editorial Title */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('screener')}>
            <div className={`w-10 h-10 flex items-center justify-center font-serif italic font-bold text-xl shadow-sm transition-transform group-hover:scale-105 ${
              isObsidian ? 'bg-amber-500 text-black' : 'bg-[#1a1a1a] text-white'
            }`}>
              α
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] tracking-[0.25em] uppercase font-bold ${
                  isObsidian ? 'text-amber-400' : 'text-[#b5a68d]'
                }`}>
                  Technical Intelligence
                </span>
                <span className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-semibold ${
                  isObsidian ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-[#1a1a1a] text-white'
                }`}>
                  Minervini SEPA
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif italic font-black tracking-tight leading-none mt-0.5">
                Growth Stock Alpha
              </h1>
            </div>
          </div>

          {/* Quick Metrics Badges & OBSIDIAN Toggle Button */}
          <div className="hidden lg:flex items-center space-x-4 text-[11px] font-mono">
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] px-3.5 py-1.5 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-sans">Qualified Setups:</span>
              <span className="font-bold text-[#1a1a1a]">{totalSetupsCount} Stocks</span>
            </div>
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] px-3.5 py-1.5 flex items-center space-x-2">
              <span className="text-emerald-700 font-bold">💧 Dry-Up Volume:</span>
              <span className="font-bold text-[#1a1a1a]">{tightVolumeCount} Setups</span>
            </div>

            <a href="/api/5paisa/auth/login" className={`px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider font-mono border shadow-sm ${realtimeStatus?.connected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'}`}>{realtimeStatus?.connected ? '5Paisa LIVE' : 'Connect 5Paisa'}</a>

            {/* OBSIDIAN Theme Toggle Button */}
            {onToggleObsidian && (
              <motion.button
                id="obsidian-theme-toggle-btn"
                onClick={onToggleObsidian}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider font-mono transition-colors duration-300 flex items-center space-x-2 border shadow-sm cursor-pointer overflow-hidden ${
                  isObsidian
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                    : 'bg-slate-900 text-amber-300 border-slate-800 hover:bg-slate-800'
                }`}
                title="Toggle Obsidian Dark Mode"
              >
                {/* Subtle animated background shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-transparent to-amber-400/20 pointer-events-none"
                  initial={false}
                  animate={{
                    x: isObsidian ? ['-100%', '100%'] : ['100%', '-100%']
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                />

                {/* Animated Gem Icon */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isObsidian ? 'obsidian-on' : 'obsidian-off'}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="flex items-center justify-center relative z-10"
                  >
                    <Gem className={`w-3.5 h-3.5 ${isObsidian ? 'text-slate-950 fill-current' : 'text-amber-400'}`} />
                  </motion.div>
                </AnimatePresence>

                {/* Animated Text Label */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isObsidian ? 'text-on' : 'text-off'}
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10"
                  >
                    {isObsidian ? 'OBSIDIAN DARK ON' : 'OBSIDIAN MODE'}
                  </motion.span>
                </AnimatePresence>

                {/* Premium Switch Track & Sliding Thumb */}
                <div className="relative z-10 ml-1 w-6 h-3 bg-black/40 rounded-full p-0.5 flex items-center border border-white/20">
                  <motion.div
                    className={`w-2 h-2 rounded-full ${isObsidian ? 'bg-slate-950' : 'bg-amber-400'}`}
                    animate={{
                      x: isObsidian ? 12 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </motion.button>
            )}
          </div>

          {/* Editorial Style Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-6 text-[11px] uppercase tracking-widest font-semibold">
            <button
              id="nav-tab-screener"
              onClick={() => setActiveTab('screener')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'screener'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Minervini Strategy</span>
            </button>

            <button
              id="nav-tab-chart"
              onClick={() => setActiveTab('chart')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'chart'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>VCP Scans ({selectedStockTicker})</span>
            </button>

            <button
              id="nav-tab-calculator"
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'calculator'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Trade Plan</span>
            </button>

            <button
              id="nav-tab-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'portfolio'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>My Portfolio</span>
            </button>

            <button
              id="nav-tab-earnings"
              onClick={() => setActiveTab('earnings')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'earnings'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Earnings Calendar</span>
            </button>

            <button
              id="nav-tab-custom"
              onClick={() => setActiveTab('custom')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'custom'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scanner</span>
            </button>

            <button
              id="nav-tab-playbook"
              onClick={() => setActiveTab('playbook')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'playbook'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Playbook</span>
            </button>

            <button
              id="nav-tab-masterclass"
              onClick={() => setActiveTab('masterclass')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'masterclass'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">3C Masterclass</span>
            </button>

            <button
              id="nav-tab-obsidian"
              onClick={() => setActiveTab('obsidian')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'obsidian'
                  ? 'border-amber-400 text-amber-500 font-bold'
                  : 'border-transparent text-gray-500 hover:text-amber-500 hover:border-amber-300'
              }`}
            >
              <Gem className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline font-bold">Obsidian Sync</span>
            </button>

            <button
              id="nav-tab-pocket-pivot"
              onClick={() => setActiveTab('pocket_pivot')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'pocket_pivot'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-amber-400 hover:border-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-bold">Pocket Pivots</span>
            </button>

            <button
              id="nav-tab-vcp-scanner"
              onClick={() => setActiveTab('vcp_scanner')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'vcp_scanner'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-amber-400 hover:border-amber-300'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-bold">VCP Scanner</span>
            </button>

            <button
              id="nav-tab-journal"
              onClick={() => setActiveTab('journal')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'journal'
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-bold'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold">Trade Journal</span>
            </button>

            <button
              id="nav-tab-sector-heatmap"
              onClick={() => setActiveTab('sector_heatmap')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'sector_heatmap'
                  ? 'border-purple-500 text-purple-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-purple-400 hover:border-purple-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold">Sector Heat Map</span>
            </button>

            <button
              id="nav-tab-alert-history"
              onClick={() => setActiveTab('alert_history')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'alert_history'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-amber-400 hover:border-amber-300'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Price Alert History</span>
            </button>

            <button
              id="nav-tab-pattern-library"
              onClick={() => setActiveTab('pattern_library')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'pattern_library'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-amber-400 hover:border-amber-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Pattern Visuals Library</span>
            </button>

            <button
              id="nav-tab-export-data"
              onClick={() => setActiveTab('export_data')}
              className={`flex items-center space-x-1.5 py-2 transition-all border-b-2 ${
                activeTab === 'export_data'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-emerald-400 hover:border-emerald-300'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Export Trade Data</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};

