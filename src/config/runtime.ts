/// <reference types="vite/client" />

export const runtimeConfig = {
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};

export function requireLiveMode() {
  if (runtimeConfig.demoMode) {
    throw new Error('Live market data is disabled while VITE_DEMO_MODE=true.');
  }
}
