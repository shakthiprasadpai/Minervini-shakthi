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
  adaptivePriorityEnabled?: boolean;
  adaptivePriorityMax?: number;
  adaptivePromoteScore?: number;
  adaptiveDemoteScore?: number;
  adaptiveRebalanceMs?: number;
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
  private priorityScores = new Map<string, number>();
  private manualPriority = new Set<string>();
  private adaptiveTimer: ReturnType<typeof setInterval> | null = null;
  private adaptiveRebalanceInProgress = false;

  constructor(
    private readonly config: FivePaisaWebSocketPoolConfig,
    private readonly onTick: (tick: MarketTick) => void,
    private readonly onConnection?: PoolConnectionHandler
  ) {}

  async start(instruments: FivePaisaInstrument[]) {
    this.stop();

    const unique = new Map<string, FivePaisaInstrument>();
    for (const instrument of instruments) unique.set(key(instrument), instrument);

    this.manualPriority = new Set(
      (this.config.prioritySymbols || [])
        .map(x => x.trim().toUpperCase())
        .filter(Boolean)
    );
    const prioritySet = this.effectivePrioritySet(unique);
    const ranked = this.rankInstruments(Array.from(unique.values()), prioritySet);

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

    if (this.config.adaptivePriorityEnabled !== false && this.config.adaptiveRebalanceMs !== 0) {
      const interval = Math.max(5_000, Number(this.config.adaptiveRebalanceMs ?? 15_000));
      this.adaptiveTimer = setInterval(() => void this.rebalanceAdaptivePriority(), interval);
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
    if (this.adaptiveTimer) clearInterval(this.adaptiveTimer);
    this.adaptiveTimer = null;
    this.priorityScores.clear();
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
      adaptivePriorityEnabled: this.config.adaptivePriorityEnabled !== false,
      adaptivePriorityCount: this.effectivePrioritySet(new Map(this.shards.flatMap(s => s.instruments).map(i => [key(i), i]))).size,
      topAdaptive: Array.from(this.priorityScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([symbol, score]) => ({ symbol, score })),
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

  updatePriorityScore(instrument: FivePaisaInstrument | string, score: number) {
    const symbol = typeof instrument === 'string' ? instrument.toUpperCase() : key(instrument);
    if (!Number.isFinite(score)) return;
    this.priorityScores.set(symbol, Math.max(0, Math.min(100, score)));
  }

  private effectivePrioritySet(instruments: Map<string, FivePaisaInstrument>) {
    const result = new Set<string>(this.manualPriority);
    if (this.config.adaptivePriorityEnabled === false) return result;

    const maxAdaptive = Math.max(0, Math.floor(this.config.adaptivePriorityMax ?? this.config.shardSize ?? 180));
    const promote = Number(this.config.adaptivePromoteScore ?? 70);
    const demote = Number(this.config.adaptiveDemoteScore ?? 55);
    const ranked = Array.from(this.priorityScores.entries())
      .filter(([symbol]) => instruments.has(symbol))
      .sort((a, b) => b[1] - a[1]);

    const currentlyAdaptive = new Set(
      this.shards.filter(s => s.priority).flatMap(s => s.instruments.map(key))
    );

    for (const [symbol, score] of ranked) {
      if (result.size >= maxAdaptive + this.manualPriority.size) break;
      if (score >= promote || (currentlyAdaptive.has(symbol) && score >= demote)) result.add(symbol);
    }
    return result;
  }

  private rankInstruments(instruments: FivePaisaInstrument[], prioritySet: Set<string>) {
    return instruments.sort((a, b) => {
      const ap = prioritySet.has(key(a)) ? 0 : 1;
      const bp = prioritySet.has(key(b)) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const as = this.priorityScores.get(key(a)) ?? 0;
      const bs = this.priorityScores.get(key(b)) ?? 0;
      return bs - as || a.exchange.localeCompare(b.exchange) || a.symbol.localeCompare(b.symbol);
    });
  }

  private async rebalanceAdaptivePriority() {
    if (this.stopped || this.adaptiveRebalanceInProgress) return;
    const instruments = new Map<string, FivePaisaInstrument>();
    for (const shard of this.shards) for (const instrument of shard.instruments) instruments.set(key(instrument), instrument);
    const desired = this.effectivePrioritySet(instruments);
    const current = new Set(this.shards.filter(s => s.priority).flatMap(s => s.instruments.map(key)));
    const changed = desired.size !== current.size || Array.from(desired).some(x => !current.has(x));
    if (!changed) return;

    this.adaptiveRebalanceInProgress = true;
    try {
      const ranked = this.rankInstruments(Array.from(instruments.values()), desired);
      const shardSize = Math.max(1, Math.min(200, Math.floor(this.config.shardSize ?? 180)));
      const raw: FivePaisaInstrument[][] = [];
      for (let i = 0; i < ranked.length; i += shardSize) raw.push(ranked.slice(i, i + shardSize));
      const priorityCount = ranked.filter(x => desired.has(key(x))).length;
      const priorityShardCount = Math.max(1, Math.ceil(priorityCount / shardSize));
      const maxConnections = Math.max(priorityShardCount, Math.floor(this.config.maxConnections ?? 4));
      for (const feed of this.feeds.values()) feed.disconnect();
      this.feeds.clear();
      this.shards = raw.map((items, index) => ({
        index, instruments: items, priority: index < priorityShardCount,
        active: false, connected: false, startedAt: null
      }));
      this.connectedCount = 0;
      const activeCount = Math.min(this.shards.length, maxConnections);
      for (let i = 0; i < activeCount; i++) {
        await this.activateShard(i);
        const stagger = Math.max(0, Number(this.config.connectionStaggerMs ?? 350));
        if (stagger && i < activeCount - 1) await new Promise(resolve => setTimeout(resolve, stagger));
      }
      this.lastRotationAt = new Date().toISOString();
    } finally {
      this.adaptiveRebalanceInProgress = false;
    }
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
