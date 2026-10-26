import { BrandLogo } from './BrandLogo.tsx';
import { StudioConfig } from '../types/invoice.ts';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  SlidersHorizontal,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Activity,
  ShieldCheck,
  Moon,
  Sun,
  X,
} from 'lucide-react';

export type MainNavTab = 'home' | 'create' | 'invoices' | 'settings' | 'editor' | 'analytics';

interface SidebarProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  studioConfig: StudioConfig;
  invoicesCount?: number;
  onOpenSettings?: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetDefaults: () => void;
  onLockStudio?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onCloseMobileMenu?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  studioConfig,
  invoicesCount = 0,
  onOpenSettings,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  onLockStudio,
  isDarkMode = true,
  onToggleDarkMode,
  onCloseMobileMenu,
}: SidebarProps) {
  const handleNavClick = (tab: MainNavTab) => {
    setActiveTab(tab);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  return (
    <aside className="no-print w-64 sm:w-68 h-full flex flex-col justify-between p-4 select-none shrink-0 bg-[#08221B] text-[#F8F4ED] border-r border-[#ACBEA3]/20 overflow-y-auto">
      {/* Brand & Top Navigation */}
      <div className="space-y-5">
        {/* Brand Header with Close Button for Mobile Drawer */}
        <div className="px-1 pt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/40 flex items-center justify-center p-1 shadow-xs">
              <BrandLogo
                customLogoUrl={studioConfig.logoDataUrl}
                size="sm"
                variant="icon"
                theme="white"
                withText={false}
              />
            </div>
            <div>
              <div className="font-montserrat font-bold text-sm text-[#F8F4ED] tracking-tight">
                {studioConfig.studioName || 'Indian Pixel'}
              </div>
              <div className="text-[10px] font-semibold text-[#FFA400] tracking-wider uppercase font-space-mono">
                Suite v4.2 · Online
              </div>
            </div>
          </div>

          {/* Close button on mobile/tablet drawer */}
          {onCloseMobileMenu && (
            <button
              type="button"
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1.5 rounded-lg bg-[#2C3330] hover:bg-[#38423e] text-[#ACBEA3] hover:text-[#F8F4ED] cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Navigation Links */}
        <nav className="space-y-1 pt-1">
          {/* Page 1: Home Overview */}
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-poppins cursor-pointer press-scale transition-colors ${
              activeTab === 'home'
                ? 'bg-[#2C3330] text-[#F8F4ED] border border-[#FFA400]/40 font-semibold shadow-xs'
                : 'text-[#ACBEA3] hover:bg-[#2C3330]/50 hover:text-[#F8F4ED] font-medium border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'home' ? 'text-[#FFA400]' : ''}`} />
              <span>Overview</span>
            </div>
            {activeTab === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFA400] shadow-[0_0_6px_#FFA400]" />
            )}
          </button>

          {/* Page 2: Generate Invoice */}
          <button
            onClick={() => handleNavClick('create')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-poppins cursor-pointer press-scale transition-colors ${
              activeTab === 'create' || (activeTab === 'editor' && !invoicesCount)
                ? 'bg-[#FFA400] text-[#08221B] font-bold shadow-xs'
                : 'text-[#ACBEA3] hover:bg-[#2C3330]/50 hover:text-[#F8F4ED] font-medium border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <FilePlus className="w-4 h-4 shrink-0" />
              <span>Generate Invoice</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                activeTab === 'create'
                  ? 'bg-[#08221B]/20 text-[#08221B]'
                  : 'bg-[#FFA400]/20 text-[#FFA400]'
              }`}
            >
              New
            </span>
          </button>

          {/* Page 3: Invoices Ledger */}
          <button
            onClick={() => handleNavClick('invoices')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-poppins cursor-pointer press-scale transition-colors ${
              activeTab === 'invoices' || (activeTab === 'editor' && invoicesCount > 0)
                ? 'bg-[#2C3330] text-[#F8F4ED] border border-[#FFA400]/40 font-semibold shadow-xs'
                : 'text-[#ACBEA3] hover:bg-[#2C3330]/50 hover:text-[#F8F4ED] font-medium border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'invoices' ? 'text-[#FFA400]' : ''}`} />
              <span>Invoices Ledger</span>
            </div>
            {invoicesCount > 0 && (
              <span className="text-[10px] font-space-mono font-bold px-2 py-0.5 rounded-full bg-[#ACBEA3]/20 text-[#ACBEA3]">
                {invoicesCount}
              </span>
            )}
          </button>

          {/* Page 4: Visual Analytics */}
          <button
            onClick={() => handleNavClick('analytics')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-poppins cursor-pointer press-scale transition-colors ${
              activeTab === 'analytics'
                ? 'bg-[#2C3330] text-[#F8F4ED] border border-[#FFA400]/40 font-semibold shadow-xs'
                : 'text-[#ACBEA3] hover:bg-[#2C3330]/50 hover:text-[#F8F4ED] font-medium border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'analytics' ? 'text-[#FFA400]' : ''}`} />
              <span>Analytics &amp; Graphs</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#ACBEA3]/20 text-[#ACBEA3]">
              Live
            </span>
          </button>

          {/* Page 5: Studio Settings */}
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              handleNavClick('settings');
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-poppins cursor-pointer press-scale transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#2C3330] text-[#F8F4ED] border border-[#FFA400]/40 font-semibold shadow-xs'
                : 'text-[#ACBEA3] hover:bg-[#2C3330]/50 hover:text-[#F8F4ED] font-medium border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-[#FFA400]' : ''}`} />
              <span>Studio Settings</span>
            </div>
            {activeTab === 'settings' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFA400] shadow-[0_0_6px_#FFA400]" />
            )}
          </button>
        </nav>
      </div>

      {/* Utilities & Lock Studio */}
      <div className="space-y-3 pt-3 border-t border-[#ACBEA3]/15">
        {/* Dark Mode Feature Switch */}
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330]/50 border border-[#ACBEA3]/20 transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Appearance' : 'Switch to Dark Appearance'}
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Moon className="w-3.5 h-3.5 text-[#FFA400]" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#FFA400]" />
              )}
              <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div
              className={`w-7 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
                isDarkMode ? 'bg-[#FFA400]' : 'bg-[#2C3330]'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full bg-[#08221B] shadow-xs transition-transform duration-200 ${
                  isDarkMode ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        )}

        {/* Studio Lock Button */}
        {onLockStudio && (
          <button
            onClick={onLockStudio}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330]/50 border border-[#ACBEA3]/20 transition-colors cursor-pointer"
            title="Lock studio (Confidential password protection)"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#FFA400]" />
              <span>Lock Studio</span>
            </div>
            <span className="text-[10px] font-space-mono text-[#ACBEA3]">Secure</span>
          </button>
        )}

        {/* Data Workflow */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-[#ACBEA3] tracking-wider uppercase px-1 font-montserrat">
            Data Workflow
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={onExportBackup}
              title="Export JSON Backup"
              className="flex items-center justify-center gap-1 py-1.5 px-1.5 text-[11px] font-medium text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330] rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-[#FFA400]" />
              <span>Backup</span>
            </button>
            <button
              onClick={onImportBackup}
              title="Import JSON Backup"
              className="flex items-center justify-center gap-1 py-1.5 px-1.5 text-[11px] font-medium text-[#ACBEA3] hover:text-[#F8F4ED] hover:bg-[#2C3330] rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3 text-[#ACBEA3]" />
              <span>Restore</span>
            </button>
            <button
              onClick={onResetDefaults}
              title="Reset all ledger and invoice data"
              className="flex items-center justify-center gap-1 py-1.5 px-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset 0</span>
            </button>
          </div>
        </div>

        {/* Verified Statutory Profile Card */}
        <div className="p-2.5 bg-[#2C3330]/60 rounded-xl border border-[#ACBEA3]/25">
          <div className="flex items-center justify-between text-[10px] text-[#ACBEA3] font-medium mb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#FFA400]" />
              <span>Sec 22 CGST Act</span>
            </span>
            <span className="font-space-mono font-bold text-[#FFA400]">Exempt</span>
          </div>
          <div className="text-[11px] font-space-mono font-bold text-[#F8F4ED] truncate">
            PAN: {studioConfig.pan || 'KJKPD8069P'}
          </div>
          <div className="text-[10px] text-[#ACBEA3] truncate mt-0.5">
            {studioConfig.accountName || 'Indian Pixel Studio'}
          </div>
        </div>
      </div>
    </aside>
  );
}
