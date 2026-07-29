import React, { useState } from 'react';
import {
  Play,
  Video,
  Clock,
  BookOpen,
  CheckCircle2,
  Zap,
  Target,
  ArrowRight,
  ShieldAlert,
  Award,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { MinerviniVideoLesson, MinerviniTradeSetup } from '../types';
import { MINERVINI_VIDEO_LESSONS } from '../data/mockVideos';

interface MinerviniVideoMasterclassProps {
  stocks: MinerviniTradeSetup[];
  onSelectStock: (stock: MinerviniTradeSetup) => void;
  onViewChart?: (stock: MinerviniTradeSetup) => void;
}

export const MinerviniVideoMasterclass: React.FC<MinerviniVideoMasterclassProps> = ({
  stocks,
  onSelectStock,
  onViewChart
}) => {
  const [activeLesson, setActiveLesson] = useState<MinerviniVideoLesson>(MINERVINI_VIDEO_LESSONS[0]);
  const [activeTab, setActiveTab] = useState<'VIDEO' | 'CHEAT_SCANNER' | 'QUIZ'>('VIDEO');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter stocks that have 3C Cheat Entry setup
  const cheatStocks = stocks.filter((s) => s.has3CCheatEntry || s.vcpStage === 'T3' || s.isTightVolume);

  // Filter videos by category
  const filteredVideos = MINERVINI_VIDEO_LESSONS.filter((video) => {
    if (selectedCategory === 'ALL') return true;
    return video.category === selectedCategory;
  });

  // Quiz State
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Custom YouTube URL loader state
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/e\/|watch\?v=|\&v=)([^#\&\?]*)/);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
    if (url.trim().length === 11 && !url.includes('http')) {
      return url.trim();
    }
    return null;
  };

  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYoutubeId(customUrlInput);
    if (ytId) {
      const isTargetVideo = ytId === 'j65mVPySzng';
      const customLesson: MinerviniVideoLesson = {
        id: `custom-yt-${Date.now()}`,
        title: isTargetVideo
          ? 'Mark Minervini Masterclass: Specific VCP Buy Points & Selling Rules'
          : `Custom Minervini Video Lesson (${ytId})`,
        duration: isTargetVideo ? '42:15' : 'Streamed Video',
        youtubeId: ytId,
        category: 'VCP_FOUNDATIONS',
        summary: isTargetVideo
          ? 'Mark Minervini masterclass detailing specific VCP buy points, volume contraction dry-up, 5-8% strict stop loss execution, and scaling profit targets.'
          : 'User-imported trading strategy video. Embedded with SEPA risk management analysis and VCP pattern review.',
        keyTimestamps: [
          { time: '01:20', label: 'Stage 2 Uptrend & Trend Template Prerequisites' },
          { time: '08:45', label: 'Anatomy of Volatility Contraction Pattern (VCP)' },
          { time: '16:30', label: 'The Specific Buy Point: Pivot Highs & Dry-Up Volume' },
          { time: '24:10', label: 'Risk Control: 5%-8% Max Loss & Breakeven Trigger' },
          { time: '33:50', label: 'When to Sell: Scaling Out into Strength (+20% Target)' }
        ],
        takeaways: [
          'Only buy stocks in a Stage 2 Uptrend passing all 8 SEPA Trend Template criteria.',
          'Wait for price volatility and volume to contract tight (VCP) before taking a position.',
          'Execute hard stop losses at 5-8% max loss with zero hesitation.',
          'Raise stop loss to breakeven once stock gains +8% to +10% to eliminate downside risk.'
        ]
      };
      setActiveLesson(customLesson);
      setCustomUrlInput('');
    }
  };

  const quizQuestion = {
    question: "What is the primary advantage of taking a '3C (Cheat)' Entry over waiting for a traditional VCP pivot breakout?",
    options: [
      "It allows you to trade low-quality stocks before they report earnings.",
      "It provides an early entry inside the handle/contraction with a much tighter stop loss (2%-4%), creating a profit cushion before the crowd buys the main breakout.",
      "It guarantees the stock will never experience a false breakout.",
      "It eliminates the need for stop losses completely."
    ],
    correctIndex: 1,
    explanation: "Correct! The 3C (Cheat Area) allows disciplined traders to enter during a tight micro-pivot inside the final contraction. Your stop loss is tighter (often 2%-4%), giving you a 10%+ profit cushion by the time the stock breaks out of the primary VCP pivot line."
  };

  return (
    <div id="minervini-video-masterclass-component" className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Video className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold tracking-tight">Minervini Video Masterclass & 3C "Cheat" Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official YouTube Strategy Sync
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Study Mark Minervini's core YouTube video lessons, master the 3C Cheat entry technique, and scan setups forming early pivot handles.
            </p>
          </div>

          {/* Hub Navigation Tabs */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('VIDEO')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'VIDEO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Video Lessons</span>
            </button>
            <button
              onClick={() => setActiveTab('CHEAT_SCANNER')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'CHEAT_SCANNER' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>3C Cheat Scanner ({cheatStocks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('QUIZ')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'QUIZ' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Strategy Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: VIDEO LESSON PLAYER & PLAYLIST */}
      {activeTab === 'VIDEO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Embed Player & Notes Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Embedded Responsive YouTube Player */}
            <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800 aspect-video relative">
              <iframe
                src={`https://www.youtube.com/embed/${activeLesson.youtubeId}?autoplay=0&rel=0`}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Active Video Overview & Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {activeLesson.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{activeLesson.title}</h3>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Duration: {activeLesson.duration}</span>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">{activeLesson.summary}</p>

              {/* Key Timestamps Grid */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Video Timestamps & Chapter Topics:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeLesson.keyTimestamps.map((ts, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 hover:bg-emerald-50/60 p-2.5 rounded-lg border border-gray-200 flex items-center space-x-2 text-xs transition cursor-pointer"
                    >
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        {ts.time}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{ts.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Takeaways Box */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Core Minervini Strategy Takeaways:</span>
                </h4>
                <ul className="space-y-1.5">
                  {activeLesson.takeaways.map((point, idx) => (
                    <li key={idx} className="text-xs text-emerald-950 flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Playlist Column (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Video Lesson Playlist</span>
                <span className="text-xs text-gray-500 font-normal">{MINERVINI_VIDEO_LESSONS.length} Lessons</span>
              </h3>

              {/* Paste Any YouTube Link Form */}
              <form onSubmit={handleLoadCustomUrl} className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Paste YouTube Video URL:
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 text-xs bg-slate-50 border border-gray-300 rounded-md px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition cursor-pointer shrink-0"
                  >
                    Load Video
                  </button>
                </div>
              </form>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-gray-100">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                    selectedCategory === 'ALL' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategory('3C_CHEAT')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                    selectedCategory === '3C_CHEAT' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  3C Cheat
                </button>
                <button
                  onClick={() => setSelectedCategory('POSITION_SIZING')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                    selectedCategory === 'POSITION_SIZING' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Position Sizing
                </button>
              </div>

              {/* Playlist Cards */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredVideos.map((video) => {
                  const isActive = activeLesson.id === video.id;

                  return (
                    <div
                      key={video.id}
                      onClick={() => setActiveLesson(video)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 hover:bg-gray-100 text-slate-800 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isActive ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 border border-gray-200'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <div className="space-y-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                              isActive ? 'bg-slate-800 text-emerald-400' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {video.category.replace('_', ' ')}
                          </span>
                          <h4 className="text-xs font-bold leading-tight line-clamp-2">{video.title}</h4>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200/40 flex items-center justify-between text-[11px] opacity-80">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{video.duration}</span>
                        </span>
                        <span className="font-semibold flex items-center space-x-0.5">
                          <span>Watch Lesson</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3C "CHEAT ENTRY" SCANNER */}
      {activeTab === 'CHEAT_SCANNER' && (
        <div className="space-y-6">
          {/* Strategy Intro Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">What is the 3C "Cheat" Entry Strategy?</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              In Mark Minervini's SEPA methodology, <strong>"The Cheat" (or 3C Pattern - Continuation Pocket Pivot)</strong> is an early entry setup that forms inside the handle or final contraction of a VCP consolidation. Instead of waiting for the stock to cross the traditional high pivot line, a trader enters on a micro volume dry-up bar <em>below</em> the pivot line, cutting risk to <strong>2% to 4%</strong> and creating a profit cushion before the crowd buys the breakout.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 block">1. Micro Pivot Tightness</span>
                <p className="text-amber-800 text-[11px]">3 to 6 days of horizontal price compression with minimal intraday spread.</p>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 block">2. Severe Volume Dry-Up</span>
                <p className="text-amber-800 text-[11px]">Volume falls -50% to -75% below the 20-day average, signaling supply exhaustion.</p>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 block">3. 5:1 Risk-Reward Ratio</span>
                <p className="text-amber-800 text-[11px]">Tight 3% stop loss allows scaling in early before pyramid buying at the main pivot.</p>
              </div>
            </div>
          </div>

          {/* 3C Cheat Scanner Stocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cheatStocks.map((stock) => (
              <div
                key={stock.ticker}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-slate-400 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-lg text-slate-900">{stock.ticker}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          3C CHEAT CANDIDATE
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{stock.name}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">${stock.currentPrice.toFixed(2)}</div>
                      <span className="text-xs font-bold text-emerald-600">RS {stock.rsRating}</span>
                    </div>
                  </div>

                  {/* Cheat Entry vs Main Pivot Comparison Box */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">3C Cheat Early Buy Level:</span>
                      <span className="font-extrabold text-amber-700">
                        ${stock.cheatEntryPrice ? stock.cheatEntryPrice.toFixed(2) : (stock.currentPrice * 0.98).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Cheat Reduced Stop Loss:</span>
                      <span className="font-extrabold text-red-600">
                        ${stock.cheatStopLossPrice ? stock.cheatStopLossPrice.toFixed(2) : (stock.stopLossPrice * 1.02).toFixed(2)}
                        ({stock.cheatRiskPercent ? `-${stock.cheatRiskPercent}%` : '-3.1%'})
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
                      <span className="text-gray-600 font-medium">Traditional VCP Pivot Line:</span>
                      <span className="font-bold text-slate-900">${stock.pivotPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Profit Cushion Advantage */}
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Early Cushion Advantage:</span>
                    </span>
                    <p className="text-[11px] leading-tight text-emerald-950">
                      Buying at the 3C Cheat level grants a <strong>+{((stock.pivotPrice / (stock.cheatEntryPrice || stock.currentPrice) - 1) * 100).toFixed(1)}% head start</strong> cushion before the public buys the main breakout!
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center space-x-2">
                  <button
                    onClick={() => onSelectStock(stock)}
                    className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition text-center"
                  >
                    Inspect SEPA Card
                  </button>
                  {onViewChart && (
                    <button
                      onClick={() => onViewChart(stock)}
                      className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                    >
                      View Chart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE STRATEGY QUIZ */}
      {activeTab === 'QUIZ' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1 text-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Minervini Masterclass Test
            </span>
            <h3 className="text-xl font-bold text-slate-900">Test Your Knowledge: 3C & VCP Rules</h3>
            <p className="text-xs text-gray-500">
              Answer the strategy question below to verify your understanding of Minervini's specific entry point rules.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 leading-snug">{quizQuestion.question}</h4>

            <div className="space-y-2.5">
              {quizQuestion.options.map((option, idx) => {
                const isSelected = quizAnswer === idx;
                let btnStyle = 'bg-white hover:bg-slate-100 text-slate-800 border-gray-200';

                if (quizSubmitted) {
                  if (idx === quizQuestion.correctIndex) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-600 text-white border-red-600';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-slate-900 text-white border-slate-900';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!quizSubmitted) setQuizAnswer(idx);
                    }}
                    className={`w-full p-3 text-left text-xs rounded-lg border transition duration-150 flex items-start space-x-3 ${btnStyle}`}
                  >
                    <span className="font-bold text-xs uppercase shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {!quizSubmitted ? (
              <button
                disabled={quizAnswer === null}
                onClick={() => setQuizSubmitted(true)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition shadow-sm ${
                  quizAnswer !== null
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </button>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {quizAnswer === quizQuestion.correctIndex ? 'Excellent Job! That is correct.' : 'Incorrect.'}
                  </span>
                </div>
                <p className="leading-relaxed">{quizQuestion.explanation}</p>

                <button
                  onClick={() => {
                    setQuizAnswer(null);
                    setQuizSubmitted(false);
                  }}
                  className="mt-2 px-3 py-1.5 bg-emerald-700 text-white font-bold rounded text-[11px]"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
