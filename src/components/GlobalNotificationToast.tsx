import React, { useState, useEffect, useRef } from 'react';
import { PriceAlert, MinerviniTradeSetup } from '../types';
import {
  getStoredAlerts,
  saveStoredAlerts,
  appendTrackerLog,
  playAlertChime,
  initializeLocalStorageAlerts,
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
  crossoverType: 'PIVOT_CROSSOVER' | 'STOP_LOSS_HIT' | 'PROXIMITY_ALERT';
  triggeredAt: string;
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

  // Initialize LocalStorage Alerts on mount
  useEffect(() => {
    initializeLocalStorageAlerts(stocks);
  }, [stocks]);

  // Background Price Checker Loop
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  useEffect(() => {
    if (!backgroundRunning) return;

    const interval = setInterval(() => {
      const storedAlerts = getStoredAlerts();
      if (!storedAlerts || storedAlerts.length === 0) return;

      let hasUpdates = false;
      let newToast: ActiveToastNotification | null = null;

      const updatedAlerts = storedAlerts.map((alert) => {
        if (alert.status !== 'ACTIVE') return alert;

        // Match stock setup from current stock list
        const stockMatch = stocksRef.current.find((s) => s.ticker === alert.ticker);
        const currentPrice = stockMatch ? stockMatch.currentPrice : alert.currentPrice;
        
        // Micro live tick simulation to test price movement towards/over pivot
        const randomTickChange = (Math.random() - 0.48) * 0.25; 
        const simulatedPrice = Number((currentPrice + randomTickChange).toFixed(2));
        const previousPrice = alert.currentPrice;

        const currencySymbol = getCurrencySymbol(alert.exchange);

        // Check 1: Pivot Entry Crossover
        if (alert.targetType === 'PIVOT_ENTRY') {
          const isCrossed = (previousPrice < alert.targetPrice && simulatedPrice >= alert.targetPrice) ||
                            simulatedPrice >= alert.targetPrice;
          const isNearProximity = Math.abs((simulatedPrice - alert.targetPrice) / alert.targetPrice) * 100 <= alert.triggerProximityPercent;

          if (isCrossed) {
            hasUpdates = true;
            playAlertChime();

            // Native browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`🎯 Pivot Breakout Crossover: ${alert.ticker}`, {
                body: `${alert.ticker} price at ${currencySymbol}${simulatedPrice.toFixed(2)} crossed Pivot Target ${currencySymbol}${alert.targetPrice.toFixed(2)}!`,
                icon: '/favicon.ico',
              });
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
              crossoverType: 'PIVOT_CROSSOVER',
              triggeredAt: new Date().toLocaleTimeString(),
            };

            return {
              ...alert,
              currentPrice: simulatedPrice,
              status: 'TRIGGERED' as const,
              triggeredAt: new Date().toLocaleTimeString(),
            };
          } else if (isNearProximity && previousPrice < simulatedPrice) {
            // Proximity warning log
            appendTrackerLog({
              ticker: alert.ticker,
              exchange: alert.exchange || 'NASDAQ',
              previousPrice,
              currentPrice: simulatedPrice,
              targetPrice: alert.targetPrice,
              targetType: alert.targetType,
              event: 'PROXIMITY_WARNING',
              triggered: false,
            });
          }
        }

        // Check 2: Stop Loss Hit
        if (alert.targetType === 'STOP_LOSS') {
          const isStopHit = simulatedPrice <= alert.targetPrice;
          if (isStopHit) {
            hasUpdates = true;
            playAlertChime();

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
              crossoverType: 'STOP_LOSS_HIT',
              triggeredAt: new Date().toLocaleTimeString(),
            };

            return {
              ...alert,
              currentPrice: simulatedPrice,
              status: 'TRIGGERED' as const,
              triggeredAt: new Date().toLocaleTimeString(),
            };
          }
        }

        // Check 3: Custom Above
        if (alert.targetType === 'CUSTOM_ABOVE' && simulatedPrice >= alert.targetPrice) {
          hasUpdates = true;
          playAlertChime();
          newToast = {
            alert: { ...alert, status: 'TRIGGERED' as const },
            previousPrice,
            currentPrice: simulatedPrice,
            crossoverType: 'PIVOT_CROSSOVER',
            triggeredAt: new Date().toLocaleTimeString(),
          };
          return {
            ...alert,
            currentPrice: simulatedPrice,
            status: 'TRIGGERED' as const,
            triggeredAt: new Date().toLocaleTimeString(),
          };
        }

        return { ...alert, currentPrice: simulatedPrice };
      });

      if (hasUpdates) {
        saveStoredAlerts(updatedAlerts);
        // Dispatch custom DOM event for other components listening
        window.dispatchEvent(new CustomEvent('minervini_alerts_updated'));
      }

      if (newToast) {
        setActiveToast(newToast);
      }

      setLastCheckTime(new Date().toLocaleTimeString());
      setChecksCount((c) => c + 1);
    }, 3500); // Check local storage price levels every 3.5 seconds

    return () => clearInterval(interval);
  }, [backgroundRunning]);

  // Handle Toast View Chart click
  const handleViewChart = () => {
    if (!activeToast) return;
    const match = stocks.find((s) => s.ticker === activeToast.alert.ticker);
    if (match) {
      onSelectStock(match);
      onNavigateTab('chart');
    }
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
      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-[#1a1a1a] text-white px-3 py-1.5 border border-amber-500/40 text-[10px] font-mono shadow-lg rounded-none opacity-80 hover:opacity-100 transition-opacity">
        <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Pivot Monitor: <strong className="text-emerald-400">RUNNING</strong></span>
        {lastCheckTime && <span className="text-gray-400">({lastCheckTime})</span>}
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(activeToast.alert.exchange);
  const isPivot = activeToast.crossoverType === 'PIVOT_CROSSOVER';

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-slide-down shadow-2xl">
      <div className={`p-4 border-2 ${
        isPivot
          ? 'bg-[#131722] text-white border-amber-400 shadow-amber-500/20'
          : 'bg-rose-950 text-white border-rose-500 shadow-rose-500/20'
      }`}>
        
        {/* Top Title Bar */}
        <div className="flex items-start justify-between border-b border-white/10 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 flex items-center justify-center font-bold rounded-none ${
              isPivot ? 'bg-amber-400 text-black' : 'bg-rose-500 text-white'
            }`}>
              {isPivot ? <Target className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-bold text-amber-400 block">
                {isPivot ? '🎯 Pivot Entry Crossover' : '🚨 Stop Loss Hit Warning'}
              </span>
              <h4 className="text-base font-mono font-black text-white leading-none">
                {activeToast.alert.ticker} ({activeToast.alert.exchange || 'NASDAQ'})
              </h4>
            </div>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crossover Price Detail */}
        <div className="bg-white/5 border border-white/10 p-3 mb-3 font-mono text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-[10px] uppercase font-bold">Target Level:</span>
            <strong className="text-amber-300 font-bold">
              {formatCurrency(activeToast.alert.targetPrice, currencySymbol)}
            </strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-[10px] uppercase font-bold">Crossed Price:</span>
            <strong className="text-emerald-400 text-sm font-extrabold">
              {formatCurrency(activeToast.currentPrice, currencySymbol)}
            </strong>
          </div>

          <div className="text-[10px] text-gray-300 border-t border-white/10 pt-1 flex justify-between">
            <span>Triggered At:</span>
            <span className="text-gray-200">{activeToast.triggeredAt}</span>
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

          <button
            onClick={handleViewChart}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>View VCP Chart</span>
          </button>
        </div>

      </div>
    </div>
  );
};
