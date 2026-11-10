// Sends trade alerts (new picks, manual sends, stop/target hits) to Telegram.
//
// Uses its OWN bot (TELEGRAM_ALERTS_BOT_TOKEN), separate from any bot used to
// chat with Claude — reusing one token for both would collide on webhook/polling.
// Create a second bot via @BotFather, then set in .env:
//   TELEGRAM_ALERTS_BOT_TOKEN=123456:ABC-...
//   TELEGRAM_ALERTS_CHAT_ID=your numeric chat id
//
// To find your chat id: message your new bot once, then GET
// https://api.telegram.org/bot<token>/getUpdates and read message.chat.id.

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export function telegramAlertsConfigured(): boolean {
  return Boolean((process.env.TELEGRAM_ALERTS_BOT_TOKEN || '').trim() && (process.env.TELEGRAM_ALERTS_CHAT_ID || '').trim());
}

export async function sendTelegramAlert(message: string): Promise<{ ok: boolean; error?: string }> {
  const token = (process.env.TELEGRAM_ALERTS_BOT_TOKEN || '').trim();
  const chatId = (process.env.TELEGRAM_ALERTS_CHAT_ID || '').trim();
  if (!token || !chatId) {
    return { ok: false, error: 'TELEGRAM_ALERTS_NOT_CONFIGURED' };
  }
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { ok: false, error: data?.description || `HTTP_${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// One-time helper for the user to discover their chat id while setting this up.
export async function fetchTelegramChatIdHint(): Promise<{ ok: boolean; chatIds?: number[]; error?: string }> {
  const token = (process.env.TELEGRAM_ALERTS_BOT_TOKEN || '').trim();
  if (!token) return { ok: false, error: 'TELEGRAM_ALERTS_BOT_TOKEN_NOT_SET' };
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getUpdates`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) return { ok: false, error: data?.description || `HTTP_${res.status}` };
    const ids = Array.from(new Set((data.result || []).map((u: any) => u.message?.chat?.id).filter((x: any) => x != null)));
    return { ok: true, chatIds: ids as number[] };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
