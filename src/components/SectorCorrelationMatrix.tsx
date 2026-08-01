import React, { useState, useMemo } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  Layers,
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  SlidersHorizontal,
  Flame,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Grid,
  Maximize2,
  Compass,
  RefreshCw,
} from 'lucide-react';

interface SectorCorrelationMatrixProps {
  stocks: MinerviniTradeSetup[];
  selectedStock?: MinerviniTradeSetup;
  onSelectStock?: (stock: MinerviniTradeSetup) => void;
}

export interface SectorEtfBenchmark {
  symbol: string;
  name: string;
  sectorName: string;
  changePercent: number;
  rsRating: number;
  stage: 'Stage 2 (Advancing)' | 'Stage 1 (Base)' | 'Stage 3 (Top)' | 'Stage 4 (Declining)';
  dailyReturns: number[]; // 20-day normalized percentage returns
}

// Predefined Sector ETF Benchmarks with realistic return streams
export const SECTOR_BENCHMARK_ETFS: Record<string, SectorEtfBenchmark> = {
  'Technology': {
    symbol: 'XLK',
    name: 'Technology Select Sector SPDR',
    sectorName: 'Technology',
    changePercent: 2.14,
    rsRating: 88,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [1.2, 0.8, -0.4, 1.5, 0.6, -0.2, 1.8, 0.9, -0.5, 1.1, 0.4, -0.8, 1.6, 2.1, 0.3, -0.1, 1.4, 0.7, 1.9, 0.8],
  },
  'Semiconductors': {
    symbol: 'SMH',
    name: 'VanEck Semiconductor ETF',
    sectorName: 'Semiconductors',
    changePercent: 3.25,
    rsRating: 94,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [2.1, 1.4, -0.8, 2.5, 1.1, -0.5, 2.8, 1.5, -0.9, 1.8, 0.9, -1.2, 2.6, 3.2, 0.8, -0.3, 2.2, 1.3, 2.9, 1.5],
  },
  'Healthcare': {
    symbol: 'XLV',
    name: 'Health Care Select Sector SPDR',
    sectorName: 'Healthcare',
    changePercent: -0.45,
    rsRating: 62,
    stage: 'Stage 1 (Base)',
    dailyReturns: [-0.3, 0.2, 0.1, -0.8, 0.4, -0.1, 0.3, -0.6, 0.2, -0.4, 0.1, -0.2, 0.5, -0.7, 0.2, 0.1, -0.3, 0.4, -0.5, -0.2],
  },
  'Biotechnology': {
    symbol: 'XBI',
    name: 'SPDR S&P Biotech ETF',
    sectorName: 'Biotechnology',
    changePercent: 1.85,
    rsRating: 81,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [0.9, 1.1, -1.2, 1.9, 0.8, -0.6, 2.1, 0.4, -0.8, 1.3, 0.6, -1.1, 1.8, 1.9, 0.5, -0.4, 1.6, 0.9, 2.0, 0.6],
  },
  'Financials': {
    symbol: 'XLF',
    name: 'Financial Select Sector SPDR',
    sectorName: 'Financials',
    changePercent: 0.95,
    rsRating: 79,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [0.5, 0.4, -0.2, 0.9, 0.3, -0.1, 1.1, 0.6, -0.4, 0.7, 0.3, -0.5, 0.8, 1.0, 0.2, 0.1, 0.7, 0.5, 1.1, 0.4],
  },
  'Consumer Discretionary': {
    symbol: 'XLY',
    name: 'Consumer Discretionary SPDR',
    sectorName: 'Consumer Discretionary',
    changePercent: 1.42,
    rsRating: 76,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [0.8, 0.6, -0.5, 1.2, 0.5, -0.3, 1.4, 0.7, -0.6, 0.9, 0.4, -0.7, 1.3, 1.5, 0.3, -0.2, 1.0, 0.6, 1.4, 0.5],
  },
  'Energy': {
    symbol: 'XLE',
    name: 'Energy Select Sector SPDR',
    sectorName: 'Energy',
    changePercent: -1.15,
    rsRating: 48,
    stage: 'Stage 4 (Declining)',
    dailyReturns: [-1.2, -0.8, 0.5, -1.5, -0.6, 0.3, -1.8, -0.9, 0.6, -1.1, -0.4, 0.9, -1.6, -1.2, -0.3, 0.2, -1.4, -0.7, -1.9, -0.8],
  },
  'Industrials': {
    symbol: 'XLI',
    name: 'Industrial Select Sector SPDR',
    sectorName: 'Industrials',
    changePercent: 1.12,
    rsRating: 82,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [0.6, 0.5, -0.3, 1.0, 0.4, -0.2, 1.2, 0.7, -0.4, 0.8, 0.3, -0.6, 1.1, 1.2, 0.2, 0.0, 0.9, 0.6, 1.2, 0.5],
  },
  'Broad Market': {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sectorName: 'Broad Market',
    changePercent: 0.82,
    rsRating: 75,
    stage: 'Stage 2 (Advancing)',
    dailyReturns: [0.4, 0.3, -0.2, 0.8, 0.3, -0.1, 0.9, 0.5, -0.3, 0.6, 0.2, -0.4, 0.8, 0.9, 0.2, 0.1, 0.6, 0.4, 0.9, 0.3],
  }
};

