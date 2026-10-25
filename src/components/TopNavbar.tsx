import { useState } from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import type { StudioConfig } from '../types/invoice.ts';
import {
  Search,
  ChevronDown,
  Moon,
  Sun,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  Menu,
} from 'lucide-react';

interface TopNavbarProps {
  activeTab: 'home' | 'create' | 'invoices' | 'settings' | 'analytics' | 'editor';
  setActiveTab: (tab: 'home' | 'create' | 'invoices' | 'settings' | 'analytics' | 'editor') => void;
  onCreateInvoice: () => void;
  studioConfig: StudioConfig;
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
}

export function TopNavbar({
  activeTab,
  setActiveTab,
  onCreateInvoice,
  studioConfig,
  isDarkMode = true,
  onToggleDarkMode,
  onLockStudio,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  invoicesCount = 0,
  timeFilter = 'Last 30 days',
  setTimeFilter,
  onOpenSearch,
  onToggleMobileMenu,
}: TopNavbarProps) {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  const filterOptions = ['Last 30 days', 'Last 90 days', 'Current FY 2026-27', 'All Time'];

  return (
    <header className="relative z-30 w-full px-3 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-[#ACBEA3]/20 bg-[#08221B]/95 backdrop-blur-md select-none">
      {/* Left: Mobile Drawer Trigger + Brand Identity */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Mobile Sidebar Hamburger Toggle (Visible on phones & tablets < lg) */}
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

        {/* Brand Mark & Title */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/40 flex items-center justify-center p-1.5 shadow-xs group-hover:border-[#FFA400] transition-colors">
            <BrandLogo
              customLogoUrl={studioConfig.logoDataUrl}
              size="sm"
              variant="icon"
              theme="white"
              withText={false}
            />
          </div>
          <div>
            <span className="font-montserrat font-bold text-xs sm:text-sm text-[#F8F4ED] tracking-tight block">
              {studioConfig.studioName || 'Indian Pixel'}
            </span>
            <span className="text-[10px] text-[#ACBEA3] font-space-mono hidden sm:block -mt-0.5">
              Financial Suite
            </span>
          </div>
        </div>

        {/* Desktop Quick Breadcrumbs / Mode Pill */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-[#ACBEA3]/20">
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

      {/* Right: Search, Filter, Tools & CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search Icon */}
        <button
          onClick={onOpenSearch}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-[#ACBEA3] hover:text-[#F8F4ED] flex items-center justify-center transition-colors cursor-pointer"
          title="Search Invoices & Clients"
          aria-label="Search Invoices"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Date Filter Dropdown (Hidden on small mobile phones) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="px-3 py-1.5 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-xs text-[#F8F4ED] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#ACBEA3]" />
            <span>{timeFilter}</span>
            <ChevronDown className="w-3 h-3 text-[#ACBEA3]" />
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
              className="absolute right-0 mt-2 w-52 rounded-xl bg-[#08221B] border border-[#ACBEA3]/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1"
              style={{ transformOrigin: 'top right' }}
            >
              <button
                onClick={() => {
                  onToggleDarkMode();
                  setIsToolsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#F8F4ED] hover:bg-[#2C3330] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#FFA400]" /> : <Moon className="w-3.5 h-3.5 text-[#ACBEA3]" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
              </button>

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
