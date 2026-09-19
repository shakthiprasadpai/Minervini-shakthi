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
    <header className="bg-[#080b10]/90 backdrop-blur-xl border-b border-white/10 text-white sticky top-0 z-40 shadow-2xl transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Editorial Title */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('screener')}>
            <div className={`w-10 h-10 flex items-center justify-center font-serif italic font-bold text-xl shadow-sm transition-transform group-hover:scale-105 ${
              isObsidian ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-black' : 'bg-[#1a1a1a] text-white'
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
              <h1 className="text-xl sm:text-2xl font-serif italic font-black tracking-tight leading-none mt-0.5 text-white">
                Growth Stock Alpha
              </h1>
            </div>
          </div>

          {/* Quick Metrics Badges & OBSIDIAN Toggle Button */}
          <div className="hidden lg:flex items-center space-x-4 text-[11px] font-mono">
            <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">Qualified Setups:</span>
              <span className="font-bold text-white">{totalSetupsCount} Stocks</span>
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

          {/* Command Center Buttons */}
          <nav className="w-full mt-3 pb-3 overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              {[
                ['screener','📊','Screener'], ['chart','📈','VCP Chart'], ['calculator','🎯','Trade Plan'],
                ['portfolio','💼','Portfolio'], ['earnings','📅','Earnings'], ['custom','⚙️','Scanner'],
                ['playbook','📚','Playbook'], ['pocket_pivot','⚡','Pocket Pivot'], ['vcp_scanner','🔎','VCP Scanner'],
                ['journal','📝','Journal'], ['sector_heatmap','🗺️','Sector Heatmap'], ['alert_history','🔔','Alerts'],
                ['pattern_library','🧩','Patterns'], ['export_data','⬇️','Export']
              ].map(([tab, icon, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as AppNavTab)}
                  className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    activeTab === tab
                      ? 'border-amber-400/60 bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300'
                  }`}
                >
                  <span className="text-sm">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

