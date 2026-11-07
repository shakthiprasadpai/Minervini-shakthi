import { PricePoint } from '../../types';
import { calculatePositionSize } from '../risk/positionSizer';
import { runMinerviniEngine, TARGET_1_R } from '../minervini/minerviniEngine';
import { calculateAtr } from '../minervini/atrStop';
import { MIN_TREND_BARS } from '../minervini/indicators';
import { BacktestConfig, BacktestResult, BacktestTrade } from './types';

/** Bars of history handed to the engine per step (bounds cost to O(n x window) instead of O(n^2)). */
const ENGINE_WINDOW_BARS = 300;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function benchmarkWindow(benchmark: PricePoint[] | undefined, date: string): PricePoint[] | undefined {
  if (!benchmark?.length || !ISO_DATE.test(date) || !ISO_DATE.test(benchmark[0].date)) return undefined;
  const key = date.slice(0, 10);
  let lo = 0, hi = benchmark.length - 1, found = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (benchmark[mid].date.slice(0, 10) <= key) { found = mid; lo = mid + 1; } else hi = mid - 1; }
  return found >= 0 ? benchmark.slice(Math.max(0, found - ENGINE_WINDOW_BARS + 1), found + 1) : undefined;
}

/**
 * Minervini backtest without lookahead.
 *  - Signal: only data up to the close of bar i; setupValid and not already extended above the buy zone.
 *  - Entry: buy-stop at the pivot, live for `signalExpiryBars` bars. Fills at max(pivot, open); skipped if that is
 *    beyond the buy zone; cancelled if price trades through the stop before triggering.
 *  - Stops fill at the stop price, or at the open when price gaps through it. If a bar touches both stop and
 *    target, the stop is assumed to hit first (conservative). Gap-up opens beyond the target fill at the open.
 *  - Exit: fixed target (TARGET_1_R x initial risk) by default, or an ATR trailing stop if configured.
 *  - A position still open at the end is closed at the last close (END_OF_TEST).
 * RS is only evaluated when a benchmark is supplied, and then it is the approximate rating (see approxRsRating).
 */
export function backtestMinervini(ticker: string, candles: PricePoint[], config: BacktestConfig, benchmark?: PricePoint[]): BacktestResult {
  const slip = (config.slippagePercent ?? 0) / 100;
  const commission = (config.commissionPercent ?? 0) / 100;
  const expiry = Math.max(1, config.signalExpiryBars ?? 3);
  let capital = config.initialCapital, peak = capital, maxDD = 0;
  const trades: BacktestTrade[] = [];
  const n = candles.length;

  for (let i = MIN_TREND_BARS - 1; i < n - 1; i++) {
    const window = candles.slice(Math.max(0, i - ENGINE_WINDOW_BARS + 1), i + 1);
    const signalBar = candles[i];
    const a = runMinerviniEngine({ ticker, currentPrice: signalBar.close, priceHistory: window }, benchmarkWindow(benchmark, signalBar.date));
    if (!a.setupValid || !a.pivotPrice || !a.stopLoss || a.breakoutStatus === 'ABOVE_PIVOT') continue;

    const pivot = a.pivotPrice;
    const buyZoneMax = a.buyZoneMax ?? pivot * 1.05;
    const riskPerShare = pivot - a.stopLoss;
    if (!(riskPerShare > 0)) continue;
    const stopAtPivot = a.stopLoss;

    let entryIdx = -1, fill = 0;
    for (let j = i + 1; j <= Math.min(i + expiry, n - 1); j++) {
      const bar = candles[j];
      if (bar.low <= stopAtPivot) break;
      if (bar.open > buyZoneMax) break;
      if (bar.high >= pivot) { fill = Math.max(pivot, bar.open); if (fill <= buyZoneMax) entryIdx = j; break; }
    }
    if (entryIdx < 0) continue;

    const entry = fill * (1 + slip);
    const initialStop = fill - riskPerShare;
    const sizing = calculatePositionSize(capital, entry, initialStop, config.riskPerTradePercent, config.maxAllocationPercent ?? 20);
    if (!sizing.quantity) continue;
    const qty = sizing.quantity;

    const atr = calculateAtr(window);
    const trailMult = config.trailingAtrMultiple && atr ? config.trailingAtrMultiple : 0;
    const target = fill + riskPerShare * TARGET_1_R;
    let stop = initialStop, highestClose = fill;
    let exitIdx = n - 1, rawExit = candles[n - 1].close;
    let reason: BacktestTrade['reason'] = 'END_OF_TEST';

    for (let k = entryIdx; k < n; k++) {
      const bar = candles[k];
      const gapThroughStop = k > entryIdx && bar.open <= stop;
      if (gapThroughStop || bar.low <= stop) {
        exitIdx = k; rawExit = gapThroughStop ? bar.open : stop;
        reason = stop > initialStop ? 'TRAILING_STOP' : 'STOP';
        break;
      }
      if (!trailMult) {
        if (k > entryIdx && bar.open >= target) { exitIdx = k; rawExit = bar.open; reason = 'TARGET'; break; }
        if (bar.high >= target) { exitIdx = k; rawExit = target; reason = 'TARGET'; break; }
      } else {
        highestClose = Math.max(highestClose, bar.close);
        stop = Math.max(stop, highestClose - atr! * trailMult);
      }
    }

    const exitPrice = rawExit * (1 - slip);
    const pnl = (exitPrice - entry) * qty - (entry * qty + exitPrice * qty) * commission;
    capital += pnl;
    peak = Math.max(peak, capital);
    maxDD = Math.max(maxDD, (peak - capital) / peak * 100);
    trades.push({
      ticker, signalDate: signalBar.date, entryDate: candles[entryIdx].date, exitDate: candles[exitIdx].date,
      entryPrice: entry, exitPrice, initialStop, quantity: qty, pnl,
      returnPercent: pnl / (entry * qty) * 100, rMultiple: pnl / ((entry - initialStop) * qty), reason
    });
    i = exitIdx;
  }

  const wins = trades.filter(t => t.pnl > 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = trades.filter(t => t.pnl <= 0).reduce((s, t) => s + Math.abs(t.pnl), 0);
  return {
    initialCapital: config.initialCapital, finalCapital: capital, totalReturnPercent: (capital / config.initialCapital - 1) * 100, trades,
    winRate: trades.length ? wins.length / trades.length * 100 : 0, profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    averageRMultiple: trades.length ? trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length : 0, maxDrawdownPercent: maxDD
  };
}
