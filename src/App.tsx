import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar, AppNavTab } from './components/Navbar';
import { ScreenerTable } from './components/ScreenerTable';
import { VcpChart } from './components/VcpChart';
import { TrendTemplateChecklist } from './components/TrendTemplateChecklist';
import { TradePlanCard } from './components/TradePlanCard';
import { AiMinerviniAnalyst } from './components/AiMinerviniAnalyst';
import { CustomTickerScanner } from './components/CustomTickerScanner';
import { EducationalGuide } from './components/EducationalGuide';
import { GoogleSheetsIntegration } from './components/GoogleSheetsIntegration';
import { MarketSentimentRibbon } from './components/MarketSentimentRibbon';
import { PriceAlertSystem } from './components/PriceAlertSystem';
import { MyPortfolio } from './components/MyPortfolio';
import { EarningsCalendar } from './components/EarningsCalendar';
import { MinerviniVideoMasterclass } from './components/MinerviniVideoMasterclass';
import { TickerNewsGrounding } from './components/TickerNewsGrounding';
import { ObsidianIntegration } from './components/ObsidianIntegration';
import { PocketPivotScanner } from './components/PocketPivotScanner';
import { VcpPatternScanner } from './components/VcpPatternScanner';
import { TradeJournal } from './components/TradeJournal';
import { BigMoneyTracker } from './components/BigMoneyTracker';
import { GlobalNotificationToast } from './components/GlobalNotificationToast';
import { HistoricalBacktestPanel } from './components/HistoricalBacktestPanel';
import { BreakoutProbabilityEngine } from './components/BreakoutProbabilityEngine';
import { SectorStrengthView } from './components/SectorStrengthView';
import { PatternVisualsLibrary } from './components/PatternVisualsLibrary';
import { ExportTradeData } from './components/ExportTradeData';
import { runtimeConfig } from './config/runtime';
import { MOCK_STOCKS } from './data/mockStocks';
import { MinerviniTradeSetup } from './types';
import { formatCurrency, formatVolume, getCurrencySymbol, calculateBreakoutProbability } from './utils/sepaCalculator';
import { TrendingUp, ShieldCheck, Target, Droplets, ArrowUpRight, Flame, BarChart3, Calculator, Sparkles, Gem } from 'lucide-react';
import { LiveMarketStatus } from './components/LiveMarketStatus';

const EMPTY_STOCK: MinerviniTradeSetup = {
  ticker: '—', name: 'No market data loaded', exchange: 'NSE', sector: '—', industry: '—',
  currentPrice: 0, changePercent: 0, sma50: 0, sma150: 0, sma200: 0, sma200_1mo_ago: 0,
  high52w: 0, low52w: 0, rsRating: 0, patternType: 'Pivot Pullback', vcpStage: 'Breakout Pending',
  trendScore: 0, avgVolume20d: 0, pivotVolume: 0, volumeDryUpPercent: 0, isTightVolume: false,
  pivotPrice: 0, buyZoneMax: 0, stopLossPrice: 0, stopLossPercent: 0, target1Price: 0,
  target1Percent: 0, target2Price: 0, target2Percent: 0, riskRewardRatio: 0, contractions: [],
  priceHistory: [], sepaNotes: 'Connect Bigul/XTS market data to load the live screener.'
};

