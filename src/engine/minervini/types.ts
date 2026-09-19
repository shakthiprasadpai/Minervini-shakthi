import type { PricePoint } from '../../types';

export interface MinerviniEngineResult {
  ticker: string;
  trendTemplateScore: number;
  trendTemplatePassed: boolean;
  rsRating?: number;
  stage: 'STAGE_2' | 'NOT_STAGE_2' | 'UNKNOWN';
  vcpDetected: boolean;
  vcpScore: number;
  volumeScore: number;
  breakoutStatus: 'ABOVE_PIVOT' | 'IN_BUY_ZONE' | 'BELOW_PIVOT' | 'NO_PIVOT';
  pivotPrice?: number;
  buyZoneMax?: number;
  stopLoss?: number;
  target1?: number;
  target2?: number;
  riskReward?: number;
  entryStatus: 'READY' | 'WATCH' | 'INVALID';
  exitStatus: 'HOLD' | 'REDUCE' | 'EXIT';
  overallScore: number;
  reasons: string[];
}

export interface MinerviniInput {
  ticker: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  rsRating?: number;
  pivotPrice?: number;
  stopLossPercent?: number;
}
