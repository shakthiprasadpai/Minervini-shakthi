export const BACKTEST_EVENT = 'sepa:backtest-request';
let pending: string | null = null;

/** Ask the Backtest section to fill in a ticker. Works even if the section is not on screen yet. */
export function requestBacktest(ticker: string): void {
  pending = ticker;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(BACKTEST_EVENT));
}

/** The ticker waiting to be tested, once. */
export function takePendingBacktest(): string | null {
  const t = pending;
  pending = null;
  return t;
}
