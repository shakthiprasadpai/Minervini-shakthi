import React, { useState, useEffect } from 'react';
import { MinerviniTradeSetup } from '../types';
import {
  loadUserRules,
  saveUserRules,
  resetUserRulesToDefault,
  loadStockRuleState,
  saveStockRuleState,
  clearStockRuleState,
  evaluateEntryAndExitRules,
  CustomUserRule
} from '../utils/rulePersistence';
import { formatCurrency, getCurrencySymbol } from '../utils/sepaCalculator';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Target,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  LogOut,
  TrendingUp,
  Layers,
  Edit3,
  Check,
  X,
  Database
} from 'lucide-react';

interface RuleBasedEntryExitPanelProps {
  stock: MinerviniTradeSetup;
  onStockUpdate?: () => void;
}

export const RuleBasedEntryExitPanel: React.FC<RuleBasedEntryExitPanelProps> = ({ stock }) => {
  const currencySymbol = getCurrencySymbol(stock.exchange);

  // Persistence State
  const [userRules, setUserRules] = useState<CustomUserRule[]>(loadUserRules());
  const [stockRuleState, setStockRuleState] = useState(loadStockRuleState(stock.ticker));

  // Simulation Controls State
  const [simulatedPrice, setSimulatedPrice] = useState<number>(stock.currentPrice);
  const [simulatedVolumeMultiplier, setSimulatedVolumeMultiplier] = useState<number>(1.25);
  const [simulatedDaysInTrade, setSimulatedDaysInTrade] = useState<number>(0);

  // New Custom Rule Form Modal State
  const [isAddRuleOpen, setIsAddRuleOpen] = useState<boolean>(false);
  const [newRuleType, setNewRuleType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [newRuleTitle, setNewRuleTitle] = useState<string>('');
  const [newRuleCategory, setNewRuleCategory] = useState<string>('Custom Strategy');
  const [newRuleFormula, setNewRuleFormula] = useState<string>('');
  const [newRuleDescription, setNewRuleDescription] = useState<string>('');

  // Toast confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reload state when stock changes
    setStockRuleState(loadStockRuleState(stock.ticker));
    setSimulatedPrice(stock.currentPrice);
  }, [stock.ticker, stock.currentPrice]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const evalResult = evaluateEntryAndExitRules(
    stock,
    simulatedPrice,
    simulatedVolumeMultiplier,
    simulatedDaysInTrade,
    userRules
  );

  // Handle manual override toggle for a rule on this specific stock
  const handleToggleRuleOverride = (ruleId: string, currentVal: boolean) => {
    const updatedOverrides = { ...stockRuleState.customRuleOverrides };
    if (updatedOverrides[ruleId] !== undefined) {
      // Remove override, return to auto
      delete updatedOverrides[ruleId];
    } else {
      // Set explicit override
      updatedOverrides[ruleId] = !currentVal;
    }

    const updatedState = {
      ...stockRuleState,
      customRuleOverrides: updatedOverrides
    };

    setStockRuleState(updatedState);
    saveStockRuleState(updatedState);
    showToast(`Updated rule override for ${stock.ticker}`);
  };

  // Reset all stock overrides
  const handleResetStockRuleOverrides = () => {
    clearStockRuleState(stock.ticker);
    setStockRuleState(loadStockRuleState(stock.ticker));
    showToast(`Reset rule checklist for ${stock.ticker} to defaults`);
  };

  // Toggle global enable/disable of a rule
  const handleToggleRuleEnabled = (ruleId: string) => {
    const updated = userRules.map(r => r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r);
    setUserRules(updated);
    saveUserRules(updated);
  };

  // Delete a custom rule
  const handleDeleteCustomRule = (ruleId: string) => {
    const updated = userRules.filter(r => r.id !== ruleId);
    setUserRules(updated);
    saveUserRules(updated);
    showToast('Deleted custom rule');
  };

  // Add a new custom user rule
  const handleCreateNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;

    const newRule: CustomUserRule = {
      id: `custom_rule_${Date.now()}`,
      type: newRuleType,
      title: newRuleTitle.trim(),
      category: newRuleCategory.trim() || 'Custom Strategy',
      conditionFormula: newRuleFormula.trim() || 'Custom Condition',
      description: newRuleDescription.trim() || 'User defined custom trading rule.',
      isEnabled: true,
      isCustom: true
    };

    const updated = [...userRules, newRule];
    setUserRules(updated);
    saveUserRules(updated);

    setIsAddRuleOpen(false);
    setNewRuleTitle('');
    setNewRuleFormula('');
    setNewRuleDescription('');
    showToast(`Added persistent ${newRuleType} rule: "${newRule.title}"`);
  };

  // Reset all user rules to original Minervini SEPA default set
  const handleResetUserRulesToDefaults = () => {
    const defs = resetUserRulesToDefault();
    setUserRules(defs);
    showToast('Reset all rules to default Minervini SEPA strategy set');
  };

  const pivot = stock.pivotPrice;
  const stopLoss = stock.stopLossPrice;
  const target1 = stock.target1Price;
  const target2 = stock.target2Price;

  return (
    <div className="bg-white border-2 border-[#1a1a1a] shadow-xl space-y-6 overflow-hidden rounded-none my-6">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="bg-amber-400 text-black px-4 py-2 font-mono text-xs font-bold flex items-center justify-between border-b border-black animate-fade-in">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold">Saved to LocalStorage</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#10141d] text-white p-6 border-b border-[#232936] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-widest">
              SEPA PERSISTENCE ENGINE
            </span>
            <span className="text-amber-400 font-serif italic text-xs">
              Persistent Rule-Based Entry &amp; Exit Signals
            </span>
          </div>
          <h2 className="text-2xl font-serif font-black tracking-tight text-white flex items-center space-x-2">
            <span>Rule-Based Entry &amp; Exit Decision Matrix</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Evaluates strict technical and fundamental entry parameters alongside systematic exit triggers. All rule overrides &amp; custom strategy rules automatically persist in local storage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddRuleOpen(true)}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Rule</span>
          </button>

          <button
            onClick={handleResetStockRuleOverrides}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Reset rule checklist overrides for this stock"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset {stock.ticker} Checklist</span>
          </button>
        </div>
      </div>

      {/* Simulation Toolbar */}
      <div className="px-6 py-4 bg-[#f9f8f5] border-b border-[#e5e4e1] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Interactive Entry / Exit Trade Simulator:</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSimulatedPrice(stock.currentPrice)}
              className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-100 font-mono text-[10px] font-bold uppercase text-gray-800 cursor-pointer"
            >
              Current: {formatCurrency(stock.currentPrice, currencySymbol)}
            </button>
            <button
              onClick={() => setSimulatedPrice(pivot)}
              className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 font-mono text-[10px] font-bold uppercase text-emerald-800 cursor-pointer"
            >
              Pivot Breakout: {formatCurrency(pivot, currencySymbol)}
            </button>
            <button
              onClick={() => setSimulatedPrice(Number((pivot * 1.08).toFixed(2)))}
              className="px-2.5 py-1 bg-white border border-blue-300 hover:bg-blue-50 font-mono text-[10px] font-bold uppercase text-blue-800 cursor-pointer"
            >
              +8% Breakeven
            </button>
            <button
              onClick={() => setSimulatedPrice(target1)}
              className="px-2.5 py-1 bg-white border border-purple-300 hover:bg-purple-50 font-mono text-[10px] font-bold uppercase text-purple-800 cursor-pointer"
            >
              Target 1 (+20%): {formatCurrency(target1, currencySymbol)}
            </button>
            <button
              onClick={() => setSimulatedPrice(stopLoss)}
              className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-50 font-mono text-[10px] font-bold uppercase text-rose-800 cursor-pointer"
            >
              Hard Stop (-8%): {formatCurrency(stopLoss, currencySymbol)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          
          {/* Simulated Price Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-600">Simulated Price:</span>
              <strong className="text-black font-bold">{formatCurrency(simulatedPrice, currencySymbol)}</strong>
            </div>
            <input
              type="range"
              min={Math.floor(stopLoss * 0.85)}
              max={Math.ceil(target2 * 1.15)}
              step={0.25}
              value={simulatedPrice}
              onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
              className="w-full accent-[#1a1a1a] cursor-pointer"
            />
          </div>

          {/* Volume Multiplier Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-600">Volume Surge Multiplier:</span>
              <strong className="text-black font-bold">{simulatedVolumeMultiplier.toFixed(2)}x 50d Avg</strong>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.5}
              step={0.1}
              value={simulatedVolumeMultiplier}
              onChange={(e) => setSimulatedVolumeMultiplier(parseFloat(e.target.value))}
              className="w-full accent-[#1a1a1a] cursor-pointer"
            />
          </div>

          {/* Days in Trade Counter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-600">Days in Trade Post-Breakout:</span>
              <strong className="text-black font-bold">{simulatedDaysInTrade} Days</strong>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={simulatedDaysInTrade}
              onChange={(e) => setSimulatedDaysInTrade(parseInt(e.target.value))}
              className="w-full accent-[#1a1a1a] cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Active Signal Execution Banner */}
      <div className={`mx-6 p-5 border ${evalResult.activeExitSignal.cardBg} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border ${evalResult.activeExitSignal.badgeBg}`}>
              {evalResult.activeExitSignal.badge}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-gray-700">
              Suggested Shares to Sell: <strong className="text-black font-bold">{evalResult.activeExitSignal.suggestedSellPct}%</strong>
            </span>
            <span className="text-gray-700">
              Recommended Stop: <strong className="text-black font-bold">{formatCurrency(evalResult.activeExitSignal.recommendedStopLevel, currencySymbol)}</strong>
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold font-serif text-[#1a1a1a]">
            {evalResult.activeExitSignal.actionTitle}
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed font-sans">
            {evalResult.activeExitSignal.description}
          </p>
        </div>
      </div>

      {/* Entry & Exit Dual Rules Grid */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ENTRY RULES COLUMN */}
        <div className="space-y-4">
          <div className="bg-[#10141d] text-white p-3 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SEPA Entry Rules Checklist ({evalResult.entryPassedCount} / {evalResult.entryTotalCount})</span>
            </div>

            <span className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
              evalResult.isEntryQualified ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'
            }`}>
              {evalResult.entryScorePercent}% Qualified
            </span>
          </div>

          <div className="space-y-2">
            {evalResult.entryRules.map(rule => (
              <div
                key={rule.ruleId}
                className={`p-3 border text-xs space-y-2 transition-all ${
                  rule.isTriggered
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    {rule.isTriggered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold text-[#1a1a1a]">{rule.title}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleRuleOverride(rule.ruleId, rule.isTriggered)}
                      className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase border cursor-pointer ${
                        rule.isUserOverridden
                          ? 'bg-amber-400 text-black border-amber-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                      }`}
                      title={rule.isUserOverridden ? 'User Override Active (Click to reset to Auto)' : 'Click to manually override rule status'}
                    >
                      {rule.isUserOverridden ? 'OVERRIDDEN' : 'AUTO'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 leading-tight">
                  {rule.description}
                </p>

                <div className="flex items-center justify-between font-mono text-[10px] pt-1 border-t border-gray-200/80">
                  <span className="text-gray-500 truncate max-w-[200px]" title={rule.formula}>
                    Req: <code className="text-gray-800 font-bold">{rule.requiredStr}</code>
                  </span>
                  <span className="text-gray-800 font-bold shrink-0">
                    Actual: <strong className={rule.isTriggered ? 'text-emerald-700' : 'text-rose-600'}>{rule.actualStr}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EXIT RULES COLUMN */}
        <div className="space-y-4">
          <div className="bg-[#10141d] text-white p-3 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>SEPA Exit Rules Matrix ({evalResult.exitTriggeredCount} Triggered)</span>
            </div>

            <span className="px-2 py-0.5 bg-rose-500 text-white font-mono text-[10px] font-bold uppercase">
              {evalResult.exitTriggeredCount > 0 ? `${evalResult.exitTriggeredCount} EXIT SIGNALS` : '0 EXITS'}
            </span>
          </div>

          <div className="space-y-2">
            {evalResult.exitRules.map(rule => (
              <div
                key={rule.ruleId}
                className={`p-3 border text-xs space-y-2 transition-all ${
                  rule.isTriggered
                    ? 'bg-rose-100/70 border-rose-400 shadow-xs'
                    : 'bg-[#f9f8f5] border-[#e5e4e1]'
                }`}
              >
                <div className="flex items-start justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    {rule.isTriggered ? (
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className={`font-bold ${rule.isTriggered ? 'text-rose-900 font-black' : 'text-[#1a1a1a]'}`}>
                      {rule.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleRuleOverride(rule.ruleId, rule.isTriggered)}
                      className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase border cursor-pointer ${
                        rule.isUserOverridden
                          ? 'bg-amber-400 text-black border-amber-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                      }`}
                      title={rule.isUserOverridden ? 'User Override Active' : 'Click to manually override exit trigger'}
                    >
                      {rule.isUserOverridden ? 'OVERRIDDEN' : 'AUTO'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 leading-tight">
                  {rule.description}
                </p>

                <div className="flex items-center justify-between font-mono text-[10px] pt-1 border-t border-gray-200/80">
                  <span className="text-gray-500 truncate max-w-[200px]" title={rule.formula}>
                    Trigger: <code className="text-gray-800 font-bold">{rule.requiredStr}</code>
                  </span>
                  <span className="text-gray-800 font-bold shrink-0">
                    Status: <strong className={rule.isTriggered ? 'text-rose-700 font-black' : 'text-gray-600'}>
                      {rule.isTriggered ? 'TRIGGERED' : 'CLEAR'} ({rule.actualStr})
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Global User Rules Management Toolbar */}
      <div className="mx-6 p-4 bg-[#f9f8f5] border border-[#e5e4e1] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-2 text-gray-700">
          <Database className="w-4 h-4 text-amber-600" />
          <span>Active Persistence: <strong>{userRules.length} Rules Saved in LocalStorage</strong></span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetUserRulesToDefaults}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 font-bold uppercase tracking-wider cursor-pointer"
          >
            Reset Strategy Rules to Default SEPA Set
          </button>
        </div>
      </div>

      {/* ADD CUSTOM RULE MODAL */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white border-2 border-black max-w-lg w-full p-6 space-y-4 text-black rounded-none shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-serif font-black flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span>Create Persistent Strategy Rule</span>
              </h3>
              <button
                onClick={() => setIsAddRuleOpen(false)}
                className="p-1 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRule} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-gray-700">Rule Type:</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer font-mono font-bold">
                    <input
                      type="radio"
                      name="ruleType"
                      checked={newRuleType === 'ENTRY'}
                      onChange={() => setNewRuleType('ENTRY')}
                      className="accent-[#1a1a1a]"
                    />
                    <span className="text-emerald-700">ENTRY TRIGGER</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-mono font-bold">
                    <input
                      type="radio"
                      name="ruleType"
                      checked={newRuleType === 'EXIT'}
                      onChange={() => setNewRuleType('EXIT')}
                      className="accent-[#1a1a1a]"
                    />
                    <span className="text-rose-700">EXIT / STOP SIGNAL</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-gray-700">Rule Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10-day EMA Bounce Confirmation"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 font-bold focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-gray-700">Category Tag:</label>
                <input
                  type="text"
                  placeholder="e.g. Custom Moving Average / Volume"
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-gray-700">Condition Formula / Condition Text:</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Low >= 10 EMA AND RSI >= 55"
                  value={newRuleFormula}
                  onChange={(e) => setNewRuleFormula(e.target.value)}
                  className="w-full p-2 border border-gray-300 font-mono text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold uppercase text-gray-700">Description:</label>
                <textarea
                  rows={2}
                  placeholder="Describe the trade logic and reasoning for this persistent rule..."
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-mono text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-amber-300 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Persistent Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="p-4 bg-[#f9f8f5] border-t border-[#e5e4e1] flex items-center justify-between text-xs font-mono text-gray-600">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-600" />
          <span>All rule changes and stock checklist states automatically persist in local storage.</span>
        </div>
        <span className="font-bold text-black">{stock.ticker} — Minervini SEPA Matrix</span>
      </div>

    </div>
  );
};
