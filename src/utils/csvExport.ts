import { PortfolioHolding, MinerviniTradeSetup } from '../types';

/**
 * Escapes strings for CSV format to avoid broken formatting when values contain quotes, commas, or line breaks.
 */
const escapeCsvCell = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Trigger file download in browser
 */
const downloadCsv = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports current Portfolio Holdings to CSV
 */
export const exportPortfolioToCsv = (holdings: PortfolioHolding[]) => {
  const headers = [
    'Ticker',
    'Company Name',
    'Exchange',
    'Shares',
    'Entry Price',
    'Current Price',
    'Total Cost Value',
    'Current Market Value',
    'Unrealized Gain/Loss ($)',
    'Unrealized Gain/Loss (%)',
    'Stop Loss Price',
    'Max Risk Amount ($)',
    'Target Price',
    'Reward/Risk Ratio',
    'Buy Date',
    'VCP Stage',
    'Notes / Strategy Rationale'
  ];

  const rows = holdings.map((h) => {
    const costValue = h.shares * h.entryPrice;
    const currentVal = h.shares * h.currentPrice;
    const pnlDollar = currentVal - costValue;
    const pnlPercent = costValue > 0 ? (pnlDollar / costValue) * 100 : 0;
    const riskDollar = (h.entryPrice - h.stopLossPrice) * h.shares;
    const targetGainDollar = (h.pivotTargetPrice - h.entryPrice) * h.shares;
    const rrRatio = riskDollar > 0 ? (targetGainDollar / riskDollar).toFixed(2) : 'N/A';

    return [
      escapeCsvCell(h.ticker),
      escapeCsvCell(h.stockName),
      escapeCsvCell(h.exchange),
      escapeCsvCell(h.shares),
      escapeCsvCell((h.entryPrice ?? 0).toFixed(2)),
      escapeCsvCell((h.currentPrice ?? 0).toFixed(2)),
      escapeCsvCell(costValue.toFixed(2)),
      escapeCsvCell(currentVal.toFixed(2)),
      escapeCsvCell(pnlDollar.toFixed(2)),
      escapeCsvCell(`${pnlPercent.toFixed(2)}%`),
      escapeCsvCell((h.stopLossPrice ?? 0).toFixed(2)),
      escapeCsvCell(riskDollar > 0 ? riskDollar.toFixed(2) : '0.00'),
      escapeCsvCell((h.pivotTargetPrice ?? 0).toFixed(2)),
      escapeCsvCell(rrRatio),
      escapeCsvCell(h.buyDate),
      escapeCsvCell(h.vcpStage),
      escapeCsvCell(h.notes || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`SEPA_Portfolio_Holdings_${dateStr}.csv`, csvContent);
};

/**
 * Exports Trade Plans & SEPA Scanner Setups to CSV
 */
export const exportTradePlansToCsv = (stocks: MinerviniTradeSetup[]) => {
  const headers = [
    'Ticker',
    'Company Name',
    'Exchange',
    'Sector',
    'Pattern Type',
    'VCP Stage',
    'Trend Template Score (/8)',
    'Current Price',
    'Pivot Buy Price',
    'Stop Loss Price',
    'Stop Loss Risk (%)',
    'Target 1 Price',
    'Target 1 Gain (%)',
    'Reward/Risk Ratio',
    'Volume Dry-Up (%)',
    'Breakout Volume Target',
    '50 SMA',
    '150 SMA',
    '200 SMA',
    'Trader Notes (Saved Local)'
  ];

  const rows = stocks.map((s) => {
    // Read saved notes for ticker from localStorage if present
    let savedNote = '';
    try {
      savedNote = localStorage.getItem(`sepa_trade_notes_${s.ticker}`) || '';
    } catch (e) {
      // ignore
    }

    return [
      escapeCsvCell(s.ticker),
      escapeCsvCell(s.name),
      escapeCsvCell(s.exchange),
      escapeCsvCell(s.sector),
      escapeCsvCell(s.patternType),
      escapeCsvCell(s.vcpStage),
      escapeCsvCell(`${s.trendScore}/8`),
      escapeCsvCell((s.currentPrice ?? 0).toFixed(2)),
      escapeCsvCell((s.pivotPrice ?? 0).toFixed(2)),
      escapeCsvCell((s.stopLossPrice ?? 0).toFixed(2)),
      escapeCsvCell(`-${s.stopLossPercent}%`),
      escapeCsvCell((s.target1Price ?? 0).toFixed(2)),
      escapeCsvCell(`+${(s.target1Percent ?? 0).toFixed(1)}%`),
      escapeCsvCell(`${(s.riskRewardRatio ?? 0).toFixed(2)}:1`),
      escapeCsvCell(`${s.volumeDryUpPercent}%`),
      escapeCsvCell(s.pivotVolume ? Math.round(s.pivotVolume) : 'N/A'),
      escapeCsvCell((s.sma50 ?? 0).toFixed(2)),
      escapeCsvCell((s.sma150 ?? 0).toFixed(2)),
      escapeCsvCell((s.sma200 ?? 0).toFixed(2)),
      escapeCsvCell(savedNote)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`SEPA_Trade_Plans_${dateStr}.csv`, csvContent);
};

/**
  * Exports Watchlist & Portfolio formatted for Indian Brokerage Import tools (Zerodha Kite, Groww, AngelOne)
  */
export const exportBrokerageWatchlistToCsv = (stocks: MinerviniTradeSetup[], brokerage: 'zerodha' | 'groww' | 'angelone' = 'zerodha') => {
  let headers: string[] = [];
  let rows: string[] = [];

  if (brokerage === 'zerodha') {
    headers = ['tradingsymbol', 'exchange', 'instrument_token', 'name'];
    rows = stocks.map((s) => [
      escapeCsvCell(s.ticker),
      escapeCsvCell(s.exchange || 'NSE'),
      escapeCsvCell(''),
      escapeCsvCell(s.name)
    ].join(','));
  } else if (brokerage === 'groww') {
    headers = ['Symbol', 'Exchange', 'Segment', 'Alert Price'];
    rows = stocks.map((s) => [
      escapeCsvCell(s.ticker),
      escapeCsvCell(s.exchange || 'NSE'),
      escapeCsvCell('EQUITY'),
      escapeCsvCell(s.pivotPrice.toFixed(2))
    ].join(','));
  } else {
    // AngelOne / general
    headers = ['Scriptname', 'Exchange', 'Token', 'BuyTriggerPrice', 'StopLossPrice'];
    rows = stocks.map((s) => [
      escapeCsvCell(s.ticker),
      escapeCsvCell(s.exchange || 'NSE'),
      escapeCsvCell(''),
      escapeCsvCell(s.pivotPrice.toFixed(2)),
      escapeCsvCell(s.stopLossPrice.toFixed(2))
    ].join(','));
  }

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`SEPA_${brokerage.toUpperCase()}_Watchlist_${dateStr}.csv`, csvContent);
};

