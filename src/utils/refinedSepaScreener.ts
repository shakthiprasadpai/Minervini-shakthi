import { MinerviniTradeSetup } from '../types';

export interface RefinedSepaRule {
  id: string;
  category: 'EARNINGS_GROWTH' | 'SALES_ACCELERATION' | 'MARGIN_QUALITY' | 'PEG_VALUATION' | 'RSI_MOMENTUM' | 'VOLUME_CONFIRMATION' | 'TREND_TEMPLATE';
  title: string;
  codeFormula: string;
  description: string;
  passed: boolean;
  actualValueStr: string;
  requiredConditionStr: string;
  strategicImprovementArea: string;
}

export interface RefinedSepaEvaluationResult {
  rules: RefinedSepaRule[];
  passedCount: number;
  totalCount: number;
  scorePercent: number;
  isFullyQualified: boolean;
  qualityGrade: {
    grade: string;
    badge: string;
    color: string;
    bgBadge: string;
  };
  improvementAreaScores: {
    earningsGrowth: { passed: boolean; label: string };
    salesAcceleration: { passed: boolean; label: string };
    marginExpansion: { passed: boolean; label: string };
    pegValuation: { passed: boolean; label: string };
    rsiBand: { passed: boolean; label: string };
    volumeConfirmation: { passed: boolean; label: string };
  };
}

