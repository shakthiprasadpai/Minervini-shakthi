import type { PickPlan } from './dailyPicks';

/**
 * A hand-screened fallback shown only while the live screener has no stocks loaded
 * (sign in with 5paisa above to replace this with a live, auto-refreshed pick).
 * Screened manually against the Trend Template / intraday rules on the date below.
 */
export const MANUAL_PICKS_AS_OF = '2026-11-09';

export const MANUAL_SWING_PICK: PickPlan = {
  kind: 'SWING',
  ticker: 'ICICIBANK',
  name: 'ICICI Bank',
  exchange: 'NSE',
  price: 1589.0,
  entry: 1592.0,
  stop: 1563.0,
  target1: 1650.0,
  target2: 1679.0,
  riskPercent: 1.82,
  rewardRisk: 2.0,
  reasons: [
    'All Trend Template rules pass: price above the rising 50-day and 200-day averages',
    'Relative strength positive and consistent over 1, 3 and 6 months (+6%, +9.4%, +20.3% vs Nifty)',
    'Closed at a fresh 52-week high on 1.83x average volume'
  ],
  warnings: [
    'Already up about 14.5% in the last five sessions — this is a late, extended entry, not a fresh pivot.',
    'Safer alternative: wait for it to pull back and tighten near its 21-day EMA (~₹1,443) rather than chasing here.',
    'Manually screened on 9 Nov 2026 — not live. Sign in with 5paisa so the screener can refresh this automatically.'
  ]
};

export const MANUAL_INTRADAY_PICK: PickPlan = {
  kind: 'INTRADAY',
  ticker: 'DIVISLAB',
  name: "Divi's Laboratories",
  exchange: 'NSE',
  price: 11565.5,
  entry: 11836.0,
  stop: 11569.0,
  target1: 12370.0,
  target2: 12637.0,
  riskPercent: 2.26,
  rewardRisk: 2.0,
  reasons: [
    'Last session +4.4% on 3.8x its 20-day average volume',
    'RSI 85 and MFI 87 — strong momentum, up about 24% in a month',
    'Trend Template intact: above both the 50-day and 200-day averages'
  ],
  warnings: [
    'Closed off the day’s high (₹11,824), so buy only if it actually trades above the entry — do not chase a gap.',
    'Built from daily candles. Confirm with the live price, and close the trade before 15:15.',
    'Manually screened on 9 Nov 2026 — not live. Sign in with 5paisa so the screener can refresh this automatically.'
  ]
};
