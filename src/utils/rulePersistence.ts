import { TrendTemplateRule, MinerviniTradeSetup } from '../types';

export interface CustomUserRule {
  id: string;
  type: 'ENTRY' | 'EXIT';
  title: string;
  conditionFormula: string;
  description: string;
  isEnabled: boolean;
  isCustom: boolean;
  category?: string;
}

export interface StoredStockRuleState {
  ticker: string;
  trendTemplateOverrides: Record<string, boolean>; // ruleId -> passed boolean override
  refinedSepaOverrides: Record<string, boolean>;
  customRuleOverrides: Record<string, boolean>;
  notes?: string;
  updatedAt: string;
}

const CUSTOM_RULES_STORAGE_KEY = 'minervini_custom_user_rules_v1';
const STOCK_RULE_OVERRIDES_PREFIX = 'minervini_stock_rule_overrides_v1_';

export const DEFAULT_ENTRY_EXIT_RULES: CustomUserRule[] = [
  // Entry Rules
  {
    id: 'entry_rule_stage2',
    type: 'ENTRY',
    title: '1. Stage 2 Trend Template Alignment',
    conditionFormula: 'Price > 50MA AND 50MA > 150MA AND 150MA > 200MA AND 200MA Slope > 0',
    description: 'Ensure the stock is in a confirmed Stage 2 uptrend with moving averages properly stacked and 200MA sloping upward.',
    isEnabled: true,
    isCustom: false,
    category: 'Trend Structure'
  },
  {
    id: 'entry_rule_pivot_breakout',
    type: 'ENTRY',
    title: '2. VCP Pivot Price Breakout Confirmation',
    conditionFormula: 'Current Price >= Pivot Price AND Volume >= 1.20 * Volume 50d Avg',
    description: 'Buy as the price breaks above the line of least resistance (pivot) with institutional volume surge confirmation (>= 120% 50d avg).',
    isEnabled: true,
    isCustom: false,
    category: 'Trigger & Volume'
  },
  {
    id: 'entry_rule_volume_dryup',
    type: 'ENTRY',
    title: '3. Pre-Breakout Volume Contraction & Tightness',
    conditionFormula: 'Pre-breakout Volume <= 0.60 * Volume 20d Avg AND Contraction Depth <= 10%',
    description: 'Verify volume dries up significantly before the breakout move, showing supply exhaustion.',
    isEnabled: true,
    isCustom: false,
    category: 'VCP Contraction'
  },
  {
    id: 'entry_rule_rs_leadership',
    type: 'ENTRY',
    title: '4. Relative Strength (RS) Rating >= 70',
    conditionFormula: 'RS Rating >= 70 (Preferably >= 85)',
    description: 'Target market leaders that are outperforming at least 70% of all stocks in the broader market.',
    isEnabled: true,
    isCustom: false,
    category: 'Leadership'
  },
  {
    id: 'entry_rule_rr_ratio',
    type: 'ENTRY',
    title: '5. Minimum 3:1 Risk-to-Reward Ratio',
    conditionFormula: '(Target 1 Price - Entry Price) / (Entry Price - Stop Loss) >= 3.0',
    description: 'Enforce asymmetric risk management where potential reward is at least 3x the potential risk.',
    isEnabled: true,
    isCustom: false,
    category: 'Risk Management'
  },
  {
    id: 'entry_rule_eps_acceleration',
    type: 'ENTRY',
    title: '6. Earnings Growth Acceleration (YoY EPS > 25%)',
    conditionFormula: 'YoY Quarterly EPS Growth >= 25% AND 3Y Earnings Growth >= 25%',
    description: 'Confirm fundamental earnings acceleration aligns with technical price structure.',
    isEnabled: true,
    isCustom: false,
    category: 'Fundamentals'
  },

  // Exit Rules
  {
    id: 'exit_rule_hard_stop',
    type: 'EXIT',
    title: '1. Hard Initial Stop Loss Breach (7–8% Max Risk)',
    conditionFormula: 'Current Price <= Hard Stop Price (or Price Loss >= 8.0%)',
    description: 'Trigger 100% position liquidation if price drops to or below initial hard stop. Zero exceptions or second-guessing.',
    isEnabled: true,
    isCustom: false,
    category: 'Risk Control'
  },
  {
    id: 'exit_rule_breakeven_backstop',
    type: 'EXIT',
    title: '2. Breakeven Backstop Rule (+8% Gain Trigger)',
    conditionFormula: 'Unrealized Gain >= +8.0%',
    description: 'When stock advances +8% above entry price, immediately move hard stop loss to breakeven (entry price) to eliminate risk.',
    isEnabled: true,
    isCustom: false,
    category: 'Profit Protection'
  },
  {
    id: 'exit_rule_target1_partial',
    type: 'EXIT',
    title: '3. Partial Profit Lock-In at Target 1 (+15% to +20%)',
    conditionFormula: 'Current Price >= Target 1 Price (or Gain >= +20%)',
    description: 'Sell 50% of the position into institutional strength at Target 1 to lock in 3:1 R/R gains and reduce portfolio risk.',
    isEnabled: true,
    isCustom: false,
    category: 'Target Execution'
  },
  {
    id: 'exit_rule_trailing_ma',
    type: 'EXIT',
    title: '4. Trailing Moving Average Exit (20d EMA / 50d SMA)',
    conditionFormula: 'Daily Close < 20-day EMA OR Daily Close < 50-day SMA on Volume > Avg',
    description: 'Trail remaining 50% position along 20-day EMA. Exit remaining shares if stock closes decisively below key support moving average.',
    isEnabled: true,
    isCustom: false,
    category: 'Trailing Strategy'
  },
  {
    id: 'exit_rule_heavy_distribution',
    type: 'EXIT',
    title: '5. Heavy Institutional Distribution / Climax Top',
    conditionFormula: 'Daily Drop > 4.0% ON Volume >= 2.0 * Volume 50d Avg',
    description: 'Exit immediately if the stock experiences a sharp high-volume selloff day or climax extension gap down.',
    isEnabled: true,
    isCustom: false,
    category: 'Distribution Alert'
  },
  {
    id: 'exit_rule_time_stop',
    type: 'EXIT',
    title: '6. Time Stop Rule (3–5 Session Inaction)',
    conditionFormula: 'Days in Trade >= 4 AND Gain < 1.0% AND Price < Pivot Entry',
    description: 'If stock fails to gain traction within 3–5 trading sessions post-breakout, sell or trim to reallocate capital to faster movers.',
    isEnabled: true,
    isCustom: false,
    category: 'Capital Efficiency'
  }
];

