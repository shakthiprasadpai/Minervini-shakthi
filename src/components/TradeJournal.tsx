import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup, TradeJournalNote, EmotionalState, TradeStatus } from '../types';
import { getStoredJournalNotes, saveStoredJournalNotes, getStoredTradeGoals, saveStoredTradeGoals, TradeGoals } from '../utils/tradeJournalStorage';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
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
  X,
  Download,
  FileText,
  BarChart2,
  RefreshCw,
  Printer,
  Sparkles as SparklesIcon,
  Camera,
  Eye,
  Maximize2,
  Target
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
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [journalViewMode, setJournalViewMode] = useState<'grid' | 'grouped'>('grid');

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
  const [formChartSnapshotUrl, setFormChartSnapshotUrl] = useState<string>('');
  const [lightboxSnapshot, setLightboxSnapshot] = useState<string | null>(null);

  const [tradeGoals, setTradeGoals] = useState<TradeGoals>(() => getStoredTradeGoals());
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState<boolean>(false);
  const [formTargetWinRate, setFormTargetWinRate] = useState<string>(tradeGoals.targetWinRate.toString());
  const [formMaxDrawdown, setFormMaxDrawdown] = useState<string>(tradeGoals.maxDrawdownLimit.toString());
  const [formMinRiskReward, setFormMinRiskReward] = useState<string>(tradeGoals.minRiskRewardRatio.toString());
  const [formWeeklyTarget, setFormWeeklyTarget] = useState<string>(tradeGoals.weeklyTradesTarget.toString());
  const [formTargetDiscipline, setFormTargetDiscipline] = useState<string>(tradeGoals.targetDisciplineScore.toString());

  useEffect(() => {
    const handleGoalsUpdate = () => {
      const g = getStoredTradeGoals();
      setTradeGoals(g);
      setFormTargetWinRate(g.targetWinRate.toString());
      setFormMaxDrawdown(g.maxDrawdownLimit.toString());
      setFormMinRiskReward(g.minRiskRewardRatio.toString());
      setFormWeeklyTarget(g.weeklyTradesTarget.toString());
      setFormTargetDiscipline(g.targetDisciplineScore.toString());
    };
    window.addEventListener('minervini_goals_updated', handleGoalsUpdate);
    return () => {
      window.removeEventListener('minervini_goals_updated', handleGoalsUpdate);
    };
  }, []);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGoals: TradeGoals = {
      targetWinRate: parseFloat(formTargetWinRate) || 60,
      maxDrawdownLimit: parseFloat(formMaxDrawdown) || 5.0,
      minRiskRewardRatio: parseFloat(formMinRiskReward) || 3.0,
      weeklyTradesTarget: parseInt(formWeeklyTarget, 10) || 5,
      targetDisciplineScore: parseFloat(formTargetDiscipline) || 4.5,
    };
    setTradeGoals(updatedGoals);
    saveStoredTradeGoals(updatedGoals);
    setIsGoalsModalOpen(false);
  };

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

  const handleCaptureVcpSnapshot = () => {
    const stock = stocks.find((s) => s.ticker.toUpperCase() === formTicker.toUpperCase()) || stocks[0];
    const svgWidth = 500;
    const svgHeight = 260;
    const history = stock && stock.priceHistory ? stock.priceHistory.slice(-45) : [
      { close: 100, high: 105, low: 95 },
      { close: 102, high: 107, low: 98 },
      { close: 108, high: 112, low: 101 }
    ];

    const minP = Math.min(...history.map((p) => p.low));
    const maxP = Math.max(...history.map((p) => p.high));
    const rangeP = maxP - minP || 1;

    const points = history.map((p, i) => {
      const x = (i / (history.length - 1)) * (svgWidth - 50) + 25;
      const y = svgHeight - 45 - ((p.close - minP) / rangeP) * (svgHeight - 80);
      return `${x},${y}`;
    }).join(' ');

    const pivotVal = stock ? stock.pivotPrice : parseFloat(formEntryPrice) || 100;
    const pivotY = svgHeight - 45 - ((pivotVal - minP) / rangeP) * (svgHeight - 80);

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background:#0f172a; font-family:monospace;">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <text x="25" y="28" fill="#34d399" font-size="14" font-weight="bold">${formTicker} VCP Chart Snapshot (${stock ? stock.patternType : 'SEPA Setup'})</text>
      <line x1="25" y1="${pivotY}" x2="${svgWidth - 25}" y2="${pivotY}" stroke="#f59e0b" stroke-dasharray="5 5" stroke-width="2"/>
      <text x="${svgWidth - 140}" y="${pivotY - 8}" fill="#f59e0b" font-size="11" font-weight="bold">Pivot: $${pivotVal}</text>
      <polyline fill="none" stroke="#60a5fa" stroke-width="3" points="${points}"/>
      <text x="25" y="${svgHeight - 18}" fill="#94a3b8" font-size="10">Minervini VCP Snapshot • RS Rating: ${stock?.rsRating || 88} • Vol Dry-Up: ${stock?.volumeDryUpPercent || '-65'}%</text>
    </svg>`;

    const encoded = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
    setFormChartSnapshotUrl(encoded);
  };

  const handleOpenAddModal = () => {
    setEditingNoteId(null);
    setFormNotes('');
    setFormKeyLesson('');
    setFormExitPrice('');
    setFormRating(5);
    setFormChartSnapshotUrl('');
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
    setFormChartSnapshotUrl(note.chartSnapshotUrl || '');
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
      chartSnapshotUrl: formChartSnapshotUrl || undefined,
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

  // Filtered notes keyed by ticker / emotion / outcome / search query
  const filteredNotes = journalNotes.filter((note) => {
    const matchesTicker = selectedTickerFilter === 'ALL' || note.ticker.toUpperCase() === selectedTickerFilter.toUpperCase();
    const matchesEmotion = selectedEmotionFilter === 'ALL' || note.emotionalState === selectedEmotionFilter;
    const matchesOutcome =
      selectedOutcomeFilter === 'ALL' ||
      (selectedOutcomeFilter === 'WIN' && note.tradeStatus === 'CLOSED_WIN') ||
      (selectedOutcomeFilter === 'LOSS' && note.tradeStatus === 'CLOSED_LOSS');
    const matchesSearch =
      !searchQuery ||
      note.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.keyLesson.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTicker && matchesEmotion && matchesOutcome && matchesSearch;
  });

  // Calculate statistics (reflecting filteredNotes)
  const totalNotes = filteredNotes.length;
  const winNotes = React.useMemo(() => filteredNotes.filter((n) => n.tradeStatus === 'CLOSED_WIN'), [filteredNotes]);
  const lossNotes = React.useMemo(() => filteredNotes.filter((n) => n.tradeStatus === 'CLOSED_LOSS'), [filteredNotes]);
  const activeNotes = React.useMemo(() => filteredNotes.filter((n) => n.tradeStatus === 'OPEN_ACTIVE'), [filteredNotes]);
  const winCount = winNotes.length;
  const lossCount = lossNotes.length;
  const closedCount = winCount + lossCount;
  const winRate = closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 0;
  const avgRating = totalNotes > 0 ? (filteredNotes.reduce((acc, n) => acc + n.rating, 0) / totalNotes).toFixed(1) : '0.0';

  // Detailed P&L and Outcome Metrics
  const summaryOutcomeStats = React.useMemo(() => {
    let grossGains = 0;
    let grossLosses = 0;

    winNotes.forEach((n) => {
      let pnl = 0;
      if (n.entryPrice !== undefined && n.exitPrice !== undefined && n.entryPrice > 0) {
        pnl = ((n.exitPrice - n.entryPrice) / n.entryPrice) * 100;
      } else {
        pnl = 8.5; // fallback standard win %
      }
      grossGains += pnl;
    });

    lossNotes.forEach((n) => {
      let pnl = 0;
      if (n.entryPrice !== undefined && n.exitPrice !== undefined && n.entryPrice > 0) {
        pnl = ((n.exitPrice - n.entryPrice) / n.entryPrice) * 100;
      } else {
        pnl = -4.0; // fallback standard loss %
      }
      grossLosses += Math.abs(pnl);
    });

    const avgWinPct = winCount > 0 ? grossGains / winCount : 0;
    const avgLossPct = lossCount > 0 ? grossLosses / lossCount : 0;
    const profitFactor = grossLosses > 0 ? grossGains / grossLosses : grossGains > 0 ? 99.9 : 0;
    const winLossRatio = avgLossPct > 0 ? avgWinPct / avgLossPct : avgWinPct > 0 ? 99.9 : 0;
    const totalRealizedPnlPct = grossGains - grossLosses;
    const winDec = closedCount > 0 ? winCount / closedCount : 0;
    const lossDec = closedCount > 0 ? lossCount / closedCount : 0;
    const expectancyPct = (winDec * avgWinPct) - (lossDec * avgLossPct);

    return {
      grossGains: Number(grossGains.toFixed(2)),
      grossLosses: Number(grossLosses.toFixed(2)),
      avgWinPct: Number(avgWinPct.toFixed(2)),
      avgLossPct: Number(avgLossPct.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      winLossRatio: Number(winLossRatio.toFixed(2)),
      totalRealizedPnlPct: Number(totalRealizedPnlPct.toFixed(2)),
      expectancyPct: Number(expectancyPct.toFixed(2)),
    };
  }, [winNotes, lossNotes, winCount, lossCount, closedCount]);

  // Emotional state frequencies and note keyword frequencies for Word Cloud (reflecting filteredNotes)
  const emotionalStateFrequencies = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredNotes.forEach((n) => {
      counts[n.emotionalState] = (counts[n.emotionalState] || 0) + 1;
    });
    return counts;
  }, [filteredNotes]);

  const recurringKeywordsFrequencies = React.useMemo(() => {
    const stopWords = new Set(['the','and','a','to','of','in','for','is','on','that','by','this','with','it','as','an','be','at','or','from','which','was','were','have','has','had','not','but','they','their','we','our','you','your','all','will','one','so','if','out','up','do','get','got','gotten']);
    const counts: Record<string, number> = {};
    
    filteredNotes.forEach((n) => {
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
  }, [filteredNotes]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Ticker', 'Stock Name', 'Exchange', 'Date', 'Setup Type', 'Entry Price', 'Exit Price', 'Emotional State', 'Trade Status', 'Rating', 'Key Lesson', 'Notes'];
    const rows = journalNotes.map((n) => [
      n.id,
      n.ticker,
      `"${n.stockName.replace(/"/g, '""')}"`,
      n.exchange,
      n.date,
      `"${n.setupType}"`,
      n.entryPrice ?? '',
      n.exitPrice ?? '',
      n.emotionalState,
      n.tradeStatus,
      n.rating,
      `"${n.keyLesson.replace(/"/g, '""')}"`,
      `"${n.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `minervini_trade_journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(journalNotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `minervini_trade_journal_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    let md = `# Mark Minervini SEPA Trade Journal & Diary\n`;
    md += `*Exported on ${new Date().toISOString().split('T')[0]}*\n\n`;
    journalNotes.forEach((n, index) => {
      md += `## ${index + 1}. ${n.ticker} - ${n.stockName} (${n.exchange})\n`;
      md += `- **Date**: ${n.date}\n`;
      md += `- **Setup**: ${n.setupType}\n`;
      md += `- **Status**: ${n.tradeStatus}\n`;
      md += `- **Emotional State**: ${n.emotionalState}\n`;
      md += `- **Entry Price**: ${n.entryPrice !== undefined ? formatCurrency(n.entryPrice, n.exchange) : 'N/A'}\n`;
      md += `- **Exit Price**: ${n.exitPrice !== undefined ? formatCurrency(n.exitPrice, n.exchange) : 'N/A'}\n`;
      md += `- **Rating**: ${'★'.repeat(n.rating)}${'☆'.repeat(5 - n.rating)}\n`;
      md += `- **Key Lesson**: ${n.keyLesson}\n`;
      md += `- **Notes**: ${n.notes}\n`;
      if (n.chartSnapshotUrl) {
        md += `- **Chart Snapshot**: [View Snapshot](${n.chartSnapshotUrl})\n`;
      }
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `minervini_trade_journal_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Interactive quick status update
  const handleQuickStatusUpdate = (id: string, newStatus: TradeStatus) => {
    const updated = journalNotes.map((n) => (n.id === id ? { ...n, tradeStatus: newStatus } : n));
    setJournalNotes(updated);
    saveStoredJournalNotes(updated);
  };

  // Auto-populate trade outcomes from stocks / screener
  const handleAutoPopulate = () => {
    const existingTickers = new Set(journalNotes.map(n => n.ticker.toUpperCase()));
    const newEntries: TradeJournalNote[] = [];
    const emotions: EmotionalState[] = ['DISCIPLINED', 'CONFIDENT', 'CALM', 'PATIENT', 'FOMO', 'ANXIOUS'];
    const statuses: TradeStatus[] = ['CLOSED_WIN', 'CLOSED_LOSS', 'ACTIVE_TRADE', 'PLANNING'];
    const lessons = [
      'Patience on volume dry-up yields optimal risk-reward ratios.',
      'Do not chase extensions without proper consolidation.',
      'Honor stop losses immediately when pivot support fails.',
      'Stage 2 uptrend with institutional accumulation is the holy grail.',
      'Control emotional discipline during high volatility swings.'
    ];

    stocks.forEach((stock, idx) => {
      if (!existingTickers.has(stock.ticker.toUpperCase())) {
        const randomEmotion = emotions[idx % emotions.length];
        const randomStatus = statuses[idx % statuses.length];
        const randomRating = randomStatus === 'CLOSED_WIN' ? 5 : randomStatus === 'CLOSED_LOSS' ? 2 : 4;
        const entryP = stock.pivotPrice;
        const exitP = randomStatus === 'CLOSED_WIN' ? Number((entryP * 1.12).toFixed(2)) : randomStatus === 'CLOSED_LOSS' ? Number((entryP * 0.95).toFixed(2)) : undefined;

        newEntries.push({
          id: `auto-${stock.ticker.toLowerCase()}-${Date.now()}-${idx}`,
          ticker: stock.ticker,
          stockName: stock.name,
          exchange: stock.exchange,
          date: new Date(Date.now() - idx * 86400000 * 2).toISOString().split('T')[0],
          setupType: stock.vcpContractions ? `VCP (${stock.vcpContractions} Contractions)` : 'Cup with Handle',
          entryPrice: entryP,
          exitPrice: exitP,
          emotionalState: randomEmotion,
          notes: `Auto-populated trade outcome for ${stock.name} (${stock.ticker}). RS Rating: ${stock.rsRating}, Volume Dry-Up: ${stock.volumeDryUp ? 'Yes' : 'No'}. Setup quality is robust.`,
          keyLesson: lessons[idx % lessons.length],
          tradeStatus: randomStatus,
          rating: randomRating,
        });
      }
    });

    if (newEntries.length > 0) {
      const updated = [...newEntries, ...journalNotes];
      setJournalNotes(updated);
      saveStoredJournalNotes(updated);
    }
  };

  // Auto Sentiment analysis from text
  const handleAutoSentiment = () => {
    const combined = `${formNotes} ${formKeyLesson}`.toLowerCase();
    if (combined.includes('fomo') || combined.includes('chase') || combined.includes('rush')) {
      setFormEmotionalState('FOMO');
    } else if (combined.includes('fear') || combined.includes('anxious') || combined.includes('nervous') || combined.includes('worry')) {
      setFormEmotionalState('ANXIOUS');
    } else if (combined.includes('patient') || combined.includes('wait') || combined.includes('dried')) {
      setFormEmotionalState('PATIENT');
    } else if (combined.includes('discipline') || combined.includes('plan') || combined.includes('rules')) {
      setFormEmotionalState('DISCIPLINED');
    } else if (combined.includes('calm') || combined.includes('zen') || combined.includes('steady')) {
      setFormEmotionalState('CALM');
    } else if (combined.includes('confident') || combined.includes('sure') || combined.includes('strong')) {
      setFormEmotionalState('CONFIDENT');
    } else if (combined.includes('greed') || combined.includes('euphoria') || combined.includes('surge')) {
      setFormEmotionalState('EUPHORIC');
    } else if (combined.includes('regret') || combined.includes('mistake') || combined.includes('missed')) {
      setFormEmotionalState('REGRETFUL');
    } else {
      setFormEmotionalState('DISCIPLINED');
    }
  };

  // Sentiment vs Outcome correlation stats (reflecting filteredNotes)
  const sentimentOutcomeStats = React.useMemo(() => {
    const map: Record<string, { wins: number; losses: number; total: number; avgRating: number; ratingSum: number }> = {};
    EMOTIONAL_STATES.forEach(em => {
      map[em.state] = { wins: 0, losses: 0, total: 0, avgRating: 0, ratingSum: 0 };
    });

    filteredNotes.forEach(n => {
      if (!map[n.emotionalState]) {
        map[n.emotionalState] = { wins: 0, losses: 0, total: 0, avgRating: 0, ratingSum: 0 };
      }
      map[n.emotionalState].total += 1;
      map[n.emotionalState].ratingSum += n.rating;
      if (n.tradeStatus === 'CLOSED_WIN') map[n.emotionalState].wins += 1;
      if (n.tradeStatus === 'CLOSED_LOSS') map[n.emotionalState].losses += 1;
    });

    return Object.entries(map).map(([state, data]) => {
      const closed = data.wins + data.losses;
      const winRate = closed > 0 ? Math.round((data.wins / closed) * 100) : 0;
      const avgRating = data.total > 0 ? (data.ratingSum / data.total).toFixed(1) : '0.0';
      return {
        state,
        ...data,
        winRate,
        avgRating,
      };
    }).filter(item => item.total > 0);
  }, [filteredNotes]);

  // Cumulative Performance Data calculation over time with sentiment correlation (reflecting filteredNotes)
  const sentimentScoreMap: Record<EmotionalState, number> = {
    DISCIPLINED: 5,
    CONFIDENT: 4.5,
    CALM: 4,
    PATIENT: 4,
    EUPHORIC: 3,
    ANXIOUS: 2,
    IMPATIENT: 2,
    REGRETFUL: 1.5,
    FOMO: 1,
  };

  const performanceChartData = React.useMemo(() => {
    const sorted = [...filteredNotes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = 0;
    let sentimentSum = 0;
    return sorted.map((note, idx) => {
      let pnl = 0;
      if (note.entryPrice !== undefined && note.exitPrice !== undefined) {
        pnl = ((note.exitPrice - note.entryPrice) / note.entryPrice) * 100;
      } else if (note.tradeStatus === 'CLOSED_WIN') {
        pnl = 8.0;
      } else if (note.tradeStatus === 'CLOSED_LOSS') {
        pnl = -4.5;
      } else {
        pnl = 0.0;
      }
      cumulative += pnl;

      const score = sentimentScoreMap[note.emotionalState] || 3;
      sentimentSum += score;
      const runningAvg = Number((sentimentSum / (idx + 1)).toFixed(2));

      return {
        date: note.date,
        ticker: note.ticker,
        pnl: Number(pnl.toFixed(2)),
        cumulative: Number(cumulative.toFixed(2)),
        sentimentScore: score,
        runningAvgSentiment: runningAvg,
        emotionalState: note.emotionalState,
        status: note.tradeStatus,
      };
    });
  }, [filteredNotes]);

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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAutoPopulate}
            className="bg-white hover:bg-gray-50 text-[#1a1a1a] font-bold px-4 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-[#e5e4e1] shadow-xs cursor-pointer"
            title="Auto-populate trade outcomes & journal notes from VCP watchlist"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Auto-Populate Outcomes</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-gray-50 text-[#1a1a1a] font-bold px-4 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-[#e5e4e1] shadow-xs cursor-pointer"
            title="Export journal and trade outcomes to CSV"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-white hover:bg-gray-50 text-[#1a1a1a] font-bold px-4 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-[#e5e4e1] shadow-xs cursor-pointer"
            title="Export journal and trade outcomes to JSON"
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="bg-white hover:bg-gray-50 text-[#1a1a1a] font-bold px-4 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-[#e5e4e1] shadow-xs cursor-pointer"
            title="Export trade diary to Markdown (Obsidian / Notion Vault compatible)"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-white hover:bg-gray-50 text-[#1a1a1a] font-bold px-4 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-[#e5e4e1] shadow-xs cursor-pointer print:hidden"
            title="Print Executive Journal Analysis & Performance Report"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Print Analysis</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-5 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 transition-all border border-black shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Trade Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Executive Trade Summary Dashboard */}
      <div className="bg-white border border-[#e5e4e1] p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-[#e5e4e1] pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-serif font-black text-[#1a1a1a]">
              Executive Performance Summary Dashboard
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Calculated from Saved Trade Outcomes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Stat 1: Win Rate */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Win Rate</span>
            <strong className="text-xl font-mono font-black text-emerald-700 block">{winRate}%</strong>
            <span className="text-[9px] font-mono text-gray-600 block">{winCount}W / {lossCount}L</span>
          </div>

          {/* Stat 2: Avg Profit per Winner */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Avg Profit / Win</span>
            <strong className="text-xl font-mono font-black text-emerald-600 block">
              +{summaryOutcomeStats.avgWinPct}%
            </strong>
            <span className="text-[9px] font-mono text-emerald-700 block">Gross Gain: +{summaryOutcomeStats.grossGains}%</span>
          </div>

          {/* Stat 3: Avg Loss per Loser */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Avg Loss / Loss</span>
            <strong className="text-xl font-mono font-black text-rose-600 block">
              -{summaryOutcomeStats.avgLossPct}%
            </strong>
            <span className="text-[9px] font-mono text-rose-700 block">Gross Loss: -{summaryOutcomeStats.grossLosses}%</span>
          </div>

          {/* Stat 4: Payoff Ratio */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Win/Loss Ratio</span>
            <strong className="text-xl font-mono font-black text-indigo-700 block">
              {summaryOutcomeStats.winLossRatio}x
            </strong>
            <span className="text-[9px] font-mono text-gray-500 block">Avg Win / Avg Loss</span>
          </div>

          {/* Stat 5: Profit Factor */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Profit Factor</span>
            <strong className="text-xl font-mono font-black text-blue-700 block">
              {summaryOutcomeStats.profitFactor}
            </strong>
            <span className="text-[9px] font-mono text-gray-500 block">Gains / Losses Ratio</span>
          </div>

          {/* Stat 6: Trade Expectancy */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Trade Expectancy</span>
            <strong className={`text-xl font-mono font-black block ${summaryOutcomeStats.expectancyPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {summaryOutcomeStats.expectancyPct >= 0 ? `+${summaryOutcomeStats.expectancyPct}%` : `${summaryOutcomeStats.expectancyPct}%`}
            </strong>
            <span className="text-[9px] font-mono text-gray-500 block">Expected Return / Trade</span>
          </div>

          {/* Stat 7: Total Realized P&L */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Total Realized P&L</span>
            <strong className={`text-xl font-mono font-black block ${summaryOutcomeStats.totalRealizedPnlPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {summaryOutcomeStats.totalRealizedPnlPct >= 0 ? `+${summaryOutcomeStats.totalRealizedPnlPct}%` : `${summaryOutcomeStats.totalRealizedPnlPct}%`}
            </strong>
            <span className="text-[9px] font-mono text-gray-500 block">Cumulative % Return</span>
          </div>

          {/* Stat 8: Avg Execution Rating */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Execution Rating</span>
            <strong className="text-xl font-mono font-black text-amber-600 flex items-center justify-center space-x-1">
              <span>{avgRating}</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current inline" />
            </strong>
            <span className="text-[9px] font-mono text-gray-500 block">{totalNotes} Journaled</span>
          </div>
        </div>
      </div>

      {/* Trade Goal Setter & Outcome Targets Tracker */}
      <div className="bg-white border border-[#e5e4e1] p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-[#e5e4e1] pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-serif font-black text-[#1a1a1a]">
              Trade Goal Setter & Outcome Targets Tracker
            </h3>
          </div>
          <button
            onClick={() => setIsGoalsModalOpen(true)}
            className="text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] text-white px-3.5 py-2 hover:bg-black transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Configure Trading Goals</span>
          </button>
        </div>

        <p className="text-xs text-gray-600 font-sans">
          Tracking actual trade outcomes against your SEPA performance goals (Win Rate, Discipline Score, Setup Frequency, Risk-to-Reward Ratio).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Goal 1: Win Rate */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500 uppercase">Win Rate Goal</span>
              <span className="font-bold text-[#1a1a1a]">{winRate}% / {tradeGoals.targetWinRate}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div
                className={`h-full ${winRate >= tradeGoals.targetWinRate ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, (winRate / tradeGoals.targetWinRate) * 100))}%` }}
              />
            </div>
            <span className={`text-[10px] font-mono font-bold block ${winRate >= tradeGoals.targetWinRate ? 'text-emerald-700' : 'text-amber-700'}`}>
              {winRate >= tradeGoals.targetWinRate ? '✓ Target Met' : '⏳ In Progress'}
            </span>
          </div>

          {/* Goal 2: Discipline Score */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500 uppercase">Avg Discipline</span>
              <span className="font-bold text-[#1a1a1a]">{avgRating}★ / {tradeGoals.targetDisciplineScore}★</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div
                className={`h-full ${parseFloat(avgRating) >= tradeGoals.targetDisciplineScore ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, (parseFloat(avgRating) / 5) * 100))}%` }}
              />
            </div>
            <span className={`text-[10px] font-mono font-bold block ${parseFloat(avgRating) >= tradeGoals.targetDisciplineScore ? 'text-emerald-700' : 'text-amber-700'}`}>
              {parseFloat(avgRating) >= tradeGoals.targetDisciplineScore ? '✓ Target Met' : '⏳ In Progress'}
            </span>
          </div>

          {/* Goal 3: Setup Frequency */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500 uppercase">Journaled Trades</span>
              <span className="font-bold text-[#1a1a1a]">{totalNotes} / {tradeGoals.weeklyTradesTarget}</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${Math.min(100, Math.max(0, (totalNotes / tradeGoals.weeklyTradesTarget) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-700 block">
              Active Logging Volume
            </span>
          </div>

          {/* Goal 4: Max Drawdown Limit */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500 uppercase">Max Loss Limit</span>
              <span className="font-bold text-rose-700">{tradeGoals.maxDrawdownLimit}% Max</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: '100%' }} />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 block">
              🛡️ Risk Guard Active
            </span>
          </div>
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

      {/* Sentiment vs Trade Outcome Correlation Analytics & Heatmap Matrix */}
      <div className="bg-white border border-[#e5e4e1] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-serif font-black text-[#1a1a1a]">
              Emotional State vs Trade Outcome Heatmap Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Behavioral Performance Correlation
          </span>
        </div>

        <p className="text-xs text-gray-600 font-sans">
          Visual heatmap matrix correlating logged emotional states (Fear, Greed, Discipline, FOMO) with trade outcomes (Wins vs Losses). Darker emerald gradients indicate high-probability disciplined setups; warmer crimson gradients highlight psychological leakage leading to poor performance.
        </p>

        {/* Heatmap Matrix Table */}
        <div className="overflow-x-auto border border-[#e5e4e1]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f9f8f5] border-b border-[#e5e4e1] text-[10px] uppercase text-gray-600">
              <tr>
                <th className="p-3">Emotional State / Mindset</th>
                <th className="p-3 text-center">Total Trades</th>
                <th className="p-3 text-center">Closed Wins</th>
                <th className="p-3 text-center">Closed Losses</th>
                <th className="p-3 text-center">Win Rate (%)</th>
                <th className="p-3 text-center">Performance Correlation / Heat Intensity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e4e1]">
              {sentimentOutcomeStats.map((stat) => {
                const emObj = EMOTIONAL_STATES.find(e => e.state === stat.state) || EMOTIONAL_STATES[0];
                const closedTotal = stat.wins + stat.losses;
                
                // Determine heat intensity background
                let heatBg = 'bg-gray-50 text-gray-700';
                let heatLabel = 'Neutral / Insufficient Data';
                if (closedTotal > 0) {
                  if (stat.winRate >= 70) {
                    heatBg = 'bg-emerald-100 text-emerald-900 border-l-4 border-emerald-600';
                    heatLabel = '🟢 High Edge (Optimal Discipline)';
                  } else if (stat.winRate >= 50) {
                    heatBg = 'bg-blue-50 text-blue-900 border-l-4 border-blue-500';
                    heatLabel = '🔵 Moderate Performance';
                  } else if (stat.winRate >= 30) {
                    heatBg = 'bg-amber-50 text-amber-900 border-l-4 border-amber-500';
                    heatLabel = '🟡 Caution (Sub-optimal)';
                  } else {
                    heatBg = 'bg-rose-100 text-rose-900 border-l-4 border-rose-600';
                    heatLabel = '🔴 High Risk / Poor Correlation';
                  }
                }

                return (
                  <tr key={stat.state} className={`hover:bg-[#fcfcfb] transition-colors ${heatBg}`}>
                    <td className="p-3 font-bold flex items-center space-x-2">
                      <span className="text-base">{emObj.icon}</span>
                      <span>{emObj.label}</span>
                    </td>
                    <td className="p-3 text-center font-bold">{stat.total}</td>
                    <td className="p-3 text-center text-emerald-700 font-bold">{stat.wins}</td>
                    <td className="p-3 text-center text-rose-600 font-bold">{stat.losses}</td>
                    <td className="p-3 text-center font-bold">
                      {closedTotal > 0 ? `${stat.winRate}%` : 'N/A'}
                    </td>
                    <td className="p-3 text-center font-sans text-[11px] font-semibold">
                      <span className="px-2.5 py-1 rounded bg-white/80 border border-black/10 shadow-xs inline-block">
                        {heatLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {sentimentOutcomeStats.map((stat) => {
            const emObj = EMOTIONAL_STATES.find(e => e.state === stat.state) || EMOTIONAL_STATES[0];
            const closedTotal = stat.wins + stat.losses;

            return (
              <div key={stat.state} className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border flex items-center space-x-1 ${emObj.color}`}>
                    <span>{emObj.icon}</span>
                    <span>{emObj.label}</span>
                  </span>
                  <span className="text-xs font-bold text-gray-700">{stat.total} trades</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-[#e5e4e1]">
                  <div>
                    <span className="text-[9px] uppercase text-gray-500 block">Wins</span>
                    <strong className="text-emerald-700 font-bold">{stat.wins}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-gray-500 block">Losses</span>
                    <strong className="text-rose-600 font-bold">{stat.losses}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-gray-500 block">Win Rate</span>
                    <strong className={`font-bold ${stat.winRate >= 60 ? 'text-emerald-700' : stat.winRate >= 40 ? 'text-amber-700' : 'text-rose-600'}`}>
                      {closedTotal > 0 ? `${stat.winRate}%` : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#e5e4e1]">
                  <span className="text-gray-500 uppercase text-[9px]">Avg Execution Rating:</span>
                  <span className="font-bold flex items-center space-x-1">
                    <span>{stat.avgRating}</span>
                    <Star className="w-3 h-3 text-amber-500 fill-current inline" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trade Performance Over Time (Cumulative P&L Growth) */}
      <div className="bg-white border border-[#e5e4e1] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-serif font-black text-[#1a1a1a]">
              Trade Performance Over Time — Cumulative P&L Growth (%)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Recharts Visualizer
          </span>
        </div>

        <p className="text-xs text-gray-600 font-sans">
          Tracking the trajectory of your portfolio growth based on closed and active trade journal entries over chronological dates.
        </p>

        <div className="h-72 w-full pt-4">
          {performanceChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-gray-400">
              No performance data available. Add or auto-populate trade journal entries.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e4e1" />
                <XAxis dataKey="date" stroke="#666" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#666" fontSize={11} fontFamily="monospace" unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1a1a1a] text-white p-3 text-xs font-mono space-y-1 shadow-xl border border-gray-800">
                          <p className="text-amber-400 font-bold">{data.ticker} ({data.date})</p>
                          <p>Trade P&L: <span className={data.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{data.pnl >= 0 ? `+${data.pnl}%` : `${data.pnl}%`}</span></p>
                          <p>Cumulative: <span className={data.cumulative >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{data.cumulative >= 0 ? `+${data.cumulative}%` : `${data.cumulative}%`}</span></p>
                          <p className="text-[10px] text-gray-400 uppercase">Status: {data.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 7, fill: '#047857' }}
                  name="Cumulative P&L (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Line Chart: Emotional Discipline vs Cumulative P&L Over Time */}
      <div className="bg-white border border-[#e5e4e1] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-serif font-black text-[#1a1a1a]">
              Emotional Discipline Score vs Cumulative P&L Over Time
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Behavioral Correlation Analysis
          </span>
        </div>

        <p className="text-xs text-gray-600 font-sans">
          Visually correlating your emotional state score (Scale: 1 FOMO/Regret to 5 Disciplined) against cumulative portfolio growth to verify that psychological discipline drives monetary success.
        </p>

        <div className="h-72 w-full pt-4">
          {performanceChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-gray-400">
              No performance data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e4e1" />
                <XAxis dataKey="date" stroke="#666" fontSize={11} fontFamily="monospace" />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={11} fontFamily="monospace" unit="%" />
                <YAxis yAxisId="right" orientation="right" stroke="#6366f1" domain={[1, 5]} fontSize={11} fontFamily="monospace" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1a1a1a] text-white p-3 text-xs font-mono space-y-1 shadow-xl border border-gray-800">
                          <p className="text-amber-400 font-bold">{data.ticker} ({data.date})</p>
                          <p>Cumulative P&L: <span className={data.cumulative >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{data.cumulative >= 0 ? `+${data.cumulative}%` : `${data.cumulative}%`}</span></p>
                          <p>Emotional State: <span className="text-indigo-300 font-bold">{data.emotionalState} (Score: {data.sentimentScore}/5)</span></p>
                          <p>Running Avg Sentiment: <span className="text-indigo-400 font-bold">{data.runningAvgSentiment}/5</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  name="Cumulative P&L (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="runningAvgSentiment"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6, fill: '#4338ca' }}
                  name="Avg Sentiment Score (1-5)"
                />
              </LineChart>
            </ResponsiveContainer>
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

          {/* Trade Outcome Filter (All, Winners, Losers) */}
          <div className="flex items-center space-x-1 bg-[#f9f8f5] border border-[#e5e4e1] p-1">
            <button
              onClick={() => setSelectedOutcomeFilter('ALL')}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                selectedOutcomeFilter === 'ALL'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setSelectedOutcomeFilter('WIN')}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                selectedOutcomeFilter === 'WIN'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Winners
            </button>
            <button
              onClick={() => setSelectedOutcomeFilter('LOSS')}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                selectedOutcomeFilter === 'LOSS'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Losers
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-[#f9f8f5] border border-[#e5e4e1] p-1">
            <button
              onClick={() => setJournalViewMode('grid')}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                journalViewMode === 'grid'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setJournalViewMode('grouped')}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                journalViewMode === 'grouped'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Grouped by Sentiment
            </button>
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
        ) : journalViewMode === 'grouped' ? (
          <div className="space-y-8">
            {EMOTIONAL_STATES.map((em) => {
              const notesInEmotion = filteredNotes.filter((n) => n.emotionalState === em.state);
              if (notesInEmotion.length === 0) return null;

              const wins = notesInEmotion.filter(n => n.tradeStatus === 'CLOSED_WIN').length;
              const losses = notesInEmotion.filter(n => n.tradeStatus === 'CLOSED_LOSS').length;
              const closedCount = wins + losses;
              const winRate = closedCount > 0 ? Math.round((wins / closedCount) * 100) : 0;
              const avgRating = (notesInEmotion.reduce((acc, n) => acc + n.rating, 0) / notesInEmotion.length).toFixed(1);

              return (
                <div key={em.state} className="bg-white border border-[#e5e4e1] p-6 space-y-4 shadow-xs">
                  <div className={`flex flex-wrap items-center justify-between border-b pb-3 ${em.color} px-4 py-3 rounded`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{em.icon}</span>
                      <h3 className="text-base font-serif font-black uppercase tracking-wide">
                        {em.label} Sentiment Group ({notesInEmotion.length} trades)
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-mono font-bold">
                      <span>Wins: <span className="text-emerald-700">{wins}</span></span>
                      <span>Losses: <span className="text-rose-700">{losses}</span></span>
                      <span>Win Rate: <span className={winRate >= 60 ? 'text-emerald-700' : 'text-amber-700'}>{closedCount > 0 ? `${winRate}%` : 'N/A'}</span></span>
                      <span>Avg Rating: {avgRating} ★</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notesInEmotion.map((note) => {
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

                            {/* VCP Chart Snapshot Thumbnail if available */}
                            {note.chartSnapshotUrl && (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-gray-600 font-mono tracking-wider flex items-center space-x-1">
                                    <Camera className="w-3 h-3 text-blue-600" />
                                    <span>VCP Chart Snapshot:</span>
                                  </span>
                                  <button
                                    onClick={() => setLightboxSnapshot(note.chartSnapshotUrl || null)}
                                    className="text-[10px] font-bold text-blue-700 hover:underline flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span>Enlarge Chart</span>
                                  </button>
                                </div>
                                <div
                                  onClick={() => setLightboxSnapshot(note.chartSnapshotUrl || null)}
                                  className="cursor-pointer border border-[#e5e4e1] bg-[#0f172a] p-1 rounded overflow-hidden hover:opacity-95 transition-all shadow-xs"
                                >
                                  <img
                                    src={note.chartSnapshotUrl}
                                    alt={`${note.ticker} VCP Snapshot`}
                                    className="w-full h-28 object-contain"
                                  />
                                </div>
                              </div>
                            )}

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
                </div>
              );
            })}
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

                    {/* VCP Chart Snapshot Thumbnail if available */}
                    {note.chartSnapshotUrl && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-gray-600 font-mono tracking-wider flex items-center space-x-1">
                            <Camera className="w-3 h-3 text-blue-600" />
                            <span>VCP Chart Snapshot:</span>
                          </span>
                          <button
                            onClick={() => setLightboxSnapshot(note.chartSnapshotUrl || null)}
                            className="text-[10px] font-bold text-blue-700 hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Enlarge Chart</span>
                          </button>
                        </div>
                        <div
                          onClick={() => setLightboxSnapshot(note.chartSnapshotUrl || null)}
                          className="cursor-pointer border border-[#e5e4e1] bg-[#0f172a] p-1 rounded overflow-hidden hover:opacity-95 transition-all shadow-xs"
                        >
                          <img
                            src={note.chartSnapshotUrl}
                            alt={`${note.ticker} VCP Snapshot`}
                            className="w-full h-28 object-contain"
                          />
                        </div>
                      </div>
                    )}

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

              {/* VCP Chart Snapshot Capture */}
              <div className="space-y-2 bg-[#f9f8f5] p-4 border border-[#e5e4e1]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-700 font-mono tracking-wider flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>VCP Chart Snapshot & Thumbnail:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCaptureVcpSnapshot}
                    className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 uppercase tracking-widest flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                    title="Capture mini-screenshot or SVG thumbnail of current VCP chart for this trade"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture VCP Snapshot</span>
                  </button>
                </div>
                {formChartSnapshotUrl ? (
                  <div className="space-y-2 pt-1">
                    <div className="relative border border-[#e5e4e1] bg-[#0f172a] p-1 rounded overflow-hidden">
                      <img
                        src={formChartSnapshotUrl}
                        alt="VCP Snapshot Preview"
                        className="w-full h-32 object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Snapshot successfully linked to this entry</span>
                      <button
                        type="button"
                        onClick={() => setFormChartSnapshotUrl('')}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Remove Snapshot
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 font-sans">
                    No chart snapshot captured yet. Click "Capture VCP Snapshot" to snapshot the active VCP setup and attach it to this journal entry.
                  </p>
                )}
              </div>

              {/* Trade Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold">
                    Trade Notes & Rationale
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSentiment}
                    className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 border border-amber-200 flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Auto-analyze sentiment & emotional state from notes and key lessons"
                  >
                    <SparklesIcon className="w-3 h-3 text-amber-600" />
                    <span>Auto Sentiment</span>
                  </button>
                </div>
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

      {/* Trade Goals Configuration Modal */}
      {isGoalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5e4e1] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-serif font-black text-[#1a1a1a]">
                  Configure Trading Goals & Outcome Targets
                </h3>
              </div>
              <button
                onClick={() => setIsGoalsModalOpen(false)}
                className="text-gray-500 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoals} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Target Win Rate (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={formTargetWinRate}
                  onChange={(e) => setFormTargetWinRate(e.target.value)}
                  className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-xs text-[#1a1a1a] font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Target Average Discipline Score (1.0 to 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formTargetDiscipline}
                  onChange={(e) => setFormTargetDiscipline(e.target.value)}
                  className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-xs text-[#1a1a1a] font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Weekly Trade Setup Target (Count)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="50"
                  value={formWeeklyTarget}
                  onChange={(e) => setFormWeeklyTarget(e.target.value)}
                  className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-xs text-[#1a1a1a] font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Max Allowable Drawdown / Loss Limit (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={formMaxDrawdown}
                  onChange={(e) => setFormMaxDrawdown(e.target.value)}
                  className="w-full bg-[#f9f8f5] border border-[#e5e4e1] p-3 text-xs text-[#1a1a1a] font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e5e4e1]">
                <button
                  type="button"
                  onClick={() => setIsGoalsModalOpen(false)}
                  className="bg-white hover:bg-gray-100 text-[#1a1a1a] border border-[#e5e4e1] font-bold px-5 py-2.5 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-6 py-2.5 text-xs uppercase tracking-widest shadow-xs"
                >
                  Save Trading Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for VCP Chart Snapshot */}
      {lightboxSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-gray-700 max-w-4xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  VCP Chart Snapshot Full Resolution View
                </span>
              </div>
              <button
                onClick={() => setLightboxSnapshot(null)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full flex items-center justify-center p-3 bg-black/60 border border-gray-800 rounded">
              <img
                src={lightboxSnapshot}
                alt="VCP Snapshot Enlarged"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
