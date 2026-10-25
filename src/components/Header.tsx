import { BrandLogo } from './BrandLogo.tsx';
import { StudioConfig } from '../types/invoice.ts';
import { Plus, SlidersHorizontal, Download, Upload, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'ledger' | 'editor';
  setActiveTab: (tab: 'ledger' | 'editor') => void;
  studioConfig: StudioConfig;
  onOpenSettings: () => void;
  onCreateNewInvoice: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetDefaults: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  studioConfig,
  onOpenSettings,
  onCreateNewInvoice,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 py-3 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark (Single text element with logo) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/40 flex items-center justify-center p-1.5 shadow-xs shrink-0">
            <BrandLogo
              customLogoUrl={studioConfig.logoDataUrl}
              size="sm"
              variant="icon"
              theme="white"
              withText={false}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
              {studioConfig.studioName || 'Indian Pixel Studio'}
            </span>
            <span className="text-[11px] font-space-mono text-neutral-400 tracking-wider">
              LEDGER &amp; INVOICE SUITE
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Workspace Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-[#121316] border border-neutral-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'ledger'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Studio Ledger
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'editor'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Invoice Studio
          </button>
        </nav>

        {/* Zone 3: Primary Action and Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={onExportBackup}
              title="Export JSON Backup"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-md transition-colors text-xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export</span>
            </button>
            <button
              onClick={onImportBackup}
              title="Import JSON Backup"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-md transition-colors text-xs flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Import</span>
            </button>
            <button
              onClick={onResetDefaults}
              title="Reset Sample Invoices"
              className="p-2 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800/80 rounded-md transition-colors text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            title="Studio Settings & Branding"
            className="p-2 text-neutral-300 hover:text-white bg-[#121316] hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onCreateNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#ff4820] hover:bg-[#e03a14] rounded-md transition-all active:scale-[0.98] whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
}
