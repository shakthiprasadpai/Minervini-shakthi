import React, { useState, useEffect, useRef } from 'react';
import { PriceAlert, MinerviniTradeSetup, PortfolioHolding } from '../types';
import {
  getStoredAlerts,
  saveStoredAlerts,
  appendTrackerLog,
  playAlertChime,
  initializeLocalStorageAlerts,
  syncPortfolioAlerts,
} from '../utils/backgroundPriceChecker';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowUpRight,
  Target,
  ShieldAlert,
  BarChart3,
  RotateCcw,
  Activity,
  Briefcase,
  Sparkles,
  Zap,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface GlobalNotificationToastProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onNavigateTab: (tab: 'screener' | 'chart' | 'calculator' | 'portfolio') => void;
}

export interface ActiveToastNotification {
  alert: PriceAlert;
  previousPrice: number;
  currentPrice: number;
  crossoverType: 'PIVOT_CROSSOVER' | 'STOP_LOSS_HIT' | 'PROXIMITY_ALERT' | 'VOLATILITY_DRYUP' | 'PORTFOLIO_PIVOT_CROSSOVER' | 'PORTFOLIO_STOP_LOSS_HIT';
  triggeredAt: string;
  isPortfolioHolding?: boolean;
  portfolioHolding?: PortfolioHolding;
}

