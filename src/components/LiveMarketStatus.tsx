import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, Radio } from 'lucide-react';

export const LiveMarketStatus: React.FC<{ apiBaseUrl: string; demoMode: boolean; status?: any }> = ({ apiBaseUrl, demoMode, status }) => {
  const [localStatus, setLocalStatus] = useState<any>(status || null);
  useEffect(() => setLocalStatus(status || null), [status]);
  useEffect(() => {
    if (demoMode) return;
    const poll = async () => { try { const r = await fetch(apiBaseUrl + '/api/market/realtime-status'); if (r.ok) setLocalStatus(await r.json()); } catch {} };
    poll(); const id = window.setInterval(poll, 5000); return () => window.clearInterval(id);
  }, [apiBaseUrl, demoMode]);
  if (demoMode) return null;
  const live = Boolean(localStatus?.connected);
  const instruments = Number(localStatus?.instruments || 0);
  const ticks = Number(localStatus?.liveTicks || 0);
  const universe = localStatus?.universeMode || 'AUTO NSE + BSE + MCX';
  return <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
    <div className="rounded-2xl border border-white/10 bg-[#11151c]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${live ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {live ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} /><span className="text-xs font-black tracking-[0.18em] text-white">{live ? 'MARKET LIVE' : 'DISCONNECTED'}</span></div><div className="text-[10px] text-slate-500 mt-0.5">5Paisa Real-Time Market Feed</div></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-[10px] font-bold text-blue-300">NSE</span>
          <span className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-[10px] font-bold text-violet-300">BSE</span>
          <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-[10px] font-bold text-amber-300">MCX</span>
          <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-mono text-slate-300">{instruments.toLocaleString()} instruments</span>
          <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-mono text-slate-300">{ticks.toLocaleString()} ticks</span>
          <a href="/api/5paisa/auth/login" className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${live ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}>{live ? 'Connected' : 'Connect 5Paisa'}</a>
        </div>
      </div>
      <div className="border-t border-white/5 bg-black/20 px-5 py-2 flex items-center justify-between gap-4 text-[9px] uppercase tracking-[0.16em]">
        <span className="text-slate-500 flex items-center gap-2"><Activity className="w-3 h-3" /> Automatic Universe: <b className="text-slate-300">{universe}</b></span>
        <span className="text-slate-600 flex items-center gap-2"><Radio className="w-3 h-3" /> Minervini engine on live ticks</span>
      </div>
    </div>
  </section>;
};
