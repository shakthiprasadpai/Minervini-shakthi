import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, googleLogout, getAccessToken } from '../utils/googleAuth';
import {
  createWatchlistSpreadsheet,
  appendTradePlanToSheet,
  importStocksFromSpreadsheet,
  listUserSpreadsheets,
  ExportResult
} from '../utils/googleSheets';
import { exportBrokerageWatchlistToCsv } from '../utils/csvExport';
import { MinerviniTradeSetup } from '../types';
import { openGooglePicker, PickedFile } from '../utils/googlePicker';
import {
  FileSpreadsheet,
  ExternalLink,
  LogOut,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  List,
  Sparkles,
  ShieldAlert,
  FolderOpen,
  HardDrive
} from 'lucide-react';

interface GoogleSheetsIntegrationProps {
  stocks: MinerviniTradeSetup[];
  selectedStock?: MinerviniTradeSetup;
  onImportStocks?: (imported: MinerviniTradeSetup[]) => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  stocks,
  selectedStock,
  onImportStocks
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sheets & Google Picker state
  const [createdSheet, setCreatedSheet] = useState<ExportResult | null>(null);
  const [userSheets, setUserSheets] = useState<Array<{ id: string; name: string; webViewLink: string }>>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [pickedFileDetails, setPickedFileDetails] = useState<PickedFile | null>(null);
  const [sheetTitleInput, setSheetTitleInput] = useState<string>(
    `SEPA Growth Watchlist - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  );

  const handleLaunchGooglePicker = async (viewType: 'SPREADSHEETS' | 'DOCS' | 'ALL' = 'SPREADSHEETS') => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      await openGooglePicker({
        accessToken: token,
        viewType,
        onFilePicked: (file: PickedFile) => {
          setPickedFileDetails(file);
          setSelectedSheetId(file.id);
          setUserSheets((prev) => {
            if (prev.some((s) => s.id === file.id)) return prev;
            return [{ id: file.id, name: file.name, webViewLink: file.url }, ...prev];
          });
          setStatusMsg({
            type: 'success',
            text: `Selected "${file.name}" via Google Picker!`,
          });
        },
        onCancel: () => {
          setStatusMsg({
            type: 'info',
            text: 'Google Picker dialog closed.',
          });
        },
      });
    } catch (err: any) {
      console.error('Google Picker error:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to open Google Picker.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Modal confirm state for destructive/overwrite actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setNeedsAuth(false);
        fetchUserSheets(token);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchUserSheets = async (token?: string) => {
    try {
      const accessToken = token || (await getAccessToken());
      if (!accessToken) return;
      const sheets = await listUserSpreadsheets(accessToken);
      setUserSheets(sheets);
      if (sheets.length > 0) {
        setSelectedSheetId(sheets[0].id);
      }
    } catch (err) {
      console.error('Error listing Google Sheets:', err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        setStatusMsg({ type: 'success', text: `Successfully connected Google account (${result.user.email})` });
        fetchUserSheets(result.accessToken);
      } else {
        setStatusMsg({ type: 'info', text: 'Google Sign-In window was closed.' });
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setStatusMsg({ type: 'info', text: 'Google Sign-In window was closed.' });
      } else {
        setStatusMsg({ type: 'error', text: err?.message || 'Google Sign-In failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setUser(null);
    setNeedsAuth(true);
    setCreatedSheet(null);
    setStatusMsg({ type: 'info', text: 'Disconnected from Google Sheets.' });
  };

  // 1. Export Watchlist to New Google Sheet
  const handleExportNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      const result = await createWatchlistSpreadsheet(token, sheetTitleInput, stocks);
      setCreatedSheet(result);
      setStatusMsg({
        type: 'success',
        text: `Exported ${stocks.length} candidates to Google Sheet "${result.title}"!`
      });
      fetchUserSheets(token);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Export to Google Sheet failed.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Append Selected Stock Trade Plan
  const handleAppendTradePlan = async () => {
    if (!selectedStock) return;
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    if (!selectedSheetId) {
      setStatusMsg({ type: 'error', text: 'Please select a Google Sheet or create a new one first.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      await appendTradePlanToSheet(token, selectedSheetId, selectedStock);
      setStatusMsg({
        type: 'success',
        text: `Appended ${selectedStock.ticker} trade plan to selected Google Sheet!`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to append trade plan.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Confirm Import with User
  const triggerImportFromSheet = () => {
    if (!selectedSheetId) {
      setStatusMsg({ type: 'error', text: 'Please select a Google Sheet to import from.' });
      return;
    }

    const sheetName = userSheets.find((s) => s.id === selectedSheetId)?.name || 'selected sheet';

    setConfirmModal({
      isOpen: true,
      title: 'Import Stock Candidates from Google Sheet?',
      description: `This will parse rows from "${sheetName}" and add them into your active Minervini SEPA screener view.`,
      action: async () => {
        const token = await getAccessToken();
        if (!token) return;
        setLoading(true);
        try {
          const imported = await importStocksFromSpreadsheet(token, selectedSheetId);
          if (onImportStocks) {
            onImportStocks(imported);
          }
          setStatusMsg({
            type: 'success',
            text: `Successfully imported ${imported.length} stock setups from Google Sheet!`
          });
        } catch (err: any) {
          setStatusMsg({ type: 'error', text: err.message || 'Import failed.' });
        } finally {
          setLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="bg-white border border-[#e5e4e1] p-6 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e4e1] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#107c41] text-white flex items-center justify-center font-bold shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b5a68d]">
                Google Workspace Integration
              </span>
              <span className="bg-[#107c41] text-white text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 font-bold">
                Live Google Sheets
              </span>
            </div>
            <h3 className="text-xl font-serif font-black text-[#1a1a1a] tracking-tight leading-none mt-1">
              Google Sheets Live Sync & Watchlist Export
            </h3>
          </div>
        </div>

        {/* User Auth Status */}
        {user ? (
          <div className="flex items-center space-x-3 bg-[#f9f8f5] border border-[#e5e4e1] px-3.5 py-1.5 text-xs">
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full border border-[#e5e4e1]" />
            )}
            <div className="text-left font-mono">
              <span className="block font-bold text-[#1a1a1a] text-[11px] leading-none">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-gray-500 truncate max-w-[150px] block">
                {user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Disconnect Google Account"
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="gsi-material-button hover:shadow-md transition-all border border-[#e5e4e1] bg-white px-4 py-2 flex items-center space-x-2"
          >
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '18px', height: '18px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="text-xs font-bold text-[#1a1a1a]">Sign in with Google</span>
          </button>
        )}
      </div>

      {/* Status Messages Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 border text-xs font-mono flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : statusMsg.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-700" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-700" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          {createdSheet && (
            <a
              href={createdSheet.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 font-bold underline hover:text-black ml-4"
            >
              <span>Open Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Main Actions Panel */}
      {needsAuth ? (
        <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-6 text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="text-base font-serif font-black text-[#1a1a1a]">
            Connect Google Sheets to Sync Your SEPA Watchlist
          </h4>
          <p className="text-xs text-gray-600 font-serif italic max-w-lg mx-auto">
            Authorize Google Drive & Sheets to seamlessly export candidate stocks, append trade risk logs, and import spreadsheets directly into Growth Stock Alpha.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-6 py-2.5 text-xs uppercase tracking-widest inline-flex items-center space-x-2 transition-all border border-black shadow-xs mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-green-400" />}
            <span>Connect Google Sheets Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Create New Google Sheet Export */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#b5a68d] font-bold block">Action 1</span>
              <h4 className="text-base font-serif font-black text-[#1a1a1a]">
                Export Watchlist to New Google Sheet
              </h4>
              <p className="text-xs text-gray-500 font-serif italic mt-0.5">
                Creates a formatted spreadsheet with {stocks.length} candidates, SEPA scores, pivot prices, & stop losses.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold">
                Spreadsheet Title
              </label>
              <input
                type="text"
                value={sheetTitleInput}
                onChange={(e) => setSheetTitleInput(e.target.value)}
                className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-mono text-[#1a1a1a] focus:border-black focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportNewSheet}
              disabled={loading}
              className="w-full bg-[#107c41] hover:bg-[#0b5b30] text-white font-bold py-2.5 text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export {stocks.length} Stocks to Google Sheet</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Append Single Stock & Import */}
          <div className="bg-[#f9f8f5] border border-[#e5e4e1] p-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#b5a68d] font-bold block">Action 2</span>
              <h4 className="text-base font-serif font-black text-[#1a1a1a]">
                Existing Sheet Sync & Import
              </h4>
              <p className="text-xs text-gray-500 font-serif italic mt-0.5">
                Append trade setup records or import custom stocks from your Google Drive spreadsheets.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold">
                  Select Existing Google Sheet
                </label>
                <button
                  type="button"
                  onClick={() => handleLaunchGooglePicker('SPREADSHEETS')}
                  disabled={loading}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center space-x-1 transition-all shadow-xs"
                >
                  <FolderOpen className="w-3 h-3 text-amber-400" />
                  <span>Browse Drive Picker</span>
                </button>
              </div>

              {userSheets.length > 0 ? (
                <select
                  value={selectedSheetId}
                  onChange={(e) => {
                    setSelectedSheetId(e.target.value);
                    const matched = userSheets.find((s) => s.id === e.target.value);
                    if (matched) {
                      setPickedFileDetails({
                        id: matched.id,
                        name: matched.name,
                        mimeType: 'application/vnd.google-apps.spreadsheet',
                        url: matched.webViewLink,
                      });
                    }
                  }}
                  className="w-full bg-white border border-[#e5e4e1] p-2 text-xs font-mono text-[#1a1a1a] focus:border-black focus:outline-none"
                >
                  {userSheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-400 italic bg-white p-2 border border-[#e5e4e1]">
                  No existing spreadsheets loaded yet. Click 'Browse Drive Picker' to choose any file from your Google Drive!
                </div>
              )}
            </div>

            {pickedFileDetails && (
              <div className="bg-white border border-[#e5e4e1] p-3 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 uppercase font-bold text-[9px]">Picked via Google Picker</span>
                  <a
                    href={pickedFileDetails.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-800 hover:underline flex items-center space-x-1 font-bold"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="font-bold text-[#1a1a1a] truncate">{pickedFileDetails.name}</div>
                <div className="text-gray-400 text-[10px] truncate">ID: {pickedFileDetails.id}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleAppendTradePlan}
                disabled={loading || !selectedStock || !selectedSheetId}
                className="bg-[#1a1a1a] hover:bg-black text-white font-bold py-2 text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log {selectedStock ? selectedStock.ticker : 'Stock'}</span>
              </button>

              <button
                onClick={triggerImportFromSheet}
                disabled={loading || !selectedSheetId}
                className="bg-white hover:bg-gray-100 text-[#1a1a1a] font-bold py-2 text-xs uppercase tracking-wider flex items-center justify-center space-x-1 border border-[#e5e4e1] transition-all disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Sheet</span>
              </button>
            </div>

          </div>

          {/* Google Picker Dedicated Feature Banner */}
          <div className="md:col-span-2 bg-[#1a1a1a] text-white p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs border border-black shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-400 text-black flex items-center justify-center font-bold">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Google Picker API Dialog</span>
                <span className="text-gray-400 text-[11px] font-sans">
                  Open Google's native file picker modal to pick spreadsheets or files directly from your Google Drive.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleLaunchGooglePicker('SPREADSHEETS')}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Pick Spreadsheets</span>
              </button>

              <button
                onClick={() => handleLaunchGooglePicker('ALL')}
                disabled={loading}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-3.5 py-1.5 text-xs uppercase tracking-wider flex items-center space-x-1.5 border border-gray-700 transition-all shadow-xs"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Pick All Drive Files</span>
              </button>
            </div>
          </div>

          {/* Indian Brokerage Watchlist CSV Export Banner */}
          <div className="md:col-span-2 bg-[#f9f8f5] text-[#1a1a1a] p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs border border-[#e5e4e1] shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1a1a1a] text-amber-400 flex items-center justify-center font-bold">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#1a1a1a] block">Indian Brokerage Watchlist CSV Export</span>
                <span className="text-gray-600 text-[11px] font-sans">
                  Download watchlists formatted for direct import into Zerodha Kite, Groww, or AngelOne.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportBrokerageWatchlistToCsv(stocks, 'zerodha')}
                className="bg-[#38761d] hover:bg-[#2e6217] text-white font-bold px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center space-x-1 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Zerodha Kite CSV</span>
              </button>

              <button
                onClick={() => exportBrokerageWatchlistToCsv(stocks, 'groww')}
                className="bg-[#00d09c] hover:bg-[#00b082] text-black font-bold px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center space-x-1 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Groww CSV</span>
              </button>

              <button
                onClick={() => exportBrokerageWatchlistToCsv(stocks, 'angelone')}
                className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-bold px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center space-x-1 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>AngelOne CSV</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5e4e1] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6 text-amber-700" />
              </div>
              <h4 className="text-lg font-serif font-black text-[#1a1a1a]">
                {confirmModal.title}
              </h4>
            </div>

            <p className="text-xs text-gray-600 font-serif leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#e5e4e1]">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action}
                disabled={loading}
                className="bg-[#1a1a1a] hover:bg-black text-white font-bold px-5 py-2 text-xs uppercase tracking-widest flex items-center space-x-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Import</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
