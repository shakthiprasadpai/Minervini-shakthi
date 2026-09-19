import { FivePaisaScripMasterService } from './fivePaisaScripMasterService';

export const fivePaisaScripMaster = new FivePaisaScripMasterService();

export async function startFivePaisaScripMaster(): Promise<void> {
  if ((process.env.REALTIME_MARKET_PROVIDER || '').toLowerCase() !== '5paisa') return;
  try {
    const count = await fivePaisaScripMaster.start().then(() => fivePaisaScripMaster.status().count);
    console.log(`5Paisa scrip master loaded: ${count} cash instruments`);
  } catch (error) {
    console.error('5Paisa scrip master startup refresh failed:', error);
    await fivePaisaScripMaster.loadFromDisk();
  }
}
