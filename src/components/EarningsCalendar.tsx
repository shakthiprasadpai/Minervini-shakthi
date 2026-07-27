import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { MinerviniTradeSetup } from '../types';

interface EarningsCalendarProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart?: (stock: MinerviniTradeSetup) => void;
  selectedStockTicker?: string;
}

export const EarningsCalendar: React.FC<EarningsCalendarProps> = ({
  stocks,
  onSelectStock,
  onViewChart,
  selectedStockTicker
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMinerviniGuide, setShowMinerviniGuide] = useState<boolean>(true);

  // Filter stocks that have earnings data
  const stocksWithEarnings = stocks.map((s) => {
    // If stock doesn't have daysToEarnings explicitly, calculate/assign default
    const days = s.daysToEarnings !== undefined ? s.daysToEarnings : 14;
    let computedStatus: 'DANGER_IMMINENT' | 'WARNING_SOON' | 'SAFE_WINDOW' | 'POST_EARNINGS_GAP' = s.earningsRiskStatus || 'SAFE_WINDOW';
    
    if (days >= 0 && days <= 5) computedStatus = 'DANGER_IMMINENT';
    else if (days > 5 && days <= 14) computedStatus = 'WARNING_SOON';
    else if (days < 0) computedStatus = 'POST_EARNINGS_GAP';
    else computedStatus = 'SAFE_WINDOW';

    return {
      ...s,
      daysToEarnings: days,
      earningsRiskStatus: computedStatus
    };
  });

  // Filter based on search and selected risk status filter
  const filteredStocks = stocksWithEarnings
    .filter((stock) => {
      const matchesSearch =
        stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'DANGER') return stock.earningsRiskStatus === 'DANGER_IMMINENT';
      if (filterStatus === 'WARNING') return stock.earningsRiskStatus === 'WARNING_SOON';
      if (filterStatus === 'SAFE') return stock.earningsRiskStatus === 'SAFE_WINDOW';
      if (filterStatus === 'POST_EARNINGS') return stock.earningsRiskStatus === 'POST_EARNINGS_GAP';

      return true;
    })
    .sort((a, b) => a.daysToEarnings - b.daysToEarnings);

  // Risk counts
  const dangerCount = stocksWithEarnings.filter((s) => s.earningsRiskStatus === 'DANGER_IMMINENT').length;
  const warningCount = stocksWithEarnings.filter((s) => s.earningsRiskStatus === 'WARNING_SOON').length;
  const safeCount = stocksWithEarnings.filter((s) => s.earningsRiskStatus === 'SAFE_WINDOW').length;
  const postEarningsCount = stocksWithEarnings.filter((s) => s.earningsRiskStatus === 'POST_EARNINGS_GAP').length;

  const getStatusBadge = (status: string, days: number) => {
    if (status === 'DANGER_IMMINENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          DANGER ({days} Days) - High Gap Hazard
        </span>
      );
    }
    if (status === 'WARNING_SOON') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          WARNING ({days} Days) - Moderate Risk
        </span>
      );
    }
    if (status === 'POST_EARNINGS_GAP') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          POST-EARNINGS ({Math.abs(days)}d Ago) - PEAD Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        SAFE WINDOW ({days} Days)
      </span>
    );
  };

  return (
    <div id="earnings-calendar-component" className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white rounded-xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold tracking-tight">Earnings Release Calendar & Risk Guard</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SEPA Volatility Guard
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Track upcoming quarterly earnings dates to eliminate overnight binary gap risk before entering VCP breakouts.
            </p>
          </div>

          <button
            onClick={() => setShowMinerviniGuide(!showMinerviniGuide)}
            className="self-start md:self-auto px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-600 transition flex items-center space-x-2"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>{showMinerviniGuide ? 'Hide Minervini Earnings Rules' : 'Show Minervini Earnings Rules'}</span>
          </button>
        </div>

        {/* Minervini Earnings Rule Card */}
        {showMinerviniGuide && (
          <div className="mt-5 pt-5 border-t border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-red-900/40 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Rule 1: No Cushion, No Earnings Holding</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Never hold a stock into earnings unless you have at least a <strong>10%–15%+ profit cushion</strong>. Without a cushion, an unexpected earnings gap down will wipe out weeks of gains.
              </p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-amber-900/40 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Rule 2: Avoid Pivots &lt; 5 Days Before Report</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Buying a VCP breakout 1 to 5 days before earnings is high-risk gambling. Wait for the report to clear, or buy earlier in the safe window when there is time for a proper run-up.
              </p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-purple-900/40 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Rule 3: Post-Earnings Gap-Up Play (PEAD)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                When a high RS growth stock surprises on EPS with a <strong>huge gap up on 2x–4x volume</strong>, look for a 3-day VCP pullback or high tight flag for a high-probability entry.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Summary Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Risk Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Stocks ({stocksWithEarnings.length})
          </button>

          <button
            onClick={() => setFilterStatus('DANGER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              filterStatus === 'DANGER'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Danger &lt;5 Days ({dangerCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              filterStatus === 'WARNING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Warning 6-14 Days ({warningCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('SAFE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              filterStatus === 'SAFE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe Window ({safeCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('POST_EARNINGS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              filterStatus === 'POST_EARNINGS'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Post-Earnings ({postEarningsCount})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search symbol, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-none"
          />
          <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Main Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStocks.map((stock) => {
          const isSelected = selectedStockTicker === stock.ticker;

          return (
            <div
              key={stock.ticker}
              id={`earnings-card-${stock.ticker}`}
              className={`bg-white rounded-xl p-5 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'border-2 border-slate-900 shadow-md ring-1 ring-slate-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-lg text-slate-900">{stock.ticker}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700">
                        {stock.exchange}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">RS {stock.rsRating}</span>
                    </div>
                    <div className="text-xs text-gray-600 font-medium truncate max-w-[200px]" title={stock.name}>
                      {stock.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">${stock.currentPrice.toFixed(2)}</div>
                    <div
                      className={`text-xs font-semibold ${
                        stock.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>{getStatusBadge(stock.earningsRiskStatus, stock.daysToEarnings)}</div>

                {/* Earnings Date & Timing Details Box */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Next Release Date:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {stock.nextEarningsDate || 'TBD'}
                      {stock.earningsTime === 'BMO' && <span className="text-[10px] text-amber-600 font-semibold">(BMO 🌅)</span>}
                      {stock.earningsTime === 'AMC' && <span className="text-[10px] text-indigo-600 font-semibold">(AMC 🌙)</span>}
                    </span>
                  </div>

                  {/* Growth Fundamentals Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-semibold">Last Q EPS Growth</span>
                      <span className="font-extrabold text-emerald-600">
                        {stock.epsYoYGrowthLastQ ? `+${stock.epsYoYGrowthLastQ}% YoY` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-semibold">Revenue Growth</span>
                      <span className="font-extrabold text-slate-800">
                        {stock.revYoYGrowthLastQ ? `+${stock.revYoYGrowthLastQ}% YoY` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minervini Action Verdict */}
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-gray-700 block">Minervini Risk Guidance:</span>
                  {stock.earningsRiskStatus === 'DANGER_IMMINENT' && (
                    <p className="text-red-700 bg-red-50/80 p-2 rounded border border-red-200 text-[11px] leading-tight">
                      <strong>HAZARD:</strong> High risk of gap down. Avoid taking a new pivot entry here unless you hold &gt;10% profit cushion.
                    </p>
                  )}
                  {stock.earningsRiskStatus === 'WARNING_SOON' && (
                    <p className="text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200 text-[11px] leading-tight">
                      <strong>CAUTION:</strong> Report in 6-14 days. If entering pivot at ${stock.pivotPrice.toFixed(2)}, ensure tight stop loss at ${stock.stopLossPrice.toFixed(2)}.
                    </p>
                  )}
                  {stock.earningsRiskStatus === 'SAFE_WINDOW' && (
                    <p className="text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-200 text-[11px] leading-tight">
                      <strong>IDEAL BUY WINDOW:</strong> {stock.daysToEarnings} days to earnings. Clean runway to trade VCP breakout to target ${stock.target1Price.toFixed(2)}.
                    </p>
                  )}
                  {stock.earningsRiskStatus === 'POST_EARNINGS_GAP' && (
                    <p className="text-purple-800 bg-purple-50/80 p-2 rounded border border-purple-200 text-[11px] leading-tight">
                      <strong>POST-EARNINGS SETUP:</strong> Report cleared with high volume. Watch for micro VCP pullback or high tight flag entry.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectStock(stock)}
                  className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition text-center"
                >
                  Inspect Setup
                </button>

                {onViewChart && (
                  <button
                    onClick={() => onViewChart(stock)}
                    className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Chart</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredStocks.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200 space-y-3">
          <Calendar className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Earnings Releases Match Your Filter</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try switching risk status filters or clear search query to view all upcoming quarterly report dates.
          </p>
          <button
            onClick={() => {
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