export default function App() {
  const [stocksList, setStocksList] = useState<MinerviniTradeSetup[]>(runtimeConfig.demoMode ? MOCK_STOCKS : []);
  const [selectedStock, setSelectedStock] = useState<MinerviniTradeSetup | null>(runtimeConfig.demoMode ? MOCK_STOCKS[0] : null);
  const [marketDataStatus, setMarketDataStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE'>('LOADING');
  const [realtimeStatus, setRealtimeStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AppNavTab>('screener');
  const [isObsidian, setIsObsidian] = useState<boolean>(true); // Default to Obsidian Dark theme for luxury feel

  useEffect(() => {
    const controller = new AbortController();
    const loadLiveScreener = async () => {
      try {
        const response = await fetch(`${runtimeConfig.apiBaseUrl}/api/screener`, { signal: controller.signal });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        const live = Array.isArray(data.results) ? data.results : [];
        if (live.length > 0) {
          setStocksList(live);
          setSelectedStock(current =>
            current
              ? live.find((x: MinerviniTradeSetup) => x.ticker === current.ticker && x.exchange === current.exchange) ?? live[0]
              : live[0]
          );
          setMarketDataStatus('LIVE');
        } else {
          setMarketDataStatus('UNAVAILABLE');
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Live screener unavailable:', error);
          if (!runtimeConfig.demoMode) {
            setStocksList([]);
            setSelectedStock(null);
          }
          setMarketDataStatus('UNAVAILABLE');
        }
      }
    };
    loadLiveScreener();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (runtimeConfig.demoMode) return;
    const poll = async () => { try { const response = await fetch(`${runtimeConfig.apiBaseUrl}/api/market/realtime-status`); if (response.ok) { const status = await response.json(); setRealtimeStatus(status); setMarketDataStatus(status.connected ? 'LIVE' : 'LOADING'); } } catch { setMarketDataStatus('UNAVAILABLE'); } };
    poll(); const timer = window.setInterval(poll, 5000); return () => window.clearInterval(timer);
  }, [runtimeConfig.apiBaseUrl, runtimeConfig.demoMode]);

  useEffect(() => {
    if (runtimeConfig.demoMode) return;
    const stream = new EventSource(`${runtimeConfig.apiBaseUrl}/api/market/stream`);
    stream.onmessage = event => {
      try {
        const tick = JSON.parse(event.data);
        setStocksList(current => current.map(stock =>
          stock.exchange === tick.exchange && stock.ticker === tick.symbol
            ? (tick.screenerResult ? { ...tick.screenerResult } : { ...stock, currentPrice: tick.price, changePercent: tick.changePercent, pivotVolume: tick.volume })
            : stock
        ));
        setSelectedStock(current =>
          current && current.exchange === tick.exchange && current.ticker === tick.symbol
            ? (tick.screenerResult ? { ...tick.screenerResult } : { ...current, currentPrice: tick.price, changePercent: tick.changePercent, pivotVolume: tick.volume })
            : current
        );
        setMarketDataStatus('LIVE');
      } catch (error) {
        console.error('Invalid realtime market tick:', error);
      }
    };
    stream.onerror = () => {
      // Keep the screener's last known values; the backend reconnects to 5paisa.
    };
    return () => stream.close();
  }, [runtimeConfig.apiBaseUrl, runtimeConfig.demoMode]);

  useEffect(() => {
    if (isObsidian) {
      document.body.classList.add('obsidian-theme');
    } else {
      document.body.classList.remove('obsidian-theme');
    }
  }, [isObsidian]);

  const totalSetupsCount = stocksList.length;
  const tightVolumeCount = stocksList.filter(s => s.isTightVolume || s.volumeDryUpPercent < -50).length;

  const handleAddStock = (newStock: MinerviniTradeSetup) => {
    // Generate dummy price history if empty
    if (!newStock.priceHistory || newStock.priceHistory.length === 0) {
      newStock.priceHistory = [];
    }
    setStocksList([newStock, ...stocksList]);
    setSelectedStock(newStock);
    setActiveTab('screener');
  };

  const handleImportStocks = (imported: MinerviniTradeSetup[]) => {
    const updated = [...imported, ...stocksList];
    setStocksList(updated);
    if (imported.length > 0) {
      setSelectedStock(imported[0]);
    }
  };

  const currencySymbol = selectedStock ? getCurrencySymbol(selectedStock?.exchange ?? 'NSE') : '₹';

  if (!selectedStock) {
    return (
      <div className="min-h-screen bg-[#080b10] text-white">
        <LiveMarketStatus apiBaseUrl={runtimeConfig.apiBaseUrl} demoMode={runtimeConfig.demoMode} status={realtimeStatus} />
        <div className="flex items-center justify-center p-8 min-h-[80vh]">
          <div className="max-w-xl text-center space-y-4">
            <h1 className="text-3xl font-bold">Minervini Screener — Live Data Required</h1>
            <p className="text-gray-300">Demo data is disabled. Connect 5Paisa and load an NSE/BSE stock before using the screener.</p>
            <a href="/api/5paisa/auth/login" className="inline-flex px-6 py-3 bg-amber-500 text-black font-bold uppercase tracking-wider rounded">Connect 5Paisa</a>
            <p className="text-sm text-gray-400">For local UI testing only, set VITE_DEMO_MODE=true.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-[#1a1a1a] selection:text-white pb-16 transition-colors duration-300 ${
      isObsidian ? 'bg-[#0b0d11] text-[#f1f5f9]' : 'bg-[#f9f8f5] text-[#1a1a1a]'
    }`}>
      
      {/* Global Background LocalStorage Pivot Price Checker Toast */}
      <GlobalNotificationToast
        stocks={stocksList}
        onSelectStock={(stock) => setSelectedStock(stock)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        realtimeStatus={realtimeStatus}
        setActiveTab={setActiveTab}
        selectedStockTicker={selectedStock?.ticker ?? '—'}
        totalSetupsCount={totalSetupsCount}
        tightVolumeCount={tightVolumeCount}
        isObsidian={isObsidian}
        onToggleObsidian={() => setIsObsidian(!isObsidian)}
      />

      <LiveMarketStatus apiBaseUrl={runtimeConfig.apiBaseUrl} demoMode={runtimeConfig.demoMode} status={realtimeStatus} />

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Banner Quick Info - Editorial Style */}
        <div className={`relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-wrap items-center justify-between gap-6 ${isObsidian ? 'bg-gradient-to-br from-[#121722] via-[#0f141d] to-[#0a0e14]' : 'bg-white border-[#e5e4e1]'}`}>
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="inline-block bg-[#1a1a1a] text-white text-[10px] px-3 py-1 uppercase tracking-[0.2em] font-medium">
                Priority Setup
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-300/80">
                Mark Minervini SEPA Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight leading-tight">
              Stage 2 Trend Continuation & VCP Screener
            </h1>
            <p className="text-sm font-serif italic text-slate-400 leading-relaxed">
              Identifies high-momentum growth stocks in Stage 2 uptrends forming Volatility Contraction Patterns (VCP) with extreme volume dry-ups prior to pivot breakouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center min-w-[110px]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#b5a68d] font-bold block">Selected Stock</span>
              <strong className="text-2xl font-serif italic font-black text-white">{selectedStock.ticker}</strong>
            </div>
            <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center min-w-[110px]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#b5a68d] font-bold block">Pivot Entry</span>
              <strong className="text-xl font-mono font-bold text-[#1a1a1a]">
                {formatCurrency(selectedStock?.pivotPrice ?? 0, currencySymbol)}
              </strong>
            </div>
            <div className="bg-red-50/50 border border-red-200 p-3 text-center min-w-[110px]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-red-700 font-bold block">Tight Stop</span>
              <strong className="text-xl font-mono font-bold text-red-600">
                {formatCurrency(selectedStock?.stopLossPrice ?? 0, currencySymbol)}
              </strong>
            </div>
            <div className="bg-amber-50 border border-amber-300 p-3 text-center min-w-[130px]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-800 font-bold block">Breakout Prob</span>
              <strong className="text-xl font-mono font-black text-amber-900">
                {selectedStock ? calculateBreakoutProbability(selectedStock) : { score: 0 }.score}%
              </strong>
            </div>
          </div>
        </div>

        {/* TAB ANIMATED CONTAINER */}
        <AnimatePresence mode="wait">
          {activeTab === 'screener' && (
            <motion.div
              key="screener"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              
              {/* Market Sentiment & Health Ribbon */}
              <MarketSentimentRibbon />

              {/* Screener Table */}
              <ScreenerTable
                stocks={stocksList}
                selectedTicker={selectedStock.ticker}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />

              {/* Price Alert System Monitor */}
              <PriceAlertSystem
                stocks={stocksList}
                selectedStock={selectedStock}
                onSelectStock={(stock) => setSelectedStock(stock)}
              />

              {/* Upcoming Earnings Release Calendar & SEPA Risk Guard */}
              <EarningsCalendar
                stocks={stocksList}
                selectedStockTicker={selectedStock.ticker}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />

              {/* My Portfolio Section */}
              <MyPortfolio
                stocks={stocksList}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />

              {/* Google Sheets Live Sync & Watchlist Export */}
              <GoogleSheetsIntegration
                stocks={stocksList}
                selectedStock={selectedStock}
                onImportStocks={handleImportStocks}
              />


              {/* Deep Dive Panel for Selected Stock */}
              <div className="space-y-8">
                
                {/* Selected Stock Overview Ribbon */}
                <div className="bg-white border border-[#e5e4e1] p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-[#1a1a1a] text-white border border-black flex flex-col items-center justify-center font-mono">
                      <span className="text-lg font-bold">{selectedStock.ticker}</span>
                      <span className="text-[9px] text-gray-300 uppercase tracking-widest">{selectedStock.exchange}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-black text-[#1a1a1a] flex items-center space-x-2">
                        <span>{selectedStock?.name ?? 'No live stock selected'}</span>
                        <span className="text-xs font-sans font-normal text-gray-500">
                          — {selectedStock?.sector ?? '—'} / {selectedStock?.industry ?? '—'}
                        </span>
                      </h2>
                      <div className="flex items-center space-x-4 text-xs font-mono mt-1">
                        <span className="text-[#1a1a1a] font-bold">
                          Price: {formatCurrency(selectedStock?.currentPrice ?? 0, currencySymbol)}
                        </span>
                        <span
                          className={`font-bold ${
                            selectedStock?.changePercent ?? 0 >= 0 ? 'text-green-700' : 'text-red-600'
                          }`}
                        >
                          {selectedStock.changePercent >= 0 ? '+' : ''}
                          {selectedStock.changePercent}%
                        </span>
                        <span className="bg-[#1a1a1a] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          RS Rating: {selectedStock?.rsRating ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setActiveTab('chart')}
                      className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-5 py-2.5 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-black"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>View Interactive VCP Chart</span>
                    </button>
                  </div>
                </div>

                {/* Trade Plan & Position Size Card */}
                <TradePlanCard stock={selectedStock} />

                {/* Historical VCP Backtest & Win-Rate Summary Engine */}
                <HistoricalBacktestPanel stock={selectedStock} />

                {/* 'Big Money' Institutional Volume Spike Tracker */}
                <BigMoneyTracker
                  stock={selectedStock}
                  onViewChart={(stock) => {
                    setSelectedStock(stock);
                    setActiveTab('chart');
                  }}
                />

                {/* Live Google Search Grounded Financial Headlines Module */}
                <TickerNewsGrounding stock={selectedStock} />

                {/* 8-Rule Trend Template Checklist */}
                <TrendTemplateChecklist stock={selectedStock} />

                {/* AI Gemini Analysis Desk */}
                <AiMinerviniAnalyst stock={selectedStock} />

              </div>

            </motion.div>
          )}

          {/* TAB 2: VCP INTERACTIVE CHART VIEW */}
          {activeTab === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              
              {/* Chart Component */}
              <VcpChart stock={selectedStock} />

              {/* Breakout Probability Engine & Interactive Simulator */}
              <BreakoutProbabilityEngine stock={selectedStock} />

              {/* 'Big Money' Institutional Volume Spike Tracker */}
              <BigMoneyTracker stock={selectedStock} />

              {/* Live Google Search Grounded Financial Headlines Module */}
              <TickerNewsGrounding stock={selectedStock} />

              {/* Trade Execution Levels Card */}
              <TradePlanCard stock={selectedStock} />

              {/* Trend Template Check */}
              <TrendTemplateChecklist stock={selectedStock} />

            </motion.div>
          )}

          {/* TAB 3: POSITION RISK CALCULATOR */}
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <TradePlanCard stock={selectedStock} />
              <TrendTemplateChecklist stock={selectedStock} />
            </motion.div>
          )}

          {/* TAB: MY PORTFOLIO TRACKER */}
          {activeTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <MyPortfolio
                stocks={stocksList}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />
            </motion.div>
          )}

          {/* TAB: EARNINGS CALENDAR & RISK GUARD */}
          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <EarningsCalendar
                stocks={stocksList}
                selectedStockTicker={selectedStock.ticker}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />
            </motion.div>
          )}

          {/* TAB 4: CUSTOM TICKER TESTER */}
          {activeTab === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <CustomTickerScanner onAddStock={handleAddStock} />
            </motion.div>
          )}

          {/* TAB 5: MINERVINI PLAYBOOK */}
          {activeTab === 'playbook' && (
            <motion.div
              key="playbook"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <EducationalGuide />
            </motion.div>
          )}

          {/* TAB 6: MINERVINI VIDEO MASTERCLASS & 3C CHEAT HUB */}
          {activeTab === 'masterclass' && (
            <motion.div
              key="masterclass"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <MinerviniVideoMasterclass
                stocks={stocksList}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />
            </motion.div>
          )}

          {/* TAB 7: OBSIDIAN VAULT SYNC HUB */}
          {activeTab === 'obsidian' && (
            <motion.div
              key="obsidian"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <ObsidianIntegration
                stocks={stocksList}
                selectedStock={selectedStock}
                onSelectStock={(stock) => setSelectedStock(stock)}
              />
            </motion.div>
          )}

          {/* TAB 8: POCKET PIVOT & VOLUME SCANNER */}
          {activeTab === 'pocket_pivot' && (
            <motion.div
              key="pocket_pivot"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <PocketPivotScanner
                stocks={stocksList}
                onSelectStock={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />
            </motion.div>
          )}

          {/* TAB 9: VCP PATTERN SCANNER */}
          {activeTab === 'vcp_scanner' && (
            <motion.div
              key="vcp_scanner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <VcpPatternScanner
                stocks={stocksList}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />
            </motion.div>
          )}

          {/* TAB: TRADE JOURNAL */}
          {activeTab === 'journal' && (
            <motion.div
              key="journal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <TradeJournal
                stocks={stocksList}
                selectedStock={selectedStock}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
              />
            </motion.div>
          )}

          {/* TAB: SECTOR HEAT MAP */}
          {activeTab === 'sector_heatmap' && (
            <motion.div
              key="sector_heatmap"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <SectorStrengthView
                stocks={stocksList}
                onSelectStock={(stock) => setSelectedStock(stock)}
                onViewChart={(stock) => {
                  setSelectedStock(stock);
                  setActiveTab('chart');
                }}
                onFilterBySector={(sec) => {
                  setActiveTab('screener');
                }}
              />
            </motion.div>
          )}

          {/* TAB: PRICE ALERT HISTORY */}
          {activeTab === 'alert_history' && (
            <motion.div
              key="alert_history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <PriceAlertSystem
                stocks={stocksList}
                selectedStock={selectedStock}
                onSelectStock={(stock) => setSelectedStock(stock)}
              />
            </motion.div>
          )}

          {/* TAB: PATTERN VISUALS LIBRARY */}
          {activeTab === 'pattern_library' && (
            <motion.div
              key="pattern_library"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <PatternVisualsLibrary />
            </motion.div>
          )}

          {/* TAB: EXPORT TRADE DATA */}
          {activeTab === 'export_data' && (
            <motion.div
              key="export_data"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <ExportTradeData stocks={stocksList} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer - Editorial Style */}
      <footer className="mt-16 bg-[#0a0e14] border-t border-white/10 py-8 text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 uppercase tracking-[0.15em] font-semibold text-[10px]">
          <div>
            Market Outlook: <span className="text-green-700 font-bold">Confirmed Uptrend</span>
          </div>
          <div>
            Mark Minervini SEPA (Specific Entry Point Analysis) Engine
          </div>
          <div className="italic text-gray-400 font-serif normal-case text-xs">
            &copy; 2026 Growth Stock Alpha — Editorial Intelligence
          </div>
        </div>
      </footer>

    </div>
  );
}
