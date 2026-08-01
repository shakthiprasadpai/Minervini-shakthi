import React, { useState } from 'react';
import { BookOpen, CheckCircle2, XCircle, Sliders, Sparkles, HelpCircle, Award, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const TrendTemplateTutor: React.FC = () => {
  // Simulator State for Rule Testing
  const [stockPrice, setStockPrice] = useState<number>(145.0);
  const [sma50, setSma50] = useState<number>(132.0);
  const [sma150, setSma150] = useState<number>(120.0);
  const [sma200, setSma200] = useState<number>(110.0);
  const [low52W, setLow52W] = useState<number>(85.0);
  const [high52W, setHigh52W] = useState<number>(155.0);
  const [rsRating, setRsRating] = useState<number>(88);
  const [sma200TrendingUp, setSma200TrendingUp] = useState<boolean>(true);

  // Evaluate Rules Dynamically
  const rule1Passed = stockPrice > sma150 && stockPrice > sma200;
  const rule2Passed = sma150 > sma200;
  const rule3Passed = sma200TrendingUp;
  const rule4Passed = sma50 > sma150 && sma50 > sma200;
  const rule5Passed = stockPrice > sma50;
  const rule6Passed = low52W > 0 ? ((stockPrice - low52W) / low52W) * 100 >= 30 : false;
  const rule7Passed = high52W > 0 ? ((high52W - stockPrice) / high52W) * 100 <= 25 : false;
  const rule8Passed = rsRating >= 70;

  const totalPassed = [rule1Passed, rule2Passed, rule3Passed, rule4Passed, rule5Passed, rule6Passed, rule7Passed, rule8Passed].filter(Boolean).length;

  // Quiz State
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});

  const quizQuestions = [
    {
      id: 1,
      question: "Which Stage of the 4 Market Cycle Stages is mandatory for Minervini SEPA stock purchases?",
      options: [
        "Stage 1: Neglect Phase / Basing",
        "Stage 2: Advancing Phase / Stage 2 Uptrend",
        "Stage 3: Top / Distribution",
        "Stage 4: Capitulation / Downtrend"
      ],
      correct: 1,
      explanation: "Minervini ONLY buys stocks in confirmed Stage 2 Advancing Phase, where institutional money is actively accumulating."
    },
    {
      id: 2,
      question: "How far above its 52-week low must a stock be at minimum according to Trend Template Rule 6?",
      options: [
        "At least 10% above",
        "At least 30% above",
        "At least 50% above",
        "At least 100% above"
      ],
      correct: 1,
      explanation: "Rule 6 dictates the stock must be at least 30% above its 52-week low to prove it has turned around out of a base."
    },
    {
      id: 3,
      question: "What is the minimum IBD Relative Strength (RS) Rating required by Minervini Rule 8?",
      options: [
        "RS Rating of 50",
        "RS Rating of 60",
        "RS Rating of 70 (ideally 80s or 90s)",
        "RS Rating of 99 only"
      ],
      correct: 2,
      explanation: "Rule 8 requires an RS Rating of 70+, ensuring the stock is outperforming at least 70% of the entire market."
    }
  ];

  const handleSelectAnswer = (qId: number, optionIdx: number) => {
    setUserAnswers({ ...userAnswers, [qId]: optionIdx });
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correct) score++;
    });
    setQuizScore(score);
    setQuizCompleted(true);
  };

  return (
    <div id="interactive-trend-template-tutor" className="bg-white border border-[#e5e4e1] p-6 space-y-8 text-[#1a1a1a]">
      {/* Header */}
      <div className="border-b border-[#e5e4e1] pb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-[#1a1a1a]" />
          <h3 className="text-xl font-serif font-black text-[#1a1a1a]">
            Interactive Trend Template & SEPA Methodology Tutor
          </h3>
        </div>
        <p className="text-xs text-gray-500 font-serif italic mt-0.5">
          Master Mark Minervini's 8-Point Trend Template with live parameter simulation & knowledge checks
        </p>
      </div>

      {/* Interactive SMA & Parameter Simulator */}
      <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4e1] pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
              Interactive Trend Template Simulator (Test Parameters Live)
            </h4>
          </div>
          <span className={`px-3 py-1 font-mono text-xs font-bold uppercase border ${
            totalPassed === 8 ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400'
          }`}>
            Passed {totalPassed}/8 Rules
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
              Stock Price (${stockPrice})
            </label>
            <input
              type="range"
              min="50"
              max="250"
              value={stockPrice}
              onChange={(e) => setStockPrice(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
              50-Day SMA (${sma50})
            </label>
            <input
              type="range"
              min="50"
              max="250"
              value={sma50}
              onChange={(e) => setSma50(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
              150-Day SMA (${sma150})
            </label>
            <input
              type="range"
              min="50"
              max="250"
              value={sma150}
              onChange={(e) => setSma150(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
              200-Day SMA (${sma200})
            </label>
            <input
              type="range"
              min="50"
              max="250"
              value={sma200}
              onChange={(e) => setSma200(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Rules Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs pt-2">
          <div className={`p-3 border flex items-center justify-between ${rule1Passed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
            <span>1. Price &gt; 150d & 200d SMA</span>
            {rule1Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
          </div>

          <div className={`p-3 border flex items-center justify-between ${rule2Passed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
            <span>2. 150d SMA &gt; 200d SMA</span>
            {rule2Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
          </div>

          <div className={`p-3 border flex items-center justify-between ${rule4Passed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
            <span>4. 50d SMA &gt; 150d & 200d SMA</span>
            {rule4Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
          </div>

          <div className={`p-3 border flex items-center justify-between ${rule5Passed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
            <span>5. Price &gt; 50d SMA</span>
            {rule5Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
          </div>
        </div>
      </div>

      {/* Knowledge Quiz Section */}
      <div className="border border-[#e5e4e1] p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#e5e4e1] pb-3">
          <Award className="w-5 h-5 text-amber-600" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
            Minervini SEPA Knowledge Check Quiz
          </h4>
        </div>

        <div className="space-y-6">
          {quizQuestions.map((q) => (
            <div key={q.id} className="space-y-2 bg-[#f9f8f5] p-4 border border-[#e5e4e1] text-xs font-sans">
              <span className="font-bold text-[#1a1a1a] block text-sm">
                Question {q.id}: {q.question}
              </span>
              <div className="space-y-1.5 pt-1">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(q.id, idx)}
                    className={`w-full text-left p-2.5 font-mono border transition cursor-pointer text-xs ${
                      userAnswers[q.id] === idx
                        ? 'bg-[#1a1a1a] text-white border-black font-bold'
                        : 'bg-white text-gray-800 border-[#e5e4e1] hover:bg-gray-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizCompleted && (
                <div className="mt-2 text-[11px] font-mono text-gray-600 bg-white p-2 border border-[#e5e4e1]">
                  💡 <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            {!quizCompleted ? (
              <button
                onClick={handleSubmitQuiz}
                className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-amber-300 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Submit Answers & Check Score
              </button>
            ) : (
              <div className="font-mono text-sm font-bold text-emerald-800 bg-emerald-100 p-3 border border-emerald-300 w-full text-center">
                🎉 Quiz Completed! Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
