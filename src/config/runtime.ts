export const runtimeConfig = {
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};
