import fs from 'node:fs/promises';
import path from 'node:path';
import { downloadFivePaisaScripMaster, FivePaisaScrip } from '../engine/marketData/fivePaisaScripMaster';

export class FivePaisaScripMasterService {
  private cache = new Map<string, FivePaisaScrip>();
  private lastUpdatedAt: string | null = null;
  private timer: NodeJS.Timeout | null = null;
  private readonly filePath: string;

  constructor() {
    this.filePath = process.env.FIVEPAISA_SCRIP_MASTER_FILE || path.join(process.cwd(), 'data', '5paisa-scrip-master.json');
  }

  async start(): Promise<void> {
    await this.refresh();
    const hours = Math.max(1, Number(process.env.FIVEPAISA_SCRIP_MASTER_REFRESH_HOURS || 24));
    this.timer = setInterval(() => this.refresh().catch(err => console.error('5Paisa scrip master refresh failed:', err)), hours * 60 * 60 * 1000);
  }

  async refresh(): Promise<number> {
    const records = await downloadFivePaisaScripMaster();
    const next = new Map<string, FivePaisaScrip>();
    for (const item of records) next.set(this.key(item.exchange, item.symbol), item);
    this.cache = next;
    this.lastUpdatedAt = new Date().toISOString();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf8');
    return records.length;
  }

  async loadFromDisk(): Promise<number> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const records = JSON.parse(raw) as FivePaisaScrip[];
      this.cache = new Map(records.map(x => [this.key(x.exchange, x.symbol), x]));
      this.lastUpdatedAt = (await fs.stat(this.filePath)).mtime.toISOString();
      return records.length;
    } catch { return 0; }
  }

  get(exchange: 'NSE' | 'BSE' | 'MCX', symbol: string): FivePaisaScrip | undefined {
    return this.cache.get(this.key(exchange, symbol));
  }

  allCashInstruments(): FivePaisaScrip[] {
    return Array.from(this.cache.values()).sort((a, b) => a.exchange.localeCompare(b.exchange) || a.symbol.localeCompare(b.symbol));
  }

  allAutoInstruments(): FivePaisaScrip[] {
    return this.allCashInstruments();
  }

  findMany(instruments: Array<{ exchange: 'NSE' | 'BSE' | 'MCX'; symbol: string }>): FivePaisaScrip[] {
    return instruments.map(x => this.get(x.exchange, x.symbol)).filter((x): x is FivePaisaScrip => Boolean(x));
  }

  status() {
    return { configured: true, filePath: this.filePath, count: this.cache.size, updatedAt: this.lastUpdatedAt, universeMode: (process.env.AUTO_UNIVERSE || 'true').toLowerCase() === 'true' ? 'FULL_NSE_BSE_CASH_MCX' : 'CONFIGURED_SYMBOLS' };
  }

  private key(exchange: string, symbol: string) { return `${exchange.toUpperCase()}:${symbol.trim().toUpperCase()}`; }
}
