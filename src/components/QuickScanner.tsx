import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MinerviniTradeSetup } from '../types';
import { rankSetups } from '../utils/dashboardMetrics';

interface Props {
  open: boolean;
  stocks: MinerviniTradeSetup[];
  onClose: () => void;
  onPick: (stock: MinerviniTradeSetup) => void;
}

/** Ctrl+K stock finder. With nothing typed it lists the setups closest to a buy point. */
export const QuickScanner: React.FC<Props> = ({ open, stocks, onClose, onPick }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return rankSetups(stocks, 8);
    return stocks
      .filter(s => s.ticker.toUpperCase().includes(q) || (s.name || '').toUpperCase().includes(q))
      .sort((a, b) => Number(b.ticker.toUpperCase().startsWith(q)) - Number(a.ticker.toUpperCase().startsWith(q)) || (b.rsRating || 0) - (a.rsRating || 0))
      .slice(0, 8);
  }, [stocks, query]);

  useEffect(() => { if (open) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);
  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, Math.max(0, results.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); onPick(results[active]); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[15vh]" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Find a stock"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#11151c] text-white shadow-2xl"
        onMouseDown={e => e.stopPropagation()} onKeyDown={onKey}
      >
        <input
          ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Type a ticker or company name"
          aria-label="Ticker or company name"
          className="w-full border-b border-white/10 bg-transparent px-5 py-4 text-sm outline-none placeholder:text-slate-500"
        />
        {stocks.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No stocks have loaded yet.</p>
        ) : results.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No stock matches "{query}".</p>
        ) : (
          <ul role="listbox" className="max-h-80 overflow-y-auto py-2">
            {!query.trim() && <li className="px-5 pb-1 text-xs text-slate-500">Closest to a buy point</li>}
            {results.map((s, i) => (
              <li key={`${s.exchange}:${s.ticker}`} role="option" aria-selected={i === active}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { onPick(s); onClose(); }}
                  className={`flex w-full items-center justify-between px-5 py-2.5 text-left text-sm ${i === active ? 'bg-amber-400/15' : ''}`}
                >
                  <span><span className="font-bold">{s.ticker}</span> <span className="text-xs text-slate-500">{s.sector}</span></span>
                  <span className="text-xs tabular-nums text-slate-400">RS {Number.isFinite(s.rsRating as number) ? s.rsRating : '—'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-white/10 px-5 py-2 text-xs text-slate-500">Enter opens the chart. Esc closes.</p>
      </div>
    </div>
  );
};
