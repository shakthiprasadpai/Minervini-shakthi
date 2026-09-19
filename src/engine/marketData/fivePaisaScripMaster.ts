import { request } from 'node:https';
import { request as httpRequest } from 'node:http';

export interface FivePaisaScrip {
  exchange: 'NSE' | 'BSE' | 'MCX';
  exchangeType: 'C' | 'D' | 'U';
  scripCode: number;
  symbol: string;
  name?: string;
  isin?: string;
  series?: string;
}

export interface FivePaisaScripMasterConfig {
  url?: string;
  timeoutMs?: number;
}

const DEFAULT_URL = 'https://openapi.5paisa.com/VendorsAPI/Service1.svc/ScripMaster/segment/All';

function fetchText(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? request : httpRequest;
    const req = client(url, { headers: { 'User-Agent': 'Minervini-shakthi/1.0', Accept: '*/*' } }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(new URL(res.headers.location, url).toString(), timeoutMs).then(resolve, reject);
        return;
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`5Paisa scrip master HTTP ${res.statusCode ?? 'unknown'}`));
        res.resume();
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(Buffer.from(c)));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('5Paisa scrip master request timed out')));
    req.on('error', reject);
    req.end();
  });
}

function value(row: Record<string, unknown>, ...keys: string[]): unknown {
  const normalized = new Map(Object.entries(row).map(([k, v]) => [k.replace(/[^a-z0-9]/gi, '').toLowerCase(), v]));
  for (const key of keys) {
    const v = normalized.get(key.replace(/[^a-z0-9]/gi, '').toLowerCase());
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return undefined;
}

function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

function parseJsonRows(text: string): Record<string, unknown>[] {
  const parsed = JSON.parse(text);
  const data = Array.isArray(parsed) ? parsed : (parsed?.data ?? parsed?.Data ?? parsed?.body ?? parsed?.Body ?? parsed?.result ?? parsed?.Result ?? []);
  return Array.isArray(data) ? data : [];
}

export function parseFivePaisaScripMaster(text: string): FivePaisaScrip[] {
  const trimmed = text.trim();
  const rows = trimmed.startsWith('[') || trimmed.startsWith('{') ? parseJsonRows(trimmed) : parseCsv(trimmed);
  const result: FivePaisaScrip[] = [];
  for (const row of rows) {
    const exchRaw = String(value(row, 'Exch', 'Exchange') ?? '').toUpperCase();
    const exchange = exchRaw === 'N' || exchRaw === 'NSE' ? 'NSE' : exchRaw === 'B' || exchRaw === 'BSE' ? 'BSE' : exchRaw === 'M' || exchRaw === 'MCX' ? 'MCX' : null;
    const exchangeType = String(value(row, 'ExchType', 'ExchangeType') ?? '').toUpperCase();
    const code = Number(value(row, 'ScripCode', 'Scrip', 'ScripCodeId'));
    const symbol = String(value(row, 'Symbol', 'Name', 'ScripName', 'ShortName') ?? '').trim().toUpperCase();
    if (!exchange || !((exchange === 'MCX' && exchangeType === 'D') || ((exchange === 'NSE' || exchange === 'BSE') && exchangeType === 'C')) || !Number.isFinite(code) || !symbol) continue;
    result.push({
      exchange,
      exchangeType: 'C',
      scripCode: code,
      symbol,
      name: String(value(row, 'FullName', 'Name') ?? '').trim() || undefined,
      isin: String(value(row, 'ISIN') ?? '').trim() || undefined,
      series: String(value(row, 'Series') ?? '').trim() || undefined,
    });
  }
  return result;
}

export async function downloadFivePaisaScripMaster(config: FivePaisaScripMasterConfig = {}): Promise<FivePaisaScrip[]> {
  const text = await fetchText(config.url || process.env.FIVEPAISA_SCRIP_MASTER_URL || DEFAULT_URL, config.timeoutMs || Number(process.env.FIVEPAISA_SCRIP_MASTER_TIMEOUT_MS || 30000));
  return parseFivePaisaScripMaster(text);
}