// Helper to compute Pearson correlation coefficient r between two arrays
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (!x || !y || x.length === 0 || y.length === 0 || x.length !== y.length) return 0;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return Math.min(1.0, Math.max(-1.0, numerator / denominator));
}

// Helper to compute Beta relative to ETF
export function calculateBeta(stockReturns: number[], etfReturns: number[]): number {
  if (!stockReturns || !etfReturns || stockReturns.length < 2) return 1.0;
  const etfMean = etfReturns.reduce((a, b) => a + b, 0) / etfReturns.length;
  const stockMean = stockReturns.reduce((a, b) => a + b, 0) / stockReturns.length;

  let covariance = 0;
  let etfVariance = 0;

  for (let i = 0; i < stockReturns.length; i++) {
    covariance += (stockReturns[i] - stockMean) * (etfReturns[i] - etfMean);
    etfVariance += Math.pow(etfReturns[i] - etfMean, 2);
  }

  if (etfVariance === 0) return 1.0;
  return Number((covariance / etfVariance).toFixed(2));
}

// Generate realistic daily returns array for a stock based on price action and volatility
function deriveStockDailyReturns(stock: MinerviniTradeSetup): number[] {
  if (stock.priceHistory && stock.priceHistory.length >= 20) {
    const recent20 = stock.priceHistory.slice(-21);
    const returns: number[] = [];
    for (let i = 1; i < recent20.length; i++) {
      const prev = recent20[i - 1].close;
      const curr = recent20[i].close;
      returns.push(Number((((curr - prev) / prev) * 100).toFixed(2)));
    }
    return returns;
  }

  // Fallback realistic returns array correlated with stock change percent
  const baseChange = stock.changePercent || 1.5;
  const mult = baseChange > 0 ? 1.2 : 0.8;
  return [
    1.1 * mult, 0.9 * mult, -0.3, 1.8 * mult, 0.7 * mult, -0.4, 2.1 * mult, 1.2 * mult,
    -0.6, 1.4 * mult, 0.5 * mult, -0.9, 1.9 * mult, 2.3 * mult, 0.4, -0.2, 1.6 * mult,
    0.8 * mult, 2.2 * mult, baseChange
  ];
}

