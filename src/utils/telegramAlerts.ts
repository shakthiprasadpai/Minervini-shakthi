// Client-side helper for sending trade alerts to Telegram via the server
// (the bot token lives only in the server's .env, never in the browser).

export async function sendTelegramAlert(message: string): Promise<boolean> {
  try {
    const res = await fetch('/api/telegram/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function isTelegramConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/telegram/status');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.configured);
  } catch {
    return false;
  }
}

// Keeps us from re-announcing the same pick every time the screener re-runs.
const SENT_PICKS_KEY = 'minervini_telegram_sent_picks';

function readSentPicks(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SENT_PICKS_KEY) || '{}'); } catch { return {}; }
}

function writeSentPicks(map: Record<string, string>): void {
  try { localStorage.setItem(SENT_PICKS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

/**
 * Sends a Telegram alert for a swing/intraday pick only the first time this
 * ticker appears for that slot (so a page refresh doesn't re-spam the same pick).
 */
export async function notifyIfNewPick(slot: 'SWING' | 'INTRADAY', ticker: string, message: string): Promise<void> {
  const sent = readSentPicks();
  if (sent[slot] === ticker) return;
  const ok = await sendTelegramAlert(message);
  if (ok) {
    sent[slot] = ticker;
    writeSentPicks(sent);
  }
}

export function formatPickAlert(kind: 'Swing' | 'Intraday', plan: {
  ticker: string; price: number; entry: number; stop: number; target1: number; target2: number;
  riskPercent: number; rewardRisk: number; holdingPeriod: string;
}): string {
  return (
    `📈 <b>New ${kind} pick: ${plan.ticker}</b>\n` +
    `Last: ₹${plan.price.toFixed(2)}\n` +
    `Buy above: ₹${plan.entry.toFixed(2)}\n` +
    `Stop: ₹${plan.stop.toFixed(2)}\n` +
    `Target 1: ₹${plan.target1.toFixed(2)}  |  Target 2: ₹${plan.target2.toFixed(2)}\n` +
    `Risk ${plan.riskPercent.toFixed(1)}% · R:R ${plan.rewardRisk.toFixed(1)}\n` +
    `Holding: ${plan.holdingPeriod}`
  );
}
