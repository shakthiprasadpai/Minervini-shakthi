import { MinerviniTradeSetup } from '../types';

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates a brand new formatted Google Spreadsheet with the provided SEPA Watchlist stocks.
 */
export async function createWatchlistSpreadsheet(
  accessToken: string,
  title: string,
  stocks: MinerviniTradeSetup[]
): Promise<ExportResult> {
  const headers = [
    'Ticker',
    'Company Name',
    'Exchange',
    'Sector',
    'Industry',
    'Price',
    'Change %',
    'SEPA Score',
    'Pattern Type',
    'VCP Stage',
    'Volume Dry-Up %',
    'Pivot Price',
    'Stop Loss',
    'Target 1 (+20%)',
    'Risk/Reward Ratio',
    'RS Rating',
  ];

  const rows = stocks.map((s) => [
    s.ticker,
    s.name,
    s.exchange,
    s.sector,
    s.industry,
    s.currentPrice,
    `${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%`,
    `${s.trendScore}/8`,
    s.patternType,
    s.vcpStage,
    `${s.volumeDryUpPercent}%`,
    s.pivotPrice,
    s.stopLossPrice,
    s.target1Price,
    `${s.riskRewardRatio.toFixed(1)}x`,
    s.rsRating,
  ]);

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Mark Minervini SEPA Watchlist - ${new Date().toLocaleDateString()}`,
      },
      sheets: [
        {
          properties: {
            title: 'SEPA Candidates',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headers.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.1, green: 0.1, blue: 0.1 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        fontSize: 10,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
                ...rows.map((row) => ({
                  values: row.map((val) => {
                    if (typeof val === 'number') {
                      return { userEnteredValue: { numberValue: val } };
                    }
                    return { userEnteredValue: { stringValue: String(val) } };
                  }),
                })),
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: data.properties?.title || title,
  };
}

/**
 * Appends a stock trade plan to an existing Google Spreadsheet.
 */
export async function appendTradePlanToSheet(
  accessToken: string,
  spreadsheetId: string,
  stock: MinerviniTradeSetup,
  notes: string = ''
): Promise<void> {
  const rowData = [
    new Date().toISOString().split('T')[0],
    stock.ticker,
    stock.exchange,
    stock.currentPrice,
    stock.pivotPrice,
    stock.stopLossPrice,
    stock.target1Price,
    `${stock.riskRewardRatio.toFixed(1)}x`,
    stock.trendScore,
    stock.vcpStage,
    `${stock.volumeDryUpPercent}%`,
    notes || 'Calculated via Minervini SEPA Engine',
  ];

  const range = 'Sheet1!A:L';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to append trade record to Google Sheet');
  }
}

/**
 * Imports SEPA stocks from a user's Google Spreadsheet.
 */
export async function importStocksFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<MinerviniTradeSetup[]> {
  const range = 'A1:Z100';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to read data from Google Spreadsheet');
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  if (rows.length <= 1) {
    throw new Error('Spreadsheet contains no data rows to import.');
  }

  const headerRow = rows[0].map((h) => h.toLowerCase());
  const tickerIdx = headerRow.findIndex((h) => h.includes('ticker') || h.includes('symbol'));
  const nameIdx = headerRow.findIndex((h) => h.includes('name') || h.includes('company'));
  const priceIdx = headerRow.findIndex((h) => h.includes('price') || h.includes('current'));
  const pivotIdx = headerRow.findIndex((h) => h.includes('pivot') || h.includes('entry'));
  const stopIdx = headerRow.findIndex((h) => h.includes('stop') || h.includes('loss'));
  const exchangeIdx = headerRow.findIndex((h) => h.includes('exchange'));

  const importedStocks: MinerviniTradeSetup[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const ticker = (tickerIdx !== -1 && r[tickerIdx]) ? r[tickerIdx].toUpperCase().trim() : `STOCK${i}`;
    const name = (nameIdx !== -1 && r[nameIdx]) ? r[nameIdx].trim() : `${ticker} Corp`;
    const price = priceIdx !== -1 && !isNaN(Number(r[priceIdx])) ? Number(r[priceIdx]) : 100;
    const pivot = pivotIdx !== -1 && !isNaN(Number(r[pivotIdx])) ? Number(r[pivotIdx]) : price * 1.05;
    const stop = stopIdx !== -1 && !isNaN(Number(r[stopIdx])) ? Number(r[stopIdx]) : pivot * 0.93;
    const exchange = (exchangeIdx !== -1 && r[exchangeIdx]) ? r[exchangeIdx].toUpperCase() : 'NASDAQ';

    const stopPct = ((pivot - stop) / pivot) * 100;
    const target1 = pivot * 1.2;
    const target2 = pivot * 1.35;
    const target3 = pivot * 1.5;
    const rr = stopPct > 0 ? 20 / stopPct : 3;

    importedStocks.push({
      ticker,
      name,
      exchange: (exchange === 'NSE' ? 'NSE' : exchange === 'NYSE' ? 'NYSE' : 'NASDAQ') as any,
      sector: 'Growth / Tech',
      industry: 'Market Leaders',
      currentPrice: price,
      changePercent: 1.5,
      sma50: price * 0.95,
      sma150: price * 0.88,
      sma200: price * 0.82,
      sma200_1mo_ago: price * 0.8,
      high52w: price * 1.02,
      low52w: price * 0.5,
      rsRating: 88,
      trendScore: 8,
      patternType: 'VCP (3 Contractions)',
      vcpStage: 'Breakout Pending',
      pivotPrice: pivot,
      buyZoneMax: pivot * 1.05,
      stopLossPrice: stop,
      stopLossPercent: stopPct,
      target1Price: target1,
      target1Percent: 20,
      target2Price: target2,
      target2Percent: 35,
      avgVolume20d: 1500000,
      pivotVolume: 250000,
      volumeDryUpPercent: -68,
      isTightVolume: true,
      riskRewardRatio: rr,
      contractions: [],
      priceHistory: [],
      sepaNotes: 'Imported from Google Sheets Watchlist.',
    });
  }

  return importedStocks;
}

/**
 * Lists Google Spreadsheets accessible in the user's Drive.
 */
export async function listUserSpreadsheets(accessToken: string): Promise<Array<{ id: string; name: string; webViewLink: string }>> {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=20&orderBy=modifiedTime%20desc`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to list Google Spreadsheets');
  }

  const data = await response.json();
  return data.files || [];
}
