import { TradeJournalNote } from '../types';

export interface TradeGoals {
  targetWinRate: number;
  maxDrawdownLimit: number;
  minRiskRewardRatio: number;
  weeklyTradesTarget: number;
  targetDisciplineScore: number;
}

const LOCAL_STORAGE_KEY = 'minervini_trade_journal_notes_v1';
const STORAGE_GOALS_KEY = 'minervini_trade_goals_v1';

const DEFAULT_TRADE_GOALS: TradeGoals = {
  targetWinRate: 60,
  maxDrawdownLimit: 5.0,
  minRiskRewardRatio: 3.0,
  weeklyTradesTarget: 5,
  targetDisciplineScore: 4.5,
};

let tradeGoalsCache: TradeGoals = DEFAULT_TRADE_GOALS;
let journalCache: TradeJournalNote[] = [];
let hydrated = false;

if (typeof window !== 'undefined') {
  fetch('/api/journal').then(r => r.ok ? r.json() : []).then(data => { journalCache = data; hydrated = true; window.dispatchEvent(new CustomEvent('minervini_journal_updated')); }).catch(()=>{});
}

export function getStoredTradeGoals(): TradeGoals { return tradeGoalsCache; }
export function saveStoredTradeGoals(goals: TradeGoals): void {
  tradeGoalsCache = goals;
  window.dispatchEvent(new CustomEvent('minervini_goals_updated'));
}

const INITIAL_JOURNAL_NOTES: TradeJournalNote[] = [
  {
    id: 'journal-nvda-1',
    ticker: 'NVDA',
    stockName: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    date: '2026-07-24',
    setupType: 'VCP (3 Contractions)',
    entryPrice: 128.50,
    exitPrice: 142.00,
    emotionalState: 'DISCIPLINED',
    notes: 'Clean 3-contraction VCP forming right below all-time highs. Volume dried up by 68% during the 3rd contraction (T3). Entered right as volume surged 2.4x above average on the pivot breakout.',
    keyLesson: 'Patience pays off. Waiting for the volume dry-up on the final contraction prevented a premature entry.',
    tradeStatus: 'CLOSED_WIN',
    rating: 5,
  },
  {
    id: 'journal-aapl-1',
    ticker: 'AAPL',
    stockName: 'Apple Inc.',
    exchange: 'NASDAQ',
    date: '2026-07-20',
    setupType: 'Pivot Pullback',
    entryPrice: 220.00,
    exitPrice: 216.50,
    emotionalState: 'ANXIOUS',
    notes: 'Attempted to buy a breakout without sufficient volume dry-up in the base. Got caught in minor shakeout and hit stop loss.',
    keyLesson: 'Never compromise on volume dry-up criteria. Low volume contraction is non-negotiable for SEPA setups.',
    tradeStatus: 'CLOSED_LOSS',
    rating: 3,
  },
  {
    id: 'journal-tsla-1',
    ticker: 'TSLA',
    stockName: 'Tesla Inc.',
    exchange: 'NASDAQ',
    date: '2026-07-26',
    setupType: 'High Tight Flag',
    entryPrice: 254.00,
    emotionalState: 'CONFIDENT',
    notes: 'High tight flag after a 120% surge in 6 weeks. Consolidating tightly in the upper quartile of the range. Ready for secondary breakout.',
    keyLesson: 'Keep position size scaled correctly when volatility is high in growth stocks.',
    tradeStatus: 'ACTIVE_TRADE',
    rating: 4,
  },
  {
    id: 'journal-reliance-1',
    ticker: 'RELIANCE',
    stockName: 'Reliance Industries Ltd',
    exchange: 'NSE',
    date: '2026-07-22',
    setupType: 'Cup with Handle',
    entryPrice: 2950.00,
    emotionalState: 'CALM',
    notes: 'Classic cup with handle pattern on NSE. Handle formed in lower volume over 3 weeks. Clean pivot at 2950.',
    keyLesson: 'Index alignment matters. Ensure Nifty 50 is in confirmed uptrend before committing capital.',
    tradeStatus: 'PLANNING',
    rating: 4,
  }
];

export function getStoredJournalNotes(): TradeJournalNote[] { return journalCache; }

export function saveStoredJournalNotes(notes: TradeJournalNote[]): void {
  journalCache = notes;
  if (typeof window !== 'undefined') {
    fetch('/api/journal/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(notes)}).catch(()=>{});
    window.dispatchEvent(new CustomEvent('minervini_journal_updated'));
  }
}

export function getNotesForTicker(ticker: string): TradeJournalNote[] {
  const notes = getStoredJournalNotes();
  return notes.filter((n) => n.ticker.toUpperCase() === ticker.toUpperCase());
}
