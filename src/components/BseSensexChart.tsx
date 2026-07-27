import React, { useState } from 'react';
import { TrendingUp, BarChart2, ShieldCheck, Calendar, Activity } from 'lucide-react';

export const BseSensexChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('1M');

  // Simulated historical data points for BSE Sensex (30 trading sessions)
  const basePrice = 78500;
  const rawData = [
    78200, 78350, 78100, 78420, 78600, 78550, 78800, 78750, 78920, 79100,
    78950, 79220, 79400, 79350, 79550, 79480, 79700, 79650, 79820, 79850
  ];

  const minPrice = Math.min(...rawData);
  const maxPrice = Math.max(...rawData);
  const priceRange = maxPrice - minPrice || 1;

  // SVG dimensions
  const width = 600;
  const height = 180;
  const padding = 20;

  const points = rawData.map((val, idx) => {
    const x = padding + (idx / (rawData.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minPrice) / priceRange) * (height - padding * 2);
    return { x, y, val };
  });

  const pathString = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
  const areaString = `${pathString} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const latestVal = rawData[rawData.length - 1];
  const prevVal = rawData[0];
  const changePct = (((latestVal - prevVal) / prevVal) * 100).toFixed(2);
  const isPositive = Number(changePct) >= 0;

  return (
    <div className="bg-[#141414] border border-amber-500/30 p-5 rounded space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-amber-400 text-black flex items-center justify-center font-bold text-sm shadow">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                BSE Index Analytics &bull; Bombay Stock Exchange
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-1.5 py-0.2 uppercase font-bold">
                Live Feed
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white">BSE SENSEX Performance Chart</h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-black/50 p-1 border border-white/10 font-mono text-xs">
          {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 font-bold transition-all ${
                timeframe === tf ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs bg-white/5 p-3 border border-white/10">
        <div>
          <span className="text-gray-400 uppercase text-[10px] block">Current Sensex Level</span>
          <span className="text-lg font-bold text-white">{latestVal.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-400 uppercase text-[10px] block">Period Return ({timeframe})</span>
          <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{changePct}%
          </span>
        </div>
        <div>
          <span className="text-gray-400 uppercase text-[10px] block">52-Wk Range & Support</span>
          <span className="text-white font-bold">72,400 &bull; 81,200</span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative bg-black/40 border border-white/10 p-3 rounded">
        <div className="absolute top-3 left-3 text-[10px] font-mono text-gray-400">
          Range: {minPrice.toLocaleString()} - {maxPrice.toLocaleString()}
        </div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible pt-4">
          <defs>
            <linearGradient id="sensexGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={padding} y1={height / 4} x2={width - padding} y2={height / 4} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padding} y1={(height * 3) / 4} x2={width - padding} y2={(height * 3) / 4} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

          {/* Area under curve */}
          <path d={areaString} fill="url(#sensexGradient)" />

          {/* Main Line */}
          <path d={pathString} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx === points.length - 1 ? 4 : 2}
              fill={idx === points.length - 1 ? '#ffffff' : '#fbbf24'}
              stroke="#000000"
              strokeWidth="1.5"
            />
          ))}
        </svg>

        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-2 pt-2 border-t border-white/10">
          <span>Start: 30 Sessions Ago</span>
          <span className="text-amber-400 font-bold">BSE Trend: Bullish Accumulation Phase</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};
