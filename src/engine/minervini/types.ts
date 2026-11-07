import type { PricePoint } from '../../types';

export interface MinerviniEngineResult {
  ticker: string;
  /** Trend Template rules passed, out of `trendTemplateMax`. */
  trendTemplateScore: number;
  /** 8, or 7 when no RS rating was available for rule 8. */
  trendTemplateMax: number;
  trendTemplatePassed: boolean;
  /** 1-99 RS rating: universe-ranked if supplied via input, else approximated from the benchmark. */
  rsRating?: number;
  /** Raw benchmark-relative score; pass these through rankRsRatings across your universe. */
  rsScore?: number;
  stage: 'STAGE_2' | 'NOT_STAGE_2' | 'UNKNOWN';
  vcpDetected: boolean;
  vcpScore: number;
  contractions?: import('../../types').VcpContraction[];
  volumeScore: number;
  breakoutStatus: 'ABOVE_PIVOT' | 'IN_BUY_ZONE' | 'BELOW_PIVOT' | 'NO_PIVOT';
  pivotPrice?: number;
  buyZoneMax?: number;
  stopLoss?: number;
  target1?: number;
  target2?: number;
  riskReward?: number;
  /** Stage 2 + full Trend Template + valid VCP, regardless of where price sits versus the pivot. */
  setupValid: boolean;
  entryStatus: 'READY' | 'WATCH' | 'INVALID';
  exitStatus: 'HOLD' | 'REDUCE' | 'EXIT';
  overallScore: number;
  reasons: string[];
}

export interface MinerviniInput {
  ticker: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  /** Universe-ranked 1-99 RS rating; takes precedence over a benchmark-derived approximation. */
  rsRating?: number;
  pivotPrice?: number;
  /** Fixed stop distance below the pivot (%); overrides the ATR stop when set. */
  stopLossPercent?: number;
  atrMultiple?: number;
}