export const SectorCorrelationMatrix: React.FC<SectorCorrelationMatrixProps> = ({
  stocks,
  selectedStock: propSelectedStock,
  onSelectStock,
}) => {
  const [activeStock, setActiveStock] = useState<MinerviniTradeSetup>(
    propSelectedStock || stocks[0] || ({ ticker: 'NVDA', name: 'NVIDIA Corp', sector: 'Semiconductors', changePercent: 3.42, currentPrice: 128.5, pivotPrice: 125.0, exchange: 'NASDAQ' } as MinerviniTradeSetup)
  );
  const [selectedEtfKey, setSelectedEtfKey] = useState<string>('Technology');
  const [timeframe, setTimeframe] = useState<'20D' | '50D' | '60D'>('20D');
  const [matrixView, setMatrixView] = useState<'STOCK_VS_ETFS' | 'SECTOR_PEERS'>('STOCK_VS_ETFS');

  // Update active stock if prop changes
  React.useEffect(() => {
    if (propSelectedStock) {
      setActiveStock(propSelectedStock);
    }
  }, [propSelectedStock]);

  const currencySymbol = getCurrencySymbol(activeStock.exchange);

  // Derived Benchmark ETF matching stock's sector
  const stockSectorEtf = useMemo(() => {
    const matchedKey = Object.keys(SECTOR_BENCHMARK_ETFS).find(
      (k) => k.toLowerCase() === (activeStock.sector || '').toLowerCase()
    );
    return matchedKey ? SECTOR_BENCHMARK_ETFS[matchedKey] : SECTOR_BENCHMARK_ETFS['Broad Market'];
  }, [activeStock.sector]);

  // Selected Benchmark ETF for deep analysis
  const currentEtf = SECTOR_BENCHMARK_ETFS[selectedEtfKey] || stockSectorEtf;

  // Active Stock Daily Returns
  const stockReturns = useMemo(() => deriveStockDailyReturns(activeStock), [activeStock]);

  // Calculations: Pearson Correlation & Beta
  const correlationScore = useMemo(
    () => calculatePearsonCorrelation(stockReturns, currentEtf.dailyReturns),
    [stockReturns, currentEtf]
  );

  const beta = useMemo(
    () => calculateBeta(stockReturns, currentEtf.dailyReturns),
    [stockReturns, currentEtf]
  );

  const rSquared = useMemo(() => Number((Math.pow(correlationScore, 2) * 100).toFixed(1)), [correlationScore]);

  // Harmony Classification
  const harmonyStatus = useMemo(() => {
    if (correlationScore >= 0.75) {
      return {
        label: 'HIGH SECTOR HARMONY',
        badgeBg: 'bg-emerald-900 text-emerald-200 border-emerald-700',
        textColor: 'text-emerald-700',
        icon: ShieldCheck,
        description: 'Stock is moving in lockstep with leading group momentum! Ideal institutional SEPA setup.',
      };
    } else if (correlationScore >= 0.50) {
      return {
        label: 'MODERATE GROUP ALIGNMENT',
        badgeBg: 'bg-blue-900 text-blue-200 border-blue-700',
        textColor: 'text-blue-700',
        icon: Activity,
        description: 'Stock tracks sector ETF closely with minor individual variance.',
      };
    } else if (correlationScore >= 0.20) {
      return {
        label: 'IDIOSYNCRATIC ALPHA',
        badgeBg: 'bg-amber-900 text-amber-200 border-amber-700',
        textColor: 'text-amber-700',
        icon: Zap,
        description: 'Stock moves independently on specific company catalysts or earnings announcements.',
      };
    } else {
      return {
        label: 'DIVERGENT DECOUPLING WARNING',
        badgeBg: 'bg-red-900 text-red-200 border-red-700',
        textColor: 'text-red-700',
        icon: ShieldAlert,
        description: 'Stock is decoupled or inverse to sector ETF. Exercise caution against sector drag!',
      };
    }
  }, [correlationScore]);

  // Peer Stock List in same sector
  const sectorPeers = useMemo(() => {
    return stocks.filter(
      (s) => (s.sector || '').toLowerCase() === (activeStock.sector || '').toLowerCase()
    );
  }, [stocks, activeStock]);

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-[#1a1a1a]" />
            <h2 className="text-lg font-extrabold uppercase tracking-widest text-[#1a1a1a]">
              Sector ETF Correlation Matrix & Group Harmony Engine
            </h2>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-3xl">
            Minervini SEPA Principle: Top market leaders emerge from top-performing sector groups. Compare price action, 20-day rolling correlation ($r$), Beta ($\beta$), and co-movement against sector benchmark ETFs.
          </p>
        </div>

        {/* Stock Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Stock:</label>
          <select
            value={activeStock.ticker}
            onChange={(e) => {
              const s = stocks.find((st) => st.ticker === e.target.value);
              if (s) {
                setActiveStock(s);
                if (onSelectStock) onSelectStock(s);
              }
            }}
            className="bg-[#f9f8f5] border border-[#e5e4e1] text-[#1a1a1a] font-mono font-bold text-xs px-3 py-2 cursor-pointer focus:outline-none focus:border-[#1a1a1a]"
          >
            {stocks.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.name} ({s.sector || 'General'})
              </option>
            ))}
          </select>

          {/* Timeframe selector */}
          <div className="flex border border-[#e5e4e1] overflow-hidden text-xs font-mono">
            {(['20D', '50D', '60D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1.5 transition-all font-bold cursor-pointer ${
                  timeframe === tf ? 'bg-[#1a1a1a] text-white' : 'bg-[#f9f8f5] text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Scorecard: Active Stock vs Benchmark ETF */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Stock Focus */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Target Stock</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-extrabold font-mono text-[#1a1a1a]">{activeStock.ticker}</span>
              <span className="text-xs font-semibold text-gray-600">{activeStock.sector}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500">Live Price:</span>
              <span className="font-bold text-[#1a1a1a]">
                {formatCurrency(activeStock.currentPrice, currencySymbol)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500">20D Return:</span>
              <span className={`font-bold ${activeStock.changePercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {activeStock.changePercent >= 0 ? '+' : ''}{activeStock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#e5e4e1] text-[10px] font-mono text-gray-500">
            SEPA Score: <strong className="text-[#1a1a1a]">{activeStock.trendScore}/8</strong> | RS Rating: <strong className="text-[#1a1a1a]">{activeStock.rsRating || 85}</strong>
          </div>
        </div>

        {/* Card 2: Sector Benchmark ETF */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Sector Benchmark ETF</span>
              <select
                value={selectedEtfKey}
                onChange={(e) => setSelectedEtfKey(e.target.value)}
                className="text-[10px] font-mono font-bold bg-white border border-[#e5e4e1] px-1.5 py-0.5 focus:outline-none"
              >
                {Object.keys(SECTOR_BENCHMARK_ETFS).map((key) => (
                  <option key={key} value={key}>
                    {SECTOR_BENCHMARK_ETFS[key].symbol} ({key})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-extrabold font-mono text-[#1a1a1a]">{currentEtf.symbol}</span>
              <span className="text-xs font-semibold text-gray-600 truncate">{currentEtf.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500">20D Return:</span>
              <span className={`font-bold ${currentEtf.changePercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {currentEtf.changePercent >= 0 ? '+' : ''}{currentEtf.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500">Group Stage:</span>
              <span className="font-bold text-[#1a1a1a]">{currentEtf.stage}</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#e5e4e1] text-[10px] font-mono text-gray-500">
            ETF RS Rating: <strong className="text-[#1a1a1a]">{currentEtf.rsRating}</strong>
          </div>
        </div>

        {/* Card 3: Correlation Score & Beta */}
        <div className="bg-[#1a1a1a] text-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Correlation Score ($r$)</span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">R² = {rSquared}%</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
              {correlationScore >= 0 ? '+' : ''}{correlationScore.toFixed(2)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono border-t border-gray-800 pt-2">
              <span className="text-gray-400">Beta ($\beta$):</span>
              <span className="font-bold text-emerald-400">{beta}x</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Outperformance Delta:</span>
              <span className={`font-bold ${(activeStock.changePercent - currentEtf.changePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(activeStock.changePercent - currentEtf.changePercent) >= 0 ? '+' : ''}
                {(activeStock.changePercent - currentEtf.changePercent).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="mt-3 text-[10px] font-mono text-gray-400">
            Beta &gt; 1.0 = High Beta Outperformer
          </div>
        </div>

        {/* Card 4: Minervini Harmony Verdict */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Harmony Verdict</span>
            <div className={`mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold font-mono border ${harmonyStatus.badgeBg}`}>
              <harmonyStatus.icon className="w-3.5 h-3.5" />
              <span>{harmonyStatus.label}</span>
            </div>
            <p className="text-xs text-gray-600 font-sans mt-3 leading-relaxed">
              {harmonyStatus.description}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-[#e5e4e1] text-[10px] font-mono text-gray-500">
            SEPA Rule: Prioritize stocks with $r \ge +0.65$ in Stage 2 ETF sectors!
          </div>
        </div>
      </div>

      {/* Visual Correlation Gauge & Scatter Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Correlation Spectrum Bar */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#1a1a1a]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                Correlation Spectrum Gauge (-1.0 to +1.0)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#1a1a1a]">
              $r = {correlationScore.toFixed(2)}$
            </span>
          </div>

          <p className="text-xs text-gray-600 font-sans">
            Measures how tightly {activeStock.ticker} moves in lockstep with {currentEtf.symbol}. Scores above +0.70 reflect institutional group accumulation.
          </p>

          {/* Spectrum Bar */}
          <div className="space-y-2">
            <div className="relative h-6 bg-gradient-to-r from-red-600 via-amber-400 via-blue-500 to-emerald-600 rounded-none border border-[#e5e4e1] shadow-inner overflow-hidden">
              {/* Pointer indicator */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-black border-2 border-white shadow-md transition-all duration-500"
                style={{
                  left: `${Math.min(98, Math.max(2, ((correlationScore + 1) / 2) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <span>-1.0 (Inverse)</span>
              <span>0.0 (Decoupled)</span>
              <span>+0.50 (Moderate)</span>
              <span className="text-emerald-700 font-bold">+1.0 (Lockstep)</span>
            </div>
          </div>

          {/* Detailed Breakdown stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
            <div className="p-2 bg-white border border-[#e5e4e1]">
              <span className="text-[10px] text-gray-500 block">R-Squared ($R^2$)</span>
              <span className="font-bold text-[#1a1a1a]">{rSquared}%</span>
            </div>
            <div className="p-2 bg-white border border-[#e5e4e1]">
              <span className="text-[10px] text-gray-500 block">Beta ($\beta$)</span>
              <span className="font-bold text-[#1a1a1a]">{beta}x</span>
            </div>
            <div className="p-2 bg-white border border-[#e5e4e1]">
              <span className="text-[10px] text-gray-500 block">Relative Alpha</span>
              <span className={`font-bold ${(activeStock.changePercent - currentEtf.changePercent) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {(activeStock.changePercent - currentEtf.changePercent) >= 0 ? '+' : ''}
                {(activeStock.changePercent - currentEtf.changePercent).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Co-Movement Scatter Plot Matrix */}
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-[#1a1a1a]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                Daily Return Co-Movement Scatter Matrix
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-500">
              Y: {activeStock.ticker} % Return | X: {currentEtf.symbol} % Return
            </span>
          </div>

          {/* SVG Scatter Plot */}
          <div className="relative w-full h-44 bg-white border border-[#e5e4e1] p-2 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 150">
              {/* Axes */}
              <line x1="150" y1="10" x2="150" y2="140" stroke="#d1d0cc" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="20" y1="75" x2="280" y2="75" stroke="#d1d0cc" strokeDasharray="3 3" strokeWidth="1" />

              {/* Axis labels */}
              <text x="275" y="70" className="text-[8px] font-mono fill-gray-400 text-anchor-end">+ETF</text>
              <text x="25" y="70" className="text-[8px] font-mono fill-gray-400">-ETF</text>
              <text x="155" y="20" className="text-[8px] font-mono fill-gray-400">+Stock</text>
              <text x="155" y="135" className="text-[8px] font-mono fill-gray-400">-Stock</text>

              {/* Regression line */}
              <line
                x1="30"
                y1={75 + (150 - 30) * 0.5 * beta}
                x2="270"
                y2={75 - (270 - 150) * 0.5 * beta}
                stroke="#d97706"
                strokeWidth="2"
              />

              {/* Data points */}
              {stockReturns.map((ret, idx) => {
                const etfRet = currentEtf.dailyReturns[idx] || 0;
                const x = 150 + etfRet * 35;
                const y = 75 - ret * 20;
                return (
                  <circle
                    key={idx}
                    cx={Math.max(25, Math.min(275, x))}
                    cy={Math.max(15, Math.min(135, y))}
                    r="4"
                    className="fill-emerald-600 stroke-emerald-900 opacity-80 hover:opacity-100 transition-all"
                  />
                );
              })}
            </svg>

            <div className="absolute top-2 left-2 bg-white/90 border border-gray-200 px-2 py-1 text-[9px] font-mono text-gray-600">
              Regression Line Slope ($\beta$) = {beta}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Quadrant I: Synchronized Bullish Advance</span>
            <span className="text-amber-800 font-bold">Trend Slope: Beta {beta}x</span>
          </div>
        </div>
      </div>

      {/* Cross-Sector Benchmark ETF Matrix Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-[#1a1a1a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
              Full Cross-Sector Benchmark ETF Correlation Matrix for {activeStock.ticker}
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={() => setMatrixView('STOCK_VS_ETFS')}
              className={`px-3 py-1 font-bold border transition-all cursor-pointer ${
                matrixView === 'STOCK_VS_ETFS'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-gray-600 border-[#e5e4e1] hover:bg-gray-100'
              }`}
            >
              Stock vs All Sector ETFs
            </button>
            <button
              onClick={() => setMatrixView('SECTOR_PEERS')}
              className={`px-3 py-1 font-bold border transition-all cursor-pointer ${
                matrixView === 'SECTOR_PEERS'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-gray-600 border-[#e5e4e1] hover:bg-gray-100'
              }`}
            >
              Same-Sector Peer Matrix ({activeStock.sector || 'Peers'})
            </button>
          </div>
        </div>

        {/* VIEW 1: Stock vs All Sector ETFs */}
        {matrixView === 'STOCK_VS_ETFS' && (
          <div className="overflow-x-auto border border-[#e5e4e1]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#1a1a1a] text-white uppercase text-[10px] tracking-wider">
                  <th className="p-3">Sector ETF Symbol</th>
                  <th className="p-3">Benchmark Name</th>
                  <th className="p-3">Sector Group</th>
                  <th className="p-3 text-right">20D Return</th>
                  <th className="p-3 text-center">Stage</th>
                  <th className="p-3 text-center">Correlation ($r$)</th>
                  <th className="p-3 text-center">Beta ($\beta$)</th>
                  <th className="p-3 text-center">R² (%)</th>
                  <th className="p-3 text-center">Harmony Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e4e1] bg-white">
                {Object.keys(SECTOR_BENCHMARK_ETFS).map((key) => {
                  const etf = SECTOR_BENCHMARK_ETFS[key];
                  const r = calculatePearsonCorrelation(stockReturns, etf.dailyReturns);
                  const b = calculateBeta(stockReturns, etf.dailyReturns);
                  const rSq = Number((Math.pow(r, 2) * 100).toFixed(1));
                  const isPrimarySector = (activeStock.sector || '').toLowerCase() === etf.sectorName.toLowerCase();

                  return (
                    <tr
                      key={etf.symbol}
                      onClick={() => setSelectedEtfKey(key)}
                      className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                        selectedEtfKey === key ? 'bg-amber-100/60 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-[#1a1a1a] flex items-center space-x-2">
                        <span>{etf.symbol}</span>
                        {isPrimarySector && (
                          <span className="bg-emerald-800 text-white text-[9px] px-1.5 py-0.2 font-sans uppercase">
                            PRIMARY SECTOR
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-700">{etf.name}</td>
                      <td className="p-3 text-gray-500">{etf.sectorName}</td>
                      <td className={`p-3 text-right font-bold ${etf.changePercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent.toFixed(2)}%
                      </td>
                      <td className="p-3 text-center text-[10px] text-gray-600 font-bold">{etf.stage}</td>
                      <td className="p-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 border text-xs ${
                            r >= 0.70
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : r >= 0.40
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : r >= 0.0
                              ? 'bg-gray-100 text-gray-800 border-gray-300'
                              : 'bg-red-100 text-red-900 border-red-300'
                          }`}
                        >
                          {r >= 0 ? '+' : ''}{r.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-[#1a1a1a]">{b}x</td>
                      <td className="p-3 text-center text-gray-600">{rSq}%</td>
                      <td className="p-3 text-center">
                        {r >= 0.70 ? (
                          <span className="text-emerald-800 font-bold text-[10px] uppercase">STRONG HARMONY</span>
                        ) : r >= 0.40 ? (
                          <span className="text-blue-800 font-bold text-[10px] uppercase">MODERATE</span>
                        ) : (
                          <span className="text-gray-500 text-[10px] uppercase">LOW / DECOUPLED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: Same-Sector Peer Matrix */}
        {matrixView === 'SECTOR_PEERS' && (
          <div className="overflow-x-auto border border-[#e5e4e1]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#1a1a1a] text-white uppercase text-[10px] tracking-wider">
                  <th className="p-3">Peer Ticker</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3 text-right">Current Price</th>
                  <th className="p-3 text-right">20D Return</th>
                  <th className="p-3 text-center">SEPA Trend</th>
                  <th className="p-3 text-center">RS Rating</th>
                  <th className="p-3 text-center">Peer Correlation ($r$)</th>
                  <th className="p-3 text-center">Harmony with {activeStock.ticker}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e4e1] bg-white">
                {sectorPeers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500 font-sans italic">
                      No additional peer stocks found in {activeStock.sector || 'this sector'}.
                    </td>
                  </tr>
                ) : (
                  sectorPeers.map((peer) => {
                    const peerReturns = deriveStockDailyReturns(peer);
                    const r = calculatePearsonCorrelation(stockReturns, peerReturns);
                    const peerCurrency = getCurrencySymbol(peer.exchange);

                    return (
                      <tr
                        key={peer.ticker}
                        onClick={() => {
                          setActiveStock(peer);
                          if (onSelectStock) onSelectStock(peer);
                        }}
                        className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                          activeStock.ticker === peer.ticker ? 'bg-amber-100/60 font-semibold' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-[#1a1a1a] flex items-center space-x-2">
                          <span>{peer.ticker}</span>
                          {activeStock.ticker === peer.ticker && (
                            <span className="bg-[#1a1a1a] text-white text-[9px] px-1.5 py-0.2">ACTIVE</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-700">{peer.name}</td>
                        <td className="p-3 text-right font-bold">
                          {formatCurrency(peer.currentPrice, peerCurrency)}
                        </td>
                        <td className={`p-3 text-right font-bold ${peer.changePercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {peer.changePercent >= 0 ? '+' : ''}{peer.changePercent.toFixed(2)}%
                        </td>
                        <td className="p-3 text-center font-bold text-[#1a1a1a]">{peer.trendScore}/8</td>
                        <td className="p-3 text-center text-gray-700">{peer.rsRating || 80}</td>
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 border text-xs ${
                              r >= 0.70
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : r >= 0.40
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {r >= 0 ? '+' : ''}{r.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {r >= 0.70 ? (
                            <span className="text-emerald-800 font-bold text-[10px] uppercase">IN LOCKSTEP</span>
                          ) : (
                            <span className="text-gray-500 text-[10px] uppercase">INDEPENDENT</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
