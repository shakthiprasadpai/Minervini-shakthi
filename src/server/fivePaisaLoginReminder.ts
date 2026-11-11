// Pings Telegram when the 5paisa session needs re-login. This never logs in
// automatically (that would mean handling your password/OTP, which isn't
// something to automate) — it just makes sure you find out promptly instead
// of only noticing when you open the app.
import { sendTelegramAlert, telegramAlertsConfigured } from './telegramAlertService';
import { fivePaisaAuth } from './fivePaisaAuthService';

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const IST_OFFSET_MINUTES = 5 * 60 + 30;

function istDateKey(): string {
  const istMs = Date.now() + IST_OFFSET_MINUTES * 60000;
  return new Date(istMs).toISOString().slice(0, 10); // YYYY-MM-DD in IST
}

/** Starts a periodic check; sends at most one Telegram reminder per IST calendar day. */
export function startFivePaisaLoginReminder(): void {
  if ((process.env.REALTIME_MARKET_PROVIDER || '').toLowerCase() !== '5paisa') return;

  let lastReminderDateKey: string | null = null;

  const check = async () => {
    if (!telegramAlertsConfigured()) return;
    if (fivePaisaAuth.getAccessToken()) return; // signed in — nothing to do

    const todayKey = istDateKey();
    if (lastReminderDateKey === todayKey) return; // already reminded today

    const r = await sendTelegramAlert(
      '⚠️ <b>5paisa session not active</b>\nLive prices and the screener need you to sign in again. ' +
      'Open the app and tap "Sign in again" to resume.'
    );
    if (r.ok) {
      lastReminderDateKey = todayKey;
      console.log('[5paisa-login-reminder] Sent re-login reminder to Telegram.');
    } else {
      console.error('[5paisa-login-reminder] Send failed:', r.error);
    }
  };

  setInterval(check, CHECK_INTERVAL_MS).unref?.();
  check(); // also check once at startup
}
