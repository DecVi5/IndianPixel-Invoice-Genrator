/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Invoice, StudioConfig, MilestoneStatus, MilestonePhase } from './types/invoice.ts';
import {
  loadStudioConfig,
  saveStudioConfig,
  loadInvoices,
  saveInvoices,
  getNextInvoiceNumber,
  createBlankInvoice,
  clearAllDataToZero,
  DEFAULT_STUDIO_CONFIG,
} from './utils/storage.ts';
import { deriveMasterStatus, formatDateToDDMMYYYY, formatIndianCurrency } from './utils/financials.ts';
import { Sidebar, MainNavTab } from './components/Sidebar.tsx';
import { TopNavbar } from './components/TopNavbar.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { RevenueHealthDashboard } from './components/RevenueHealthDashboard.tsx';
import { LedgerDashboard } from './components/LedgerDashboard.tsx';
import { InvoiceEditor } from './components/InvoiceEditor.tsx';
import { InvoicePrintSheet } from './components/InvoicePrintSheet.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { StudioSettingsModal } from './components/StudioSettingsModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { BrandLogo } from './components/BrandLogo.tsx';
import {
  ArrowLeft,
  Edit3,
  Eye,
  Menu,
  X,
  Plus,
  CheckCircle2,
  RotateCcw,
  Zap,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Lock,
  Moon,
  Sun,
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ips_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ips_dark_mode') !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ips_dark_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Sync document root class and background color with isDarkMode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#071311';
      document.body.style.color = '#f1f5f9';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#2C3330';
      document.body.style.color = '#08221B';
    }
  }, [isDarkMode]);

  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() =>
    loadStudioConfig()
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [timeFilter, setTimeFilter] = useState<string>('Last 30 days');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(() => {
    const list = loadInvoices();
    return list[0]?.id || '';
  });
  const [editorSubView, setEditorSubView] = useState<'split' | 'form' | 'preview'>('split');
  const [liveZoomScale, setLiveZoomScale] = useState<number>(0.54);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apple-style transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    saveStudioConfig(studioConfig);
  }, [studioConfig]);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  const handleLoginSuccess = () => {
    try {
      sessionStorage.setItem('ips_authenticated', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(true);
    showToast('Authenticated — Welcome to Indian Pixel Studio');
  };

  const handleLockStudio = () => {
    try {
      sessionStorage.removeItem('ips_authenticated');
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    showToast('Studio locked');
  };

  // Fallback blank invoice when list is reset to 0
  const fallbackInvoice = createBlankInvoice(studioConfig, 'INV-2026-0001');
  const activeInvoice =
    invoices.find((i) => i.id === activeInvoiceId) || invoices[0] || fallbackInvoice;

  // Actions
  const handleCreateNewInvoice = () => {
    const nextNo = getNextInvoiceNumber(invoices);
    const newInv = createBlankInvoice(studioConfig, nextNo);
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    setActiveInvoiceId(newInv.id);
    setActiveTab('create');
    setEditorSubView('split');
    setMobileMenuOpen(false);
    showToast(`Created new draft ${nextNo}`);
  };

  const handleSelectInvoiceForPreview = (inv: Invoice) => {
    setActiveInvoiceId(inv.id);
    setActiveTab('editor');
    setEditorSubView('preview');
  };

  const handleSelectInvoiceForEdit = (inv: Invoice) => {
    setActiveInvoiceId(inv.id);
    setActiveTab('editor');
    setEditorSubView('split');
  };

  const handleSaveInvoice = useCallback((updated: Invoice, options?: { isAutoSave?: boolean }) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === updated.id);
      if (exists) {
        return prev.map((inv) => (inv.id === updated.id ? updated : inv));
      }
      return [updated, ...prev];
    });
    setActiveInvoiceId(updated.id);
    if (!options?.isAutoSave) {
      showToast(`Invoice ${updated.invoiceNo} saved`);
    }
  }, []);

  // Real-time synchronization while typing for live bill
  const handleLiveUpdate = useCallback((updated: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === updated.id);
      if (exists) {
        return prev.map((inv) => (inv.id === updated.id ? updated : inv));
      }
      return [updated, ...prev];
    });
    setActiveInvoiceId(updated.id);
  }, []);

  const handleDuplicateInvoice = (inv: Invoice) => {
    const nextNo = getNextInvoiceNumber(invoices);
    const duplicated: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNo: nextNo,
      date: formatDateToDDMMYYYY(new Date()),
      masterStatus: 'UNPAID',
      singleBillPaid: false,
      singleBillPaidAt: undefined,
      milestones: [
        { ...inv.milestones[0], status: 'DUE', paidAt: undefined },
        { ...inv.milestones[1], status: 'DUE', paidAt: undefined },
        { ...inv.milestones[2], status: 'DUE', paidAt: undefined },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoices([duplicated, ...invoices]);
    setActiveInvoiceId(duplicated.id);
    showToast(`Duplicated to ${nextNo}`);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const remaining = invoices.filter((inv) => inv.id !== invoiceId);
    setInvoices(remaining);
    if (activeInvoiceId === invoiceId) {
      setActiveInvoiceId(remaining[0]?.id || '');
    }
    showToast('Invoice removed from ledger');
  };

  // Milestone or Single Bill toggle
  const handleToggleMilestone = (invoiceId: string, phaseId: 1 | 2 | 3) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        if (inv.billingType === 'single') {
          const nextPaid = !inv.singleBillPaid;
          const nextPaidAt = nextPaid ? formatDateToDDMMYYYY(new Date()) : undefined;
          const masterStatus = nextPaid ? 'PAID' : 'UNPAID';
          return {
            ...inv,
            singleBillPaid: nextPaid,
            singleBillPaidAt: nextPaidAt,
            masterStatus,
            updatedAt: new Date().toISOString(),
          };
        }

        const updatedMilestones: [MilestonePhase, MilestonePhase, MilestonePhase] = [
          {
            ...inv.milestones[0],
            status:
              phaseId === 1
                ? inv.milestones[0].status === 'PAID'
                  ? 'DUE'
                  : 'PAID'
                : inv.milestones[0].status,
            paidAt:
              phaseId === 1
                ? inv.milestones[0].status === 'PAID'
                  ? undefined
                  : formatDateToDDMMYYYY(new Date())
                : inv.milestones[0].paidAt,
          },
          {
            ...inv.milestones[1],
            status:
              phaseId === 2
                ? inv.milestones[1].status === 'PAID'
                  ? 'DUE'
                  : 'PAID'
                : inv.milestones[1].status,
            paidAt:
              phaseId === 2
                ? inv.milestones[1].status === 'PAID'
                  ? undefined
                  : formatDateToDDMMYYYY(new Date())
                : inv.milestones[1].paidAt,
          },
          {
            ...inv.milestones[2],
            status:
              phaseId === 3
                ? inv.milestones[2].status === 'PAID'
                  ? 'DUE'
                  : 'PAID'
                : inv.milestones[2].status,
            paidAt:
              phaseId === 3
                ? inv.milestones[2].status === 'PAID'
                  ? undefined
                  : formatDateToDDMMYYYY(new Date())
                : inv.milestones[2].paidAt,
          },
        ];

        const newMasterStatus = deriveMasterStatus(
          updatedMilestones,
          inv.billingType,
          inv.singleBillPaid
        );

        return {
          ...inv,
          milestones: updatedMilestones,
          masterStatus: newMasterStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const data = {
      app: 'Indian Pixel Studio Suite',
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      studioConfig,
      invoices,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Indian-Pixel-Backup-${formatDateToDDMMYYYY(new Date()).replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON backup exported successfully');
  };

  // Trigger file upload for restore
  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.studioConfig) {
          setStudioConfig(parsed.studioConfig);
        }
        if (Array.isArray(parsed.invoices)) {
          setInvoices(parsed.invoices);
          if (parsed.invoices.length > 0) {
            setActiveInvoiceId(parsed.invoices[0].id);
          }
        }
        showToast('Backup restored successfully');
      } catch (err) {
        console.error('Failed to import JSON backup', err);
        showToast('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Strict Reset to 0: Clears ledger so all metrics start at 0
  const handlePerformResetZero = () => {
    clearAllDataToZero();
    setInvoices([]);
    setActiveInvoiceId('');
    setStudioConfig(DEFAULT_STUDIO_CONFIG);
    setIsResetModalOpen(false);
    setActiveTab('home');
    showToast('Studio data reset to ₹0.00 — Ready for clean entry');
  };

  // Load sample demo invoice for testing
  const handleLoadSampleDemo = () => {
    const sampleInv: Invoice = {
      id: `inv-demo-${Date.now()}`,
      invoiceNo: 'INV-2026-0042',
      date: formatDateToDDMMYYYY(new Date()),
      dueDate: formatDateToDDMMYYYY(new Date(Date.now() + 14 * 86400000)),
      projectName: 'Mitti & Co. — Dynamic Brand Identity Architecture & Packaging',
      client: {
        name: 'Mitti Clayworks Private Limited',
        address: '42 Pottery Lane, Fort, Mumbai 400001, Maharashtra',
        phone: '+91 98200 12345',
        email: 'accounts@mitticlay.in',
        gstin: '27AABCM8765P1ZT',
        stateCode: '27',
      },
      items: [
        {
          id: 'item-demo-1',
          description: 'Brand Identity Architecture & Motion Guidelines',
          unit: 'Package',
          qty: 1,
          rate: 150000,
          amount: 150000,
        },
        {
          id: 'item-demo-2',
          description: 'Eco-Friendly Product Packaging Suites (5 SKUs)',
          unit: 'Designs',
          qty: 5,
          rate: 18000,
          amount: 90000,
        },
        {
          id: 'item-demo-3',
          description: 'Fast-Track Rush Delivery — Priority Weekend Sprint',
          unit: 'Tier',
          qty: 1,
          rate: 25000,
          amount: 25000,
        },
      ],
      billingType: 'single',
      singleBillPaid: false,
      singleBillPaidAt: undefined,
      subtotal: 265000,
      discountType: 'percentage',
      discountValue: 10,
      discountAmount: 26500,
      discountReason: 'Spring Agency Retainer Partner Privilege (10% OFF)',
      taxableAmount: 238500,
      gstType: 'zero',
      gstRate: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      cessRate: 0,
      cessAmount: 0,
      totalTax: 0,
      tdsApplicable: false,
      tdsRate: 10,
      tdsAmount: 0,
      totalAmountDue: 238500,
      amountInWords: 'Two Lakh Thirty-Eight Thousand Five Hundred Rupees Only',
      milestones: [
        {
          phaseId: 1,
          name: 'Phase 1: Brand Strategy & Architecture Sprint',
          percentage: 40,
          amount: 95400,
          status: 'DUE',
        },
        {
          phaseId: 2,
          name: 'Phase 2: Comprehensive Packaging Design (5 SKUs)',
          percentage: 40,
          amount: 95400,
          status: 'DUE',
        },
        {
          phaseId: 3,
          name: 'Phase 3: Production Signoff & Master Source Handover',
          percentage: 20,
          amount: 47700,
          status: 'DUE',
        },
      ],
      masterStatus: 'UNPAID',
      bankDetails: {
        bankName: studioConfig.bankName,
        accountName: studioConfig.accountName,
        accountNumber: studioConfig.accountNumber,
        ifscCode: studioConfig.ifscCode,
        upiId: studioConfig.upiId,
      },
      termsAndConditions: studioConfig.defaultTerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoices([sampleInv]);
    setActiveInvoiceId(sampleInv.id);
    showToast('Loaded sample studio invoice with Single Bill & Discount');
  };

  // If user is not authenticated, render confidential password login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        logoDataUrl={studioConfig.logoDataUrl}
      />
    );
  }

  return (
    <div className="min-h-screen p-0 sm:p-3 lg:p-6 flex items-center justify-center font-poppins antialiased bg-[#2C3330] text-[#F8F4ED]">
      {/* Hidden file input for import backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Floating Apple-Style Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#08221B]/95 text-[#F8F4ED] rounded-full border border-[#ACBEA3]/40 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-poppins transition-all animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#FFA400]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Shell: Full-screen on mobile, curved card on tablet & desktop */}
      <div className="w-full max-w-[1720px] min-h-screen sm:min-h-0 sm:h-[95vh] rounded-none sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col transition-colors duration-300 relative bg-[#08221B] border-0 sm:border border-[#ACBEA3]/25">
        {/* Top Navigation Header with Mobile Drawer Trigger */}
        <TopNavbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'create') {
              handleCreateNewInvoice();
            } else {
              setActiveTab(tab as MainNavTab);
            }
          }}
          onCreateInvoice={handleCreateNewInvoice}
          studioConfig={studioConfig}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onLockStudio={handleLockStudio}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetDefaults={() => setIsResetModalOpen(true)}
          invoicesCount={invoices.length}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Body Container with Left Sidebar Intact */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Left Sidebar (Always Intact on lg+ screens) */}
          <div className="hidden lg:flex shrink-0 h-full">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                if (tab === 'create') {
                  handleCreateNewInvoice();
                } else {
                  setActiveTab(tab as MainNavTab);
                }
              }}
              studioConfig={studioConfig}
              invoicesCount={invoices.length}
              onOpenSettings={() => setActiveTab('settings')}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDefaults={() => setIsResetModalOpen(true)}
              onLockStudio={handleLockStudio}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          </div>

          {/* Mobile & Tablet Slide-Over Drawer (< lg screens) */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    if (tab === 'create') {
                      handleCreateNewInvoice();
                    } else {
                      setActiveTab(tab as MainNavTab);
                    }
                  }}
                  studioConfig={studioConfig}
                  invoicesCount={invoices.length}
                  onOpenSettings={() => setActiveTab('settings')}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onResetDefaults={() => setIsResetModalOpen(true)}
                  onLockStudio={handleLockStudio}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                  onCloseMobileMenu={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Right Main Canvas */}
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto relative flex flex-col transition-colors duration-300 bg-[#2C3330] text-[#F8F4ED]">
          {/* PAGE 1: Home Screen with Basic Stats, Current Invoices, Revenue Health Recharts */}
          {activeTab === 'home' && (
            <HomeScreen
              invoices={invoices}
              studioConfig={studioConfig}
              onNavigateTab={(tab) => {
                if (tab === 'create') {
                  handleCreateNewInvoice();
                } else {
                  setActiveTab(tab);
                }
              }}
              onSelectInvoice={handleSelectInvoiceForPreview}
              onEditInvoice={handleSelectInvoiceForEdit}
              onLoadSampleData={handleLoadSampleDemo}
              isDarkMode={isDarkMode}
            />
          )}

          {/* PAGE 3: All Invoices (Studio Ledger) */}
          {activeTab === 'invoices' && (
            <LedgerDashboard
              invoices={invoices}
              onSelectInvoice={handleSelectInvoiceForPreview}
              onEditInvoice={handleSelectInvoiceForEdit}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onToggleMilestone={handleToggleMilestone}
              onCreateNewInvoice={handleCreateNewInvoice}
              onLoadSampleData={handleLoadSampleDemo}
              studioConfig={studioConfig}
              isDarkMode={isDarkMode}
            />
          )}

          {/* PAGE: Deep Visual Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <RevenueHealthDashboard
                invoices={invoices}
                onLoadSampleData={handleLoadSampleDemo}
                onCreateNewInvoice={handleCreateNewInvoice}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* PAGE 4: Settings Page */}
          {activeTab === 'settings' && (
            <SettingsPage
              config={studioConfig}
              onSaveConfig={(cfg) => {
                setStudioConfig(cfg);
                showToast('Studio settings and branding saved');
              }}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetData={() => setIsResetModalOpen(true)}
              onLockStudio={handleLockStudio}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}

          {/* PAGE 2 / EDITOR: Generate Invoice or Edit Invoice */}
          {(activeTab === 'create' || activeTab === 'editor') && (
            <div className="space-y-4">
              {/* Workspace Navigation Bar (Hidden during print) */}
              <div
                className={`no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                  isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/40'
                }`}
              >
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-poppins font-medium cursor-pointer ${
                    isDarkMode
                      ? 'text-slate-300 hover:text-white hover:bg-white/10'
                      : 'text-[#2C3330] hover:text-[#08221B] hover:bg-white'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Invoices</span>
                </button>

                {/* Subview Selector: Live Split vs Form vs Full A4 */}
                <div
                  className={`flex items-center gap-1.5 p-1 rounded-xl shadow-xs border ${
                    isDarkMode
                      ? 'bg-white/[0.06] border-white/10'
                      : 'bg-white border-[#ACBEA3]/40'
                  }`}
                >
                  <button
                    onClick={() => setEditorSubView('split')}
                    className={`px-3.5 py-1.5 text-xs font-poppins font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editorSubView === 'split'
                        ? isDarkMode
                          ? 'bg-[#FFA400] text-[#08221B] shadow-xs'
                          : 'bg-[#08221B] text-[#ACBEA3]'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-white'
                        : 'text-[#2C3330]/70 hover:text-[#08221B]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-[#FFA400]" />
                    <span>Live Split Bill</span>
                    <span className="hidden sm:inline text-[9px] bg-[#08221B] text-[#FFA400] font-bold px-1.5 py-0.2 rounded-full">
                      Live
                    </span>
                  </button>

                  <button
                    onClick={() => setEditorSubView('form')}
                    className={`px-3.5 py-1.5 text-xs font-poppins font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editorSubView === 'form'
                        ? isDarkMode
                          ? 'bg-[#FFA400] text-[#08221B] shadow-xs'
                          : 'bg-[#08221B] text-[#ACBEA3]'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-white'
                        : 'text-[#2C3330]/70 hover:text-[#08221B]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Form Only</span>
                  </button>

                  <button
                    onClick={() => setEditorSubView('preview')}
                    className={`px-3.5 py-1.5 text-xs font-poppins font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editorSubView === 'preview'
                        ? isDarkMode
                          ? 'bg-[#FFA400] text-[#08221B] shadow-xs'
                          : 'bg-[#08221B] text-[#ACBEA3]'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-white'
                        : 'text-[#2C3330]/70 hover:text-[#08221B]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Full A4 Print &amp; PDF</span>
                  </button>
                </div>
              </div>

              {/* View 1: Live Split View (Form on Left, Real-Time Synchronized A4 Bill on Right) */}
              {editorSubView === 'split' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Form Controls (7 cols on XL) */}
                  <div className="xl:col-span-7 space-y-4">
                    <InvoiceEditor
                      key={activeInvoice.id}
                      invoice={activeInvoice}
                      studioConfig={studioConfig}
                      onSaveInvoice={handleSaveInvoice}
                      onViewInvoice={() => setEditorSubView('preview')}
                      onLiveUpdate={handleLiveUpdate}
                      onToggleSplitLiveView={() => setEditorSubView('form')}
                      isSplitLiveActive={true}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Right Column: Real-Time Live Bill Preview (5 cols on XL) */}
                  <div className="xl:col-span-5 sticky top-2 space-y-2">
                    <div
                      className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between ${
                        isDarkMode
                          ? 'bg-[#18202F]/80 backdrop-blur-xl border-white/10 text-white'
                          : 'bg-white border-[#ACBEA3]/40 text-[#08221B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFA400] animate-pulse" />
                        <span
                          className={`font-montserrat font-bold text-xs tracking-wide uppercase ${
                            isDarkMode ? 'text-white' : 'text-[#08221B]'
                          }`}
                        >
                          Live Bill Synchronized
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLiveZoomScale(0.54)}
                          title="Fit Live Bill to panel width"
                          className={`px-2 py-0.5 rounded text-[10px] font-poppins font-semibold transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 text-[#08221B]'
                          }`}
                        >
                          Fit
                        </button>
                        <button
                          onClick={() =>
                            setLiveZoomScale((curr) =>
                              curr <= 0.4 ? 0.54 : Math.round((curr - 0.06) * 100) / 100
                            )
                          }
                          title="Zoom Out Live Bill"
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 text-[#08221B]'
                          }`}
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`text-[10px] font-space-mono font-semibold px-1 ${
                            isDarkMode ? 'text-white' : 'text-[#08221B]'
                          }`}
                        >
                          {Math.round(liveZoomScale * 100)}%
                        </span>
                        <button
                          onClick={() =>
                            setLiveZoomScale((curr) =>
                              curr >= 1.0 ? 0.54 : Math.round((curr + 0.06) * 100) / 100
                            )
                          }
                          title="Zoom In Live Bill"
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 text-[#08221B]'
                          }`}
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditorSubView('preview')}
                          title="Open Fullscreen A4 Print Sheet"
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 text-[#08221B]'
                          }`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scale-Fitted Live Bill Container */}
                    <div
                      className={`border rounded-2xl p-2 sm:p-3 overflow-y-auto max-h-[calc(88vh-110px)] flex justify-center shadow-inner ${
                        isDarkMode
                          ? 'bg-black/30 border-white/10'
                          : 'bg-[#2C3330]/5 border-[#ACBEA3]/40'
                      }`}
                    >
                      <div
                        style={{
                          transform: `scale(${liveZoomScale})`,
                          transformOrigin: 'top center',
                          width: '210mm',
                          marginBottom: `calc((1 - ${liveZoomScale}) * -297mm)`,
                        }}
                        className="transition-transform duration-200 shrink-0"
                      >
                        <InvoicePrintSheet
                          invoice={activeInvoice}
                          studioConfig={studioConfig}
                          hidePrintControls={true}
                          onToggleSingleBillPaid={() =>
                            handleToggleMilestone(activeInvoice.id, 1)
                          }
                          onMilestoneToggle={(phaseId) =>
                            handleToggleMilestone(activeInvoice.id, phaseId)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Form Only View */}
              {editorSubView === 'form' && (
                <InvoiceEditor
                  key={activeInvoice.id}
                  invoice={activeInvoice}
                  studioConfig={studioConfig}
                  onSaveInvoice={handleSaveInvoice}
                  onViewInvoice={() => setEditorSubView('preview')}
                  onLiveUpdate={handleLiveUpdate}
                  onToggleSplitLiveView={() => setEditorSubView('split')}
                  isSplitLiveActive={false}
                  isDarkMode={isDarkMode}
                />
              )}

              {/* View 3: Full A4 Print / PDF Preview */}
              {editorSubView === 'preview' && (
                <InvoicePrintSheet
                  invoice={activeInvoice}
                  studioConfig={studioConfig}
                  onEdit={() => setEditorSubView('split')}
                  onToggleSingleBillPaid={() =>
                    handleToggleMilestone(activeInvoice.id, 1)
                  }
                  onMilestoneToggle={(phaseId) =>
                    handleToggleMilestone(activeInvoice.id, phaseId)
                  }
                />
              )}
            </div>
          )}
        </main>
        </div>
      </div>

      {/* Quick Studio Settings Modal */}
      <StudioSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={studioConfig}
        onSaveConfig={(cfg) => {
          setStudioConfig(cfg);
          showToast('Studio settings and branding saved');
        }}
      />

      {/* Apple-Style Non-blocking Reset Confirmation Dialog */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div
            className={`rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border space-y-5 ${
              isDarkMode
                ? 'bg-[#18202F]/95 backdrop-blur-2xl border-white/15 text-white'
                : 'bg-white border-[#ACBEA3]/40 text-[#08221B]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3
                className={`text-lg font-bold font-montserrat ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Reset All Studio Data to 0?
              </h3>
              <p
                className={`text-xs leading-relaxed font-poppins ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/80'
                }`}
              >
                This will purge all custom invoices, reset revenue metrics to ₹0.00, and restore Indian Pixel default studio configurations.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'border-white/15 bg-white/10 hover:bg-white/15 text-white'
                    : 'border-[#ACBEA3]/60 bg-[#F8F4ED] hover:bg-[#ACBEA3]/20 text-[#08221B]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformResetZero}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold font-montserrat text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Reset to ₹0.00
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#091513] border border-emerald-500/30 shadow-2xl p-5 text-white font-poppins">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
              <span className="text-[#10e599]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice #, client name, or project..."
                autoFocus
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-poppins"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-white/5">
              {invoices
                .filter(
                  (inv) =>
                    !searchQuery ||
                    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inv.projectName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      handleSelectInvoiceForPreview(inv);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-white/5 rounded-2xl flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white font-space-mono group-hover:text-[#10e599] transition-colors">
                        {inv.invoiceNo} · {inv.client.name || 'Valued Client'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {inv.projectName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-space-mono text-emerald-400">
                        {formatIndianCurrency(inv.totalAmountDue)}
                      </div>
                      <div className="text-[10px] text-slate-500">{inv.masterStatus}</div>
                    </div>
                  </div>
                ))}
              {invoices.length === 0 && (
                <div className="p-5 text-center text-xs text-slate-500">
                  No registered invoices found. Click + Generate Invoice to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
