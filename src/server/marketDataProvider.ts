import { createFivePaisaProvider, createXtsProvider } from '../engine';
import { fivePaisaAuth } from './fivePaisaAuthService';
import { fivePaisaScripMaster } from './scripMasterScheduler';
import type { MarketDataProvider } from '../engine/marketData/types';

export type ProviderName = '5paisa' | 'xts';

/** 5paisa unless MARKET_DATA_PROVIDER=xts. */
export const providerName = (): ProviderName => ((process.env.MARKET_DATA_PROVIDER || '').trim().toLowerCase() === 'xts' ? 'xts' : '5paisa');

let fivePaisa: MarketDataProvider | null = null;

/** Daily history and quotes for the screener and backtest. */
export function getMarketDataProvider(): MarketDataProvider {
  if (providerName() === 'xts') return createXtsProvider();
  fivePaisa ??= createFivePaisaProvider({
    getToken: () => fivePaisaAuth.getAccessToken() ?? null,
    lookup: (exchange, symbol) => fivePaisaScripMaster.get(exchange, symbol)
  });
  return fivePaisa;
}
