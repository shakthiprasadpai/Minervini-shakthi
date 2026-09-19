import {
  FivePaisaMarketFeed,
  type FivePaisaInstrument,
  type FivePaisaRealtimeConfig
} from './fivePaisaWebSocket';
import type { MarketTick } from '../realtimeTypes';

export interface FivePaisaWebSocketPoolConfig extends Omit<FivePaisaRealtimeConfig, 'instruments'> {
  /** Keep below the documented 200-subscription tier to leave operational headroom. */
  shardSize?: number;
  /** Maximum simultaneous websocket connections used by this process. */
  maxConnections?: number;
  /** Symbols that must remain live while lower-priority shards rotate. */
  prioritySymbols?: string[];
  /** Rotate one secondary shard at this interval when the universe exceeds connection capacity. */
  rotationIntervalMs?: number;
  /** Stagger connection startup to avoid a reconnect storm. */
  connectionStaggerMs?: number;
}

interface ShardState {
  index: number;
  instruments: FivePaisaInstrument[];
  priority: boolean;
  active: boolean;
  connected: boolean;
  startedAt: string | null;
}

type PoolConnectionHandler = (connected: boolean) => void;

function key(i: FivePaisaInstrument) {
  return `${i.exchange}:${i.symbol}`.toUpperCase();
}

export class FivePaisaWebSocketPool {
  private feeds = new Map<number, FivePaisaMarketFeed>();
  private shards: ShardState[] = [];
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private stopped = true;
  private cursor = 0;
  private connectedCount = 0;
  private lastRotationAt: string | null = null;

  constructor(
    private readonly config: FivePaisaWebSocketPoolConfig,
    private readonly onTick: (tick: MarketTick) => void,
    private readonly onConnection?: PoolConnectionHandler
  ) {}

  async start(instruments: FivePaisaInstrument[]) {
    this.stop();

    const unique = new Map<string, FivePaisaInstrument>();
    for (const instrument of instruments) unique.set(key(instrument), instrument);

    const prioritySet = new Set(
      (this.config.prioritySymbols || [])
        .map(x => x.trim().toUpperCase())
        .filter(Boolean)
    );

    const ranked = Array.from(unique.values()).sort((a, b) => {
      const ap = prioritySet.has(key(a)) ? 0 : 1;
      const bp = prioritySet.has(key(b)) ? 0 : 1;
      return ap - bp || a.exchange.localeCompare(b.exchange) || a.symbol.localeCompare(b.symbol);
    });

    const shardSize = Math.max(1, Math.min(200, Math.floor(this.config.shardSize ?? 180)));
    const rawShards: FivePaisaInstrument[][] = [];
    for (let i = 0; i < ranked.length; i += shardSize) rawShards.push(ranked.slice(i, i + shardSize));

    const priorityCount = ranked.filter(x => prioritySet.has(key(x))).length;
    const priorityShardCount = Math.max(1, Math.ceil(priorityCount / shardSize));
    const maxConnections = Math.max(priorityShardCount, Math.floor(this.config.maxConnections ?? 4));

    this.shards = rawShards.map((items, index) => ({
      index,
      instruments: items,
      priority: index < priorityShardCount,
      active: false,
      connected: false,
      startedAt: null
    }));

    this.stopped = false;
    const activeCount = Math.min(this.shards.length, maxConnections);

    for (let i = 0; i < activeCount; i++) {
      await this.activateShard(i);
      const stagger = Math.max(0, Number(this.config.connectionStaggerMs ?? 350));
      if (stagger && i < activeCount - 1) await new Promise(resolve => setTimeout(resolve, stagger));
    }

    if (this.shards.length > activeCount && this.config.rotationIntervalMs !== 0) {
      const interval = Math.max(10_000, Number(this.config.rotationIntervalMs ?? 60_000));
      this.rotationTimer = setInterval(() => this.rotateSecondaryShard(maxConnections), interval);
    }
  }

  stop() {
    this.stopped = true;
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    this.rotationTimer = null;
    for (const feed of this.feeds.values()) feed.disconnect();
    this.feeds.clear();
    this.shards.forEach(s => { s.active = false; s.connected = false; });
    this.connectedCount = 0;
  }

  status() {
    const total = this.shards.reduce((n, s) => n + s.instruments.length, 0);
    const activeSubscriptions = this.shards.filter(s => s.active).reduce((n, s) => n + s.instruments.length, 0);
    const prioritySubscriptions = this.shards.filter(s => s.priority).reduce((n, s) => n + s.instruments.length, 0);
    return {
      enabled: total > 0,
      totalInstruments: total,
      shardCount: this.shards.length,
      activeShards: this.shards.filter(s => s.active).length,
      connectedShards: this.shards.filter(s => s.connected).length,
      connections: this.connectedCount,
      activeSubscriptions,
      prioritySubscriptions,
      coveragePercent: total ? Number(((activeSubscriptions / total) * 100).toFixed(2)) : 0,
      rotationEnabled: Boolean(this.rotationTimer),
      lastRotationAt: this.lastRotationAt,
      shards: this.shards.map(s => ({
        index: s.index,
        instruments: s.instruments.length,
        priority: s.priority,
        active: s.active,
        connected: s.connected,
        startedAt: s.startedAt
      }))
    };
  }

  private async activateShard(index: number) {
    if (this.stopped || this.feeds.has(index)) return;
    const shard = this.shards[index];
    if (!shard) return;

    const feedConfig: FivePaisaRealtimeConfig = {
      ...this.config,
      instruments: shard.instruments,
      reconnectJitterMs: Math.min(2_000, index * 250)
    };

    const feed = new FivePaisaMarketFeed(
      feedConfig,
      tick => this.onTick(tick),
      connected => {
        const current = this.shards[index];
        if (!current) return;
        if (current.connected !== connected) {
          current.connected = connected;
          this.connectedCount += connected ? 1 : -1;
          this.onConnection?.(this.connectedCount > 0);
        }
      }
    );

    this.feeds.set(index, feed);
    shard.active = true;
    shard.startedAt = new Date().toISOString();
    feed.connect();
  }

  private deactivateShard(index: number) {
    const feed = this.feeds.get(index);
    if (!feed) return;
    feed.disconnect();
    this.feeds.delete(index);
    const shard = this.shards[index];
    if (shard) {
      shard.active = false;
      if (shard.connected) {
        shard.connected = false;
        this.connectedCount = Math.max(0, this.connectedCount - 1);
      }
    }
  }

  private rotateSecondaryShard(maxConnections: number) {
    if (this.stopped || this.shards.length <= maxConnections) return;

    const activeSecondary = this.shards
      .filter(s => s.active && !s.priority)
      .sort((a, b) => a.index - b.index);
    const inactiveSecondary = this.shards
      .filter(s => !s.active && !s.priority)
      .sort((a, b) => a.index - b.index);

    if (!activeSecondary.length || !inactiveSecondary.length) return;

    const oldShard = activeSecondary[this.cursor % activeSecondary.length];
    const newShard = inactiveSecondary[this.cursor % inactiveSecondary.length];
    this.cursor++;
    this.deactivateShard(oldShard.index);
    void this.activateShard(newShard.index);
    this.lastRotationAt = new Date().toISOString();
  }
}
