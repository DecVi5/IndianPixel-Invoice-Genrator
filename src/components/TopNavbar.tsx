import { useState } from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import type { Invoice, StudioConfig } from '../types/invoice.ts';
import { formatIndianCurrency } from '../utils/financials.ts';
import {
  Search,
  ChevronDown,
  Moon,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  Menu,
  Target,
  TrendingDown,
  Edit3,
  Check,
  Cloud,
  RefreshCw,
  LogOut,
} from 'lucide-react';

interface TopNavbarProps {
  activeTab: 'home' | 'create' | 'invoices' | 'settings' | 'analytics' | 'editor';
  setActiveTab: (tab: 'home' | 'create' | 'invoices' | 'settings' | 'analytics' | 'editor') => void;
  onCreateInvoice: () => void;
  studioConfig: StudioConfig;
  invoices?: Invoice[];
  onUpdateFinancialGoal?: (newGoal: number) => void;
  isDarkMode?: boolean;
  onToggleDarkMode: () => void;
  onLockStudio: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetDefaults: () => void;
  invoicesCount?: number;
  timeFilter?: string;
  setTimeFilter?: (val: string) => void;
  onOpenSearch?: () => void;
  onToggleMobileMenu?: () => void;
  // Google Drive Cloud Persistence Props
  driveConnected?: boolean;
  driveUserEmail?: string | null;
  driveFileName?: string | null;
  driveLastSynced?: string | null;
  isDriveSyncing?: boolean;
  onConnectGoogleDrive?: () => void;
  onSyncToGoogleDrive?: () => void;
  onRestoreFromGoogleDrive?: () => void;
  onDisconnectGoogleDrive?: () => void;
}

