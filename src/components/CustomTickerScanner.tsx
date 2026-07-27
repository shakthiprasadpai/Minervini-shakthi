import React, { useState } from 'react';
import { MinerviniTradeSetup } from '../types';
import { evaluateTrendTemplate, calculatePositionSize, formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import { SlidersHorizontal, PlusCircle, CheckCircle2, ShieldAlert, Target, Droplets } from 'lucide-react';

interface CustomTickerScannerProps {
  onAddStock: (stock: MinerviniTradeSetup) => void;
}

export const CustomTickerScanner: React.FC<CustomTickerScannerProps> = ({ onAddStock }) => {
  const [ticker, setTicker] = useState<string>('AMD');
  const [name, setName] = useState<string>('Advanced Micro Devices');
  const [exchange, setExchange] = useState<'NASDAQ' | 'NYSE' | 'NSE'>('NASDAQ');
  const [sector, setSector] = useState<string>('Technology');
  const [industry, setIndustry] = useState<string>('Semiconductors');
  const [price, setPrice] = useState<number>(175.50);
  const [sma50, setSma50] = useState<number>(160.20);
  const [sma150, setSma150] = useState<number>(145.00);
  const [sma200, setSma200] = useState<number>(132.80);
  const [sma200_1mo, setSma200_1mo] = useState<number>(128.00);
  const [high52, setHigh52] = useState<number>(184.00);
  const [low52, setLow52] = useState<number>(95.00);
  const [rsRating, setRsRating] = useState<number>(91);
  
  const [pivotPrice, setPivotPrice] = useState<number>(178.00);
  const [stopLossPrice, setStopLossPrice] = useState<number>(166.50);
  const [avgVol20, setAvgVol20] = useState<number>(35000000);
  const [pivotVol, setPivotVol] = useState<number>(1120000); // Tight volume dry-up!

  const currencySymbol = getCurrencySymbol(exchange);

  // Evaluate Trend Template Rules
  const { rules, passedCount } = evaluateTrendTemplate({
    currentPrice: price,
    sma50,
    sma150,
    sma200,
    sma200_1mo_ago: sma200_1mo,
    high52w: high52,
    low52w: low52,
    rsRating
  });

  const stopLossPct = ((pivotPrice - stopLossPrice) / pivotPrice) * 100;
  const target1P = pivotPrice * 1.20;
  const target2P = pivotPrice * 1.35;
  const rrRatio = stopLossPct > 0 ? 20 / stopLossPct : 0;
  const volDryUpPct = avgVol20 > 0 ? (((pivotVol - avgVol20) / avgVol20) * 100) : 0;
  const isTight = volDryUpPct < -40;

  const handleCreateAndAdd = () => {
    const newStock: MinerviniTradeSetup = {
      ticker: ticker.toUpperCase(),
      name,
      exchange,
      sector,
      industry,
      currentPrice: price,
      changePercent: 1.2,
      sma50,
      sma150,
      sma200,
      sma200_1mo_ago: sma200_1mo,
      high52w: high52,
      low52w: low52,
      rsRating,
      patternType: 'VCP (3 Contractions)',
      vcpStage: 'Breakout Pending',
      trendScore: passedCount,
      avgVolume20d: avgVol20,
      pivotVolume: pivotVol,
      volumeDryUpPercent: Number(volDryUpPct.toFixed(1)),
      isTightVolume: isTight,
      pivotPrice,
      buyZoneMax: Number((pivotPrice * 1.02).toFixed(2)),
      stopLossPrice,
      stopLossPercent: Number(stopLossPct.toFixed(2)),
      target1Price: Number(target1P.toFixed(2)),
      target1Percent: 20,
      target2Price: Number(target2P.toFixed(2)),
      target2Percent: 35,
      riskRewardRatio: Number(rrRatio.toFixed(2)),
      contractions: [
        { contractionIndex: 1, depthPercent: 18.0, durationDays: 14, volumeDryUpPercent: -20, startDate: '2026-06-01', endDate: '2026-06-15', highPrice: high52, lowPrice: high52 * 0.82 },
        { contractionIndex: 2, depthPercent: 8.0, durationDays: 8, volumeDryUpPercent: -45, startDate: '2026-06-16', endDate: '2026-06-24', highPrice: pivotPrice * 0.98, lowPrice: pivotPrice * 0.90 },
        { contractionIndex: 3, depthPercent: 3.2, durationDays: 4, volumeDryUpPercent: Number(volDryUpPct.toFixed(0)), startDate: '2026-06-25', endDate: '2026-06-29', highPrice: pivotPrice, lowPrice: stopLossPrice }
      ],
      priceHistory: [], // will auto generate in app state
      sepaNotes: `Custom setup created for ${ticker}. SEPA Score: ${passedCount}/8. Volume dry-up: ${volDryUpPct.toFixed(1)}%.`
    };

    onAddStock(newStock);
  };

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e4e1] pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">Custom Analysis</span>
          <h3 className="text-xl font-serif font-black text-[#1a1a1a] leading-tight mt-0.5">
            SEPA Quantitative Level & Setup Tester
          </h3>
          <p className="text-xs font-serif italic text-gray-500 mt-0.5">
            Audit any symbol against Mark Minervini's 8 Trend Template rules and calculate risk/reward levels
          </p>
        </div>

        <button
          id="btn-add-custom-stock"
          onClick={handleCreateAndAdd}
          className="bg-[#1a1a1a] hover:bg-[#333333] text-white font-bold text-xs uppercase tracking-[0.15em] px-4 py-2.5 flex items-center space-x-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add To Screener</span>
        </button>
      </div>

      {/* Main Grid: Inputs Left, Live Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Row 1: Stock Identity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f9f8f5] p-4 border border-[#e5e4e1] text-xs">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#b5a68d] font-bold mb-1">Symbol</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono uppercase font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#b5a68d] font-bold mb-1">Exchange</label>
              <select
                value={exchange}
                onChange={(e: any) => setExchange(e.target.value)}
                className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
              >
                <option value="NASDAQ">NASDAQ</option>
                <option value="NYSE">NYSE</option>
                <option value="NSE">NSE (India)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#b5a68d] font-bold mb-1">Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Price & Moving Averages */}
          <div className="bg-[#f9f8f5] p-4 border border-[#e5e4e1] text-xs space-y-3">
            <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-[0.2em] border-b border-[#e5e4e1] pb-2">
              Price & Moving Averages ({currencySymbol})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">Current Stock Price</label>
                <input
                  type="number"
                  step="0.1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-bold font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">50-day SMA</label>
                <input
                  type="number"
                  step="0.1"
                  value={sma50}
                  onChange={(e) => setSma50(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">150-day SMA</label>
                <input
                  type="number"
                  step="0.1"
                  value={sma150}
                  onChange={(e) => setSma150(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">200-day SMA</label>
                <input
                  type="number"
                  step="0.1"
                  value={sma200}
                  onChange={(e) => setSma200(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">200 SMA (1 Mo Ago)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sma200_1mo}
                  onChange={(e) => setSma200_1mo(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">RS Rating (1-99)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={rsRating}
                  onChange={(e) => setRsRating(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-bold font-mono focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: 52W High/Low & Volume Dry-Up */}
          <div className="bg-[#f9f8f5] p-4 border border-[#e5e4e1] text-xs space-y-3">
            <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-[0.2em] border-b border-[#e5e4e1] pb-2">
              52-Week Range & Volume Contraction Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">52-Week High</label>
                <input
                  type="number"
                  step="0.1"
                  value={high52}
                  onChange={(e) => setHigh52(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">52-Week Low</label>
                <input
                  type="number"
                  step="0.1"
                  value={low52}
                  onChange={(e) => setLow52(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">Pivot Entry Price</label>
                <input
                  type="number"
                  step="0.1"
                  value={pivotPrice}
                  onChange={(e) => setPivotPrice(Number(e.target.value))}
                  className="w-full bg-white border border-black p-1.5 text-[#1a1a1a] font-bold font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">Stop Loss Exit</label>
                <input
                  type="number"
                  step="0.1"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  className="w-full bg-white border border-red-300 p-1.5 text-red-700 font-bold font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">20D Avg Volume</label>
                <input
                  type="number"
                  value={avgVol20}
                  onChange={(e) => setAvgVol20(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-mono">Pivot Vol (Tight Vol)</label>
                <input
                  type="number"
                  value={pivotVol}
                  onChange={(e) => setPivotVol(Number(e.target.value))}
                  className="w-full bg-white border border-[#e5e4e1] p-1.5 text-[#1a1a1a] font-mono font-bold focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Output Dashboard (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Trend Template Score Card */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#e5e4e1] pb-3">
              <span className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-[0.2em]">
                Minervini Stage 2 Score
              </span>
              <span
                className={`px-3 py-1 text-xs font-bold border uppercase tracking-wider ${
                  passedCount === 8
                    ? 'bg-[#1a1a1a] text-white border-black'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                {passedCount} / 8 QUALIFIED
              </span>
            </div>

            {/* Rules Quick Checklist */}
            <div className="space-y-2 text-[11px]">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1 border-b border-[#e5e4e1]">
                  <span className="text-gray-600 truncate max-w-[200px]">{r.title}</span>
                  {r.passed ? (
                    <span className="text-green-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASS</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold">FAIL</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Trade Execution Levels Output */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 space-y-3">
            <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-[0.2em] border-b border-[#e5e4e1] pb-3">
              Calculated Levels ({ticker})
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-white p-3 border border-[#e5e4e1]">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Pivot Entry:</span>
                <strong className="text-[#1a1a1a] text-base font-bold">
                  {formatCurrency(pivotPrice, currencySymbol)}
                </strong>
              </div>

              <div className="bg-white p-3 border border-red-200">
                <span className="text-[10px] text-red-700 block uppercase tracking-wider">Stop Exit:</span>
                <strong className="text-red-600 text-base font-bold">
                  {formatCurrency(stopLossPrice, currencySymbol)} (-{stopLossPct.toFixed(1)}%)
                </strong>
              </div>

              <div className="bg-white p-3 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block uppercase tracking-wider">Target 1 (+20%):</span>
                <strong className="text-emerald-800 text-base font-bold">
                  {formatCurrency(target1P, currencySymbol)}
                </strong>
              </div>

              <div className="bg-white p-3 border border-[#e5e4e1]">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Tight Vol Dry-Up:</span>
                <strong className={isTight ? 'text-[#1a1a1a] text-base font-bold' : 'text-gray-500 text-base'}>
                  {volDryUpPct.toFixed(1)}%
                </strong>
              </div>
            </div>

            <div className="bg-[#1a1a1a] text-white p-3 text-xs flex justify-between items-center border border-black font-mono">
              <span className="text-[#b5a68d] uppercase tracking-wider text-[10px] font-bold">Risk/Reward Ratio:</span>
              <strong className="text-white text-base font-bold">
                {rrRatio.toFixed(2)} : 1
              </strong>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

