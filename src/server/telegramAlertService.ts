// Sends trade alerts (new picks, manual sends, stop/target hits) to Telegram,
// to one or more recipients.
//
// Uses its OWN bot (TELEGRAM_ALERTS_BOT_TOKEN), separate from any bot used to
// chat with Claude — reusing one token for both would collide on webhook/polling.
// Create a second bot via @BotFather, then set in .env:
//   TELEGRAM_ALERTS_BOT_TOKEN=123456:ABC-...
//   TELEGRAM_ALERTS_CHAT_ID=your numeric chat id, or several comma-separated
//     (e.g. "1248931500,998877665") to alert multiple people individually.
//
// To find a chat id: have that person message the bot once, then GET
// https://api.telegram.org/bot<token>/getUpdates (or /api/telegram/chat-id-hint
// on this app) and read message.chat.id.

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function configuredChatIds(): string[] {
  return (process.env.TELEGRAM_ALERTS_CHAT_ID || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function telegramAlertsConfigured(): boolean {
  return Boolean((process.env.TELEGRAM_ALERTS_BOT_TOKEN || '').trim() && configuredChatIds().length > 0);
}

async function sendToOneChat(token: string, chatId: string, message: string): Promise<{ ok: boolean; error?: string }> {
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

/** Sends to every configured chat id. Succeeds if at least one recipient got it; errors list each failure. */
export async function sendTelegramAlert(message: string): Promise<{ ok: boolean; error?: string }> {
  const token = (process.env.TELEGRAM_ALERTS_BOT_TOKEN || '').trim();
  const chatIds = configuredChatIds();
  if (!token || chatIds.length === 0) {
    return { ok: false, error: 'TELEGRAM_ALERTS_NOT_CONFIGURED' };
  }
  const results = await Promise.all(chatIds.map(id => sendToOneChat(token, id, message)));
  const failures = results
    .map((r, i) => (r.ok ? null : `${chatIds[i]}: ${r.error}`))
    .filter((x): x is string => x !== null);
  const anyOk = results.some(r => r.ok);
  if (!anyOk) return { ok: false, error: failures.join('; ') };
  if (failures.length) console.error('[telegram] Some recipients failed:', failures.join('; '));
  return { ok: true };
}

export interface ChatIdHint {
  id: number;
  type: string; // 'private' | 'group' | 'supergroup' | 'channel'
  /** Group/channel title, or the person's name for a private chat. */
  name: string;
}

// One-time helper for the user to discover their chat id (and name/title, so
// several lookalike groups/people can be told apart) while setting this up.
export async function fetchTelegramChatIdHint(): Promise<{ ok: boolean; chats?: ChatIdHint[]; error?: string }> {
  const token = (process.env.TELEGRAM_ALERTS_BOT_TOKEN || '').trim();
  if (!token) return { ok: false, error: 'TELEGRAM_ALERTS_BOT_TOKEN_NOT_SET' };
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getUpdates`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) return { ok: false, error: data?.description || `HTTP_${res.status}` };
    const byId = new Map<number, ChatIdHint>();
    for (const u of data.result || []) {
      const chat = u.message?.chat;
      if (!chat?.id) continue;
      byId.set(chat.id, {
        id: chat.id,
        type: chat.type || 'unknown',
        name: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || String(chat.id)
      });
    }
    return { ok: true, chats: Array.from(byId.values()) };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
