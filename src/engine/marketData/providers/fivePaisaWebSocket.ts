import type { MarketTick } from '../realtimeTypes';

export interface FivePaisaInstrument {
  exchange: 'NSE' | 'BSE' | 'MCX';
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
  reconnectJitterMs?: number;
}

type TickHandler = (tick: MarketTick) => void;
type ConnectionHandler = (connected: boolean) => void;

const exchangeCode = (exchange: FivePaisaInstrument['exchange']) =>
  exchange === 'NSE' ? 'N' : exchange === 'BSE' ? 'B' : 'M';

function instrumentKey(exchange: FivePaisaInstrument['exchange'], exchangeType: FivePaisaInstrument['exchangeType'], scripCode: number) {
  return `${exchange}:${exchangeType}:${scripCode}`;
}

function parseTick(raw: any, instrumentsByToken: Map<string, FivePaisaInstrument>): MarketTick | null {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;

  const token = Number(row.Token ?? row.ScripCode ?? row.scripCode);
  const exchRaw = String(row.Exch ?? row.exch ?? '').toUpperCase();
  const exchTypeRaw = String(row.ExchType ?? row.exchType ?? '').toUpperCase();
  const exchange = exchRaw === 'N' ? 'NSE' : exchRaw === 'B' ? 'BSE' : exchRaw === 'M' ? 'MCX' : null;
  const exchangeType = exchTypeRaw === 'C' || exchTypeRaw === 'D' || exchTypeRaw === 'U' ? exchTypeRaw : null;
  const instrument =
    exchange && exchangeType
      ? instrumentsByToken.get(instrumentKey(exchange, exchangeType, token))
      : Array.from(instrumentsByToken.values()).find(x => x.scripCode === token);

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
  private readonly instrumentsByToken: Map<string, FivePaisaInstrument>;

  constructor(
    private readonly config: FivePaisaRealtimeConfig,
    private readonly onTick: TickHandler,
    private readonly onConnection?: ConnectionHandler
  ) {
    this.instrumentsByToken = new Map(
      config.instruments.map(i => [instrumentKey(i.exchange, i.exchangeType, i.scripCode), i])
    );
  }

  connect() {
    this.stopped = false;
    this.open();
  }

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
      this.onConnection?.(true);
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
        const rows = Array.isArray(payload)
          ? payload
          : (payload.Data || payload.data || payload.Body || payload.body || payload);

        if (Array.isArray(rows)) {
          for (const row of rows) {
            const tick = parseTick(row, this.instrumentsByToken);
            if (tick) this.onTick(tick);
          }
        } else {
          const tick = parseTick(rows, this.instrumentsByToken);
          if (tick) this.onTick(tick);
        }
      } catch {
        // Ignore malformed broker frames.
      }
    };

    this.ws.onerror = () => this.ws?.close();
    this.ws.onclose = () => {
      this.ws = null;
      this.onConnection?.(false);
      if (!this.stopped) {
        const baseDelay = this.config.reconnectMs ?? 3000;
        const jitter = this.config.reconnectJitterMs ?? 0;
        const delay = baseDelay + jitter;
        this.reconnectTimer = setTimeout(() => this.open(), delay);
      }
    };
  }
}
