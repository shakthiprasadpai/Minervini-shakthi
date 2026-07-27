import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateTrendTemplate } from '../utils/sepaCalculator';
import { Copy, Check, Download, Code, ExternalLink, ShieldCheck, Sparkles, Terminal, X, Play } from 'lucide-react';

interface PineScriptExporterProps {
  stock?: MinerviniTradeSetup;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PINE_SCRIPT_CODE = `//@version=5
indicator("Mark Minervini Trend Template", overlay=true)

// --- Inputs ---
showTable = input.bool(true, "Show Checklist Table", group="Display Settings")
tablePosition = input.string("Top Right", "Table Position", options=["Top Right", "Bottom Right", "Top Left"], group="Display Settings")

// --- Moving Averages ---
sma50  = ta.sma(close, 50)
sma150 = ta.sma(close, 150)
sma200 = ta.sma(close, 200)

// --- 52-Week High & Low ---
high52 = ta.highest(high, 252)
low52  = ta.lowest(low, 252)

// --- 200 SMA Slope (Trending Up for at least 1 month / 20 bars) ---
sma200_20ago = sma200[20]
sma200_rising = sma200 > sma200_20ago

// --- Minervini 8 Trend Template Rules ---
rule1 = close > sma150 and close > sma200               // Price > 150 & 200 SMA
rule2 = sma150 > sma200                                 // 150 SMA > 200 SMA
rule3 = sma200_rising                                   // 200 SMA Trending Up
rule4 = sma50 > sma150 and sma50 > sma200               // 50 SMA > 150 & 200 SMA
rule5 = close > sma50                                   // Price > 50 SMA
rule6 = close >= (low52 * 1.30)                         // Price >= 30% above 52W Low
rule7 = close >= (high52 * 0.75)                        // Price within 25% of 52W High

// Combine all technical rules
minervini_pass = rule1 and rule2 and rule3 and rule4 and rule5 and rule6 and rule7

// --- Plot Moving Averages ---
plot(sma50,  "50 SMA",  color=color.blue,   linewidth=2)
plot(sma150, "150 SMA", color=color.orange, linewidth=2)
plot(sma200, "200 SMA", color=color.red,    linewidth=2)

// Highlight chart background when stock is in Stage 2 Uptrend
bgcolor(minervini_pass ? color.new(color.green, 90) : na)

// --- On-Screen Status Table ---
var table_pos = tablePosition == "Top Right" ? position.top_right : tablePosition == "Bottom Right" ? position.bottom_right : position.top_left
var statusTable = table.new(table_pos, 2, 8, bgcolor=color.new(color.black, 20), border_width=1)

if barstate.islast and showTable
    table.cell(statusTable, 0, 0, "Minervini Criteria", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 0, "Status",             text_color=color.white, text_size=size.small)
    
    table.cell(statusTable, 0, 1, "Price > 150 & 200 SMA", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 1, rule1 ? "PASS" : "FAIL", text_color=rule1 ? color.green : color.red, text_size=size.small)

    table.cell(statusTable, 0, 2, "150 SMA > 200 SMA", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 2, rule2 ? "PASS" : "FAIL", text_color=rule2 ? color.green : color.red, text_size=size.small)

    table.cell(statusTable, 0, 3, "200 SMA Trending Up", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 3, rule3 ? "PASS" : "FAIL", text_color=rule3 ? color.green : color.red, text_size=size.small)

    table.cell(statusTable, 0, 4, "50 SMA > 150 & 200 SMA", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 4, rule4 ? "PASS" : "FAIL", text_color=rule4 ? color.green : color.red, text_size=size.small)

    table.cell(statusTable, 0, 5, "Price > 50 SMA", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 5, rule5 ? "PASS" : "FAIL", text_color=rule5 ? color.green : color.red, text_size=size.small)

    table.cell(statusTable, 0, 6, ">= 30% Above 52W Low", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 6, rule6 ? "PASS" : "FAIL", text_color=rule6 ? color.green : color.red, text_size=size.small)

    table.cell(statusTable, 0, 7, "Within 25% of 52W High", text_color=color.white, text_size=size.small)
    table.cell(statusTable, 1, 7, rule7 ? "PASS" : "FAIL", text_color=rule7 ? color.green : color.red, text_size=size.small)`;

export const PineScriptExporter: React.FC<PineScriptExporterProps> = ({
  stock,
  isOpen = false,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PINE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([PINE_SCRIPT_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mark_Minervini_Trend_Template.pine';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const evaluation = stock ? evaluateTrendTemplate(stock) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e1117] text-[#e2e8f0] border border-[#2d3748] w-full max-w-4xl shadow-2xl rounded-none my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-[#161b22] px-6 py-4 border-b border-[#2d3748] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
              v5
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400 block">
                TradingView Pine Script v5
              </span>
              <h3 className="text-lg font-serif font-black text-white leading-tight">
                Mark Minervini Trend Template Indicator Code
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Pine Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white border border-gray-600 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download .pine</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-sans">
          
          {/* Quick Context & Installation Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block font-bold">
                1. Copy Script
              </span>
              <p className="text-gray-300 font-serif italic">
                Click "Copy Pine Code" above to copy the complete TradingView v5 script to your clipboard.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block font-bold">
                2. Open TradingView
              </span>
              <p className="text-gray-300 font-serif italic">
                Open TradingView chart &gt; Click <strong className="text-amber-300 font-mono">Pine Editor</strong> at the bottom toolbar.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block font-bold">
                3. Save & Apply
              </span>
              <p className="text-gray-300 font-serif italic">
                Paste code, click <strong className="text-emerald-400 font-mono">Save</strong>, and then click <strong className="text-emerald-400 font-mono">Add to Chart</strong>.
              </p>
            </div>
          </div>

          {/* Current Stock Live Pass/Fail against Pine Script Rules */}
          {stock && evaluation && (
            <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Live Test on Stock: {stock.ticker} ({stock.name})</span>
                </span>
                <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                  evaluation.passedCount >= 7 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  PineScript Test Score: {evaluation.passedCount}/8 Rules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                {evaluation.rules.slice(0, 7).map((rule, idx) => (
                  <div
                    key={rule.id}
                    className={`p-2 border flex items-center justify-between ${
                      rule.passed
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                    }`}
                  >
                    <span className="truncate pr-1">R{idx + 1}: {rule.title.replace(/^\d+\.\s*/, '')}</span>
                    <strong className={`font-mono text-[10px] px-1.5 py-0.5 ${
                      rule.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {rule.passed ? 'PASS' : 'FAIL'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Viewer Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold">Pine Script v5 Source Code</span>
              </span>
              <span>Language: TradingView PineScript v5</span>
            </div>

            <div className="relative bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed shadow-inner selection:bg-amber-500 selection:text-black">
              <pre className="whitespace-pre">{PINE_SCRIPT_CODE}</pre>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#161b22] px-6 py-3 border-t border-[#2d3748] flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Mark Minervini SEPA Architecture • Stage 2 Trend Template</span>
          <a
            href="https://www.tradingview.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline flex items-center space-x-1"
          >
            <span>Open TradingView</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
