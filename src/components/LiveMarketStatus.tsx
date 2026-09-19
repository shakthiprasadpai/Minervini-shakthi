import React, { useEffect, useState } from 'react';
export const LiveMarketStatus: React.FC<{ apiBaseUrl: string; demoMode: boolean; status?: any }> = ({ apiBaseUrl, demoMode, status }) => {
  const [localStatus, setLocalStatus] = useState<any>(status || null);
  useEffect(() => setLocalStatus(status || null), [status]);
  useEffect(() => { if (demoMode) return; const poll = async () => { try { const r = await fetch(apiBaseUrl + '/api/market/realtime-status'); if (r.ok) setLocalStatus(await r.json()); } catch {} }; poll(); const id = window.setInterval(poll, 5000); return () => window.clearInterval(id); }, [apiBaseUrl, demoMode]);
  if (demoMode) return null;
  const live = Boolean(localStatus?.connected);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3"><div className="flex items-center justify-between border border-[#e5e4e1] bg-white px-4 py-2 text-xs shadow-xs"><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span><span className="font-bold uppercase tracking-wider">{live ? 'LIVE' : 'DISCONNECTED'}</span><span className="text-gray-500">5Paisa • NSE + BSE</span></div><div className="flex items-center gap-4 font-mono text-[10px] text-gray-500"><span>{localStatus?.instruments || 0} instruments</span><span>{localStatus?.liveTicks || 0} live ticks</span><a className="font-bold text-[#1a1a1a] hover:underline" href="/api/5paisa/auth/login">Connect</a></div></div></div>;
};
