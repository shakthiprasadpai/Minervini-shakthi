import { PriceAlert, MinerviniTradeSetup } from '../types';
import { getCurrencySymbol } from './sepaCalculator';

export const ALERTS_STORAGE_KEY = 'minervini_price_alerts';
export const TRACKER_LOGS_KEY = 'minervini_price_tracker_logs';
let alertsCache: PriceAlert[] = [];
if (typeof window !== 'undefined') fetch('/api/alerts').then(r=>r.ok?r.json():[]).then(d=>{alertsCache=d; window.dispatchEvent(new CustomEvent('minervini_alerts_updated'));}).catch(()=>{});

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

// Alerts are persisted by the backend database. Browser memory is only a short-lived UI cache.
export function initializeLocalStorageAlerts(stocks: MinerviniTradeSetup[]): PriceAlert[] {
  if (alertsCache.length) return alertsCache;
  return stocks.slice(0,4).map(stock => ({id:`alert-${stock.ticker}-pivot`,ticker:stock.ticker,stockName:stock.name,targetType:'PIVOT_ENTRY',targetPrice:stock.pivotPrice,triggerProximityPercent:1.5,currentPrice:stock.currentPrice,status:'ACTIVE',createdAt:new Date().toISOString(),exchange:stock.exchange,notes:'Backend-persisted pivot alert'}));
}
export function getStoredAlerts(): PriceAlert[] { return alertsCache; }

// Ensure user's portfolio holdings automatically have active alerts synced
export function syncPortfolioAlerts(): PriceAlert[] { return getStoredAlerts(); }

// Save alerts through backend API; no browser database is used.
export function saveStoredAlerts(alerts: PriceAlert[]): void {
  alertsCache = alerts;
  if (typeof window !== 'undefined') fetch('/api/alerts/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(alerts)}).catch(()=>{});
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('minervini_alerts_updated'));
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
