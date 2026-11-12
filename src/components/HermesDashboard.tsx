import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Send, Calculator, LineChart, MessageCircle } from 'lucide-react';
import type { MinerviniTradeSetup } from '../types';
import { getTelegramStatus, sendTelegramAlert } from '../utils/telegramAlerts';
import { MinerviniPicksPanel } from './MinerviniPicksPanel';

interface ChatMessage {
  id: number;
  from: 'HERMES' | 'YOU';
  text: string;
  time: string;
}

interface Props {
  stock: MinerviniTradeSetup | null;
  totalSetupsCount: number;
  onOpenScanner: () => void;
  onOpenCalculator: () => void;
  onViewChart: () => void;
  currencySymbol: string;
}

const now = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

const fmt = (n: number | undefined, currencySymbol: string) =>
  Number.isFinite(n as number) ? `${currencySymbol}${(n as number).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

/** A canned Hermes reply built from the selected stock's real screen data, not a live model call. */
function hermesReply(query: string, stock: MinerviniTradeSetup | null, currencySymbol: string): string {
  const t = stock?.ticker ?? 'your watchlist';
  if (!stock) return `Load a stock from the screener first and I'll evaluate ${query.toLowerCase()} against it.`;
  if (/breakout probability|vcp tightness/i.test(query)) {
    return `${t}: Trend Template ${stock.trendScore}/8, RS ${stock.rsRating}, volume ${Math.round(stock.volumeDryUpPercent)}% below its 20-day average. ${
      stock.isTightVolume ? 'Volume is drying up into the pivot — a constructive sign for a breakout.' : 'Volume has not dried up yet — wait for tighter action before sizing up.'
    }`;
  }
  if (/1% risk|position size/i.test(query)) {
    const risk = stock.currentPrice - stock.stopLossPrice;
    if (!(risk > 0)) return `${t} has no valid stop distance right now, so I can't size a 1% risk position.`;
    const shares = Math.floor(50000 / risk);
    return `On ${t}: entry ${fmt(stock.currentPrice, currencySymbol)}, stop ${fmt(stock.stopLossPrice, currencySymbol)} (risk ${fmt(risk, currencySymbol)}/share). 1% of $50,000 = $500 → about ${shares.toLocaleString('en-IN')} shares.`;
  }
  if (/3c cheat/i.test(query)) {
    return 'Minervini’s 3C Cheat Entry buys the first push off a sharp low-volume pullback inside an active VCP, ahead of the pivot — tighter stop, earlier entry, but needs the base to still be intact.';
  }
  if (/max drawdown/i.test(query)) {
    return 'SEPA risk guidelines: cut losses at 7–10% on any individual position, and step aside entirely if your portfolio draws down past about 10–12% from a peak.';
  }
  if (/stage 2 uptrend/i.test(query)) {
    return `Scanning now — open the Stage Scan screen for the full ranked list of stocks passing all 8 Trend Template rules.`;
  }
  return `Noted on ${t}. Ask about breakout probability, position sizing, the 3C cheat entry, drawdown limits, or today's Stage 2 scan.`;
}

const QUICK_QUERIES = [
  'Evaluate {ticker} breakout probability & VCP tightness',
  'Calculate 1% risk position size for $50,000 capital on {ticker}',
  "Explain Mark Minervini's 3C Cheat Entry setup",
  'What is the max drawdown allowed under SEPA guidelines?',
  'Scan top growth stocks in Stage 2 uptrends right now'
];

