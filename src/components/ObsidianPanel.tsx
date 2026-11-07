import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { MinerviniTradeSetup } from '../types';
import { buildFunnel, rankSetups } from '../utils/dashboardMetrics';

interface Status { configured: boolean; connected: boolean; vaultName: string | null }
export type SaveResult = { path: string; status: 'written' | 'updated' | 'skipped'; reason?: string };

const panel = 'rounded-2xl border border-white/10 bg-[#11151c]';
const btn = 'inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition hover:bg-white/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50';

export async function saveToObsidian(apiBaseUrl: string, body: unknown): Promise<SaveResult[]> {
  const r = await fetch(`${apiBaseUrl}/api/obsidian/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.message || `Server answered ${r.status}`);
  return data.results as SaveResult[];
}

export function summarizeSave(results: SaveResult[]): string {
  const ok = results.filter(r => r.status !== 'skipped').length;
  const skipped = results.filter(r => r.status === 'skipped');
  const first = results.find(r => r.status !== 'skipped');
  let msg = ok ? `Saved ${ok} note${ok === 1 ? '' : 's'}${first ? `, for example ${first.path}` : ''}.` : 'Nothing was saved.';
  if (skipped.length) msg += ` Skipped ${skipped.length}: ${skipped[0].reason}.`;
  return msg;
}

export const ObsidianPanel: React.FC<{ apiBaseUrl: string; stocks: MinerviniTradeSetup[]; demoMode: boolean }> = ({ apiBaseUrl, stocks, demoMode }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${apiBaseUrl}/api/obsidian/status`);
      if (!r.ok) throw new Error();
      setStatus(await r.json());
    } catch { setStatus(null); }
  }, [apiBaseUrl]);
  useEffect(() => { if (!demoMode) void load(); }, [demoMode, load]);

  const top = rankSetups(stocks, 8);
  const run = async (kind: 'plans' | 'daily') => {
    setBusy(kind); setMessage(null);
    try {
      const results = await saveToObsidian(apiBaseUrl, { kind, setups: top, funnel: buildFunnel(stocks) });
      setMessage({ ok: true, text: summarizeSave(results) });
    } catch (e: any) { setMessage({ ok: false, text: `Could not save. ${e?.message || ''}`.trim() }); }
    finally { setBusy(null); }
  };

  const connected = Boolean(status?.connected);
  return (
    <section className={`${panel} p-6`} aria-labelledby="obs-title">
      <h2 id="obs-title" className="flex items-center gap-2 text-base font-semibold text-white font-sans not-italic">
        <BookOpen className="h-4 w-4 text-slate-400" aria-hidden /> Obsidian
      </h2>
      {demoMode ? (
        <p className="mt-2 text-sm text-slate-400">Saving to Obsidian is off in demo mode.</p>
      ) : !status ? (
        <p className="mt-2 text-sm text-slate-400">Can’t reach the server, so the vault status is unknown.</p>
      ) : !connected ? (
        <p className="mt-2 text-sm text-slate-400">
          {status.configured
            ? 'The vault folder in OBSIDIAN_VAULT_PATH was not found. Check the path in .env, then restart the server.'
            : 'Not connected. Set OBSIDIAN_VAULT_PATH in .env to your vault folder, then restart the server.'}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-300">Connected to <span className="text-white">{status.vaultName}</span>. Notes go into its Trading folder.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={btn} disabled={busy !== null || top.length === 0} onClick={() => run('plans')}>
              {busy === 'plans' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save top setups as trade plans
            </button>
            <button className={btn} disabled={busy !== null || stocks.length === 0} onClick={() => run('daily')}>
              {busy === 'daily' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save today’s screener summary
            </button>
          </div>
          {top.length === 0 && <p className="mt-3 text-xs text-slate-500">Buttons turn on once the screener has results.</p>}
        </>
      )}
      {message && <p role={message.ok ? 'status' : 'alert'} className={`mt-4 text-sm ${message.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{message.text}</p>}
    </section>
  );
};
