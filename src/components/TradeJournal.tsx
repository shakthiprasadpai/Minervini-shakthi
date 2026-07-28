import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup, TradeJournalNote, EmotionalState, TradeStatus } from '../types';
import { getStoredJournalNotes, saveStoredJournalNotes } from '../utils/tradeJournalStorage';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  BookMarked,
  Plus,
  Search,
  Star,
  Smile,
  Frown,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Filter,
  Sparkles,
  TrendingUp,
  Brain,
  Award,
  Hash,
  Calendar,
  DollarSign,
  ShieldAlert,
  X
} from 'lucide-react';

interface TradeJournalProps {
  stocks: MinerviniTradeSetup[];
  selectedStock?: MinerviniTradeSetup;
  onSelectStock?: (stock: MinerviniTradeSetup) => void;
  onViewChart?: (stock: MinerviniTradeSetup) => void;
}

const EMOTIONAL_STATES: { state: EmotionalState; label: string; color: string; icon: string }[] = [
  { state: 'DISCIPLINED', label: 'Disciplined', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: '🛡️' },
  { state: 'CONFIDENT', label: 'Confident', color: 'bg-blue-100 text-blue-900 border-blue-300', icon: '🎯' },
  { state: 'CALM', label: 'Calm & Zen', color: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: '🧘' },
  { state: 'PATIENT', label: 'Patient', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: '⏳' },
  { state: 'ANXIOUS', label: 'Anxious', color: 'bg-orange-100 text-orange-900 border-orange-300', icon: '⚠️' },
  { state: 'FOMO', label: 'FOMO Driven', color: 'bg-rose-100 text-rose-900 border-rose-300', icon: '🔥' },
  { state: 'IMPATIENT', label: 'Impatient', color: 'bg-purple-100 text-purple-900 border-purple-300', icon: '⚡' },
  { state: 'EUPHORIC', label: 'Euphoric', color: 'bg-yellow-100 text-yellow-900 border-yellow-300', icon: '🌟' },
  { state: 'REGRETFUL', label: 'Regretful', color: 'bg-gray-200 text-gray-800 border-gray-400', icon: '💭' },
];