export const HermesDashboard: React.FC<Props> = ({ stock, totalSetupsCount, onOpenScanner, onOpenCalculator, onViewChart, currencySymbol }) => {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const idRef = useRef(0);
  const sepaScore = stock ? Math.round((stock.trendScore / 8) * 70 + Math.min(stock.rsRating, 99) * 0.3) : 0;

  const ticker = stock?.ticker ?? 'a stock';
  const queries = useMemo(() => QUICK_QUERIES.map(q => q.replace('{ticker}', ticker)), [ticker]);

  const [telegramConfigured, setTelegramConfigured] = useState<boolean | null>(null);
  const [telegramRecipientCount, setTelegramRecipientCount] = useState(0);
  const [telegramSendState, setTelegramSendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  useEffect(() => {
    getTelegramStatus().then(s => {
      setTelegramConfigured(s.configured);
      setTelegramRecipientCount(s.recipientCount);
    });
  }, []);

  const sendSetupToTelegram = async () => {
    if (!stock) return;
    setTelegramSendState('sending');
    const message =
      `🪽 <b>Hermes setup: ${stock.ticker}</b>\n` +
      `${stock.name}\n` +
      `SEPA score ${sepaScore}/100 · RS ${stock.rsRating}/99 · Trend ${stock.trendScore}/8\n` +
      `Pivot ${fmt(stock.pivotPrice, currencySymbol)} · Stop ${fmt(stock.stopLossPrice, currencySymbol)}${Number.isFinite(stock.stopLossPercent) ? ` (${stock.stopLossPercent.toFixed(2)}%)` : ''}\n` +
      `Target 1 ${fmt(stock.target1Price, currencySymbol)}${Number.isFinite(stock.target1Percent) ? ` (+${stock.target1Percent.toFixed(0)}%)` : ''} · R:R ${Number.isFinite(stock.riskRewardRatio) ? `${stock.riskRewardRatio.toFixed(1)}:1` : '—'}`;
    const ok = await sendTelegramAlert(message);
    setTelegramSendState(ok ? 'sent' : 'failed');
    if (ok) setTimeout(() => setTelegramSendState('idle'), 4000);
  };

  const [isThinking, setIsThinking] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { id: idRef.current++, from: 'YOU', text, time: now() }]);
    setDraft('');
    setIsThinking(true);

    let reply: string;
    try {
      const res = await fetch('/api/hermes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, stock, currencySymbol })
      });
      const data = res.ok ? await res.json() : null;
      reply = data?.reply || hermesReply(text, stock, currencySymbol);
    } catch {
      reply = hermesReply(text, stock, currencySymbol);
    }

    setIsThinking(false);
    setMessages(m => [...m, { id: idRef.current++, from: 'HERMES', text: reply, time: now() }]);
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Hermes Agent chat */}
        <div className="flex min-h-[440px] flex-col rounded-2xl border border-white/10 bg-[#0d1119] p-5">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Hermes Agent</span>
            <span className="text-[10px] text-slate-500">{now()}</span>
          </div>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-200">
            <p>
              Greetings Trader. I am <strong className="text-white">Hermes Agent</strong> — your autonomous SEPA AI trading co-pilot &amp; algorithmic market intelligence messenger.
            </p>
            <p className="text-slate-300">
              I operate on real-time SEPA Trend Template validation, Volatility Contraction Pattern (VCP) detection, volume dry-up analysis, and institutional risk management parameters.
            </p>
            <p>How can I direct your trading strategy today?</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-current" /> SEPA Score: {sepaScore || 0}/100
            </span>
            <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
              {stock && stock.trendScore >= 8 ? 'Stage 2 bullish' : stock && stock.trendScore <= 1 ? 'Stage 4 bearish' : 'Neutral'}
            </span>
          </div>

          {(messages.length > 0 || isThinking) && (
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-3">
              {messages.map(m => (
                <div key={m.id} className={m.from === 'YOU' ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      m.from === 'YOU' ? 'bg-amber-400 text-slate-950' : 'bg-white/[0.06] text-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-600">{m.time}</div>
                </div>
              ))}
              {isThinking && (
                <div className="text-left">
                  <div className="inline-block animate-pulse rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-slate-400">
                    Hermes is thinking…
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-4">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(draft)}
                placeholder={`Ask Hermes Agent about ${ticker} or SEPA setup execution...`}
                className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-400/60 focus:outline-none"
              />
              <button
                onClick={() => send(draft)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Send className="h-3.5 w-3.5" /> Execute
              </button>
            </div>
            <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Quick queries:</p>
            <div className="flex flex-wrap gap-2">
              {queries.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-300 hover:border-amber-400/40 hover:text-amber-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical execution panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Company Name:</dt>
                <dd className="font-bold text-white">{stock?.name ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Current Price:</dt>
                <dd className="font-black text-amber-400">{fmt(stock?.currentPrice, currencySymbol)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">RS Rating:</dt>
                <dd className="font-bold text-emerald-400">{Number.isFinite(stock?.rsRating as number) ? `${stock!.rsRating} / 99` : '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Trend Template Score:</dt>
                <dd className="font-bold text-white">{stock ? `${stock.trendScore} / 8 Rules` : '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical execution levels</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Pivot Entry:</dt>
                <dd className="font-bold text-emerald-400">{fmt(stock?.pivotPrice, currencySymbol)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Hard Stop Loss:</dt>
                <dd className="font-bold text-rose-400">
                  {fmt(stock?.stopLossPrice, currencySymbol)}
                  {Number.isFinite(stock?.stopLossPercent as number) && <span className="text-slate-500"> ({stock!.stopLossPercent.toFixed(2)}%)</span>}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Target 1 {Number.isFinite(stock?.target1Percent as number) ? `(+${stock!.target1Percent.toFixed(0)}%)` : ''}:</dt>
                <dd className="font-bold text-white">{fmt(stock?.target1Price, currencySymbol)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Risk/Reward Ratio:</dt>
                <dd className="font-bold text-white">{Number.isFinite(stock?.riskRewardRatio as number) ? `${stock!.riskRewardRatio.toFixed(1)}:1` : '—'}</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={onOpenCalculator}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0d1119] px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-200 hover:border-amber-400/40 hover:text-amber-200"
          >
            <Calculator className="h-4 w-4" /> Open Position Size Calculator
          </button>
          <button
            onClick={onViewChart}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300"
          >
            <LineChart className="h-4 w-4" /> View VCP Chart &amp; Contractions
          </button>
          <button
            onClick={sendSetupToTelegram}
            disabled={!stock || telegramSendState === 'sending'}
            title={telegramConfigured === false ? 'Set TELEGRAM_ALERTS_BOT_TOKEN / TELEGRAM_ALERTS_CHAT_ID in .env first' : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-[#0d1119] px-4 py-3 text-xs font-black uppercase tracking-wider text-sky-200 hover:border-sky-400/60 hover:text-sky-100 disabled:opacity-40"
          >
            <MessageCircle className="h-4 w-4" />
            {telegramSendState === 'sending' ? 'Sending…' : telegramSendState === 'sent' ? 'Sent ✓' : telegramSendState === 'failed' ? 'Failed — retry' : 'Send Setup to Telegram'}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0d1119] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">Stage 2 breakout engine active</span>
              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                8 SEPA criteria filter
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Continuous Minervini Trend Template evaluation &amp; volume dry-up monitoring across {totalSetupsCount} watchlist stocks.
            </p>
            {telegramConfigured !== null && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                <span className={`h-1.5 w-1.5 rounded-full ${telegramConfigured ? 'bg-sky-400' : 'bg-slate-600'}`} />
                <span className={telegramConfigured ? 'text-sky-300' : 'text-slate-600'}>
                  {telegramConfigured
                    ? `Telegram alerts connected · ${telegramRecipientCount} recipient${telegramRecipientCount === 1 ? '' : 's'}`
                    : 'Telegram alerts not configured'}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[10px] text-slate-500">
            <div className="font-black uppercase tracking-wider">Keyboard shortcut</div>
            <div>Press anywhere to toggle scanner</div>
          </div>
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300"
          >
            Open Scanner <span className="rounded bg-slate-950/20 px-1.5 py-0.5 text-[10px]">⌘K / Ctrl+K</span>
          </button>
        </div>
      </div>

      {/* Minervini picks — one per market-cap bucket */}
      <MinerviniPicksPanel currencySymbol={currencySymbol} />

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-white/5 pt-4 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-bold uppercase tracking-wider text-emerald-400">
          Market outlook: <span className="text-emerald-300">Confirmed uptrend</span>
        </span>
        <span className="uppercase tracking-wider">Mark Minervini SEPA (Specific Entry Point Analysis) Engine</span>
        <span>© {new Date().getFullYear()} Growth Stock Alpha — Editorial Intelligence</span>
      </div>
    </section>
  );
};
