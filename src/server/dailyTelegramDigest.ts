// Sends today's swing + intraday pick to Telegram once a day, independent of
// anyone having the app open in a browser (unlike DailyPicksCard's auto-send,
// which only fires while a tab is open).
import type { MinerviniTradeSetup } from '../types';
import { pickIntraday, pickSwing } from '../utils/dailyPicks';
import { sendTelegramAlert, telegramAlertsConfigured } from './telegramAlertService';

const IST_OFFSET_MINUTES = 5 * 60 + 30;

// Hour/minute in IST the digest should fire. Override with DAILY_TELEGRAM_DIGEST_TIME="HH:MM" (IST).
function getFireTimeIst(): { hour: number; minute: number } {
  const raw = (process.env.DAILY_TELEGRAM_DIGEST_TIME || '09:00').trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m) return { hour: 9, minute: 0 };
  return { hour: Math.min(23, parseInt(m[1], 10)), minute: Math.min(59, parseInt(m[2], 10)) };
}

function msUntilNextIstFireTime(): number {
  const { hour, minute } = getFireTimeIst();
  const now = new Date();
  const nowIstMinutes = Math.floor(now.getTime() / 60000) + IST_OFFSET_MINUTES;
  const istNow = new Date(nowIstMinutes * 60000);

  const next = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), hour, minute, 0));
  let nextUtcMs = next.getTime() - IST_OFFSET_MINUTES * 60000;
  if (nextUtcMs <= Date.now()) nextUtcMs += 24 * 60 * 60 * 1000;
  return nextUtcMs - Date.now();
}

function formatDigestMessage(swing: ReturnType<typeof pickSwing>, intraday: ReturnType<typeof pickIntraday>): string {
  const lines: string[] = [`🗓️ <b>Today's picks</b>`];
  const section = (label: string, plan: ReturnType<typeof pickSwing>) => {
    if (!plan) {
      lines.push(`\n<b>${label}</b>: no stock qualifies today.`);
      return;
    }
    lines.push(
      `\n<b>${label}: ${plan.ticker}</b>\n` +
      `Buy above ₹${plan.entry.toFixed(2)} · Stop ₹${plan.stop.toFixed(2)}\n` +
      `Target 1 ₹${plan.target1.toFixed(2)} · Target 2 ₹${plan.target2.toFixed(2)}\n` +
      `Risk ${plan.riskPercent.toFixed(1)}% · R:R ${plan.rewardRisk.toFixed(1)}\n` +
      `Holding: ${plan.holdingPeriod}`
    );
  };
  section('Swing pick', swing);
  section('Intraday pick', intraday);
  return lines.join('\n');
}

/**
 * Starts a timer that fires once a day at DAILY_TELEGRAM_DIGEST_TIME (IST, default 09:00),
 * running the given screener and sending the resulting swing/intraday pick to Telegram.
 * No-ops quietly if Telegram alerts aren't configured.
 */
export function startDailyTelegramDigest(
  runScreener: () => Promise<{ results: MinerviniTradeSetup[] }>
): void {
  const fire = async () => {
    if (!telegramAlertsConfigured()) {
      console.log('[daily-telegram-digest] Skipped: TELEGRAM_ALERTS_BOT_TOKEN/CHAT_ID not set.');
      return;
    }
    try {
      const { results } = await runScreener();
      const swing = pickSwing(results);
      const intraday = pickIntraday(results);
      const r = await sendTelegramAlert(formatDigestMessage(swing, intraday));
      if (!r.ok) console.error('[daily-telegram-digest] Send failed:', r.error);
      else console.log('[daily-telegram-digest] Sent today\'s picks to Telegram.');
    } catch (e) {
      console.error('[daily-telegram-digest] Screener run failed:', e);
    } finally {
      scheduleNext();
    }
  };

  const scheduleNext = () => {
    const delay = msUntilNextIstFireTime();
    const { hour, minute } = getFireTimeIst();
    console.log(`[daily-telegram-digest] Next run at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} IST (in ${Math.round(delay / 60000)} min).`);
    setTimeout(fire, delay);
  };

  scheduleNext();
}
