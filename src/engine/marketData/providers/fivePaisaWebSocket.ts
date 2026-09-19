import type { MarketTick } from '../realtimeTypes';

export interface FivePaisaInstrument {
  exchange: 'NSE' | 'BSE';
  exchangeType: 'C' | 'D' | 'U';
  scripCode: number;
  symbol: string;
}

export interface FivePaisaRealtimeConfig {
  accessToken: string;
  clientCode: string;
  websocketUrl?: string;
  instruments: FivePaisaInstrument[];
  reconnectMs?: number;
}

type TickHandler = (tick: MarketTick) => void;
const exchangeCode = (exchange: FivePaisaInstrument['exchange']) => exchange === 'NSE' ? 'N' : 'B';

function parseTick(raw: any, instruments: FivePaisaInstrument[]): MarketTick | null {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  const token = Number(row.Token ?? row.ScripCode ?? row.scripCode);
  const instrument = instruments.find(x => x.scripCode === token);
  if (!instrument) return null;
  const price = Number(row.LastRate ?? row.lastRate ?? row.LTP ?? row.ltp);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    exchange: instrument.exchange,
    symbol: instrument.symbol,
    scripCode: instrument.scripCode,
    price,
    volume: Number(row.TotalQty ?? row.totalQty ?? row.Volume ?? row.volume ?? 0),
    dayHigh: Number(row.High ?? row.high ?? 0),
    dayLow: Number(row.Low ?? row.low ?? 0),
    open: Number(row.OpenRate ?? row.openRate ?? row.Open ?? 0),
    previousClose: Number(row.PClose ?? row.pClose ?? row.PreviousClose ?? 0),
    changePercent: Number(row.ChgPcnt ?? row.chgPcnt ?? 0),
    timestamp: row.TickDt ? new Date(row.TickDt).toISOString() : new Date().toISOString()
  };
}

export class FivePaisaMarketFeed {
  private ws: WebSocket | null = null;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly config: FivePaisaRealtimeConfig, private readonly onTick: TickHandler) {}

  connect() { this.stopped = false; this.open(); }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
  }

  private open() {
    if (this.stopped) return;
    const base = this.config.websocketUrl || 'wss://openfeed.5paisa.com/feeds/api/chat';
    const url = `${base}?Value1=${encodeURIComponent(this.config.accessToken)}|${encodeURIComponent(this.config.clientCode)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        Method: 'MarketFeedV3',
        Operation: 'Subscribe',
        ClientCode: this.config.clientCode,
        MarketFeedData: this.config.instruments.map(i => ({
          Exch: exchangeCode(i.exchange),
          ExchType: i.exchangeType,
          ScripCode: i.scripCode
        }))
      }));
    };

    this.ws.onmessage = event => {
      try {
        const payload = JSON.parse(String(event.data));
        const rows = Array.isArray(payload) ? payload : (payload.Data || payload.data || payload.Body || payload.body || payload);
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const tick = parseTick(row, this.config.instruments);
            if (tick) this.onTick(tick);
          }
        } else {
          const tick = parseTick(rows, this.config.instruments);
          if (tick) this.onTick(tick);
        }
      } catch {
        // Ignore malformed broker frames.
      }
    };

    this.ws.onerror = () => this.ws?.close();
    this.ws.onclose = () => {
      this.ws = null;
      if (!this.stopped) this.reconnectTimer = setTimeout(() => this.open(), this.config.reconnectMs ?? 3000);
    };
  }
}