const TRADE_STATUSES: { status: TradeStatus; label: string; badge: string }[] = [
  { status: 'PLANNING', label: 'Planning Setups', badge: 'bg-gray-100 text-gray-800 border-gray-300' },
  { status: 'ACTIVE_TRADE', label: 'Active Position', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
  { status: 'CLOSED_WIN', label: 'Closed Win (+)', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { status: 'CLOSED_LOSS', label: 'Closed Loss (-)', badge: 'bg-rose-100 text-rose-900 border-rose-300' },
  { status: 'SCRATCHED', label: 'Scratched / Breakeven', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
];

export const TradeJournal: React.FC<TradeJournalProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  onViewChart,
}) => {
  const [journalNotes, setJournalNotes] = useState<TradeJournalNote[]>(() => {
    return getStoredJournalNotes();
  });

  const [selectedTickerFilter, setSelectedTickerFilter] = useState<string>('ALL');
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal form state for Adding/Editing Note
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form fields
  const [formTicker, setFormTicker] = useState<string>(selectedStock ? selectedStock.ticker : stocks[0]?.ticker || 'NVDA');
  const [formStockName, setFormStockName] = useState<string>(selectedStock ? selectedStock.name : stocks[0]?.name || 'NVIDIA Corporation');
  const [formExchange, setFormExchange] = useState<'NASDAQ' | 'NYSE' | 'NSE' | 'BSE'>(selectedStock ? selectedStock.exchange : 'NASDAQ');
  const [formSetupType, setFormSetupType] = useState<string>('VCP (3 Contractions)');
  const [formEntryPrice, setFormEntryPrice] = useState<string>(selectedStock ? selectedStock.pivotPrice.toString() : '125.00');
  const [formExitPrice, setFormExitPrice] = useState<string>('');
  const [formEmotionalState, setFormEmotionalState] = useState<EmotionalState>('DISCIPLINED');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formKeyLesson, setFormKeyLesson] = useState<string>('');
  const [formTradeStatus, setFormTradeStatus] = useState<TradeStatus>('ACTIVE_TRADE');
  const [formRating, setFormRating] = useState<number>(5);

  // Sync state with localStorage events
  useEffect(() => {
    const handleStorageUpdate = () => {
      setJournalNotes(getStoredJournalNotes());
    };
    window.addEventListener('minervini_journal_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('minervini_journal_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // When selectedStock changes, default form ticker if opening modal
  useEffect(() => {
    if (selectedStock) {
      setFormTicker(selectedStock.ticker);
      setFormStockName(selectedStock.name);
      setFormExchange(selectedStock.exchange);
      setFormEntryPrice(selectedStock.pivotPrice.toString());
    }
  }, [selectedStock]);

  const handleTickerSelectionChange = (tickerStr: string) => {
    const found = stocks.find((s) => s.ticker.toUpperCase() === tickerStr.toUpperCase());
    if (found) {
      setFormTicker(found.ticker);
      setFormStockName(found.name);
      setFormExchange(found.exchange);
      setFormEntryPrice(found.pivotPrice.toString());
    } else {
      setFormTicker(tickerStr);
      setFormStockName(tickerStr + ' Stock');
    }
  };

  const handleOpenAddModal = () => {
    setEditingNoteId(null);
    setFormNotes('');
    setFormKeyLesson('');
    setFormExitPrice('');
    setFormRating(5);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: TradeJournalNote) => {
    setEditingNoteId(note.id);
    setFormTicker(note.ticker);
    setFormStockName(note.stockName);
    setFormExchange(note.exchange);
    setFormSetupType(note.setupType);
    setFormEntryPrice(note.entryPrice?.toString() || '');
    setFormExitPrice(note.exitPrice?.toString() || '');
    setFormEmotionalState(note.emotionalState);
    setFormNotes(note.notes);
    setFormKeyLesson(note.keyLesson);
    setFormTradeStatus(note.tradeStatus);
    setFormRating(note.rating);
    setIsModalOpen(true);
  };

  const handleSaveJournalNote = (e: React.FormEvent) => {
    e.preventDefault();
    const entryDate = new Date().toISOString().split('T')[0];

    const newNote: TradeJournalNote = {
      id: editingNoteId || `journal-${formTicker.toLowerCase()}-${Date.now()}`,
      ticker: formTicker.toUpperCase(),
      stockName: formStockName,
      exchange: formExchange,
      date: entryDate,
      setupType: formSetupType,
      entryPrice: formEntryPrice ? parseFloat(formEntryPrice) : undefined,
      exitPrice: formExitPrice ? parseFloat(formExitPrice) : undefined,
      emotionalState: formEmotionalState,
      notes: formNotes || 'No notes provided.',
      keyLesson: formKeyLesson || 'Patience and risk management are paramount.',
      tradeStatus: formTradeStatus,
      rating: formRating,
    };

    let updated: TradeJournalNote[];
    if (editingNoteId) {
      updated = journalNotes.map((n) => (n.id === editingNoteId ? newNote : n));
    } else {
      updated = [newNote, ...journalNotes];
    }

    setJournalNotes(updated);
    saveStoredJournalNotes(updated);
    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    const updated = journalNotes.filter((n) => n.id !== id);
    setJournalNotes(updated);
    saveStoredJournalNotes(updated);
  };

  // Extract unique tickers present in journal notes or stocks list for filtering
  const allTickers = Array.from(
    new Set([...stocks.map((s) => s.ticker), ...journalNotes.map((n) => n.ticker)])
  );

  // Filtered notes keyed by ticker / emotion / search query
  const filteredNotes = journalNotes.filter((note) => {
    const matchesTicker = selectedTickerFilter === 'ALL' || note.ticker.toUpperCase() === selectedTickerFilter.toUpperCase();
    const matchesEmotion = selectedEmotionFilter === 'ALL' || note.emotionalState === selectedEmotionFilter;
    const matchesSearch =
      !searchQuery ||
      note.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.keyLesson.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTicker && matchesEmotion && matchesSearch;
  });

  // Calculate statistics
  const totalNotes = journalNotes.length;
  const winCount = journalNotes.filter((n) => n.tradeStatus === 'CLOSED_WIN').length;
  const lossCount = journalNotes.filter((n) => n.tradeStatus === 'CLOSED_LOSS').length;
  const winRate = winCount + lossCount > 0 ? Math.round((winCount / (winCount + lossCount)) * 100) : 0;
  const avgRating = totalNotes > 0 ? (journalNotes.reduce((acc, n) => acc + n.rating, 0) / totalNotes).toFixed(1) : '0.0';

  // Emotional state frequencies and note keyword frequencies for Word Cloud
  const emotionalStateFrequencies = React.useMemo(() => {
    const counts: Record<string, number> = {};
    journalNotes.forEach((n) => {
      counts[n.emotionalState] = (counts[n.emotionalState] || 0) + 1;
    });
    return counts;
  }, [journalNotes]);

  const recurringKeywordsFrequencies = React.useMemo(() => {
    const stopWords = new Set(['the','and','a','to','of','in','for','is','on','that','by','this','with','it','as','an','be','at','or','from','which','was','were','have','has','had','not','but','they','their','we','our','you','your','all','will','one','so','if','out','up','do','get','got','gotten']);
    const counts: Record<string, number> = {};
    
    journalNotes.forEach((n) => {
      const combinedText = `${n.notes} ${n.keyLesson} ${n.setupType}`.toLowerCase();
      const words = combinedText.replace(/[^\w\s]/gi, '').split(/\s+/);
      words.forEach((w) => {
        const cleaned = w.trim();
        if (cleaned.length > 3 && !stopWords.has(cleaned)) {
          counts[cleaned] = (counts[cleaned] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [journalNotes]);

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#e5e4e1] p-6 sm:p-8 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-3">
            <span className="inline-block bg-[#1a1a1a] text-white text-[10px] px-3 py-1 uppercase tracking-[0.2em] font-medium">
              Psychology & Execution Journal
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">
              Keyed by Ticker State
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1a1a1a] tracking-tight">
            Mark Minervini SEPA Trade Journal
          </h2>
          <p className="text-sm font-serif italic text-gray-600">
            Record emotional states, breakout setup evaluations, execution ratings, and invaluable key lessons keyed by ticker to eliminate psychological bias and refine your trading edge.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenAddModal}
            className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-5 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-black shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Trade Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5e4e1] p-4 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#b5a68d] font-bold block">Total Journaled Trades</span>
          <strong className="text-2xl font-serif font-black text-[#1a1a1a]">{totalNotes}</strong>
        </div>
        <div className="bg-white border border-[#e5e4e1] p-4 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#b5a68d] font-bold block">Journal Win Rate</span>
          <strong className="text-2xl font-mono font-bold text-emerald-700">{winRate}%</strong>
        </div>
        <div className="bg-white border border-[#e5e4e1] p-4 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#b5a68d] font-bold block">Avg Execution Rating</span>
          <strong className="text-2xl font-mono font-bold text-[#1a1a1a] flex items-center justify-center space-x-1">
            <span>{avgRating}</span>
            <Star className="w-4 h-4 text-amber-500 fill-current inline" />
          </strong>
        </div>
        <div className="bg-white border border-[#e5e4e1] p-4 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#b5a68d] font-bold block">Unique Tickers Tracked</span>
          <strong className="text-2xl font-mono font-bold text-blue-700">{allTickers.length}</strong>
        </div>
      </div>

      {/* Emotional State & Note Keywords Word Cloud */}
      <div className="bg-white border border-[#e5e4e1] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-serif font-black text-[#1a1a1a]">
              Psychological State & Keyword Word Cloud
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Click emotional keyword to filter
          </span>
        </div>

        <div className="space-y-4 pt-2">
          {/* Emotional States Word Cloud */}
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider block mb-2">
              Frequently Highlighted Emotional States:
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {EMOTIONAL_STATES.map((em) => {
                const count = emotionalStateFrequencies[em.state] || 0;
                if (count === 0 && journalNotes.length > 0) return null;
                const isActive = selectedEmotionFilter === em.state;
                
                const scaleClass = count >= 3 ? 'text-sm px-4 py-2 font-black' : count >= 2 ? 'text-xs px-3 py-1.5 font-bold' : 'text-xs px-2.5 py-1 font-medium';
                
                return (
                  <button
                    key={em.state}
                    onClick={() => setSelectedEmotionFilter(isActive ? 'ALL' : em.state)}
                    className={`transition-all border flex items-center space-x-1.5 cursor-pointer ${scaleClass} ${
                      isActive
                        ? 'bg-[#1a1a1a] text-white border-black shadow-sm ring-2 ring-amber-400'
                        : em.color + ' hover:opacity-80'
                    }`}
                  >
                    <span>{em.icon}</span>
                    <span>{em.label}</span>
                    <span className="text-[9px] opacity-75 ml-1 bg-white/60 text-black px-1 rounded">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurring Lesson / Note Keywords Cloud */}
          {recurringKeywordsFrequencies.length > 0 && (
            <div className="pt-3 border-t border-[#f0eee6]">
              <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider block mb-2">
                Recurring Note & Lesson Keywords (Top Terminology):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {recurringKeywordsFrequencies.map(([word, freq]) => {
                  const sizeClasses = freq >= 3 
                    ? 'text-sm font-black bg-amber-100 text-amber-900 border-amber-300' 
                    : freq >= 2 
                    ? 'text-xs font-bold bg-blue-50 text-blue-900 border-blue-200' 
                    : 'text-xs font-normal bg-gray-100 text-gray-700 border-gray-200';
                  
                  return (
                    <span
                      key={word}
                      onClick={() => setSearchQuery(word)}
                      className={`px-3 py-1 border transition-all cursor-pointer hover:scale-105 font-mono capitalize ${sizeClasses}`}
                      title={`Frequency: ${freq} times. Click to search.`}
                    >
                      #{word} <span className="text-[9px] opacity-60 ml-0.5 font-sans">({freq})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#e5e4e1] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Ticker Filter Dropdown */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-gray-500 uppercase text-[10px] font-bold">Ticker:</span>
            <select
              value={selectedTickerFilter}
              onChange={(e) => setSelectedTickerFilter(e.target.value)}
              className="bg-[#f9f8f5] border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
            >
              <option value="ALL">All Tickers ({journalNotes.length})</option>
              {allTickers.map((t) => {
                const count = journalNotes.filter((n) => n.ticker.toUpperCase() === t.toUpperCase()).length;
                return (
                  <option key={t} value={t}>
                    {t} ({count} notes)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Emotional State Filter */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-gray-500 uppercase text-[10px] font-bold">Emotion:</span>
            <select
              value={selectedEmotionFilter}
              onChange={(e) => setSelectedEmotionFilter(e.target.value)}
              className="bg-[#f9f8f5] border border-[#e5e4e1] p-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
            >
              <option value="ALL">All Emotional States</option>
              {EMOTIONAL_STATES.map((em) => (
                <option key={em.state} value={em.state}>
                  {em.icon} {em.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes, lessons, tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f9f8f5] border border-[#e5e4e1] pl-9 pr-3 py-2 text-xs text-[#1a1a1a] focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Journal Notes Cards List (Keyed by Ticker) */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white border border-[#e5e4e1] p-12 text-center space-y-3">
            <BookMarked className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-serif font-black text-[#1a1a1a]">No Trade Journal Entries Found</h3>
            <p className="text-xs text-gray-500 font-sans max-w-md mx-auto">
              No journal notes match your current ticker or emotional filter. Click the button above to log your first trade reflection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotes.map((note) => {
              const emotionObj = EMOTIONAL_STATES.find((e) => e.state === note.emotionalState) || EMOTIONAL_STATES[0];
              const statusObj = TRADE_STATUSES.find((s) => s.status === note.tradeStatus) || TRADE_STATUSES[1];
              const currency = getCurrencySymbol(note.exchange);
              const matchingStock = stocks.find((s) => s.ticker.toUpperCase() === note.ticker.toUpperCase());

              return (
                <div
                  key={note.id}
                  className="bg-white border border-[#e5e4e1] p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Ticker Header & Badges */}
                    <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 bg-[#1a1a1a] text-white flex flex-col items-center justify-center font-mono">
                          <span className="text-sm font-bold">{note.ticker}</span>
                          <span className="text-[8px] text-gray-300 uppercase">{note.exchange}</span>
                        </div>
                        <div>
                          <h4 className="text-base font-serif font-black text-[#1a1a1a] flex items-center space-x-2">
                            <span>{note.stockName}</span>
                          </h4>
                          <span className="text-[10px] font-mono text-gray-500 block">
                            Logged on {note.date} &bull; Setup: <strong className="text-[#1a1a1a]">{note.setupType}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Trade Status Badge */}
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 uppercase border ${statusObj.badge}`}>
                        {statusObj.label}
                      </span>
                    </div>

                    {/* Emotional State & Execution Rating */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f9f8f5] p-3 border border-[#e5e4e1] text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 uppercase text-[10px]">Emotional State:</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase border flex items-center space-x-1 ${emotionObj.color}`}>
                          <span>{emotionObj.icon}</span>
                          <span>{emotionObj.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500 text-[10px] uppercase">Rating:</span>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < note.rating ? 'text-amber-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Entry / Exit Prices if available */}
                    {(note.entryPrice !== undefined || note.exitPrice !== undefined) && (
                      <div className="flex items-center space-x-6 text-xs font-mono pt-1">
                        {note.entryPrice !== undefined && (
                          <div>
                            <span className="text-gray-500 uppercase text-[9px] block">Entry Price</span>
                            <strong className="text-[#1a1a1a] font-bold">{formatCurrency(note.entryPrice, currency)}</strong>
                          </div>
                        )}
                        {note.exitPrice !== undefined && (
                          <div>
                            <span className="text-gray-500 uppercase text-[9px] block">Exit Price</span>
                            <strong className="text-emerald-700 font-bold">{formatCurrency(note.exitPrice, currency)}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trade Notes */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider block">
                        Trade Rationale & Notes:
                      </span>
                      <p className="text-xs font-sans text-gray-700 leading-relaxed bg-gray-50 p-3 border border-gray-200">
                        {note.notes}
                      </p>
                    </div>

                    {/* Key Lesson / Takeaway */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-amber-800 font-mono tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Key Lesson / Takeaway:</span>
                      </span>
                      <p className="text-xs font-serif italic text-amber-950 bg-amber-50/70 p-3 border border-amber-200">
                        "{note.keyLesson}"
                      </p>
                    </div>

                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#e5e4e1] text-xs font-mono mt-4">
                    <div className="flex items-center space-x-2">
                      {matchingStock && (
                        <button
                          onClick={() => {
                            if (onSelectStock) onSelectStock(matchingStock);
                            if (onViewChart) onViewChart(matchingStock);
                          }}
                          className="text-blue-700 font-bold hover:underline flex items-center space-x-1"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>View Ticker Chart</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(note)}
                        className="bg-white hover:bg-gray-100 text-[#1a1a1a] p-2 border border-[#e5e4e1] transition-all flex items-center space-x-1 font-bold text-[11px]"
                        title="Edit Note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="bg-white hover:bg-red-50 text-red-600 p-2 border border-[#e5e4e1] transition-all flex items-center space-x-1 font-bold text-[11px]"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Journal Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5e4e1] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">
                  {editingNoteId ? 'Edit Journal Entry' : 'New Trade Journal Entry'}
                </span>
                <h3 className="text-xl font-serif font-black text-[#1a1a1a] mt-1">
                  {editingNoteId ? 'Update Trade Log' : 'Record Trade Reflection & Emotion'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournalNote} className="space-y-4 font-mono text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ticker Input or Selector */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Ticker Symbol
                  </label>
                  <select
                    value={formTicker}
                    onChange={(e) => handleTickerSelectionChange(e.target.value)}
                    className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  >
                    {stocks.map((s) => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} — {s.name} ({s.exchange})
                      </option>
                    ))}
                    {/* Allow custom entry if not in stocks list */}
                    {!stocks.some((s) => s.ticker.toUpperCase() === formTicker.toUpperCase()) && (
                      <option value={formTicker}>{formTicker} (Custom)</option>
                    )}
                  </select>
                </div>

                {/* Setup Type */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Setup / Pattern Type
                  </label>
                  <select
                    value={formSetupType}
                    onChange={(e) => setFormSetupType(e.target.value)}
                    className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  >
                    <option value="VCP (3 Contractions)">VCP (3 Contractions)</option>
                    <option value="VCP (4 Contractions)">VCP (4 Contractions)</option>
                    <option value="High Tight Flag">High Tight Flag</option>
                    <option value="Cup with Handle">Cup with Handle</option>
                    <option value="Pivot Pullback">Pivot Pullback</option>
                    <option value="3C Cheat Entry">3C Cheat Entry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Trade Status */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Trade Status
                  </label>
                  <select
                    value={formTradeStatus}
                    onChange={(e: any) => setFormTradeStatus(e.target.value)}
                    className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  >
                    {TRADE_STATUSES.map((st) => (
                      <option key={st.status} value={st.status}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entry Price */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Entry Price ({getCurrencySymbol(formExchange)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="125.00"
                    value={formEntryPrice}
                    onChange={(e) => setFormEntryPrice(e.target.value)}
                    className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>

                {/* Exit Price */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Exit Price ({getCurrencySymbol(formExchange)}) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="145.00"
                    value={formExitPrice}
                    onChange={(e) => setFormExitPrice(e.target.value)}
                    className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Emotional State Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-2">
                  Emotional State During Trade
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {EMOTIONAL_STATES.map((em) => {
                    const isSelected = formEmotionalState === em.state;
                    return (
                      <button
                        key={em.state}
                        type="button"
                        onClick={() => setFormEmotionalState(em.state)}
                        className={`p-2.5 text-center text-xs border transition-all flex flex-col items-center justify-center space-y-1 ${
                          isSelected
                            ? 'bg-[#1a1a1a] text-white border-black font-bold shadow-xs'
                            : 'bg-[#f9f8f5] text-gray-700 border-[#e5e4e1] hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-base">{em.icon}</span>
                        <span className="text-[10px] truncate w-full">{em.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execution Quality Rating */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Execution Quality Rating ({formRating} / 5 Stars)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formRating ? 'text-amber-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Notes */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Trade Notes & Rationale
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe market action, volume behavior, setup quality, and execution rationale..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-xs text-[#1a1a1a] focus:outline-none font-sans"
                />
              </div>

              {/* Key Lesson */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Key Lesson / Takeaway
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wait for proper volume dry-up before entering pivot breakouts"
                  value={formKeyLesson}
                  onChange={(e) => setFormKeyLesson(e.target.value)}
                  className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-xs text-[#1a1a1a] focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e5e4e1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white hover:bg-gray-100 text-[#1a1a1a] border border-[#e5e4e1] font-bold px-5 py-2.5 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-6 py-2.5 text-xs uppercase tracking-widest shadow-xs"
                >
                  {editingNoteId ? 'Update Journal Entry' : 'Save Journal Entry'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
