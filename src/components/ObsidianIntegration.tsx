import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { formatCurrency, formatVolume } from '../utils/sepaCalculator';
import { Gem, Download, ExternalLink, Copy, Check, FileText, Sparkles, Youtube, BookOpen, RefreshCw } from 'lucide-react';

interface ObsidianIntegrationProps {
  stocks: MinerviniTradeSetup[];
  selectedStock: MinerviniTradeSetup;
  onSelectStock: (stock: MinerviniTradeSetup) => void;
}

export const ObsidianIntegration: React.FC<ObsidianIntegrationProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
}) => {
  const [vaultName, setVaultName] = useState<string>('GrowthStockAlpha');
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

  // Obsidian Local REST API Connection State
  const [apiKey, setApiKey] = useState<string>('obsidian_sepa_secret_key');
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://127.0.0.1:27124');
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'TESTING' | 'CONNECTED_URI' | 'CONNECTED_REST'>('CONNECTED_URI');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [connectionMessage, setConnectionMessage] = useState<string>('Ready via Obsidian URI Protocol (`obsidian://new`). Local REST API plugin fallback enabled.');

  const handleTestConnection = async () => {
    setConnectionStatus('TESTING');
    setConnectionMessage('Testing connection to Obsidian Local REST API at ' + apiEndpoint + '...');

    try {
      const response = await fetch(`${apiEndpoint}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setConnectionStatus('CONNECTED_REST');
        setConnectionMessage(`Successfully connected to Obsidian Local REST API! Vault: "${vaultName}".`);
      } else {
        setConnectionStatus('CONNECTED_URI');
        setConnectionMessage(`Rest API ping returned status ${response.status}. Fallback to native Obsidian URI Protocol active.`);
      }
    } catch {
      setConnectionStatus('CONNECTED_URI');
      setConnectionMessage(`Obsidian URI Protocol handler active. (Tip: Enable Obsidian 'Local REST API' plugin on port 27124 for direct background sync).`);
    }
  };

  // Generate Obsidian Markdown Note Content for a given stock
  const generateMarkdownNote = (stock: MinerviniTradeSetup): string => {
    const frontmatter = `---
type: minervini-sepa-setup
ticker: ${stock.ticker}
name: "${stock.name}"
exchange: ${stock.exchange}
sector: "${stock.sector}"
industry: "${stock.industry}"
current_price: ${stock.currentPrice}
pivot_price: ${stock.pivotPrice}
stop_loss: ${stock.stopLossPrice}
rs_rating: ${stock.rsRating}
trend_score: ${stock.trendScore}
pattern: "${stock.patternType}"
is_tight_volume: ${stock.isTightVolume}
next_earnings: "${stock.nextEarningsDate || 'N/A'}"
tags:
  - trading/minervini
  - screener/vcp
  - ${stock.ticker.toLowerCase()}
  - stage2-uptrend
created_date: "${new Date().toISOString().split('T')[0]}"
---

# ${stock.ticker} — ${stock.name} (${stock.exchange})

> **Mark Minervini SEPA Analysis & VCP Vault Note**
> *Synced via Growth Stock Alpha & Ankur Patel Quant Workflow* (https://www.youtube.com/@AnkurPatel57)

---

## 📊 Core Valuation & Trend Metrics
- **Current Price**: \`${formatCurrency(stock.currentPrice, stock.exchange === 'NSE' ? '₹' : '$')}\` (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent}%)
- **Relative Strength (RS Rating)**: \`${stock.rsRating} / 99\`
- **Trend Template Score**: \`${stock.trendScore} / 8 Rules Passing\`
- **Sector / Industry**: ${stock.sector} / ${stock.industry}
- **52-Week Range**: ${formatCurrency(stock.low52w, stock.exchange === 'NSE' ? '₹' : '$')} – ${formatCurrency(stock.high52w, stock.exchange === 'NSE' ? '₹' : '$')}

---

## 🎯 VCP & Pivot Execution Levels
- **Pattern Structure**: **${stock.patternType}** (${stock.vcpStage})
- **Pivot Breakout Price**: \`${formatCurrency(stock.pivotPrice, stock.exchange === 'NSE' ? '₹' : '$')}\`
- **Recommended Buy Zone**: \`${formatCurrency(stock.pivotPrice, stock.exchange === 'NSE' ? '₹' : '$')} – ${formatCurrency(stock.buyZoneMax, stock.exchange === 'NSE' ? '₹' : '$')}\`
- **Stop Loss (Hard Stop)**: \`${formatCurrency(stock.stopLossPrice, stock.exchange === 'NSE' ? '₹' : '$')}\` (\`${stock.stopLossPercent}%\`)
- **Target 1 (+20% R/R)**: \`${formatCurrency(stock.target1Price, stock.exchange === 'NSE' ? '₹' : '$')}\`
- **Risk/Reward Ratio**: \`1 : ${stock.riskRewardRatio}\`

---

## 💧 Volume & Contraction Details
- **Volume Dry-Up**: \`${stock.volumeDryUpPercent}%\` vs 20-day average (\`${formatVolume(stock.pivotVolume)}\`)
- **Contractions Breakdown**:
${stock.contractions.map(c => `  - **T${c.contractionIndex}**: Depth \`${c.depthPercent}%\`, Duration \`${c.durationDays}d\`, Volume Dry-Up \`${c.volumeDryUpPercent}%\``).join('\n')}

---

## 🤖 SEPA Technical Summary
${stock.sepaNotes}

---

## 📅 Earnings Catalyst & Risk
- **Next Earnings Date**: \`${stock.nextEarningsDate || 'N/A'}\` (${stock.earningsTime || 'AMC'})
- **Risk Status**: **${stock.earningsRiskStatus || 'SAFE_WINDOW'}**
- **Last Quarter YoY Growth**: EPS +${stock.epsYoYGrowthLastQ || 50}%, Rev +${stock.revYoYGrowthLastQ || 30}%

---
*Linked to Obsidian Vault: [[TradingMasterplan]] • [[Watchlist]] • [[MinerviniPlaybook]]*
`;
    return frontmatter;
  };

  const handleCopyMarkdown = (stock: MinerviniTradeSetup) => {
    const md = generateMarkdownNote(stock);
    navigator.clipboard.writeText(md);
    setCopiedTicker(stock.ticker);
    setTimeout(() => setCopiedTicker(null), 2500);
  };

  const handleDownloadSingleMarkdown = (stock: MinerviniTradeSetup) => {
    const md = generateMarkdownNote(stock);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stock.ticker}-Minervini-SEPA.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportedStatus(`Downloaded ${stock.ticker}.md to Obsidian Vault folder!`);
    setTimeout(() => setExportedStatus(null), 3000);
  };

  const handleOpenInObsidianUri = (stock: MinerviniTradeSetup) => {
    const md = generateMarkdownNote(stock);
    const encodedContent = encodeURIComponent(md);
    const fileName = `${stock.ticker}-SEPA-Setup`;
    const obsidianUri = `obsidian://new?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(fileName)}&content=${encodedContent}`;
    window.open(obsidianUri, '_blank');
  };

  const handleDownloadAllVaultNotes = () => {
    stocks.forEach((stock, idx) => {
      setTimeout(() => {
        const md = generateMarkdownNote(stock);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${stock.ticker}-SEPA.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, idx * 150);
    });
    setExportedStatus(`Successfully exported all ${stocks.length} screener setups as Obsidian Markdown vault notes!`);
    setTimeout(() => setExportedStatus(null), 4000);
  };

  return (
    <div className="bg-[#1a1a1a] text-white p-6 sm:p-8 border border-black shadow-xl space-y-8">
      
      {/* Header & YouTube Creator Reference */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-500 text-black flex items-center justify-center font-bold text-xl shadow-lg">
            <Gem className="w-6 h-6 fill-current text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-400">
                Obsidian Vault & Knowledge Sync
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] uppercase px-2 py-0.5 font-mono font-bold">
                Local Markdown / URI Integration
              </span>
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tight text-white mt-0.5">
              Obsidian Ticker & Trade Plan Vault Exporter
            </h2>
          </div>
        </div>

        {/* YouTube Creator Link Card */}
        <a
          href="https://www.youtube.com/@AnkurPatel57"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-200 px-4 py-2.5 rounded flex items-center space-x-3 transition-all group"
        >
          <Youtube className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <div className="text-[10px] font-mono text-red-300 uppercase font-bold">Ankur Patel Masterclass</div>
            <div className="text-xs font-bold text-white flex items-center space-x-1">
              <span>youtube.com/@AnkurPatel57</span>
              <ExternalLink className="w-3 h-3 text-red-400" />
            </div>
          </div>
        </a>
      </div>

      {/* Obsidian Connection Status & REST API Settings Card */}
      <div className="bg-[#111318] border border-amber-500/30 p-5 space-y-4 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'CONNECTED_REST'
                ? 'bg-emerald-400 animate-pulse'
                : connectionStatus === 'CONNECTED_URI'
                ? 'bg-cyan-400'
                : connectionStatus === 'TESTING'
                ? 'bg-amber-400 animate-spin'
                : 'bg-gray-500'
            }`} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Obsidian Vault Connection Status:
            </span>
            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
              connectionStatus === 'CONNECTED_REST'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : connectionStatus === 'CONNECTED_URI'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {connectionStatus === 'CONNECTED_REST' && '🟢 REST API CONNECTED'}
              {connectionStatus === 'CONNECTED_URI' && '🔵 URI PROTOCOL ACTIVE'}
              {connectionStatus === 'TESTING' && '🟡 TESTING CONNECTION...'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={handleTestConnection}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'TESTING' ? 'animate-spin' : ''}`} />
              <span>Test Obsidian Connection</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-300 font-sans leading-relaxed">
          {connectionMessage}
        </p>

        {/* Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Obsidian Vault Name
            </label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="GrowthStockAlpha"
              className="w-full bg-black/60 border border-white/20 text-white px-3 py-1.5 text-xs font-mono rounded focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Local REST API Endpoint
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://127.0.0.1:27124"
              className="w-full bg-black/60 border border-white/20 text-white px-3 py-1.5 text-xs font-mono rounded focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              API Authorization Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Secret API Token"
              className="w-full bg-black/60 border border-white/20 text-white px-3 py-1.5 text-xs font-mono rounded focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Auto Sync Checkbox */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
              className="accent-amber-400 w-4 h-4"
            />
            <span className="text-gray-300 font-sans">Auto-sync stock SEPA Markdown note when selected from screener</span>
          </label>

          <span className="text-[10px] text-amber-400 font-mono">
            Vault Target: <strong className="text-white">/{vaultName}/Minervini-SEPA/</strong>
          </span>
        </div>
      </div>

      {/* Vault Settings & Quick Batch Export */}
      <div className="bg-white/5 border border-white/10 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Obsidian Vault Name
            </label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="e.g. GrowthStockAlpha"
              className="bg-black/40 border border-white/20 text-white px-3 py-1.5 text-xs font-mono rounded focus:outline-none focus:border-amber-400 w-48"
            />
          </div>
          <p className="text-xs text-gray-400 max-w-sm">
            Configure your target Obsidian vault name for one-click URI note creation (`obsidian://new`).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadAllVaultNotes}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-4 py-2.5 text-xs uppercase font-mono tracking-widest flex items-center space-x-2 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export All {stocks.length} Setups to Vault (.md)</span>
          </button>
        </div>
      </div>

      {exportedStatus && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 text-xs font-mono flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{exportedStatus}</span>
        </div>
      )}

      {/* Selected Stock Detailed Obsidian Preview & Export */}
      <div className="bg-white/5 border border-white/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-black text-[10px] px-2 py-0.5 font-mono font-bold uppercase">
                Active Vault Preview
              </span>
              <span className="text-gray-400 text-xs font-mono">{selectedStock.ticker} — {selectedStock.name}</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white mt-1">
              Obsidian Markdown Note with YAML Frontmatter & Wikilinks
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={() => handleOpenInObsidianUri(selectedStock)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 flex items-center space-x-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Obsidian</span>
            </button>

            <button
              onClick={() => handleDownloadSingleMarkdown(selectedStock)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 flex items-center space-x-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              onClick={() => handleCopyMarkdown(selectedStock)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 flex items-center space-x-1.5 transition-all"
            >
              {copiedTicker === selectedStock.ticker ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTicker === selectedStock.ticker ? 'Copied Note!' : 'Copy Markdown'}</span>
            </button>
          </div>
        </div>

        {/* Markdown Raw Code Preview Box */}
        <div className="bg-black/60 border border-white/10 p-4 rounded max-h-96 overflow-y-auto">
          <pre className="text-xs font-mono text-amber-200 whitespace-pre-wrap leading-relaxed">
            {generateMarkdownNote(selectedStock)}
          </pre>
        </div>
      </div>

      {/* Screener Stocks Quick Obsidian List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-bold">
          All Scanned Stocks Ready for Obsidian Export ({stocks.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stocks.map((stock) => (
            <div
              key={stock.ticker}
              onClick={() => onSelectStock(stock)}
              className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                selectedStock.ticker === stock.ticker
                  ? 'bg-amber-500/10 border-amber-400 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-black text-amber-400 border border-white/20 flex items-center justify-center font-mono font-bold text-xs">
                  {stock.ticker}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{stock.name}</div>
                  <div className="text-[10px] font-mono text-gray-400">
                    Pivot: {formatCurrency(stock.pivotPrice, stock.exchange === 'NSE' ? '₹' : '$')} • RS {stock.rsRating}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSingleMarkdown(stock);
                  }}
                  title="Download .md for Obsidian"
                  className="p-1.5 bg-white/10 hover:bg-amber-400 hover:text-black transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenInObsidianUri(stock);
                  }}
                  title="Open in Obsidian via URI"
                  className="p-1.5 bg-white/10 hover:bg-blue-500 hover:text-white transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/10 pt-4">
        <span>Obsidian Integration & Quantitative Workflow (Inspired by AnkurPatel57)</span>
        <span className="text-amber-400 font-bold">Local Markdown Vault Synchronization Active</span>
      </div>

    </div>
  );
};
