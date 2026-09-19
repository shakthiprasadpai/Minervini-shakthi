import type { Response } from 'express';
import { FivePaisaMarketFeed, type FivePaisaInstrument } from '../engine/marketData/providers/fivePaisaWebSocket';
import type { MarketTick } from '../engine/marketData/realtimeTypes';

export class RealtimeMarketFeedService {
  private feed: FivePaisaMarketFeed | null = null;
  private clients = new Set<Response>();
  private latest = new Map<string, MarketTick>();
  private connected = false;

  start() {
    const accessToken = process.env.FIVEPAISA_ACCESS_TOKEN;
    const clientCode = process.env.FIVEPAISA_CLIENT_CODE;
    const raw = process.env.FIVEPAISA_INSTRUMENTS_JSON;
    if (!accessToken || !clientCode || !raw) return false;

    let instruments: FivePaisaInstrument[];
    try { instruments = JSON.parse(raw); }
    catch { throw new Error('FIVEPAISA_INSTRUMENTS_JSON must be valid JSON'); }

    this.feed = new FivePaisaMarketFeed(
      {
        accessToken,
        clientCode,
        websocketUrl: process.env.FIVEPAISA_WEBSOCKET_URL,
        instruments,
        reconnectMs: Number(process.env.FIVEPAISA_RECONNECT_MS || 3000)
      },
      tick => {
        this.connected = true;
        this.latest.set(`${tick.exchange}:${tick.symbol}`, tick);
        const payload = `data: ${JSON.stringify(tick)}\\n\\n`;
        for (const response of this.clients) response.write(payload);
      }
    );
    this.feed.connect();
    return true;
  }

  stop() {
    this.feed?.disconnect();
    this.feed = null;
    this.connected = false;
    for (const response of this.clients) response.end();
    this.clients.clear();
  }

  status() {
    return {
      configured: Boolean(process.env.FIVEPAISA_ACCESS_TOKEN && process.env.FIVEPAISA_CLIENT_CODE && process.env.FIVEPAISA_INSTRUMENTS_JSON),
      connected: this.connected,
      instruments: this.latest.size
    };
  }

  addClient(response: Response) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();
    for (const tick of this.latest.values()) response.write(`data: ${JSON.stringify(tick)}\\n\\n`);
    this.clients.add(response);
    response.on('close', () => this.clients.delete(response));
  }
}