export function TopNavbar({
  activeTab,
  setActiveTab,
  onCreateInvoice,
  studioConfig,
  invoices = [],
  onUpdateFinancialGoal,
  onLockStudio,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  invoicesCount = 0,
  timeFilter = 'Last 30 days',
  setTimeFilter,
  onOpenSearch,
  onToggleMobileMenu,
  driveConnected = false,
  driveUserEmail = null,
  driveFileName = null,
  driveLastSynced = null,
  isDriveSyncing = false,
  onConnectGoogleDrive,
  onSyncToGoogleDrive,
  onRestoreFromGoogleDrive,
  onDisconnectGoogleDrive,
}: TopNavbarProps) {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isGoalPopoverOpen, setIsGoalPopoverOpen] = useState(false);
  const [isDrivePopoverOpen, setIsDrivePopoverOpen] = useState(false);

  const financialGoal = studioConfig.financialGoal ?? 500000;
  const [goalInput, setGoalInput] = useState<string>(String(financialGoal));

  const totalTransactionsReduction = invoices.reduce(
    (sum, inv) => sum + (Number(inv.totalAmountDue) || 0),
    0
  );
  const remainingGoal = Math.max(0, financialGoal - totalTransactionsReduction);
  const remainingRatio =
    financialGoal > 0 ? Math.max(0, Math.min(100, Math.round((remainingGoal / financialGoal) * 100))) : 0;

  const filterOptions = ['Last 30 days', 'Last 90 days', 'Current FY 2026-27', 'All Time'];
  const goalPresets = [100000, 500000, 1000000, 2500000, 5000000];

  const handleSaveGoal = (val?: number) => {
    const parsed = val !== undefined ? val : Math.max(0, Number(goalInput) || 0);
    setGoalInput(String(parsed));
    onUpdateFinancialGoal?.(parsed);
    setIsGoalPopoverOpen(false);
  };

  return (
    <header className="relative z-30 w-full px-5 sm:px-8 lg:px-10 py-3.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 border-b border-[#ACBEA3]/15 bg-[#08221B]/95 backdrop-blur-xl select-none">
      {/* Left: Mobile Drawer Trigger + Brand Identity (No background box on logo) */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-[#F8F4ED] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-[#FFA400]" />
          </button>
        )}

        {/* Brand Mark & Title — Clean transparent logo without background box */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <BrandLogo
            customLogoUrl={studioConfig.logoDataUrl}
            size="sm"
            variant="icon"
            theme="white"
            withText={false}
          />
          <div>
            <span className="font-montserrat font-bold text-sm sm:text-base text-[#F8F4ED] tracking-tight block leading-tight">
              {studioConfig.studioName || 'Indian Pixel'}
            </span>
            <span className="text-[10px] text-[#ACBEA3] font-space-mono hidden sm:block">
              Financial Suite
            </span>
          </div>
        </div>

        {/* Desktop Quick Breadcrumbs / Mode Pill */}
        <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-[#ACBEA3]/20">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#2C3330] text-[#FFA400] font-semibold border border-[#FFA400]/40'
                : 'text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330]/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'invoices'
                ? 'bg-[#2C3330] text-[#FFA400] font-semibold border border-[#FFA400]/40'
                : 'text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330]/50'
            }`}
          >
            <span>Invoices</span>
            {invoicesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#ACBEA3]/20 text-[#ACBEA3] font-space-mono">
                {invoicesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Center / Top: Financial Goal Countdown Tracker (Reduces on Every Transaction) */}
      <div className="relative order-3 lg:order-2 w-full lg:w-auto flex justify-center">
        <button
          type="button"
          onClick={() => {
            setGoalInput(String(financialGoal));
            setIsGoalPopoverOpen(!isGoalPopoverOpen);
          }}
          className="w-full lg:w-auto px-3 py-1.5 rounded-2xl bg-[#2C3330] hover:bg-[#353d39] border border-[#FFA400]/40 transition-all flex items-center justify-between lg:justify-start gap-2.5 cursor-pointer shadow-sm group"
          title="Click to set or adjust your Studio Financial Goal"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#08221B] border border-[#FFA400]/40 flex items-center justify-center text-[#FFA400] shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-montserrat font-bold uppercase tracking-wider text-[#ACBEA3]">
                  Financial Goal Remaining
                </span>
                <Edit3 className="w-2.5 h-2.5 text-[#FFA400] opacity-80 group-hover:opacity-100" />
              </div>
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold font-space-mono text-[#F8F4ED] tabular-nums">
                  {formatIndianCurrency(remainingGoal)}
                </span>
                <span className="text-[10px] font-space-mono text-[#ACBEA3]">
                  / {formatIndianCurrency(financialGoal)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Reduction Pill & Mini Bar */}
          <div className="flex flex-col items-end gap-1 pl-2.5 border-l border-[#ACBEA3]/20 whitespace-nowrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-space-mono font-semibold text-[#FFA400]">
              <TrendingDown className="w-3 h-3" />
              <span>-{formatIndianCurrency(totalTransactionsReduction)}</span>
              <span className="text-[#ACBEA3] text-[9px]">({invoices.length} txns)</span>
            </span>
            <div className="w-20 h-1.5 rounded-full bg-[#08221B] overflow-hidden border border-[#ACBEA3]/20">
              <div
                className="h-full bg-[#FFA400] transition-all duration-500 rounded-full"
                style={{ width: `${remainingRatio}%` }}
              />
            </div>
          </div>
        </button>

        {/* Financial Goal Editor Popover */}
        {isGoalPopoverOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#08221B] border border-[#FFA400]/50 shadow-2xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 text-[#F8F4ED]"
          >
            <div className="flex items-center justify-between border-b border-[#ACBEA3]/20 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FFA400]" />
                <span className="text-xs font-montserrat font-bold text-[#F8F4ED] uppercase tracking-wider">
                  Set Target Financial Goal
                </span>
              </div>
              <span className="text-[10px] font-space-mono text-[#FFA400]">
                Auto-Reduces per Txn
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/25 space-y-1 text-[11px]">
              <div className="flex justify-between text-[#ACBEA3]">
                <span>Starting Target Goal:</span>
                <span className="font-space-mono text-[#F8F4ED] font-semibold">
                  {formatIndianCurrency(financialGoal)}
                </span>
              </div>
              <div className="flex justify-between text-[#FFA400]">
                <span>Reduced by {invoices.length} Transaction(s):</span>
                <span className="font-space-mono font-bold">
                  - {formatIndianCurrency(totalTransactionsReduction)}
                </span>
              </div>
              <div className="flex justify-between text-[#F8F4ED] font-bold pt-1 border-t border-[#ACBEA3]/20">
                <span>Remaining Goal Balance:</span>
                <span className="font-space-mono text-[#FFA400]">
                  {formatIndianCurrency(remainingGoal)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#ACBEA3] uppercase mb-1">
                TARGET GOAL AMOUNT (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveGoal();
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/40 text-xs font-space-mono font-bold text-[#F8F4ED] focus:border-[#FFA400] outline-none"
                  placeholder="e.g. 500000"
                />
                <button
                  type="button"
                  onClick={() => handleSaveGoal()}
                  className="px-3.5 py-2 rounded-xl bg-[#FFA400] hover:bg-[#e69400] text-[#08221B] font-montserrat font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Set</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-montserrat font-bold text-[#ACBEA3] uppercase block">
                Quick Target Presets
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {goalPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSaveGoal(preset)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-space-mono font-semibold border transition-colors cursor-pointer ${
                      financialGoal === preset
                        ? 'bg-[#FFA400] text-[#08221B] border-[#FFA400] font-bold'
                        : 'bg-[#2C3330] text-[#ACBEA3] hover:text-[#F8F4ED] border-[#ACBEA3]/30'
                    }`}
                  >
                    ₹{preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Google Drive Cloud Sync, Search, Filter, Tools & CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5 order-2 md:order-3 shrink-0">
        {/* Google Drive Cloud Persistence Button & Popover */}
        <div className="relative shrink-0">
          {!driveConnected ? (
            <button
              type="button"
              onClick={onConnectGoogleDrive}
              disabled={isDriveSyncing}
              className="gsi-material-button px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/40 text-xs font-poppins font-medium text-[#F8F4ED] flex items-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              title="Sign in with Google to persist invoices & settings in Google Drive"
            >
              <div className="w-3.5 h-3.5 shrink-0">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span className="hidden xl:inline">Connect Google Drive</span>
              <span className="xl:hidden">Drive</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDrivePopoverOpen(!isDrivePopoverOpen)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#FFA400]/50 text-xs font-poppins font-semibold text-[#F8F4ED] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              title="Google Drive Cloud Persistence Active"
            >
              <Cloud
                className={`w-3.5 h-3.5 text-[#FFA400] shrink-0 ${
                  isDriveSyncing ? 'animate-bounce' : ''
                }`}
              />
              <span className="hidden xl:inline">
                {isDriveSyncing ? 'Syncing Drive...' : 'Drive Synced'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#ACBEA3] shrink-0" />
            </button>
          )}

          {/* Google Drive Cloud Control Popover */}
          {isDrivePopoverOpen && driveConnected && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#08221B] border border-[#FFA400]/50 shadow-2xl p-3.5 z-50 space-y-2.5 animate-in fade-in zoom-in-95 text-[#F8F4ED]"
              style={{ transformOrigin: 'top right' }}
            >
              <div className="flex items-center justify-between border-b border-[#ACBEA3]/20 pb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#FFA400]" />
                  <span className="text-xs font-montserrat font-bold uppercase tracking-wider">
                    Google Drive Persistence
                  </span>
                </div>
                <span className="text-[9px] font-space-mono px-1.5 py-0.5 rounded bg-[#FFA400]/20 text-[#FFA400] font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/25 space-y-1 text-[11px]">
                <div className="flex justify-between text-[#ACBEA3]">
                  <span>Account:</span>
                  <span className="font-space-mono text-[#F8F4ED] truncate max-w-[155px]">
                    {driveUserEmail || 'Connected User'}
                  </span>
                </div>
                <div className="flex justify-between text-[#ACBEA3]">
                  <span>Cloud File:</span>
                  <span className="font-space-mono text-[#FFA400] truncate max-w-[155px]">
                    {driveFileName || 'indian-pixel-studio-ledger.json'}
                  </span>
                </div>
                {driveLastSynced && (
                  <div className="flex justify-between text-[#ACBEA3]">
                    <span>Last Sync:</span>
                    <span className="font-space-mono text-[#F8F4ED]">{driveLastSynced}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrivePopoverOpen(false);
                    onSyncToGoogleDrive?.();
                  }}
                  disabled={isDriveSyncing}
                  className="w-full py-2 px-3 rounded-xl bg-[#FFA400] hover:bg-[#e69400] text-[#08221B] font-montserrat font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Ledger to Google Drive</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrivePopoverOpen(false);
                    onRestoreFromGoogleDrive?.();
                  }}
                  disabled={isDriveSyncing}
                  className="w-full py-2 px-3 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/35 text-[#F8F4ED] font-poppins font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Load / Restore from Drive</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrivePopoverOpen(false);
                    onDisconnectGoogleDrive?.();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl text-rose-300 hover:bg-rose-950/30 text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Disconnect Google Drive</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Icon */}
        <button
          onClick={onOpenSearch}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-[#ACBEA3] hover:text-[#F8F4ED] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Search Invoices & Clients"
          aria-label="Search Invoices"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Date Filter Dropdown (Hidden on small mobile phones) */}
        <div className="relative hidden sm:block shrink-0">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="px-3 py-1.5 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-xs text-[#F8F4ED] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#ACBEA3] shrink-0" />
            <span>{timeFilter}</span>
            <ChevronDown className="w-3 h-3 text-[#ACBEA3] shrink-0" />
          </button>

          {isFilterDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl bg-[#08221B] border border-[#ACBEA3]/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
              style={{ transformOrigin: 'top right' }}
            >
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setTimeFilter?.(opt);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    timeFilter === opt
                      ? 'bg-[#2C3330] text-[#FFA400] font-medium'
                      : 'text-[#ACBEA3] hover:bg-[#2C3330]/60 hover:text-[#F8F4ED]'
                  }`}
                >
                  <span>{opt}</span>
                  {timeFilter === opt && <CheckCircle2 className="w-3.5 h-3.5 text-[#FFA400]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Action Button: + Generate Invoice (Amber Yellow CTA) */}
        <button
          onClick={onCreateInvoice}
          className="press-scale flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#FFA400] hover:bg-[#ffb426] text-[#08221B] font-montserrat font-bold text-xs shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Generate Invoice</span>
          <span className="sm:hidden">Invoice</span>
        </button>

        {/* Studio Tools Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-[#ACBEA3] hover:text-[#F8F4ED] flex items-center justify-center transition-colors cursor-pointer"
            title="Studio Actions & Settings"
            aria-label="Studio Options"
          >
            <ChevronDown className="w-3.5 h-3.5 text-[#ACBEA3]" />
          </button>

          {isToolsDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-[#08221B] border border-[#ACBEA3]/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1"
              style={{ transformOrigin: 'top right' }}
            >
              <div className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#ACBEA3] bg-[#2C3330]/60 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Dark Theme Locked</span>
                </span>
                <span className="text-[9px] font-space-mono text-[#FFA400] font-bold">ON</span>
              </div>

              {!driveConnected ? (
                <button
                  onClick={() => {
                    setIsToolsDropdownOpen(false);
                    onConnectGoogleDrive?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#FFA400] hover:bg-[#2C3330] flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Connect Google Drive</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsToolsDropdownOpen(false);
                    onSyncToGoogleDrive?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#FFA400] hover:bg-[#2C3330] flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Sync to Google Drive</span>
                </button>
              )}

              <button
                onClick={() => {
                  onExportBackup();
                  setIsToolsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330] flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Export Data Backup</span>
              </button>

              <button
                onClick={() => {
                  onImportBackup();
                  setIsToolsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330] flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#ACBEA3]" />
                <span>Restore from File</span>
              </button>

              <button
                onClick={() => {
                  onResetDefaults();
                  setIsToolsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset to 0</span>
              </button>

              <div className="border-t border-[#ACBEA3]/15 my-1" />

              <button
                onClick={() => {
                  onLockStudio();
                  setIsToolsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#FFA400] hover:bg-[#2C3330] flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Studio Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