// Load Custom User Rules from localStorage
export function loadUserRules(): CustomUserRule[] {
  try {
    const raw = localStorage.getItem(CUSTOM_RULES_STORAGE_KEY);
    if (!raw) return DEFAULT_ENTRY_EXIT_RULES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load custom user rules from localStorage:', err);
  }
  return DEFAULT_ENTRY_EXIT_RULES;
}

// Save Custom User Rules to localStorage
export function saveUserRules(rules: CustomUserRule[]): boolean {
  try {
    localStorage.setItem(CUSTOM_RULES_STORAGE_KEY, JSON.stringify(rules));
    return true;
  } catch (err) {
    console.error('Failed to save user rules:', err);
    return false;
  }
}

// Reset Custom User Rules to defaults
export function resetUserRulesToDefault(): CustomUserRule[] {
  saveUserRules(DEFAULT_ENTRY_EXIT_RULES);
  return DEFAULT_ENTRY_EXIT_RULES;
}

// Load per-stock rule overrides from localStorage
export function loadStockRuleState(ticker: string): StoredStockRuleState {
  try {
    const raw = localStorage.getItem(`${STOCK_RULE_OVERRIDES_PREFIX}${ticker.toUpperCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ticker: ticker.toUpperCase(),
        trendTemplateOverrides: parsed.trendTemplateOverrides || {},
        refinedSepaOverrides: parsed.refinedSepaOverrides || {},
        customRuleOverrides: parsed.customRuleOverrides || {},
        notes: parsed.notes || '',
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error(`Failed to load rule state for ${ticker}:`, err);
  }

  return {
    ticker: ticker.toUpperCase(),
    trendTemplateOverrides: {},
    refinedSepaOverrides: {},
    customRuleOverrides: {},
    notes: '',
    updatedAt: new Date().toISOString()
  };
}

// Save per-stock rule overrides to localStorage
export function saveStockRuleState(state: StoredStockRuleState): boolean {
  try {
    const key = `${STOCK_RULE_OVERRIDES_PREFIX}${state.ticker.toUpperCase()}`;
    const payload = {
      ...state,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error(`Failed to save stock rule state for ${state.ticker}:`, err);
    return false;
  }
}

// Clear per-stock rule overrides
export function clearStockRuleState(ticker: string): boolean {
  try {
    const key = `${STOCK_RULE_OVERRIDES_PREFIX}${ticker.toUpperCase()}`;
    localStorage.removeItem(key);
    // Also clear legacy key if present
    localStorage.removeItem(`vcp_trend_checklist_${ticker}`);
    return true;
  } catch (err) {
    console.error(`Failed to clear stock rule state for ${ticker}:`, err);
    return false;
  }
}

export interface RuleEvaluationSummary {
  ruleId: string;
  type: 'ENTRY' | 'EXIT';
  title: string;
  category: string;
  formula: string;
  description: string;
  isTriggered: boolean;
  actualStr: string;
  requiredStr: string;
  isUserOverridden: boolean;
}

export interface EntryExitEvaluationResult {
  entryRules: RuleEvaluationSummary[];
  exitRules: RuleEvaluationSummary[];
  entryPassedCount: number;
  entryTotalCount: number;
  entryScorePercent: number;
  isEntryQualified: boolean;

  exitTriggeredCount: number;
  activeExitSignal: {
    status: 'NO_EXIT' | 'STOP_LOSS_EXECUTED' | 'BREAKEVEN_RAISED' | 'TARGET_1_PARTIAL' | 'TRAILING_MA_EXIT' | 'DISTRIBUTION_ALERT' | 'TIME_STOP_EXPIRED';
    badge: string;
    badgeBg: string;
    cardBg: string;
    actionTitle: string;
    suggestedSellPct: number;
    recommendedStopLevel: number;
    description: string;
  };
}

export function evaluateEntryAndExitRules(
  stock: MinerviniTradeSetup,
  simulatedPrice?: number,
  simulatedVolumeMultiplier?: number,
  simulatedDaysInTrade?: number,
  rulesList?: CustomUserRule[]
): EntryExitEvaluationResult {
  const rules = rulesList || loadUserRules();
  const stockState = loadStockRuleState(stock.ticker);

  const testPrice = simulatedPrice ?? stock.currentPrice;
  const testVolMult = simulatedVolumeMultiplier ?? 1.25;
  const daysInTrade = simulatedDaysInTrade ?? 0;

  const pivotPrice = stock.pivotPrice;
  const stopLossPrice = stock.stopLossPrice;
  const target1Price = stock.target1Price;
  const target2Price = stock.target2Price;

  const gainPct = ((testPrice - pivotPrice) / pivotPrice) * 100;
  const vol50dAvg = stock.volume50dAvg ?? (stock.avgVolume20d * 0.95);
  const currentVol = stock.currentVolume ?? (stock.pivotVolume > stock.avgVolume20d ? stock.pivotVolume : stock.avgVolume20d * testVolMult);

  const entryRules: RuleEvaluationSummary[] = [];
  const exitRules: RuleEvaluationSummary[] = [];

  const enabledRules = rules.filter(r => r.isEnabled);

  enabledRules.forEach(rule => {
    let triggered = false;
    let actualStr = '';
    let requiredStr = '';

    const isOverridden = stockState.customRuleOverrides[rule.id] !== undefined;
    const userOverrideVal = stockState.customRuleOverrides[rule.id];

    if (rule.type === 'ENTRY') {
      switch (rule.id) {
        case 'entry_rule_stage2':
          triggered = stock.currentPrice > stock.sma50 && stock.sma50 > stock.sma150 && stock.sma150 > stock.sma200 && stock.sma200 > stock.sma200_1mo_ago;
          actualStr = `Price $${testPrice.toFixed(2)} | 50MA $${stock.sma50.toFixed(2)}`;
          requiredStr = 'Price > 50MA > 150MA > 200MA';
          break;

        case 'entry_rule_pivot_breakout':
          triggered = testPrice >= pivotPrice && currentVol >= vol50dAvg * 1.2;
          actualStr = `$${testPrice.toFixed(2)} vs Pivot $${pivotPrice.toFixed(2)} (${(currentVol/vol50dAvg).toFixed(2)}x vol)`;
          requiredStr = 'Price >= Pivot & Vol >= 1.2x 50d Avg';
          break;

        case 'entry_rule_volume_dryup':
          triggered = Math.abs(stock.volumeDryUpPercent) >= 30 || stock.isTightVolume;
          actualStr = `${stock.volumeDryUpPercent}% volume dry-up`;
          requiredStr = 'Volume Dry-up >= 30%';
          break;

        case 'entry_rule_rs_leadership':
          triggered = stock.rsRating >= 70;
          actualStr = `RS Rating ${stock.rsRating}`;
          requiredStr = 'RS Rating >= 70';
          break;

        case 'entry_rule_rr_ratio':
          const riskPerShare = Math.max(0.01, pivotPrice - stopLossPrice);
          const rewardPerShare = Math.max(0, target1Price - pivotPrice);
          const rr = rewardPerShare / riskPerShare;
          triggered = rr >= 3.0;
          actualStr = `R:R = 1:${rr.toFixed(1)}`;
          requiredStr = 'R:R Ratio >= 1:3.0';
          break;

        case 'entry_rule_eps_acceleration':
          const epsGrowth = stock.qtrProfitGrowthYoY ?? stock.epsYoYGrowthLastQ ?? 48;
          triggered = epsGrowth >= 25;
          actualStr = `YoY EPS Growth +${epsGrowth}%`;
          requiredStr = 'YoY EPS Growth >= 25%';
          break;

        default:
          // Custom user rule
          triggered = testPrice >= pivotPrice;
          actualStr = `$${testPrice.toFixed(2)}`;
          requiredStr = rule.conditionFormula;
          break;
      }

      if (isOverridden) {
        triggered = userOverrideVal;
      }

      entryRules.push({
        ruleId: rule.id,
        type: 'ENTRY',
        title: rule.title,
        category: rule.category || 'Entry Rule',
        formula: rule.conditionFormula,
        description: rule.description,
        isTriggered: triggered,
        actualStr,
        requiredStr,
        isUserOverridden: isOverridden
      });
    } else {
      // EXIT RULES EVALUATION
      switch (rule.id) {
        case 'exit_rule_hard_stop':
          triggered = testPrice <= stopLossPrice;
          actualStr = `$${testPrice.toFixed(2)} vs Stop $${stopLossPrice.toFixed(2)} (${gainPct.toFixed(1)}%)`;
          requiredStr = `Price <= $${stopLossPrice.toFixed(2)}`;
          break;

        case 'exit_rule_breakeven_backstop':
          triggered = gainPct >= 8.0;
          actualStr = `Unrealized Gain: +${gainPct.toFixed(1)}%`;
          requiredStr = 'Gain >= +8.0%';
          break;

        case 'exit_rule_target1_partial':
          triggered = testPrice >= target1Price || gainPct >= stock.target1Percent;
          actualStr = `$${testPrice.toFixed(2)} vs Target 1 $${target1Price.toFixed(2)} (+${gainPct.toFixed(1)}%)`;
          requiredStr = `Price >= $${target1Price.toFixed(2)}`;
          break;

        case 'exit_rule_trailing_ma':
          triggered = testPrice < stock.sma50;
          actualStr = `Price $${testPrice.toFixed(2)} vs 50MA $${stock.sma50.toFixed(2)}`;
          requiredStr = 'Price < 20d EMA / 50d SMA';
          break;

        case 'exit_rule_heavy_distribution':
          triggered = stock.changePercent <= -4.0 && currentVol >= vol50dAvg * 2.0;
          actualStr = `Daily Change ${stock.changePercent}% (${(currentVol/vol50dAvg).toFixed(1)}x Vol)`;
          requiredStr = 'Drop > 4% on Volume >= 2x Avg';
          break;

        case 'exit_rule_time_stop':
          triggered = daysInTrade >= 4 && gainPct < 1.0 && testPrice < pivotPrice;
          actualStr = `${daysInTrade} Days in Trade | Gain: ${gainPct.toFixed(1)}%`;
          requiredStr = 'Days >= 4 & Gain < 1% below entry';
          break;

        default:
          triggered = testPrice <= stopLossPrice;
          actualStr = `$${testPrice.toFixed(2)}`;
          requiredStr = rule.conditionFormula;
          break;
      }

      if (isOverridden) {
        triggered = userOverrideVal;
      }

      exitRules.push({
        ruleId: rule.id,
        type: 'EXIT',
        title: rule.title,
        category: rule.category || 'Exit Rule',
        formula: rule.conditionFormula,
        description: rule.description,
        isTriggered: triggered,
        actualStr,
        requiredStr,
        isUserOverridden: isOverridden
      });
    }
  });

  const entryPassedCount = entryRules.filter(r => r.isTriggered).length;
  const entryTotalCount = entryRules.length;
  const entryScorePercent = entryTotalCount > 0 ? Math.round((entryPassedCount / entryTotalCount) * 100) : 0;
  const isEntryQualified = entryPassedCount === entryTotalCount;

  const exitTriggeredCount = exitRules.filter(r => r.isTriggered).length;

  // Compute active exit signal precedence
  let activeExitSignal: EntryExitEvaluationResult['activeExitSignal'];

  if (testPrice <= stopLossPrice) {
    activeExitSignal = {
      status: 'STOP_LOSS_EXECUTED',
      badge: '🔴 HARD STOP LOSS EXECUTED (SELL 100%)',
      badgeBg: 'bg-rose-950 text-white border-rose-600',
      cardBg: 'bg-rose-50 border-rose-300',
      actionTitle: 'ACTION: CUT LOSS IMMEDIATELY',
      suggestedSellPct: 100,
      recommendedStopLevel: stopLossPrice,
      description: `Price ($${testPrice.toFixed(2)}) has breached initial risk threshold of $${stopLossPrice.toFixed(2)} (-${stock.stopLossPercent}%). Liquidate 100% with zero hesitation to protect capital.`
    };
  } else if (exitRules.find(r => r.ruleId === 'exit_rule_heavy_distribution')?.isTriggered) {
    activeExitSignal = {
      status: 'DISTRIBUTION_ALERT',
      badge: '⚠️ HEAVY INSTITUTIONAL DISTRIBUTION ALERT',
      badgeBg: 'bg-rose-900 text-amber-300 border-rose-600',
      cardBg: 'bg-rose-50 border-rose-400',
      actionTitle: 'ACTION: EXIT OR TRIM HEAVILY',
      suggestedSellPct: 75,
      recommendedStopLevel: stopLossPrice,
      description: `Stock dropped ${stock.changePercent}% on massive volume (${(currentVol/vol50dAvg).toFixed(1)}x avg). Heavy institutional dumping detected.`
    };
  } else if (testPrice >= target2Price) {
    activeExitSignal = {
      status: 'TARGET_1_PARTIAL',
      badge: '🌟 TARGET 2 RUNAWAY PROFIT (+35–50%)',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-500',
      cardBg: 'bg-amber-50 border-amber-300',
      actionTitle: 'ACTION: LOCK IN FINAL PROFITS',
      suggestedSellPct: 100,
      recommendedStopLevel: pivotPrice,
      description: `Stock reached Target 2 at $${target2Price.toFixed(2)} (+${stock.target2Percent}%). Lock in exceptional gains.`
    };
  } else if (testPrice >= target1Price) {
    activeExitSignal = {
      status: 'TARGET_1_PARTIAL',
      badge: '🎯 TARGET 1 REACHED (SELL 50%, TRAIL REST)',
      badgeBg: 'bg-purple-950 text-amber-300 border-purple-600',
      cardBg: 'bg-purple-50 border-purple-300',
      actionTitle: 'ACTION: SELL 50% & RAISE STOP TO BREAKEVEN',
      suggestedSellPct: 50,
      recommendedStopLevel: pivotPrice,
      description: `Stock hit Target 1 at $${target1Price.toFixed(2)} (+${stock.target1Percent}%). Sell 50% shares to lock in 3:1 R/R profit, then trail remaining shares along 20-day EMA.`
    };
  } else if (gainPct >= 8.0) {
    activeExitSignal = {
      status: 'BREAKEVEN_RAISED',
      badge: '🛡️ BREAKEVEN BACKSTOP ACTIVATED (+8% GAIN)',
      badgeBg: 'bg-blue-950 text-cyan-300 border-blue-600',
      cardBg: 'bg-blue-50 border-blue-300',
      actionTitle: 'ACTION: MOVE STOP LOSS TO BREAKEVEN ($' + pivotPrice.toFixed(2) + ')',
      suggestedSellPct: 0,
      recommendedStopLevel: pivotPrice,
      description: `Stock reached +${gainPct.toFixed(1)}% profit. Immediately raise stop loss from $${stopLossPrice.toFixed(2)} to $${pivotPrice.toFixed(2)} entry price. This trade is now 100% ZERO RISK.`
    };
  } else if (exitRules.find(r => r.ruleId === 'exit_rule_time_stop')?.isTriggered) {
    activeExitSignal = {
      status: 'TIME_STOP_EXPIRED',
      badge: '⏳ TIME STOP EXPIRED (3-5 DAYS INACTION)',
      badgeBg: 'bg-amber-900 text-white border-amber-600',
      cardBg: 'bg-amber-50 border-amber-300',
      actionTitle: 'ACTION: TRIM OR REALLOCATE CAPITAL',
      suggestedSellPct: 50,
      recommendedStopLevel: stopLossPrice,
      description: `Stock has been in trade for ${daysInTrade} days without follow-through momentum. Consider closing or reducing size to reallocate capital to faster Stage 2 leaders.`
    };
  } else if (testPrice < pivotPrice) {
    activeExitSignal = {
      status: 'NO_EXIT',
      badge: '🟡 BELOW PIVOT ENTRY (MONITORING STOP)',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-600',
      cardBg: 'bg-[#f9f8f5] border-gray-300',
      actionTitle: 'ACTION: HOLD INITIAL STOP LOSS',
      suggestedSellPct: 0,
      recommendedStopLevel: stopLossPrice,
      description: `Price ($${testPrice.toFixed(2)}) is pulling back below pivot entry ($${pivotPrice.toFixed(2)}). Maintain initial hard stop loss at $${stopLossPrice.toFixed(2)}.`
    };
  } else {
    activeExitSignal = {
      status: 'NO_EXIT',
      badge: '🟢 IN TRADE — HOLDING POSITION',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-600',
      cardBg: 'bg-emerald-50 border-emerald-200',
      actionTitle: 'ACTION: HOLD FOR BREAKOUT FOLLOW-THROUGH',
      suggestedSellPct: 0,
      recommendedStopLevel: stopLossPrice,
      description: `Stock is trading above pivot entry (+${gainPct.toFixed(1)}% gain). Hold position with hard stop loss active at $${stopLossPrice.toFixed(2)}.`
    };
  }

  return {
    entryRules,
    exitRules,
    entryPassedCount,
    entryTotalCount,
    entryScorePercent,
    isEntryQualified,
    exitTriggeredCount,
    activeExitSignal
  };
}
