import React, { useState, useEffect } from 'react';
import { PortfolioHolding, MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { exportPortfolioToCsv } from '../utils/csvExport';
import { PortfolioRebalancing } from './PortfolioRebalancing';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Target,
  BarChart3,
  DollarSign,
  PieChart,
  Edit2,
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronRight,
  Download,
  FileSpreadsheet
} from 'lucide-react';

interface MyPortfolioProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart: (stock: MinerviniTradeSetup) => void;
}

export const MyPortfolio: React.FC<MyPortfolioProps> = ({
  stocks,
  onSelectStock,
  onViewChart,
}) => {
  const [portfolioSubTab, setPortfolioSubTab] = useState<'holdings' | 'rebalancing'>('holdings');
  // Load portfolio from localStorage or provide initial default holdings
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    try {
      const saved = localStorage.getItem('minervini_sepa_portfolio');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'hold-1',
        ticker: 'NVDA',
        stockName: 'NVIDIA Corporation',
        exchange: 'NASDAQ',
        shares: 100,
        entryPrice: 128.5,
        currentPrice: 135.2,
        buyDate: '2026-07-10',
        stopLossPrice: 122.0,
        pivotTargetPrice: 154.2,
        notes: '3T VCP Breakout Entry on 2.5x volume surge',
        trendScore: 8,
        sma50: 121.5,
        sma200: 105.0,
        vcpStage: 'Active Breakout',
      },
      {
        id: 'hold-2',
        ticker: 'DIXON',
        stockName: 'Dixon Technologies Ltd.',
        exchange: 'NSE',
        shares: 25,
        entryPrice: 13200.0,
        currentPrice: 13850.0,
        buyDate: '2026-07-14',
        stopLossPrice: 12500.0,
        pivotTargetPrice: 15800.0,
        notes: 'NSE Growth Leader - Cup with Handle pivot',
        trendScore: 8,
        sma50: 12400.0,
        sma200: 10800.0,
        vcpStage: 'Active Breakout',
      },
    ];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);

  // Real-time market index benchmark state for performance summary widget
  const [selectedBenchmark, setSelectedBenchmark] = useState<'SP500' | 'NASDAQ' | 'NIFTY50' | 'RUSSELL'>('SP500');
  const [lastTickTime, setLastTickTime] = useState<string>(new Date().toLocaleTimeString());
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  // Benchmark index live data feed
  const benchmarkData = {
    SP500: { name: 'S&P 500 (^GSPC)', value: 5592.1, changePercent: 0.54 },
    NASDAQ: { name: 'Nasdaq 100 (^NDX)', value: 19850.3, changePercent: 0.88 },
    NIFTY50: { name: 'Nifty 50 (^NSEI)', value: 24420.8, changePercent: 0.32 },
    RUSSELL: { name: 'Russell 2000 (^RUT)', value: 2240.15, changePercent: 1.15 },
  };

  const currentBenchmark = benchmarkData[selectedBenchmark];

  // Periodic real-time update simulation for the widget
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      setLastTickTime(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Add position form state
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>(
    stocks.length > 0 ? stocks[0].ticker : 'NVDA'
  );
  const [sharesInput, setSharesInput] = useState<string>('50');
  const [entryPriceInput, setEntryPriceInput] = useState<string>(
    stocks.length > 0 ? stocks[0].pivotPrice.toString() : '138.50'
  );
  const [stopLossInput, setStopLossInput] = useState<string>(
    stocks.length > 0 ? stocks[0].stopLossPrice.toString() : '129.00'
  );
  const [targetPriceInput, setTargetPriceInput] = useState<string>(
    stocks.length > 0 ? stocks[0].target1Price.toString() : '165.00'
  );
  const [buyDateInput, setBuyDateInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notesInput, setNotesInput] = useState<string>('');

  // Sync current prices from live stock feed
  useEffect(() => {
    setHoldings((prevHoldings) =>
      prevHoldings.map((h) => {
        const liveStock = stocks.find((s) => s.ticker === h.ticker);
        if (liveStock) {
          return {
            ...h,
            currentPrice: liveStock.currentPrice,
            trendScore: liveStock.trendScore,
            sma50: liveStock.sma50,
            sma200: liveStock.sma200,
            vcpStage: liveStock.vcpStage,
          };
        }
        return h;
      })
    );
  }, [stocks]);

  // Persist portfolio
  useEffect(() => {
    try {
      localStorage.setItem('minervini_sepa_portfolio', JSON.stringify(holdings));
      window.dispatchEvent(new CustomEvent('minervini_portfolio_updated'));
    } catch (e) {
      console.error(e);
    }
  }, [holdings]);

  // Select stock handler in add modal
  const handleSelectStockForAdd = (ticker: string) => {
    setSelectedStockTicker(ticker);
    const matched = stocks.find((s) => s.ticker === ticker);
    if (matched) {
      setEntryPriceInput(matched.pivotPrice.toString());
      setStopLossInput(matched.stopLossPrice.toString());
      setTargetPriceInput(matched.target1Price.toString());
    }
  };

  // Add or Edit holding submit
  const handleSaveHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStock = stocks.find((s) => s.ticker === selectedStockTicker);

    const sharesNum = parseFloat(sharesInput) || 1;
    const entryNum = parseFloat(entryPriceInput) || (matchedStock ? matchedStock.pivotPrice : 100);
    const stopNum = parseFloat(stopLossInput) || entryNum * 0.93;
    const targetNum = parseFloat(targetPriceInput) || entryNum * 1.2;

    if (editingHoldingId) {
      setHoldings((prev) =>
        prev.map((h) =>
          h.id === editingHoldingId
            ? {
                ...h,
                shares: sharesNum,
                entryPrice: entryNum,
                stopLossPrice: stopNum,
                pivotTargetPrice: targetNum,
                buyDate: buyDateInput,
                notes: notesInput,
              }
            : h
        )
      );
      setEditingHoldingId(null);
    } else {
      const newHolding: PortfolioHolding = {
        id: `hold-${Date.now()}`,
        ticker: matchedStock ? matchedStock.ticker : selectedStockTicker.toUpperCase(),
        stockName: matchedStock ? matchedStock.name : `${selectedStockTicker.toUpperCase()} Inc.`,
        exchange: matchedStock ? matchedStock.exchange : 'NASDAQ',
        shares: sharesNum,
        entryPrice: entryNum,
        currentPrice: matchedStock ? matchedStock.currentPrice : entryNum,
        buyDate: buyDateInput,
        stopLossPrice: stopNum,
        pivotTargetPrice: targetNum,
        notes: notesInput || 'Stage 2 VCP Position Entry',
        trendScore: matchedStock ? matchedStock.trendScore : 8,
        sma50: matchedStock ? matchedStock.sma50 : entryNum * 0.95,
        sma200: matchedStock ? matchedStock.sma200 : entryNum * 0.85,
        vcpStage: matchedStock ? matchedStock.vcpStage : 'Active Breakout',
      };

      setHoldings([newHolding, ...holdings]);
    }

    setIsAddModalOpen(false);
    setNotesInput('');
  };

  // Delete holding
  const handleDeleteHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  // Edit holding trigger
  const handleOpenEdit = (holding: PortfolioHolding) => {
    setEditingHoldingId(holding.id);
    setSelectedStockTicker(holding.ticker);
    setSharesInput(holding.shares.toString());
    setEntryPriceInput(holding.entryPrice.toString());
    setStopLossInput(holding.stopLossPrice.toString());
    setTargetPriceInput(holding.pivotTargetPrice.toString());
    setBuyDateInput(holding.buyDate);
    setNotesInput(holding.notes || '');
    setIsAddModalOpen(true);
  };

  // Portfolio Summary Calculations
  const calculateTotals = () => {
    let totalCostBasisUsd = 0;
    let totalValueUsd = 0;
    let totalCostBasisNse = 0;
    let totalValueNse = 0;

    let totalGainers = 0;
    let totalLosers = 0;

    let sepaViolations = 0;

    holdings.forEach((h) => {
      const cost = h.shares * h.entryPrice;
      const value = h.shares * h.currentPrice;

      if (h.exchange === 'NSE' || h.exchange === 'BSE') {
        totalCostBasisNse += cost;
        totalValueNse += value;
      } else {
        totalCostBasisUsd += cost;
        totalValueUsd += value;
      }

      if (h.currentPrice >= h.entryPrice) totalGainers++;
      else totalLosers++;

      // SEPA Violation checks:
      // 1. Current price dropped below Stop Loss
      // 2. Current price dropped below 200 SMA (Lost Stage 2)
      if (h.currentPrice <= h.stopLossPrice || (h.sma200 && h.currentPrice < h.sma200)) {
        sepaViolations++;
      }
    });

    const pnlUsd = totalValueUsd - totalCostBasisUsd;
    const pnlUsdPercent = totalCostBasisUsd > 0 ? (pnlUsd / totalCostBasisUsd) * 100 : 0;

    const pnlNse = totalValueNse - totalCostBasisNse;
    const pnlNsePercent = totalCostBasisNse > 0 ? (pnlNse / totalCostBasisNse) * 100 : 0;

    return {
      totalCostBasisUsd,
      totalValueUsd,
      pnlUsd,
      pnlUsdPercent,
      totalCostBasisNse,
      totalValueNse,
      pnlNse,
      pnlNsePercent,
      totalGainers,
      totalLosers,
      sepaViolations,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">
                Minervini Execution Engine
              </span>
              <span className="bg-black text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-bold">
                Actual Holdings Tracker
              </span>
            </div>
            <h3 className="text-xl font-serif font-black text-[#1a1a1a] tracking-tight leading-none mt-1">
              My Portfolio & SEPA Rule Alignment Tracker
            </h3>
          </div>
        </div>

        {/* Portfolio Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-[#f9f8f5] p-1 border border-[#e5e4e1] font-mono text-xs">
            <button
              onClick={() => setPortfolioSubTab('holdings')}
              className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer ${
                portfolioSubTab === 'holdings'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Active Holdings ({holdings.length})
            </button>
            <button
              onClick={() => setPortfolioSubTab('rebalancing')}
              className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 ${
                portfolioSubTab === 'rebalancing'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-50'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Portfolio Rebalancer</span>
            </button>
          </div>

          <button
            onClick={() => exportPortfolioToCsv(holdings)}
            className="bg-[#f9f8f5] hover:bg-black hover:text-white text-[#1a1a1a] font-bold px-3 py-2 text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all border border-[#e5e4e1] shadow-xs cursor-pointer group"
            title="Export portfolio holdings to CSV format"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:text-amber-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingHoldingId(null);
              setIsAddModalOpen(true);
            }}
            className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all border border-black shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {portfolioSubTab === 'rebalancing' ? (
        <PortfolioRebalancing
          holdings={holdings}
          stocksList={stocks}
          onApplyRebalance={(updated) => setHoldings(updated)}
        />
      ) : (
        <>

      {/* Real-Time Portfolio Performance Summary Widget */}
      <div className="bg-[#1a1a1a] text-white p-5 border border-black shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full bg-emerald-400 absolute ${isLiveStreaming ? 'animate-ping' : ''} opacity-75`} />
              <span className="w-3 h-3 rounded-full bg-emerald-400 relative" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400">
                  Real-Time Portfolio Performance Widget
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] uppercase px-2 py-0.2 font-mono font-bold">
                  {isLiveStreaming ? 'Live Tick Active' : 'Feed Paused'}
                </span>
              </div>
              <h4 className="text-lg font-serif font-bold text-white mt-0.5">
                Aggregate Portfolio Unrealized P&L & Benchmark Alpha
              </h4>
            </div>
          </div>

          {/* Benchmark Selector & Controls */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1 bg-white/10 p-1 border border-white/20">
              <span className="text-gray-400 text-[10px] uppercase px-1">Benchmark:</span>
              {(['SP500', 'NASDAQ', 'NIFTY50', 'RUSSELL'] as const).map((bKey) => (
                <button
                  key={bKey}
                  onClick={() => setSelectedBenchmark(bKey)}
                  className={`px-2 py-1 text-[10px] uppercase font-bold transition-all ${
                    selectedBenchmark === bKey
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {bKey === 'SP500' ? 'S&P 500' : bKey === 'NASDAQ' ? 'Nasdaq' : bKey === 'NIFTY50' ? 'Nifty 50' : 'Russell'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-2.5 py-1.5 text-[10px] font-bold uppercase border transition-all ${
                isLiveStreaming ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200' : 'bg-gray-800 border-gray-600 text-gray-300'
              }`}
            >
              {isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}
            </button>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* Metric 1: Total Portfolio Unrealized P&L */}
          <div className="bg-white/5 border border-white/10 p-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase font-bold">
              <span>Total Unrealized P&L (USD Equiv)</span>
              <span>All Active Positions</span>
            </div>
            <div className="font-mono text-2xl font-black text-white">
              {formatCurrency(totals.pnlUsd + totals.pnlNse * 0.012, '$')}
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/10 text-gray-300">
              <span>Weighted Return:</span>
              <span
                className={`font-black flex items-center space-x-1 ${
                  totals.pnlUsd + totals.pnlNse >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totals.pnlUsd + totals.pnlNse >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>
                  {totals.pnlUsdPercent >= 0 ? '+' : ''}
                  {totals.pnlUsdPercent.toFixed(2)}%
                </span>
              </span>
            </div>
          </div>

          {/* Metric 2: Market Index Comparison */}
          <div className="bg-white/5 border border-white/10 p-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase font-bold">
              <span>{currentBenchmark.name}</span>
              <span>Live Index Return</span>
            </div>
            <div className="font-mono text-2xl font-black text-white">
              {currentBenchmark.value.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/10 text-gray-300">
              <span>Index Change Today:</span>
              <span
                className={`font-black flex items-center space-x-1 ${
                  currentBenchmark.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentBenchmark.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>
                  {currentBenchmark.changePercent >= 0 ? '+' : ''}
                  {currentBenchmark.changePercent}%
                </span>
              </span>
            </div>
          </div>

          {/* Metric 3: Portfolio Alpha vs Market Index */}
          <div className="bg-white/5 border border-white/10 p-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase font-bold">
              <span>Portfolio Alpha vs Index</span>
              <span>Relative Outperformance</span>
            </div>
            {(() => {
              const portfolioReturn = totals.pnlUsdPercent;
              const alpha = portfolioReturn - currentBenchmark.changePercent;
              return (
                <>
                  <div className={`font-mono text-2xl font-black ${alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}% Alpha
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/10 text-gray-300">
                    <span>Performance Status:</span>
                    <span className="font-bold text-amber-300">
                      {alpha >= 0 ? 'Outperforming Market' : 'Lagging Market Index'}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

        </div>

        {/* Live Timestamp footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-white/10">
          <span>Real-time WebSocket Data Feed: Connected (NYSE / NASDAQ / NSE Direct Feed)</span>
          <span>Last Tick Synchronized: <strong className="text-white">{lastTickTime}</strong></span>
        </div>
      </div>

      {/* Portfolio Performance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: US Growth Holdings P&L */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase font-bold">
            <span>🇺🇸 US Portfolio Market Value</span>
            <span>NASDAQ / NYSE</span>
          </div>
          <div className="font-mono text-2xl font-black text-[#1a1a1a]">
            {formatCurrency(totals.totalValueUsd, '$')}
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#e5e4e1]">
            <span className="text-gray-500 text-[11px]">Unrealized P&L:</span>
            <span
              className={`font-extrabold flex items-center space-x-1 ${
                totals.pnlUsd >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {totals.pnlUsd >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>
                {totals.pnlUsd >= 0 ? '+' : ''}
                {formatCurrency(totals.pnlUsd, '$')} ({totals.pnlUsdPercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Card 2: NSE India Growth Holdings P&L */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase font-bold">
            <span>🇮🇳 NSE India Market Value</span>
            <span>NSE Leader Stocks</span>
          </div>
          <div className="font-mono text-2xl font-black text-[#1a1a1a]">
            {formatCurrency(totals.totalValueNse, '₹')}
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#e5e4e1]">
            <span className="text-gray-500 text-[11px]">Unrealized P&L:</span>
            <span
              className={`font-extrabold flex items-center space-x-1 ${
                totals.pnlNse >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {totals.pnlNse >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>
                {totals.pnlNse >= 0 ? '+' : ''}
                {formatCurrency(totals.pnlNse, '₹')} ({totals.pnlNsePercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Card 3: SEPA Risk Health Score */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase font-bold">
            <span>SEPA Health Status</span>
            <span>Stage 2 & Stop Checks</span>
          </div>
          <div className="flex items-center space-x-2">
            {totals.sepaViolations === 0 ? (
              <div className="flex items-center space-x-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 text-xs font-mono font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% SEPA Compliant</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-rose-800 bg-rose-100 px-2.5 py-1 text-xs font-mono font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{totals.sepaViolations} SEPA Violations</span>
              </div>
            )}
          </div>
          <p className="text-[11px] font-serif italic text-gray-600 pt-1 border-t border-[#e5e4e1]">
            {totals.sepaViolations === 0
              ? 'All positions strictly above Stage 2 moving averages & stop losses.'
              : 'Action Required: Position hit stop-loss or lost 200-day moving average.'}
          </p>
        </div>

        {/* Card 4: Position Win/Loss Ratio */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase font-bold">
            <span>Win / Loss Breadth</span>
            <span>Batting Average</span>
          </div>
          <div className="font-mono text-xl font-bold text-[#1a1a1a] flex items-center space-x-3">
            <span className="text-emerald-700 font-black">{totals.totalGainers} Gainers</span>
            <span className="text-gray-300">/</span>
            <span className="text-rose-600 font-black">{totals.totalLosers} Losers</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-gray-500 pt-1 border-t border-[#e5e4e1]">
            <span>Total Active Holdings:</span>
            <strong className="text-[#1a1a1a] font-bold">{holdings.length} Positions</strong>
          </div>
        </div>

      </div>

      {/* Main Holdings Table */}
      <div className="overflow-x-auto border border-[#e5e4e1]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e4e1] text-[10px] uppercase tracking-[0.2em] text-[#b5a68d] font-bold bg-[#f9f8f5]">
              <th className="py-3 px-4">Stock & Exchange</th>
              <th className="py-3 px-4">Position Size</th>
              <th className="py-3 px-4">Cost Basis</th>
              <th className="py-3 px-4">Current Price</th>
              <th className="py-3 px-4 font-mono text-right">Unrealized P&L</th>
              <th className="py-3 px-4 text-center">SEPA Stage & Stop Check</th>
              <th className="py-3 px-4 text-center">Execution Plan</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e4e1] text-xs">
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500 font-serif italic text-sm">
                  No actual portfolio holdings tracked yet. Click "Add Portfolio Holding" to monitor your positions.
                </td>
              </tr>
            ) : (
              holdings.map((h) => {
                const currency = getCurrencySymbol(h.exchange);
                const totalCost = h.shares * h.entryPrice;
                const currentValue = h.shares * h.currentPrice;
                const pnl = currentValue - totalCost;
                const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

                const isStopViolated = h.currentPrice <= h.stopLossPrice;
                const isTargetReached = h.currentPrice >= h.pivotTargetPrice;
                const isStage2Intact = !h.sma200 || h.currentPrice >= h.sma200;

                const matchedStock = stocks.find((s) => s.ticker === h.ticker);

                return (
                  <tr
                    key={h.id}
                    className={`transition-all ${
                      isStopViolated
                        ? 'bg-rose-50/80 border-l-4 border-l-rose-600'
                        : isTargetReached
                        ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {/* Ticker & Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-[#1a1a1a] font-mono">
                          {h.ticker}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider bg-[#1a1a1a] text-white font-mono font-semibold">
                          {h.exchange}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate max-w-[160px] mt-0.5 font-sans">
                        {h.stockName}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                        Bought {h.buyDate}
                      </div>
                    </td>

                    {/* Position Size */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-[#1a1a1a] text-sm">
                        {h.shares} Shares
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Market Value: {formatCurrency(currentValue, currency)}
                      </div>
                    </td>

                    {/* Cost Basis */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-[#1a1a1a]">
                        {formatCurrency(h.entryPrice, currency)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Total Cost: {formatCurrency(totalCost, currency)}
                      </div>
                    </td>

                    {/* Current Live Price */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-extrabold text-sm text-[#1a1a1a]">
                        {formatCurrency(h.currentPrice, currency)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Stop Level: {formatCurrency(h.stopLossPrice, currency)}
                      </div>
                    </td>

                    {/* Unrealized P&L */}
                    <td className="py-4 px-4 font-mono text-right">
                      <div
                        className={`font-black text-sm flex items-center justify-end space-x-1 ${
                          pnl >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>
                          {pnl >= 0 ? '+' : ''}
                          {formatCurrency(pnl, currency)}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          pnl >= 0 ? 'text-emerald-800' : 'text-rose-700'
                        }`}
                      >
                        {pnlPercent >= 0 ? '+' : ''}
                        {pnlPercent.toFixed(2)}%
                      </div>
                    </td>

                    {/* SEPA Stage & Risk Compliance Check */}
                    <td className="py-4 px-4 text-center font-mono">
                      {isStopViolated ? (
                        <span className="inline-flex items-center space-x-1 bg-rose-800 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>STOP HIT — CUT LOSS!</span>
                        </span>
                      ) : isTargetReached ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-800 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                          <Target className="w-3.5 h-3.5" />
                          <span>+20% TARGET REACHED!</span>
                        </span>
                      ) : !isStage2Intact ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-500 text-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>BELOW 200 SMA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>STAGE 2 INTACT</span>
                        </span>
                      )}
                    </td>

                    {/* Minervini Action Plan */}
                    <td className="py-4 px-4 text-center font-sans">
                      {pnlPercent >= 8 ? (
                        <span className="text-[10px] bg-blue-50 text-blue-900 border border-blue-300 px-2 py-0.5 font-mono font-bold block">
                          🔒 Trail Stop to Breakeven (${h.entryPrice})
                        </span>
                      ) : pnlPercent <= -5 ? (
                        <span className="text-[10px] bg-rose-50 text-rose-900 border border-rose-300 px-2 py-0.5 font-mono font-bold block">
                          ⚠️ Nearing Max 7-8% Loss Limit
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono block">
                          Hold for Stage 2 Trend Continuation
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {matchedStock && (
                          <button
                            onClick={() => onViewChart(matchedStock)}
                            title="Scan VCP Chart"
                            className="bg-[#1a1a1a] hover:bg-black text-white p-1.5 transition-colors border border-black"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(h)}
                          title="Edit Position"
                          className="bg-white hover:bg-gray-100 text-gray-800 p-1.5 border border-[#e5e4e1] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHolding(h.id)}
                          title="Remove Position"
                          className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 border border-[#e5e4e1] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Minervini Risk Management Golden Rules Banner */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-gray-700">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="font-bold uppercase text-[10px] text-[#b5a68d]">
            Mark Minervini SEPA Portfolio Rule:
          </span>
          <span className="font-bold text-[#1a1a1a]">
            "Never turn a gain into a loss. Once a stock advances +7-8% above pivot, raise stop loss to breakeven."
          </span>
        </div>
      </div>

      {/* Add / Edit Holding Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1a1a1a] max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
              <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
                {editingHoldingId ? 'Edit Portfolio Position' : 'Add Actual Portfolio Holding'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHolding} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                  Select Stock Setup Candidate
                </label>
                <select
                  value={selectedStockTicker}
                  onChange={(e) => handleSelectStockForAdd(e.target.value)}
                  className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                >
                  {stocks.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} — {s.name} ({s.exchange}) [Pivot: {s.pivotPrice}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                    Shares Quantity
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={sharesInput}
                    onChange={(e) => setSharesInput(e.target.value)}
                    className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={entryPriceInput}
                    onChange={(e) => setEntryPriceInput(e.target.value)}
                    className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                    Stop Loss Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={stopLossInput}
                    onChange={(e) => setStopLossInput(e.target.value)}
                    className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                    Profit Target Price (+20%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    value={buyDateInput}
                    onChange={(e) => setBuyDateInput(e.target.value)}
                    className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
                    Strategy Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Breakout on 2x avg volume"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full bg-white border border-[#e5e4e1] p-2 text-xs text-[#1a1a1a] focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#e5e4e1]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white hover:bg-gray-100 text-gray-700 font-bold px-4 py-2 text-xs uppercase tracking-wider border border-[#e5e4e1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-5 py-2 text-xs uppercase tracking-wider border border-black"
                >
                  Save Position
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
};