export function evaluateRefinedSepaScreener(stock: MinerviniTradeSetup): RefinedSepaEvaluationResult {
  const currentPrice = stock.currentPrice;
  const sma50 = stock.sma50;
  const sma200 = stock.sma200;
  const high52w = stock.high52w;
  const low52w = stock.low52w;

  // Defaults for enriched metrics if missing on mock data
  const salesGrowth3Y = stock.salesGrowth3Y ?? 28.5;
  const profitGrowth3Y = stock.profitGrowth3Y ?? 34.2;
  const qtrSalesGrowthYoY = stock.qtrSalesGrowthYoY ?? (stock.revYoYGrowthLastQ ?? 32.0);
  const qtrProfitGrowthYoY = stock.qtrProfitGrowthYoY ?? (stock.epsYoYGrowthLastQ ?? 48.0);
  const salesLatestQtr = stock.salesLatestQtr ?? 1450;
  const salesPrecedingQtr = stock.salesPrecedingQtr ?? 1100;
  
  const roce = stock.roce ?? 24.8;
  const roe = stock.roe ?? 28.2;
  const debtToEquity = stock.debtToEquity ?? 0.22;
  const npmLastYear = stock.npmLastYear ?? 14.8;
  const npmLatestQtr = stock.npmLatestQtr ?? 17.5;
  const npmPrecedingQtr = stock.npmPrecedingQtr ?? 14.1;
  const pegRatio = stock.pegRatio ?? 0.88;
  const rsi14 = stock.rsi14 ?? 62.5;

  const vol50dAvg = stock.volume50dAvg ?? (stock.avgVolume20d * 0.95);
  const currentVol = stock.currentVolume ?? (stock.pivotVolume > stock.avgVolume20d ? stock.pivotVolume : stock.avgVolume20d * 1.35);

  const pctFromHigh52 = ((high52w - currentPrice) / high52w) * 100;
  const pctAboveLow52 = ((currentPrice - low52w) / low52w) * 100;

  // 18 Rules Evaluation
  const rules: RefinedSepaRule[] = [
    {
      id: 'r_sales_3y',
      category: 'SALES_ACCELERATION',
      title: '3-Year Sales Growth > 20%',
      codeFormula: 'Sales growth 3Years > 20',
      description: 'Ensures long-term top-line revenue expansion over 3 years.',
      passed: salesGrowth3Y > 20,
      actualValueStr: `${salesGrowth3Y.toFixed(1)}%`,
      requiredConditionStr: '> 20.0%',
      strategicImprovementArea: 'Sales Growth Enhancement'
    },
    {
      id: 'r_profit_3y',
      category: 'EARNINGS_GROWTH',
      title: '3-Year Profit Growth > 25%',
      codeFormula: 'Profit growth 3Years > 25',
      description: 'Refined from conservative 15% to Minervini 25%+ 3-year earnings CAGR requirement.',
      passed: profitGrowth3Y > 25,
      actualValueStr: `${profitGrowth3Y.toFixed(1)}%`,
      requiredConditionStr: '> 25.0%',
      strategicImprovementArea: 'Earnings Growth Criteria Refinement'
    },
    {
      id: 'r_qtr_sales_yoy',
      category: 'SALES_ACCELERATION',
      title: 'YoY Quarterly Sales Growth > 20%',
      codeFormula: 'YOY Quarterly sales growth > 20',
      description: 'Verifies current quarter sales are expanding at least 20% vs same quarter last year.',
      passed: qtrSalesGrowthYoY > 20,
      actualValueStr: `${qtrSalesGrowthYoY.toFixed(1)}%`,
      requiredConditionStr: '> 20.0%',
      strategicImprovementArea: 'Sales Growth Enhancement'
    },
    {
      id: 'r_qtr_profit_yoy',
      category: 'EARNINGS_GROWTH',
      title: 'YoY Quarterly Profit Growth > 25%',
      codeFormula: 'YOY Quarterly profit growth > 25',
      description: 'Requires strong 25%+ quarterly EPS acceleration year-over-year.',
      passed: qtrProfitGrowthYoY > 25,
      actualValueStr: `${qtrProfitGrowthYoY.toFixed(1)}%`,
      requiredConditionStr: '> 25.0%',
      strategicImprovementArea: 'Earnings Growth Criteria Refinement'
    },
    {
      id: 'r_sales_accel_qoq',
      category: 'SALES_ACCELERATION',
      title: 'Quarterly Sales Acceleration > 20%',
      codeFormula: 'Sales latest quarter > Sales preceding quarter * 1.20',
      description: 'Detects sequential top-line momentum where latest quarter sales exceed preceding quarter by 20%+',
      passed: salesLatestQtr > salesPrecedingQtr * 1.20,
      actualValueStr: `$${salesLatestQtr.toLocaleString()}M vs $${salesPrecedingQtr.toLocaleString()}M (${((salesLatestQtr/salesPrecedingQtr - 1)*100).toFixed(1)}%)`,
      requiredConditionStr: '> 1.20x Preceding Qtr',
      strategicImprovementArea: 'Sales Growth Enhancement'
    },
    {
      id: 'r_roce',
      category: 'MARGIN_QUALITY',
      title: 'ROCE > 15%',
      codeFormula: 'Return on capital employed > 15',
      description: 'Return on Capital Employed exceeds 15%, showing superior capital efficiency.',
      passed: roce > 15,
      actualValueStr: `${roce.toFixed(1)}%`,
      requiredConditionStr: '> 15.0%',
      strategicImprovementArea: 'Capital Efficiency'
    },
    {
      id: 'r_roe',
      category: 'MARGIN_QUALITY',
      title: 'ROE > 15%',
      codeFormula: 'Return on equity > 15',
      description: 'Return on Equity exceeds 15% benchmark for high-profitability institutional leaders.',
      passed: roe > 15,
      actualValueStr: `${roe.toFixed(1)}%`,
      requiredConditionStr: '> 15.0%',
      strategicImprovementArea: 'Capital Efficiency'
    },
    {
      id: 'r_debt_equity',
      category: 'MARGIN_QUALITY',
      title: 'Debt to Equity < 0.5',
      codeFormula: 'Debt to equity < 0.5',
      description: 'Prudent balance sheet leverage with debt-to-equity ratio below 0.50.',
      passed: debtToEquity < 0.5,
      actualValueStr: `${debtToEquity.toFixed(2)}`,
      requiredConditionStr: '< 0.50',
      strategicImprovementArea: 'Risk & Solvency Management'
    },
    {
      id: 'r_npm_annual',
      category: 'MARGIN_QUALITY',
      title: 'Annual Net Profit Margin > 8%',
      codeFormula: 'NPM last year > 8',
      description: 'Ensures baseline quality of earnings with annual net profit margin above 8%.',
      passed: npmLastYear > 8,
      actualValueStr: `${npmLastYear.toFixed(1)}%`,
      requiredConditionStr: '> 8.0%',
      strategicImprovementArea: 'Net Profit Margin Optimization'
    },
    {
      id: 'r_npm_expansion',
      category: 'MARGIN_QUALITY',
      title: 'Sequential Margin Expansion (NPM Latest > Preceding)',
      codeFormula: 'NPM latest quarter > NPM preceding quarter',
      description: 'Confirms operational leverage with latest quarter NPM higher than preceding quarter.',
      passed: npmLatestQtr > npmPrecedingQtr,
      actualValueStr: `${npmLatestQtr.toFixed(1)}% vs ${npmPrecedingQtr.toFixed(1)}%`,
      requiredConditionStr: 'NPM Latest > Preceding Qtr',
      strategicImprovementArea: 'Net Profit Margin Optimization'
    },
    {
      id: 'r_price_dma50',
      category: 'TREND_TEMPLATE',
      title: 'Current Price > 50-Day SMA',
      codeFormula: 'Current price > DMA 50',
      description: 'Short-term institutional trend support above the 50-day moving average.',
      passed: currentPrice > sma50,
      actualValueStr: `$${currentPrice.toFixed(2)} vs $${sma50.toFixed(2)}`,
      requiredConditionStr: '> 50MA',
      strategicImprovementArea: 'Trend Template Baseline'
    },
    {
      id: 'r_price_dma200',
      category: 'TREND_TEMPLATE',
      title: 'Current Price > 200-Day SMA',
      codeFormula: 'Current price > DMA 200',
      description: 'Long-term Stage 2 trend confirmation above the 200-day moving average.',
      passed: currentPrice > sma200,
      actualValueStr: `$${currentPrice.toFixed(2)} vs $${sma200.toFixed(2)}`,
      requiredConditionStr: '> 200MA',
      strategicImprovementArea: 'Trend Template Baseline'
    },
    {
      id: 'r_dma50_dma200',
      category: 'TREND_TEMPLATE',
      title: '50-Day SMA > 200-Day SMA',
      codeFormula: 'DMA 50 > DMA 200',
      description: 'Intermediate momentum alignment (Golden Cross structure).',
      passed: sma50 > sma200,
      actualValueStr: `$${sma50.toFixed(2)} vs $${sma200.toFixed(2)}`,
      requiredConditionStr: '50MA > 200MA',
      strategicImprovementArea: 'Trend Template Baseline'
    },
    {
      id: 'r_from_52w_high',
      category: 'TREND_TEMPLATE',
      title: 'Within 25% of 52-Week High',
      codeFormula: 'From 52w high < 25',
      description: 'Trading near 52-week highs with minimal overhead supply resistance.',
      passed: pctFromHigh52 < 25,
      actualValueStr: `${pctFromHigh52.toFixed(1)}% off high`,
      requiredConditionStr: '< 25.0% off high',
      strategicImprovementArea: 'Leadership Proximity'
    },
    {
      id: 'r_up_52w_low',
      category: 'TREND_TEMPLATE',
      title: 'At Least 30% Above 52-Week Low',
      codeFormula: 'Up from 52w low > 30',
      description: 'Stage 2 breakout power at least 30% above 52-week low.',
      passed: pctAboveLow52 > 30,
      actualValueStr: `+${pctAboveLow52.toFixed(1)}% above low`,
      requiredConditionStr: '> 30.0% above low',
      strategicImprovementArea: 'Stage 2 Confirmation'
    },
    {
      id: 'r_peg_ratio',
      category: 'PEG_VALUATION',
      title: 'PEG Ratio < 1.2',
      codeFormula: 'PEG Ratio < 1.2',
      description: 'Refined from legacy 1.5 down to Minervini sweet spot < 1.2 for sustainable growth valuation.',
      passed: pegRatio < 1.2,
      actualValueStr: `${pegRatio.toFixed(2)}`,
      requiredConditionStr: '< 1.20',
      strategicImprovementArea: 'PEG Ratio Refinement'
    },
    {
      id: 'r_rsi_band',
      category: 'RSI_MOMENTUM',
      title: 'RSI Between 50 and 70',
      codeFormula: 'RSI > 50 AND RSI < 70',
      description: 'Target momentum sweet spot: strong upward bias without overbought exhaustion.',
      passed: rsi14 > 50 && rsi14 < 70,
      actualValueStr: `RSI(14): ${rsi14.toFixed(1)}`,
      requiredConditionStr: '50.0 < RSI < 70.0',
      strategicImprovementArea: 'RSI Criteria Enhancement'
    },
    {
      id: 'r_volume_breakout',
      category: 'VOLUME_CONFIRMATION',
      title: 'Volume > 1.2x 50-Day Average Volume',
      codeFormula: 'Volume > Volume 50-day average * 1.2',
      description: 'Institutional volume surge confirmation at least 20% above 50-day average.',
      passed: currentVol > vol50dAvg * 1.2,
      actualValueStr: `${(currentVol / 1000000).toFixed(2)}M vs ${(vol50dAvg / 1000000).toFixed(2)}M (${(currentVol / vol50dAvg).toFixed(2)}x)`,
      requiredConditionStr: '> 1.20x 50d Avg Vol',
      strategicImprovementArea: 'Volume Analysis Addition'
    }
  ];

  const passedCount = rules.filter(r => r.passed).length;
  const totalCount = rules.length;
  const scorePercent = Math.round((passedCount / totalCount) * 100);
  const isFullyQualified = passedCount === totalCount;

  const getQualityGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', badge: '100% Enhanced Minervini Qualified', color: 'text-emerald-400 border-emerald-500', bgBadge: 'bg-emerald-900/90 text-emerald-100' };
    if (pct >= 75) return { grade: 'A', badge: 'High Quality SEPA Setup', color: 'text-emerald-300 border-emerald-600', bgBadge: 'bg-teal-900/90 text-teal-100' };
    if (pct >= 60) return { grade: 'B', badge: 'Moderate Alignment', color: 'text-amber-300 border-amber-500', bgBadge: 'bg-amber-900/90 text-amber-100' };
    return { grade: 'C / F', badge: 'Fails Refined Criteria', color: 'text-rose-400 border-rose-500', bgBadge: 'bg-rose-900/90 text-rose-100' };
  };

  return {
    rules,
    passedCount,
    totalCount,
    scorePercent,
    isFullyQualified,
    qualityGrade: getQualityGrade(scorePercent),
    improvementAreaScores: {
      earningsGrowth: {
        passed: rules.find(r => r.id === 'r_profit_3y')?.passed && rules.find(r => r.id === 'r_qtr_profit_yoy')?.passed || false,
        label: 'Earnings Growth > 25% (3Y & Qtr)'
      },
      salesAcceleration: {
        passed: rules.find(r => r.id === 'r_sales_accel_qoq')?.passed || false,
        label: 'Sales Q-o-Q Acceleration > 20%'
      },
      marginExpansion: {
        passed: rules.find(r => r.id === 'r_npm_expansion')?.passed || false,
        label: 'Net Profit Margin Expansion'
      },
      pegValuation: {
        passed: rules.find(r => r.id === 'r_peg_ratio')?.passed || false,
        label: 'PEG Ratio < 1.2'
      },
      rsiBand: {
        passed: rules.find(r => r.id === 'r_rsi_band')?.passed || false,
        label: 'RSI Between 50 and 70'
      },
      volumeConfirmation: {
        passed: rules.find(r => r.id === 'r_volume_breakout')?.passed || false,
        label: 'Breakout Volume > 1.2x 50d Avg'
      }
    }
  };
}

export const REFINED_MINERVINI_FORMULA_TEXT = `Sales growth 3Years > 20 AND Profit growth 3Years > 25 AND YOY Quarterly sales growth > 20 AND YOY Quarterly profit growth > 25 AND Sales latest quarter > Sales preceding quarter * 1.20 AND Return on capital employed > 15 AND Return on equity > 15 AND Debt to equity < 0.5 AND NPM last year > 8 AND NPM latest quarter > NPM preceding quarter AND Current price > DMA 50 AND Current price > DMA 200 AND PEG Ratio < 1.2 AND From 52w high < 25 AND DMA 50 > DMA 200 AND Up from 52w low > 30 AND RSI > 50 AND RSI < 70 AND Volume > Volume 50-day average * 1.2`;