export const GlobalNotificationToast: React.FC<GlobalNotificationToastProps> = ({
  stocks,
  onSelectStock,
  onNavigateTab,
}) => {
  const [activeToast, setActiveToast] = useState<ActiveToastNotification | null>(null);
  const [backgroundRunning, setBackgroundRunning] = useState<boolean>(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [checksCount, setChecksCount] = useState<number>(0);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState<boolean>(false);

  // Initialize LocalStorage Alerts & Portfolio Sync on mount
  useEffect(() => {
    initializeLocalStorageAlerts(stocks);
    syncPortfolioAlerts();
  }, [stocks]);

  // Listen to custom window events for immediate alert/portfolio re-sync
  useEffect(() => {
    const handleSync = () => {
      syncPortfolioAlerts();
    };

    window.addEventListener('minervini_portfolio_updated', handleSync);
    window.addEventListener('minervini_alerts_updated', handleSync);
    return () => {
      window.removeEventListener('minervini_portfolio_updated', handleSync);
      window.removeEventListener('minervini_alerts_updated', handleSync);
    };
  }, []);

  // Background Price Checker Loop
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  useEffect(() => {
    if (!backgroundRunning) return;

    const interval = setInterval(() => {
      // Re-sync portfolio holdings to make sure new portfolio positions are tracked
      syncPortfolioAlerts();

      const storedAlerts = getStoredAlerts();
      if (!storedAlerts || storedAlerts.length === 0) return;

      // Read active portfolio holdings
      let portfolioHoldings: PortfolioHolding[] = [];
      try {
        const rawPortfolio = localStorage.getItem('minervini_sepa_portfolio');
        if (rawPortfolio) portfolioHoldings = JSON.parse(rawPortfolio);
      } catch (e) {
        console.error(e);
      }

      let hasUpdates = false;
      let newToast: ActiveToastNotification | null = null;

      const updatedAlerts = storedAlerts.map((alert) => {
        if (alert.status !== 'ACTIVE') return alert;

        // Match stock setup from current stock list
        const stockMatch = stocksRef.current.find((s) => s.ticker === alert.ticker);
        const currentPrice = stockMatch ? stockMatch.currentPrice : alert.currentPrice;

        // Match portfolio holding if present
        const portfolioMatch = portfolioHoldings.find((h) => h.ticker === alert.ticker);
        const isPortfolio = !!portfolioMatch || (alert.notes && alert.notes.includes('💼 Portfolio'));

        // Micro live tick simulation to test price movement towards/over thresholds
        const randomTickChange = (Math.random() - 0.48) * 0.28;
        const simulatedPrice = Number((currentPrice + randomTickChange).toFixed(2));
        const previousPrice = alert.currentPrice;

        const currencySymbol = getCurrencySymbol(alert.exchange);

        // Check 1: Pivot Entry Crossover
        if (alert.targetType === 'PIVOT_ENTRY') {
          const isCrossed = (previousPrice < alert.targetPrice && simulatedPrice >= alert.targetPrice) ||
                            simulatedPrice >= alert.targetPrice;

          if (isCrossed) {
            hasUpdates = true;
            playAlertChime();

            const toastType = isPortfolio ? 'PORTFOLIO_PIVOT_CROSSOVER' : 'PIVOT_CROSSOVER';

            // Native browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(
                isPortfolio
                  ? `💼 Portfolio Position Breakout: ${alert.ticker}`
                  : `🎯 Pivot Breakout Crossover: ${alert.ticker}`,
                {
                  body: `${alert.ticker} price at ${currencySymbol}${simulatedPrice.toFixed(2)} crossed Pivot Target ${currencySymbol}${alert.targetPrice.toFixed(2)}!`,
                  icon: '/favicon.ico',
                }
              );
            }

            appendTrackerLog({
              ticker: alert.ticker,
              exchange: alert.exchange || 'NASDAQ',
              previousPrice,
              currentPrice: simulatedPrice,
              targetPrice: alert.targetPrice,
              targetType: alert.targetType,
              event: 'PIVOT_CROSSED',
              triggered: true,
            });

            newToast = {
              alert: { ...alert, status: 'TRIGGERED' as const },
              previousPrice,
              currentPrice: simulatedPrice,
              crossoverType: toastType,
              triggeredAt: new Date().toLocaleTimeString(),
              isPortfolioHolding: isPortfolio,
              portfolioHolding: portfolioMatch,
            };

            return {
              ...alert,
              currentPrice: simulatedPrice,
              status: 'TRIGGERED' as const,
              triggeredAt: new Date().toLocaleTimeString(),
            };
          }
        }

        // Check 2: Stop Loss Hit
        if (alert.targetType === 'STOP_LOSS') {
          const isStopHit = simulatedPrice <= alert.targetPrice;
          if (isStopHit) {
            hasUpdates = true;
            playAlertChime();

            const toastType = isPortfolio ? 'PORTFOLIO_STOP_LOSS_HIT' : 'STOP_LOSS_HIT';

            // Native browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(
                isPortfolio
                  ? `🚨 PORTFOLIO STOP LOSS WARNING: ${alert.ticker}`
                  : `🚨 Stop Loss Hit Warning: ${alert.ticker}`,
                {
                  body: `${alert.ticker} price at ${currencySymbol}${simulatedPrice.toFixed(2)} fell below Stop Loss threshold ${currencySymbol}${alert.targetPrice.toFixed(2)}! Protect capital!`,
                  icon: '/favicon.ico',
                }
              );
            }

            appendTrackerLog({
              ticker: alert.ticker,
              exchange: alert.exchange || 'NASDAQ',
              previousPrice,
              currentPrice: simulatedPrice,
              targetPrice: alert.targetPrice,
              targetType: alert.targetType,
              event: 'STOP_LOSS_HIT',
              triggered: true,
            });

            newToast = {
              alert: { ...alert, status: 'TRIGGERED' as const },
              previousPrice,
              currentPrice: simulatedPrice,
              crossoverType: toastType,
              triggeredAt: new Date().toLocaleTimeString(),
              isPortfolioHolding: isPortfolio,
              portfolioHolding: portfolioMatch,
            };

            return {
              ...alert,
              currentPrice: simulatedPrice,
              status: 'TRIGGERED' as const,
              triggeredAt: new Date().toLocaleTimeString(),
            };
          }
        }

        // Check 3: Volatility Dry-Up Alert
        if (alert.targetType === 'VOLATILITY_DRYUP') {
          const targetTightness = alert.volatilityTightnessTargetPct || 5.0;
          const targetDryUp = alert.volatilityVolumeDryUpTargetPct || -50.0;

          const currentTightness = stockMatch
            ? Math.abs(stockMatch.contractions[stockMatch.contractions.length - 1]?.depthPercent || 4.2)
            : 4.2;
          const currentVolDryUp = stockMatch ? stockMatch.volumeDryUpPercent : -58;

          const isPrimed = currentTightness <= targetTightness && currentVolDryUp <= targetDryUp;

          if (isPrimed && alert.status === 'ACTIVE') {
            hasUpdates = true;
            playAlertChime();

            appendTrackerLog({
              ticker: alert.ticker,
              exchange: alert.exchange || 'NASDAQ',
              previousPrice,
              currentPrice: simulatedPrice,
              targetPrice: alert.targetPrice,
              targetType: alert.targetType,
              event: 'VOLATILITY_DRYUP_PRIMED',
              triggered: true,
            });

            newToast = {
              alert: { ...alert, status: 'TRIGGERED' as const },
              previousPrice,
              currentPrice: simulatedPrice,
              crossoverType: 'VOLATILITY_DRYUP',
              triggeredAt: new Date().toLocaleTimeString(),
              isPortfolioHolding: isPortfolio,
              portfolioHolding: portfolioMatch,
            };

            return {
              ...alert,
              currentPrice: simulatedPrice,
              status: 'TRIGGERED' as const,
              triggeredAt: new Date().toLocaleTimeString(),
            };
          }
        }

        return { ...alert, currentPrice: simulatedPrice };
      });

      if (hasUpdates) {
        saveStoredAlerts(updatedAlerts);
        window.dispatchEvent(new CustomEvent('minervini_alerts_updated'));
      }

      if (newToast) {
        setActiveToast(newToast);
      }

      setLastCheckTime(new Date().toLocaleTimeString());
      setChecksCount((c) => c + 1);
    }, 3500);

    return () => clearInterval(interval);
  }, [backgroundRunning]);

  // Manual Trigger Simulation for User Testing
  const triggerSimulatedPortfolioToast = (type: 'PORTFOLIO_PIVOT_CROSSOVER' | 'PORTFOLIO_STOP_LOSS_HIT') => {
    let portfolioHoldings: PortfolioHolding[] = [];
    try {
      const raw = localStorage.getItem('minervini_sepa_portfolio');
      if (raw) portfolioHoldings = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    const testHolding = portfolioHoldings[0] || {
      id: 'test-nvda',
      ticker: 'NVDA',
      stockName: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      shares: 100,
      entryPrice: 128.5,
      currentPrice: 154.5,
      buyDate: '2026-07-10',
      stopLossPrice: 122.0,
      pivotTargetPrice: 154.2,
    };

    playAlertChime();

    const simulatedPrice =
      type === 'PORTFOLIO_PIVOT_CROSSOVER'
        ? Number((testHolding.pivotTargetPrice + 0.8).toFixed(2))
        : Number((testHolding.stopLossPrice - 0.6).toFixed(2));

    setActiveToast({
      alert: {
        id: `sim-${Date.now()}`,
        ticker: testHolding.ticker,
        stockName: testHolding.stockName,
        targetType: type === 'PORTFOLIO_PIVOT_CROSSOVER' ? 'PIVOT_ENTRY' : 'STOP_LOSS',
        targetPrice: type === 'PORTFOLIO_PIVOT_CROSSOVER' ? testHolding.pivotTargetPrice : testHolding.stopLossPrice,
        triggerProximityPercent: 1.5,
        currentPrice: simulatedPrice,
        status: 'TRIGGERED',
        createdAt: new Date().toLocaleDateString(),
        exchange: testHolding.exchange,
        notes: '💼 Simulated Real-Time Portfolio Threshold Alert',
      },
      previousPrice: testHolding.entryPrice,
      currentPrice: simulatedPrice,
      crossoverType: type,
      triggeredAt: new Date().toLocaleTimeString(),
      isPortfolioHolding: true,
      portfolioHolding: testHolding,
    });
  };

  // View Portfolio handler
  const handleViewPortfolio = () => {
    if (!activeToast) return;
    const match = stocks.find((s) => s.ticker === activeToast.alert.ticker);
    if (match) onSelectStock(match);
    onNavigateTab('portfolio');
    setActiveToast(null);
  };

  // View Chart handler
  const handleViewChart = () => {
    if (!activeToast) return;
    const match = stocks.find((s) => s.ticker === activeToast.alert.ticker);
    if (match) onSelectStock(match);
    onNavigateTab('chart');
    setActiveToast(null);
  };

  // Re-arm triggered alert
  const handleRearmAlert = () => {
    if (!activeToast) return;
    const stored = getStoredAlerts();
    const updated = stored.map((a) =>
      a.id === activeToast.alert.id
        ? { ...a, status: 'ACTIVE' as const, triggeredAt: undefined }
        : a
    );
    saveStoredAlerts(updated);
    window.dispatchEvent(new CustomEvent('minervini_alerts_updated'));
    setActiveToast(null);
  };

  if (!activeToast) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-1.5 font-mono text-xs">
        {/* Expandable Quick Test Simulation Panel */}
        {isTestDrawerOpen && (
          <div className="bg-[#1a1a1a] text-white p-3 border border-amber-500/50 shadow-2xl space-y-2 max-w-xs animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Simulate Real-Time Alerts</span>
              </span>
              <button
                onClick={() => setIsTestDrawerOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[10px] text-gray-300 font-sans leading-tight">
              Test real-time notification toasts for portfolio positions crossing thresholds:
            </p>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button
                onClick={() => triggerSimulatedPortfolioToast('PORTFOLIO_PIVOT_CROSSOVER')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <Target className="w-3 h-3" />
                <span>Test Pivot Target Breakout</span>
              </button>

              <button
                onClick={() => triggerSimulatedPortfolioToast('PORTFOLIO_STOP_LOSS_HIT')}
                className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Test Stop Loss Level Hit</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimal Bottom Monitor Status Pill */}
        <div className="flex items-center space-x-2 bg-[#1a1a1a] text-white px-3 py-1.5 border border-amber-500/40 text-[10px] font-mono shadow-lg rounded-none opacity-90 hover:opacity-100 transition-opacity">
          <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            Portfolio & Pivot Monitor: <strong className="text-emerald-400">LIVE</strong>
          </span>

          <button
            onClick={() => setIsTestDrawerOpen(!isTestDrawerOpen)}
            className="ml-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 px-2 py-0.5 border border-amber-500/30 text-[9px] font-bold uppercase flex items-center space-x-1 transition-colors"
          >
            <span>Test Alerts</span>
            {isTestDrawerOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(activeToast.alert.exchange);
  const isPortfolio = activeToast.isPortfolioHolding || activeToast.crossoverType.startsWith('PORTFOLIO');
  const isPivot = activeToast.crossoverType === 'PIVOT_CROSSOVER' || activeToast.crossoverType === 'PORTFOLIO_PIVOT_CROSSOVER';
  const isStopHit = activeToast.crossoverType === 'STOP_LOSS_HIT' || activeToast.crossoverType === 'PORTFOLIO_STOP_LOSS_HIT';
  const isVolatility = activeToast.crossoverType === 'VOLATILITY_DRYUP';

  const holding = activeToast.portfolioHolding;
  const shares = holding ? holding.shares : 50;
  const entryPrice = holding ? holding.entryPrice : activeToast.previousPrice;
  const positionValue = shares * activeToast.currentPrice;
  const positionCost = shares * entryPrice;
  const pnlDollar = positionValue - positionCost;
  const pnlPercent = entryPrice > 0 ? ((activeToast.currentPrice - entryPrice) / entryPrice) * 100 : 0;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-lg w-full animate-slide-down shadow-2xl">
      <div
        className={`p-5 border-2 ${
          isPortfolio && isPivot
            ? 'bg-[#0a1a12] text-white border-emerald-400 shadow-emerald-500/30'
            : isPortfolio && isStopHit
            ? 'bg-[#21090c] text-white border-rose-500 shadow-rose-500/30'
            : isVolatility
            ? 'bg-[#150d2a] text-white border-purple-400 shadow-purple-500/30'
            : isPivot
            ? 'bg-[#131722] text-white border-amber-400 shadow-amber-500/20'
            : 'bg-rose-950 text-white border-rose-500 shadow-rose-500/20'
        }`}
      >
        {/* Top Header Tag */}
        <div className="flex items-start justify-between border-b border-white/15 pb-2.5 mb-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 flex items-center justify-center font-bold ${
                isPortfolio && isPivot
                  ? 'bg-emerald-500 text-black'
                  : isPortfolio && isStopHit
                  ? 'bg-rose-600 text-white'
                  : isVolatility
                  ? 'bg-purple-500 text-white'
                  : isPivot
                  ? 'bg-amber-400 text-black'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {isPortfolio ? (
                <Briefcase className="w-5 h-5" />
              ) : isVolatility ? (
                <Activity className="w-5 h-5" />
              ) : isPivot ? (
                <Target className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] uppercase font-mono tracking-[0.2em] font-extrabold block ${
                    isPortfolio ? 'text-amber-300' : 'text-amber-400'
                  }`}
                >
                  {isPortfolio && isPivot
                    ? '💼 PORTFOLIO POSITION BREAKOUT'
                    : isPortfolio && isStopHit
                    ? '💼 PORTFOLIO STOP LOSS TRIGGERED'
                    : isVolatility
                    ? '⚡ VCP VOLATILITY DRY-UP PRIMED'
                    : isPivot
                    ? '🎯 PIVOT ENTRY CROSSOVER'
                    : '🚨 STOP LOSS HIT WARNING'}
                </span>
                {isPortfolio && (
                  <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-1.5 py-0.5">
                    Portfolio Stock
                  </span>
                )}
              </div>

              <h4 className="text-lg font-mono font-black text-white leading-tight">
                {activeToast.alert.ticker} ({activeToast.alert.exchange || 'NASDAQ'})
                {isPortfolio && <span className="text-xs font-normal text-gray-300 ml-2">[{shares} Shares]</span>}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crossover Detail Grid */}
        <div className="bg-white/5 border border-white/10 p-3.5 mb-3 font-mono text-xs space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
            <div>
              <span className="text-gray-300 text-[10px] uppercase font-bold block">
                {isPivot ? 'Target Pivot Price:' : 'Stop Loss Threshold:'}
              </span>
              <span className="text-amber-300 font-extrabold text-sm">
                {formatCurrency(activeToast.alert.targetPrice, currencySymbol)}
              </span>
            </div>

            <div>
              <span className="text-gray-300 text-[10px] uppercase font-bold block">Live Crossed Price:</span>
              <span
                className={`text-sm font-black ${
                  isPivot ? 'text-emerald-400 animate-pulse' : 'text-rose-400 animate-pulse'
                }`}
              >
                {formatCurrency(activeToast.currentPrice, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Portfolio P&L Summary Block */}
          {isPortfolio && (
            <div className="bg-black/30 p-2 border border-white/10 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-300 uppercase">
                <span>Entry Price: {formatCurrency(entryPrice, currencySymbol)}</span>
                <span>Shares: {shares}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-200">Position Un-Realized P&L:</span>
                <span
                  className={`font-black font-mono text-xs ${
                    pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {pnlDollar >= 0 ? '+' : ''}
                  {formatCurrency(pnlDollar, currencySymbol)} ({pnlPercent >= 0 ? '+' : ''}
                  {pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          {/* Minervini Trade Management Discipline Rule */}
          <div className="text-[11px] font-sans text-gray-200 leading-relaxed pt-1">
            {isPivot ? (
              <p>
                <strong className="text-emerald-300 font-serif italic">SEPA Discipline Rule:</strong> Position crossed
                its pivot entry price on expanding volume. Consider taking partial 20-25% profits into strength or trailing
                stops up to entry level.
              </p>
            ) : isStopHit ? (
              <p>
                <strong className="text-rose-300 font-serif italic">Mark Minervini Rule:</strong> Price crossed hard stop
                loss threshold ({formatCurrency(activeToast.alert.targetPrice, currencySymbol)}). Preserve trading capital
                by executing stop immediately — never hold and hope!
              </p>
            ) : (
              <p>
                <strong className="text-purple-300 font-serif italic">VCP Setup Primed:</strong> Stock entered tight 3-week
                contraction range with extreme volume dry-up. Prepare for pivot breakout order!
              </p>
            )}
          </div>

          <div className="text-[10px] text-gray-400 border-t border-white/10 pt-1 flex justify-between">
            <span>Triggered At:</span>
            <span className="text-gray-200 font-bold">{activeToast.triggeredAt}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 text-xs font-mono">
          <button
            onClick={handleRearmAlert}
            className="bg-white/10 hover:bg-white/20 text-gray-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 transition-colors border border-white/20"
          >
            <RotateCcw className="w-3 h-3 text-blue-400" />
            <span>Re-arm</span>
          </button>

          {isPortfolio && (
            <button
              onClick={handleViewPortfolio}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>View Portfolio</span>
            </button>
          )}

          <button
            onClick={handleViewChart}
            className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>View VCP Chart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

