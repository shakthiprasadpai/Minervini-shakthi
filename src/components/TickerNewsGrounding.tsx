import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup } from '../types';
import { Newspaper, Globe, ExternalLink, RefreshCw, Sparkles, TrendingUp, TrendingDown, AlertCircle, Search, ShieldCheck, Tag } from 'lucide-react';

interface TickerNewsGroundingProps {
  stock: MinerviniTradeSetup;
}

interface HeadlineItem {
  title: string;
  source: string;
  date: string;
  snippet: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'CATALYST';
  catalystType: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

interface NewsResponse {
  summary: string;
  headlines: HeadlineItem[];
  groundingSources: GroundingSource[];
  groundingQueries: string[];
}

export const TickerNewsGrounding: React.FC<TickerNewsGroundingProps> = ({ stock }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BULLISH' | 'CATALYST' | 'BEARISH'>('ALL');

  const fetchTickerHeadlines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ticker-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: stock.ticker,
          name: stock.name,
          exchange: stock.exchange,
          sector: stock.sector
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setNewsData(data);
    } catch (err: any) {
      console.error('Failed to fetch ticker news grounding', err);
      setError('Unable to fetch grounded headlines at this moment. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerHeadlines();
  }, [stock.ticker]);

  const filteredHeadlines = newsData?.headlines ? newsData.headlines.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.sentiment === activeFilter;
  }) : [];

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#1a1a1a] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono">
              Google Search Grounding
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">
              Live Catalyst Intelligence
            </span>
          </div>
          <h3 className="text-xl font-serif font-black text-[#1a1a1a] mt-1 flex items-center space-x-2">
            <span>Financial Headlines & Context — {stock.ticker}</span>
          </h3>
          <p className="text-xs font-serif italic text-gray-500 mt-0.5">
            Real-time web headlines grounded by Google Search to explain price consolidation and breakout drivers for {stock.name}.
          </p>
        </div>

        <button
          onClick={fetchTickerHeadlines}
          disabled={loading}
          className="bg-[#1a1a1a] hover:bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer border border-black"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Grounding News...' : 'Refresh Headlines'}</span>
        </button>
      </div>

      {/* Filter Tabs & Grounding Meta Ribbon */}
      {newsData && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-[#f9f8f5] p-3 border border-[#e5e4e1]">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold mr-1">Sentiment Filter:</span>
            {(['ALL', 'BULLISH', 'CATALYST', 'BEARISH'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                  activeFilter === filter
                    ? 'bg-[#1a1a1a] text-white border-black'
                    : 'bg-white text-gray-600 border-[#e5e4e1] hover:bg-gray-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {newsData.groundingQueries && newsData.groundingQueries.length > 0 && (
            <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
              <Search className="w-3 h-3 text-amber-700" />
              <span>Grounded via:</span>
              <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 border border-amber-200/80 font-mono">
                "{newsData.groundingQueries[0]}"
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center space-y-3 bg-[#f9f8f5] border border-[#e5e4e1]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1a1a1a] mx-auto" />
          <p className="text-xs font-mono font-bold text-[#1a1a1a] uppercase tracking-wider">
            Fetching latest Google Search grounded headlines for {stock.ticker}...
          </p>
          <p className="text-xs font-serif italic text-gray-500 max-w-md mx-auto">
            Analyzing current press releases, earnings releases, and Wall Street coverage to evaluate price catalyst alignment.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTickerHeadlines}
            className="underline font-bold text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Headlines Content */}
      {newsData && !loading && (
        <div className="space-y-5">
          
          {/* Executive Catalyst Summary Banner */}
          {newsData.summary && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-none space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-950 font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Price Catalyst Synthesis</span>
              </div>
              <p className="text-xs font-serif text-gray-800 leading-relaxed italic">
                "{newsData.summary}"
              </p>
            </div>
          )}

          {/* Headlines Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHeadlines.map((headline, idx) => {
              const isBullish = headline.sentiment === 'BULLISH';
              const isCatalyst = headline.sentiment === 'CATALYST';
              const isBearish = headline.sentiment === 'BEARISH';

              return (
                <div
                  key={idx}
                  className="bg-[#f9f8f5] border border-[#e5e4e1] p-4 flex flex-col justify-between space-y-3 hover:border-black transition-all shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <span>{headline.source}</span>
                      </span>
                      <span className="text-gray-400">{headline.date}</span>
                    </div>

                    <h4 className="text-sm font-serif font-black text-[#1a1a1a] leading-tight hover:underline">
                      {headline.title}
                    </h4>

                    <p className="text-xs font-sans text-gray-600 leading-normal">
                      {headline.snippet}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#e5e4e1] flex items-center justify-between text-[10px] font-mono">
                    <span className="bg-gray-200 text-gray-800 px-2 py-0.5 font-bold uppercase tracking-wider">
                      {headline.catalystType}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 font-extrabold uppercase tracking-wider flex items-center space-x-1 ${
                        isBullish
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isCatalyst
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isBearish
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}
                    >
                      {isBullish && <TrendingUp className="w-3 h-3 text-emerald-700" />}
                      {isBearish && <TrendingDown className="w-3 h-3 text-rose-700" />}
                      <span>{headline.sentiment}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredHeadlines.length === 0 && (
            <div className="p-6 text-center text-xs font-mono text-gray-500 bg-[#f9f8f5] border border-[#e5e4e1]">
              No headlines match the selected sentiment filter "{activeFilter}".
            </div>
          )}

          {/* Verified Google Search Grounding Sources / Citations */}
          {newsData.groundingSources && newsData.groundingSources.length > 0 && (
            <div className="pt-4 border-t border-[#e5e4e1] space-y-2 font-mono text-xs">
              <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Google Search Grounded Web Sources</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {newsData.groundingSources.map((source, i) => (
                  <a
                    key={i}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#f9f8f5] hover:bg-black hover:text-white text-gray-700 border border-[#e5e4e1] px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 transition-all group"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-amber-400" />
                    <span className="truncate max-w-[260px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
