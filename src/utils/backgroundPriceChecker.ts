import { PriceAlert, MinerviniTradeSetup } from '../types';
import { getCurrencySymbol } from './sepaCalculator';

export const ALERTS_STORAGE_KEY = 'minervini_price_alerts';
export const TRACKER_LOGS_KEY = 'minervini_price_tracker_logs';

export interface BackgroundCheckLog {
  id: string;
  timestamp: string;
  ticker: string;
  exchange: string;
  previousPrice: number;
  currentPrice: number;
  targetPrice: number;
  targetType: string;
  event: 'PIVOT_CROSSED' | 'STOP_LOSS_HIT' | 'PROXIMITY_WARNING' | 'VOLATILITY_DRYUP_PRIMED' | 'TICK_CHECK';
  triggered: boolean;
}

// Ensure default alerts exist in localStorage for initial stocks
export function initializeLocalStorageAlerts(stocks: MinerviniTradeSetup[]): PriceAlert[] {
  try {
    const existing = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read price alerts from localStorage:', e);
  }

  // Create initial default pivot entry, stop loss, and VCP volatility dry-up alerts for provided stocks
  const initialAlerts: PriceAlert[] = stocks.slice(0, 4).flatMap((stock) => [
    {
      id: `alert-${stock.ticker}-pivot-${Date.now()}`,
      ticker: stock.ticker,
      stockName: stock.name,
      targetType: 'PIVOT_ENTRY',
      targetPrice: stock.pivotPrice,
      triggerProximityPercent: 1.5,
      currentPrice: stock.currentPrice,
      status: 'ACTIVE',
      createdAt: new Date().toLocaleDateString(),
      exchange: stock.exchange,
      notes: `VCP Pivot Entry Breakout Target @ ${getCurrencySymbol(stock.exchange)}${stock.pivotPrice}`,
    },
    {
      id: `alert-${stock.ticker}-stop-${Date.now()}`,
      ticker: stock.ticker,
      stockName: stock.name,
      targetType: 'STOP_LOSS',
      targetPrice: stock.stopLossPrice,
      triggerProximityPercent: 1.0,
      currentPrice: stock.currentPrice,
      status: 'ACTIVE',
      createdAt: new Date().toLocaleDateString(),
      exchange: stock.exchange,
      notes: `Hard Risk Stop Loss Level @ ${getCurrencySymbol(stock.exchange)}${stock.stopLossPrice}`,
    },
    {
      id: `alert-${stock.ticker}-volatility-${Date.now()}`,
      ticker: stock.ticker,
      stockName: stock.name,
      targetType: 'VOLATILITY_DRYUP',
      targetPrice: stock.pivotPrice,
      triggerProximityPercent: 1.5,
      currentPrice: stock.currentPrice,
      status: 'ACTIVE',
      createdAt: new Date().toLocaleDateString(),
      exchange: stock.exchange,
      volatilityTightnessTargetPct: 5.0,
      volatilityVolumeDryUpTargetPct: -50.0,
      notes: `⚡ VCP Volatility Dry-Up Radar: Alert when 3-week price range tightens ≤ 5% with volume dry-up ≤ -50%`,
    },
  ]);

  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(initialAlerts));
  } catch (e) {
    console.error('Failed to write initial alerts to localStorage:', e);
  }

  return initialAlerts;
}

// Read current alerts from localStorage
export function getStoredAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Ensure user's portfolio holdings automatically have active alerts synced
export function syncPortfolioAlerts(): PriceAlert[] {
  try {
    const rawPortfolio = localStorage.getItem('minervini_sepa_portfolio');
    if (!rawPortfolio) return getStoredAlerts();
    const holdings = JSON.parse(rawPortfolio);
    if (!Array.isArray(holdings) || holdings.length === 0) return getStoredAlerts();

    const storedAlerts = getStoredAlerts();
    let updated = [...storedAlerts];
    let changed = false;

    holdings.forEach((h: any) => {
      // Check Pivot Target alert for holding
      const hasPivotAlert = updated.some(
        (a) => a.ticker === h.ticker && a.targetType === 'PIVOT_ENTRY' && Math.abs(a.targetPrice - h.pivotTargetPrice) < 0.01
      );

      if (!hasPivotAlert && h.pivotTargetPrice > 0) {
        const newPivotAlert: PriceAlert = {
          id: `alert-portfolio-${h.ticker}-pivot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ticker: h.ticker,
          stockName: h.stockName || h.ticker,
          targetType: 'PIVOT_ENTRY',
          targetPrice: h.pivotTargetPrice,
          triggerProximityPercent: 1.5,
          currentPrice: h.currentPrice || h.entryPrice,
          status: 'ACTIVE',
          createdAt: new Date().toLocaleDateString(),
          exchange: h.exchange || 'NASDAQ',
          notes: `💼 Portfolio Holding Pivot Target @ ${getCurrencySymbol(h.exchange)}${h.pivotTargetPrice}`,
        };
        updated.unshift(newPivotAlert);
        changed = true;
      }

      // Check Stop Loss alert for holding
      const hasStopAlert = updated.some(
        (a) => a.ticker === h.ticker && a.targetType === 'STOP_LOSS' && Math.abs(a.targetPrice - h.stopLossPrice) < 0.01
      );

      if (!hasStopAlert && h.stopLossPrice > 0) {
        const newStopAlert: PriceAlert = {
          id: `alert-portfolio-${h.ticker}-stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ticker: h.ticker,
          stockName: h.stockName || h.ticker,
          targetType: 'STOP_LOSS',
          targetPrice: h.stopLossPrice,
          triggerProximityPercent: 1.0,
          currentPrice: h.currentPrice || h.entryPrice,
          status: 'ACTIVE',
          createdAt: new Date().toLocaleDateString(),
          exchange: h.exchange || 'NASDAQ',
          notes: `💼 Portfolio Holding Stop Loss Level @ ${getCurrencySymbol(h.exchange)}${h.stopLossPrice}`,
        };
        updated.unshift(newStopAlert);
        changed = true;
      }
    });

    if (changed) {
      saveStoredAlerts(updated);
    }
    return updated;
  } catch (e) {
    console.error('Failed to sync portfolio alerts:', e);
    return getStoredAlerts();
  }
}

// Save alerts array to localStorage
export function saveStoredAlerts(alerts: PriceAlert[]): void {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error(e);
  }
}

// Read tracker logs
export function getTrackerLogs(): BackgroundCheckLog[] {
  try {
    const raw = localStorage.getItem(TRACKER_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Append log entry to localStorage
export function appendTrackerLog(log: Omit<BackgroundCheckLog, 'id' | 'timestamp'>): void {
  try {
    const logs = getTrackerLogs();
    const newLog: BackgroundCheckLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    // Keep last 30 logs
    const updated = [newLog, ...logs].slice(0, 30);
    localStorage.setItem(TRACKER_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

// Web Audio sound synthesizer
export function playAlertChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6 note

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio context may require user interaction first
  }
}
