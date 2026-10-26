import { useState, ChangeEvent, useEffect, useRef } from 'react';
import {
  Invoice,
  LineItem,
  StudioConfig,
  DiscountType,
  GstType,
  MilestoneStatus,
  BillingType,
} from '../types/invoice.ts';
import { BrandLogo } from './BrandLogo.tsx';
import {
  calculateInvoiceFinancials,
  calculateMilestones,
  deriveMasterStatus,
  formatDateToDDMMYYYY,
  formatIndianCurrency,
  determineGstTypeFromGstins,
  getStateCodeFromGstin,
  GST_STATE_CODES,
} from '../utils/financials.ts';
import { STUDIO_ADDONS, StudioAddonDefinition } from '../data/studioAddons.ts';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
  FileText,
  Tag,
  Zap,
  Layers,
  Sparkles,
  Percent,
  Palette,
  Boxes,
  ShieldCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InvoiceEditorProps {
  invoice: Invoice;
  studioConfig: StudioConfig;
  onSaveInvoice: (updated: Invoice, options?: { isAutoSave?: boolean }) => void;
  onViewInvoice: () => void;
  onLiveUpdate?: (updated: Invoice) => void;
  onToggleSplitLiveView?: () => void;
  isSplitLiveActive?: boolean;
  isDarkMode?: boolean;
}

export function InvoiceEditor({
  invoice,
  studioConfig,
  onSaveInvoice,
  onViewInvoice,
  onLiveUpdate,
  onToggleSplitLiveView,
  isSplitLiveActive = false,
  isDarkMode = true,
}: InvoiceEditorProps) {
  const [current, setCurrent] = useState<Invoice>({ ...invoice });
  const [saveToast, setSaveToast] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showItemDiscountIndex, setShowItemDiscountIndex] = useState<number | null>(null);
  const [selectedRushTier, setSelectedRushTier] = useState<string>('tier-01');
  const [revisionsCount, setRevisionsCount] = useState<number>(1);
  const [subbrandCount, setSubbrandCount] = useState<number>(1);
  const [trademarkCount, setTrademarkCount] = useState<number>(1);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState<boolean>(true);

  const lastSavedSnapshotRef = useRef<string>(JSON.stringify(invoice));
  const currentRef = useRef<Invoice>(current);
  currentRef.current = current;
  const onSaveInvoiceRef = useRef(onSaveInvoice);
  onSaveInvoiceRef.current = onSaveInvoice;

  // Sync internal state when invoice prop changes
  useEffect(() => {
    setCurrent({ ...invoice });
    lastSavedSnapshotRef.current = JSON.stringify(invoice);
    setAutoSaveStatus('saved');
  }, [invoice.id]);

  // Periodic 5-Second Auto-Save Mechanism to prevent data loss while drafting complex project invoices
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const activeSnapshot = JSON.stringify(currentRef.current);
      if (activeSnapshot !== lastSavedSnapshotRef.current) {
        setAutoSaveStatus('saving');
        onSaveInvoiceRef.current(currentRef.current, { isAutoSave: true });
        lastSavedSnapshotRef.current = activeSnapshot;
        setTimeout(() => {
          setAutoSaveStatus('saved');
          setLastSavedAt(new Date());
        }, 350);
      }
    }, 5000);

    return () => clearInterval(autoSaveInterval);
  }, []);

  // Prevent data loss: auto-save on component unmount if dirty
  useEffect(() => {
    return () => {
      const activeSnapshot = JSON.stringify(currentRef.current);
      if (activeSnapshot !== lastSavedSnapshotRef.current) {
        onSaveInvoiceRef.current(currentRef.current, { isAutoSave: true });
      }
    };
  }, []);

  const recompute = (
    items: LineItem[],
    discountType: DiscountType,
    discountValue: number,
    discountReason: string | undefined,
    gstType: GstType,
    gstRate: number,
    billingType: BillingType = current.billingType || 'single',
    singleBillPaid = current.singleBillPaid,
    singleBillPaidAt = current.singleBillPaidAt,
    existingMilestones = current.milestones,
    cessRate = current.cessRate || 0,
    tdsApplicable = current.tdsApplicable || false,
    tdsRate = current.tdsRate || 10,
    tdsSection = current.tdsSection || '194J (10% Professional)'
  ) => {
    const calc = calculateInvoiceFinancials({
      items,
      discountType,
      discountValue,
      discountReason,
      gstType,
      gstRate,
      cessRate,
      tdsApplicable,
      tdsRate,
    });

    const updatedMilestones = calculateMilestones(
      calc.totalAmountDue,
      existingMilestones
    );

    const masterStatus = deriveMasterStatus(
      updatedMilestones,
      billingType,
      Boolean(singleBillPaid)
    );

    const updated: Invoice = {
      ...current,
      items: calc.computedItems || items,
      billingType,
      singleBillPaid,
      singleBillPaidAt,
      discountType,
      discountValue,
      discountReason,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstType,
      gstRate,
      cgstRate: calc.cgstRate,
      cgstAmount: calc.cgstAmount,
      sgstRate: calc.sgstRate,
      sgstAmount: calc.sgstAmount,
      igstRate: calc.igstRate,
      igstAmount: calc.igstAmount,
      cessRate: calc.cessRate,
      cessAmount: calc.cessAmount,
      totalTax: calc.totalTax,
      totalAmountDue: calc.totalAmountDue,
      tdsApplicable,
      tdsSection,
      tdsRate: calc.tdsRate,
      tdsAmount: calc.tdsAmount,
      netReceivableAfterTds: calc.netReceivableAfterTds,
      amountInWords: calc.amountInWords,
      milestones: updatedMilestones,
      masterStatus,
      updatedAt: new Date().toISOString(),
    };

    setCurrent(updated);
    onLiveUpdate?.(updated);
    return updated;
  };

  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    val: string | number | undefined
  ) => {
    const nextItems = [...current.items];
    const target = { ...nextItems[index] };

    if (field === 'qty' || field === 'rate') {
      const numVal = Math.max(0, parseFloat(String(val)) || 0);
      (target as Record<string, unknown>)[field] = numVal;
    } else if (field === 'itemDiscountValue') {
      target.itemDiscountValue = Math.max(0, parseFloat(String(val)) || 0);
    } else {
      (target as Record<string, unknown>)[field] = val;
    }

    nextItems[index] = target;
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${current.items.length + 1}`,
      description: '',
      qty: 1,
      unit: 'Sprint',
      rate: 10000,
      sacCode: '998311',
      amount: 10000,
    };
    const nextItems = [...current.items, newItem];
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  const handleRemoveItem = (index: number) => {
    if (current.items.length <= 1) return;
    const nextItems = current.items.filter((_, i) => i !== index);
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  // Add-on 1: Fast-Track Rush Delivery
  const handleAddRushAddon = () => {
    const rushDef = STUDIO_ADDONS.find((a) => a.id === 'rush');
    const selectedTier =
      rushDef?.tiers?.find((t) => t.id === selectedRushTier) || rushDef?.tiers?.[0];
    const price = selectedTier?.price || 4999;
    const desc = `${selectedTier?.name || 'Fast-Track Rush Delivery'} — Priority Queue & 35%-50% Reduced Turnaround (8-10 Days)`;

    const newItem: LineItem = {
      id: `addon-rush-${Date.now()}`,
      description: desc,
      qty: 1,
      unit: 'Sprint',
      rate: price,
      sacCode: '998311',
      addonType: 'rush',
      amount: price,
    };
    const nextItems = [...current.items, newItem];
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  // Add-on 2: Extra Creative Concepts & Revisions
  const handleAddRevisionsAddon = () => {
    const count = Math.max(1, revisionsCount);
    const rate = 3999;
    const desc = `Extra Creative Concepts & Revisions (${count} Round${count > 1 ? 's' : ''}) — 2 New Concept Presentation Boards + 2 Refinement Rounds`;

    const newItem: LineItem = {
      id: `addon-revisions-${Date.now()}`,
      description: desc,
      qty: count,
      unit: 'Round',
      rate,
      sacCode: '998314',
      addonType: 'revisions',
      amount: count * rate,
    };
    const nextItems = [...current.items, newItem];
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  // Add-on 3: Sub-Brand & Sister Venture Identity
  const handleAddSubbrandAddon = () => {
    const count = Math.max(1, subbrandCount);
    const rate = 6999;
    const desc = `Sub-Brand & Sister Venture Identity System (${count} Sub-Brand${count > 1 ? 's' : ''}) — Child Logo System, Adapted Color/Font Hierarchy & Vector Master Package`;

    const newItem: LineItem = {
      id: `addon-subbrand-${Date.now()}`,
      description: desc,
      qty: count,
      unit: 'Sub-Brand',
      rate,
      sacCode: '998314',
      addonType: 'subbrand',
      amount: count * rate,
    };
    const nextItems = [...current.items, newItem];
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  // Add-on 4: Trademark-Ready Asset Kit
  const handleAddTrademarkAddon = () => {
    const count = Math.max(1, trademarkCount);
    const rate = 2499;
    const desc = `Trademark-Ready Asset Kit (${count} Mark${count > 1 ? 's' : ''}) — Monochrome Vector Proofs, Safe-Zone Dimension Sheets & Pure Vector EPS/TIFF Legal Master Assets`;

    const newItem: LineItem = {
      id: `addon-trademark-${Date.now()}`,
      description: desc,
      qty: count,
      unit: 'Mark',
      rate,
      sacCode: '998319',
      addonType: 'trademark',
      amount: count * rate,
    };
    const nextItems = [...current.items, newItem];
    recompute(
      nextItems,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate
    );
  };

  // Auto-detect GST when Client GSTIN changes
  const handleClientGstinChange = (clientGstin: string) => {
    const detectedGstType = determineGstTypeFromGstins(
      studioConfig.gstin,
      clientGstin
    );
    const stateCode = getStateCodeFromGstin(clientGstin);

    const updatedClient = {
      ...current.client,
      gstin: clientGstin,
      stateCode,
    };

    const updated = {
      ...current,
      client: updatedClient,
      gstType: detectedGstType,
    };
    setCurrent(updated);

    recompute(
      current.items,
      current.discountType,
      current.discountValue,
      current.discountReason,
      detectedGstType,
      current.gstRate
    );
  };

  // Toggle Billing Mode (Single Bill vs 3-Phase Milestone)
  const handleToggleBillingType = (type: BillingType) => {
    recompute(
      current.items,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate,
      type,
      current.singleBillPaid,
      current.singleBillPaidAt
    );
  };

  // Toggle Single Bill Paid/Due
  const handleToggleSingleBillPaid = () => {
    const nextPaid = !current.singleBillPaid;
    const nextPaidAt = nextPaid ? formatDateToDDMMYYYY(new Date()) : undefined;
    recompute(
      current.items,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate,
      'single',
      nextPaid,
      nextPaidAt
    );
  };

  // Milestone toggles
  const handleMilestoneToggle = (phaseId: 1 | 2 | 3) => {
    const nextMilestones = [...current.milestones] as [
      typeof current.milestones[0],
      typeof current.milestones[1],
      typeof current.milestones[2]
    ];
    const idx = phaseId - 1;
    const currentStatus = nextMilestones[idx].status;
    const nextStatus: MilestoneStatus = currentStatus === 'PAID' ? 'DUE' : 'PAID';

    nextMilestones[idx] = {
      ...nextMilestones[idx],
      status: nextStatus,
      paidAt: nextStatus === 'PAID' ? formatDateToDDMMYYYY(new Date()) : undefined,
    };

    recompute(
      current.items,
      current.discountType,
      current.discountValue,
      current.discountReason,
      current.gstType,
      current.gstRate,
      current.billingType,
      current.singleBillPaid,
      current.singleBillPaidAt,
      nextMilestones
    );
  };

  // Mark unsaved whenever current state changes from last snapshot
  useEffect(() => {
    currentRef.current = current;
    const currentJson = JSON.stringify(current);
    if (currentJson !== lastSavedSnapshotRef.current) {
      setAutoSaveStatus('unsaved');
    }
  }, [current]);

  const handleSave = () => {
    const activeSnapshot = JSON.stringify(current);
    onSaveInvoice(current);
    lastSavedSnapshotRef.current = activeSnapshot;
    setAutoSaveStatus('saved');
    setLastSavedAt(new Date());
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Quick discount reason suggestions
  const discountReasonSuggestions = [
    'Agency Retainer Discount',
    'Early Payment Concession',
    'Loyalty Courtesy',
    'Festive Launch Offer',
    'Referral Benefit',
  ];

  const clientStateName = current.client.stateCode
    ? GST_STATE_CODES[current.client.stateCode] || `State ${current.client.stateCode}`
    : '';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 font-poppins">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-[#08221B] flex items-center justify-center p-1.5 shadow-xs shrink-0">
            <BrandLogo
              customLogoUrl={studioConfig.logoDataUrl}
              size="sm"
              variant="icon"
              theme="white"
              withText={false}
            />
          </div>
          <span className="font-space-mono text-sm font-bold text-[#08221B] tracking-wider">
            {current.invoiceNo}
          </span>
          <span className="text-[#ACBEA3]">·</span>
          <span className="text-xs text-[#2C3330] font-medium truncate max-w-[140px] sm:max-w-xs">
            {current.projectName || 'Untitled Project'}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              current.masterStatus === 'PAID'
                ? 'bg-[#08221B] text-[#ACBEA3]'
                : current.masterStatus === 'PARTIALLY PAID'
                ? 'bg-[#FFA400]/20 text-[#08221B] border border-[#FFA400]/60'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {current.masterStatus}
          </span>

          {/* 5-Second Auto-Save Status Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              autoSaveStatus === 'saving'
                ? 'bg-[#FFA400]/25 text-[#08221B] border border-[#FFA400]/60'
                : autoSaveStatus === 'unsaved'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-[#08221B]/10 text-[#08221B] border border-[#ACBEA3]/50'
            }`}
            title="Auto-saves every 5 seconds to prevent draft loss"
          >
            {autoSaveStatus === 'saving' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFA400] animate-ping" />
                <span className="font-space-mono text-[10.5px] font-semibold text-[#08221B]">
                  Saving draft...
                </span>
              </>
            ) : autoSaveStatus === 'unsaved' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-space-mono text-[10.5px] font-medium">
                  Unsaved · auto-saves in 5s
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#08221B]" />
                <span className="font-space-mono text-[10.5px] font-medium text-[#08221B]">
                  {lastSavedAt
                    ? `Auto-saved at ${lastSavedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}`
                    : 'Auto-saved (5s sync)'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleSplitLiveView && (
            <button
              onClick={onToggleSplitLiveView}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isSplitLiveActive
                  ? 'bg-[#08221B] text-[#ACBEA3] border-[#08221B]'
                  : 'bg-[#FFA400]/15 text-[#08221B] border-[#FFA400]/50 hover:bg-[#FFA400]/25'
              }`}
              title="Toggle Live Synchronized Bill side-by-side"
            >
              <Zap className="w-3.5 h-3.5 text-[#FFA400]" />
              <span>{isSplitLiveActive ? 'Close Live Bill' : 'See Live Bill'}</span>
            </button>
          )}

          <button
            onClick={onViewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#08221B] bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 border border-[#ACBEA3]/60 rounded-xl transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Full A4 / Print</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold font-montserrat text-[#08221B] bg-[#FFA400] hover:bg-[#e69400] rounded-xl transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Invoice</span>
          </button>
          {saveToast && (
            <span className="text-xs text-[#08221B] font-semibold bg-[#ACBEA3]/40 px-2 py-1 rounded-md animate-fade-in">
              Saved!
            </span>
          )}
        </div>
      </div>

      {/* BILLING STRUCTURE SELECTOR: Single Bill vs 3-Phase Milestone */}
      <div className="p-5 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
              Billing Structure
            </h3>
            <span className="text-[11px] text-[#2C3330]/70">
              Select one-time single settlement or structured phased milestones
            </span>
          </div>
          <span className="text-xs font-space-mono font-semibold text-[#08221B]">
            {current.billingType === 'single' ? 'Mode: Single Bill (100%)' : 'Mode: 3-Milestone Schedule'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Single Bill */}
          <button
            type="button"
            onClick={() => handleToggleBillingType('single')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
              current.billingType === 'single'
                ? 'bg-[#08221B] text-white border-[#08221B] shadow-md ring-2 ring-[#FFA400]/40'
                : 'bg-[#F8F4ED]/60 text-[#2C3330] border-[#ACBEA3]/40 hover:border-[#08221B]/40 hover:bg-[#F8F4ED]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${
                current.billingType === 'single'
                  ? 'bg-[#FFA400] text-[#08221B]'
                  : 'bg-[#ACBEA3]/30 text-[#08221B]'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-montserrat font-bold text-sm">
                  Single Bill (100% Full Payment)
                </span>
                {current.billingType === 'single' && (
                  <span className="text-[10px] font-semibold bg-[#FFA400] text-[#08221B] px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  current.billingType === 'single'
                    ? 'text-[#ACBEA3]'
                    : 'text-[#2C3330]/70'
                }`}
              >
                Simple, direct billing. 100% of the bill is settled in a single payment without milestone splits.
              </p>
            </div>
          </button>

          {/* Card 2: 3-Phase Milestone Schedule */}
          <button
            type="button"
            onClick={() => handleToggleBillingType('milestone')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
              current.billingType === 'milestone'
                ? 'bg-[#08221B] text-white border-[#08221B] shadow-md ring-2 ring-[#FFA400]/40'
                : 'bg-[#F8F4ED]/60 text-[#2C3330] border-[#ACBEA3]/40 hover:border-[#08221B]/40 hover:bg-[#F8F4ED]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${
                current.billingType === 'milestone'
                  ? 'bg-[#FFA400] text-[#08221B]'
                  : 'bg-[#ACBEA3]/30 text-[#08221B]'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-montserrat font-bold text-sm">
                  3-Phase Milestones (40% — 40% — 20%)
                </span>
                {current.billingType === 'milestone' && (
                  <span className="text-[10px] font-semibold bg-[#FFA400] text-[#08221B] px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  current.billingType === 'milestone'
                    ? 'text-[#ACBEA3]'
                    : 'text-[#2C3330]/70'
                }`}
              >
                Split invoice into 3 milestone disbursements (Advance, Midpoint, Handover).
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Grid: Invoice Meta & Bill To Client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Meta */}
        <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ACBEA3]/20">
            <FileText className="w-4 h-4 text-[#FFA400]" />
            <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
              Invoice Meta &amp; Dates
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                INVOICE NUMBER
              </label>
              <input
                type="text"
                value={current.invoiceNo}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...current, invoiceNo: val };
                  setCurrent(updated);
                  onLiveUpdate?.(updated);
                }}
                className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                PROJECT NAME
              </label>
              <input
                type="text"
                value={current.projectName}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...current, projectName: val };
                  setCurrent(updated);
                  onLiveUpdate?.(updated);
                }}
                placeholder="e.g. Mitti & Co. — Dynamic Identity"
                className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                INVOICE DATE (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={current.date}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...current, date: val };
                  setCurrent(updated);
                  onLiveUpdate?.(updated);
                }}
                className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                PAYMENT DUE DATE (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={current.dueDate}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...current, dueDate: val };
                  setCurrent(updated);
                  onLiveUpdate?.(updated);
                }}
                className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bill To Client Details */}
        <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ACBEA3]/20">
            <Building2 className="w-4 h-4 text-[#FFA400]" />
            <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
              Billed To (Client Details)
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                CLIENT / COMPANY NAME
              </label>
              <input
                type="text"
                value={current.client.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = {
                    ...current,
                    client: { ...current.client, name: val },
                  };
                  setCurrent(updated);
                  onLiveUpdate?.(updated);
                }}
                placeholder="Mitti Clayworks Private Limited"
                className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-medium text-[#08221B] focus:border-[#08221B] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                BILLING ADDRESS
              </label>
              <textarea
                rows={2}
                value={current.client.address}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = {
                    ...current,
                    client: { ...current.client, address: val },
                  };
                  setCurrent(updated);
                  onLiveUpdate?.(updated);
                }}
                placeholder="42 Pottery Lane, Fort, Mumbai 400001, Maharashtra"
                className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  PHONE
                </label>
                <input
                  type="text"
                  value={current.client.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = {
                      ...current,
                      client: { ...current.client, phone: val },
                    };
                    setCurrent(updated);
                    onLiveUpdate?.(updated);
                  }}
                  placeholder="+91 98200 12345"
                  className="w-full px-2.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={current.client.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = {
                      ...current,
                      client: { ...current.client, email: val },
                    };
                    setCurrent(updated);
                    onLiveUpdate?.(updated);
                  }}
                  placeholder="client@mitticlay.com"
                  className="w-full px-2.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
                    CLIENT GSTIN
                  </label>
                  {clientStateName && (
                    <span className="text-[9px] text-[#08221B] font-semibold font-space-mono bg-[#ACBEA3]/40 px-1 rounded">
                      {clientStateName}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={current.client.gstin || ''}
                  onChange={(e) => handleClientGstinChange(e.target.value)}
                  placeholder="27AAACM4491D1ZL"
                  className="w-full px-2.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STUDIO ADD-ONS & SERVICE ACCELERATORS (RUSH, REVISIONS, SUB-BRAND, TRADEMARK) */}
      <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFA400]" />
            <div>
              <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
                Studio Add-ons &amp; Service Accelerators
              </h3>
              <p className="text-xs text-[#2C3330]/70">
                1-click additions for rush delivery, extra creative rounds, sub-brands, and trademark asset kits.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddonsExpanded(!isAddonsExpanded)}
            className="p-1.5 rounded-lg text-[#2C3330] hover:bg-[#F8F4ED] cursor-pointer"
          >
            {isAddonsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isAddonsExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Addon 1: Fast-Track Rush Delivery */}
            <div className="p-4 bg-[#F8F4ED]/60 border border-[#ACBEA3]/40 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#FFA400]" />
                    <span className="font-montserrat font-bold text-xs text-[#08221B]">
                      Fast-Track Rush Delivery
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold bg-[#FFA400]/20 text-[#08221B] px-2 py-0.5 rounded-full border border-[#FFA400]/50">
                    Priority Queue
                  </span>
                </div>
                <p className="text-[11px] text-[#2C3330]/80 leading-relaxed">
                  <strong>When needed:</strong> Launch date moved up, urgent investor demo, or immediate retail deadline.
                </p>
                <p className="text-[10px] text-[#2C3330]/70">
                  Turnaround reduced by 35%–50% (standard 3-week project delivered in 8–10 business days) with daily feedback loops.
                </p>

                {/* Tier Selection */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-montserrat font-bold text-[#2C3330] uppercase block">
                    SELECT RUSH TIER:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'tier-01', label: 'Tier 01', name: 'Foundation', price: '₹4,999' },
                      { id: 'tier-02', label: 'Tier 02', name: 'Rebuild', price: '₹6,999' },
                      { id: 'tier-03', label: 'Tier 03', name: 'Ecosystem', price: '₹11,999' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedRushTier(tier.id)}
                        className={`p-1.5 rounded-lg text-center border text-[10px] transition-all cursor-pointer ${
                          selectedRushTier === tier.id
                            ? 'bg-[#08221B] text-white border-[#08221B] font-semibold'
                            : 'bg-white text-[#2C3330] border-[#ACBEA3]/40 hover:border-[#08221B]'
                        }`}
                      >
                        <div className="font-bold">{tier.name}</div>
                        <div className="font-space-mono text-[9px] opacity-90">{tier.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddRushAddon}
                className="w-full mt-2 py-2 bg-[#08221B] hover:bg-[#08221B]/90 text-[#ACBEA3] font-montserrat font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Add Rush Delivery to Invoice</span>
              </button>
            </div>

            {/* Addon 2: Extra Creative Concepts & Revisions */}
            <div className="p-4 bg-[#F8F4ED]/60 border border-[#ACBEA3]/40 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#FFA400]" />
                    <span className="font-montserrat font-bold text-xs text-[#08221B]">
                      Extra Creative Concepts &amp; Revisions
                    </span>
                  </div>
                  <span className="text-[10px] font-space-mono font-bold text-[#08221B]">
                    ₹3,999 / Round
                  </span>
                </div>
                <p className="text-[11px] text-[#2C3330]/80 leading-relaxed">
                  <strong>When needed:</strong> Radically different art styles, alternate naming layouts, or iterations beyond standard package allowance.
                </p>
                <p className="text-[10px] text-[#2C3330]/70">
                  Delivers 2 new concept presentation boards + 2 refinement rounds per round.
                </p>

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
                    NUMBER OF ROUNDS:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRevisionsCount(Math.max(1, revisionsCount - 1))}
                      className="w-6 h-6 rounded bg-white border border-[#ACBEA3]/50 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-space-mono font-bold text-xs w-6 text-center">
                      {revisionsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRevisionsCount(revisionsCount + 1)}
                      className="w-6 h-6 rounded bg-white border border-[#ACBEA3]/50 text-xs font-bold"
                    >
                      +
                    </button>
                    <span className="font-space-mono text-xs font-semibold text-[#08221B] ml-1">
                      = ₹{(revisionsCount * 3999).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddRevisionsAddon}
                className="w-full mt-2 py-2 bg-[#08221B] hover:bg-[#08221B]/90 text-[#ACBEA3] font-montserrat font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Add Concepts &amp; Revisions</span>
              </button>
            </div>

            {/* Addon 3: Sub-Brand & Sister Venture Identity */}
            <div className="p-4 bg-[#F8F4ED]/60 border border-[#ACBEA3]/40 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-[#FFA400]" />
                    <span className="font-montserrat font-bold text-xs text-[#08221B]">
                      Sub-Brand &amp; Sister Venture Identity
                    </span>
                  </div>
                  <span className="text-[10px] font-space-mono font-bold text-[#08221B]">
                    ₹6,999 / Sub-Brand
                  </span>
                </div>
                <p className="text-[11px] text-[#2C3330]/80 leading-relaxed">
                  <strong>When needed:</strong> Child brand, spin-off company, or distinct product division inheriting parent brand prestige.
                </p>
                <p className="text-[10px] text-[#2C3330]/70">
                  Delivers sub-brand logo system, adapted color &amp; font hierarchy, social media avatars, and master vector package.
                </p>

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
                    SUB-BRAND COUNT:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSubbrandCount(Math.max(1, subbrandCount - 1))}
                      className="w-6 h-6 rounded bg-white border border-[#ACBEA3]/50 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-space-mono font-bold text-xs w-6 text-center">
                      {subbrandCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubbrandCount(subbrandCount + 1)}
                      className="w-6 h-6 rounded bg-white border border-[#ACBEA3]/50 text-xs font-bold"
                    >
                      +
                    </button>
                    <span className="font-space-mono text-xs font-semibold text-[#08221B] ml-1">
                      = ₹{(subbrandCount * 6999).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSubbrandAddon}
                className="w-full mt-2 py-2 bg-[#08221B] hover:bg-[#08221B]/90 text-[#ACBEA3] font-montserrat font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Add Sub-Brand Identity</span>
              </button>
            </div>

            {/* Addon 4: Trademark-Ready Asset Kit */}
            <div className="p-4 bg-[#F8F4ED]/60 border border-[#ACBEA3]/40 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#FFA400]" />
                    <span className="font-montserrat font-bold text-xs text-[#08221B]">
                      Trademark-Ready Asset Kit
                    </span>
                  </div>
                  <span className="text-[10px] font-space-mono font-bold text-[#08221B]">
                    ₹2,499 / Mark
                  </span>
                </div>
                <p className="text-[11px] text-[#2C3330]/80 leading-relaxed">
                  <strong>When needed:</strong> Filing for IP registration with Trademark Registry (IP India / USPTO).
                </p>
                <p className="text-[10px] text-[#2C3330]/70">
                  Delivers monochrome vector proofs, safe-zone dimension sheets, and pure vector EPS/TIFF master assets formatted to exact legal filing rules.
                </p>

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
                    MARKS TO FILE:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTrademarkCount(Math.max(1, trademarkCount - 1))}
                      className="w-6 h-6 rounded bg-white border border-[#ACBEA3]/50 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-space-mono font-bold text-xs w-6 text-center">
                      {trademarkCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTrademarkCount(trademarkCount + 1)}
                      className="w-6 h-6 rounded bg-white border border-[#ACBEA3]/50 text-xs font-bold"
                    >
                      +
                    </button>
                    <span className="font-space-mono text-xs font-semibold text-[#08221B] ml-1">
                      = ₹{(trademarkCount * 2499).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTrademarkAddon}
                className="w-full mt-2 py-2 bg-[#08221B] hover:bg-[#08221B]/90 text-[#ACBEA3] font-montserrat font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Add Trademark Kit</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Line Items Section */}
      <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
          <div>
            <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
              Deliverables &amp; Billable Items
            </h3>
            <p className="text-xs text-[#2C3330]/70">
              Add billable services, design sprints, or asset packages with optional item discounts and SAC codes.
            </p>
          </div>
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#08221B] bg-[#ACBEA3]/30 hover:bg-[#ACBEA3]/50 border border-[#ACBEA3] rounded-xl transition-colors font-poppins cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#08221B]" />
            <span>Add Custom Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {current.items.map((item, idx) => {
            const hasItemDiscount = Boolean(item.itemDiscountValue && item.itemDiscountValue > 0);
            const isDiscountOpen = showItemDiscountIndex === idx;

            return (
              <div
                key={item.id}
                className="p-3 bg-[#F8F4ED]/60 border border-[#ACBEA3]/30 rounded-xl hover:border-[#08221B]/40 transition-colors space-y-2"
              >
                <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[9px] font-montserrat font-bold text-[#2C3330] mb-0.5">
                      #{idx + 1} DESCRIPTION
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Dynamic Identity & Motion Brand Matrix"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-lg text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-[9px] font-montserrat font-bold text-[#2C3330] mb-0.5">
                      SAC
                    </label>
                    <input
                      type="text"
                      value={item.sacCode || '998311'}
                      onChange={(e) => handleItemChange(idx, 'sacCode', e.target.value)}
                      className="w-full px-1.5 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-lg text-[11px] font-space-mono text-[#08221B] focus:border-[#08221B] outline-none text-center"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[9px] font-montserrat font-bold text-[#2C3330] mb-0.5">
                      QTY
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-lg text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none text-center"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[9px] font-montserrat font-bold text-[#2C3330] mb-0.5">
                      UNIT
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      placeholder="Sprint / Round"
                      className="w-full px-2 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-lg text-xs font-poppins text-[#08221B] focus:border-[#08221B] outline-none text-center"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[9px] font-montserrat font-bold text-[#2C3330] mb-0.5">
                      RATE (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-lg text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none text-right"
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setShowItemDiscountIndex(isDiscountOpen ? null : idx)
                      }
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        hasItemDiscount
                          ? 'bg-[#FFA400]/25 text-[#08221B] font-semibold border border-[#FFA400]'
                          : 'text-[#2C3330]/60 hover:text-[#08221B] hover:bg-[#ACBEA3]/20'
                      }`}
                      title="Add Line-Item Discount"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={current.items.length <= 1}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        current.items.length <= 1
                          ? 'text-[#ACBEA3]/40 cursor-not-allowed'
                          : 'text-[#2C3330]/70 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Item-Level Discount Input */}
                {isDiscountOpen && (
                  <div className="pt-2 pb-1 px-3 bg-white border border-[#ACBEA3]/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#FFA400]" />
                      <span className="font-montserrat font-bold text-[10px] text-[#08221B] uppercase">
                        Item #{idx + 1} Discount:
                      </span>
                      <div className="flex bg-[#F8F4ED] rounded-lg p-0.5 border border-[#ACBEA3]/40">
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'itemDiscountType', 'percentage')}
                          className={`px-2 py-0.5 text-[10px] rounded ${
                            item.itemDiscountType !== 'flat'
                              ? 'bg-[#08221B] text-white font-semibold'
                              : 'text-[#2C3330]'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'itemDiscountType', 'flat')}
                          className={`px-2 py-0.5 text-[10px] rounded ${
                            item.itemDiscountType === 'flat'
                              ? 'bg-[#08221B] text-white font-semibold'
                              : 'text-[#2C3330]'
                          }`}
                        >
                          ₹
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={item.itemDiscountValue || 0}
                        onChange={(e) => handleItemChange(idx, 'itemDiscountValue', e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-0.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded text-xs font-space-mono text-right outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#2C3330]/80">
                        Net: <strong className="text-[#08221B] font-space-mono">₹{item.amount.toLocaleString('en-IN')}</strong>
                      </span>
                      {hasItemDiscount && (
                        <button
                          type="button"
                          onClick={() => {
                            handleItemChange(idx, 'itemDiscountValue', 0);
                            setShowItemDiscountIndex(null);
                          }}
                          className="text-[10px] text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ADVANCED TAXES, GST CALCULATOR & DISCOUNT ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax, GST & TDS Engine */}
        <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#FFA400]" />
              <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
                Tax &amp; GST Calculation Engine
              </h3>
            </div>
            <span className="text-[10px] font-space-mono font-bold bg-[#F8F4ED] px-2 py-0.5 rounded border border-[#ACBEA3]/40">
              SAC 9983 (Design &amp; IP)
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                GST REGIME &amp; JURISDICTION
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      current.discountType,
                      current.discountValue,
                      current.discountReason,
                      'intra',
                      current.gstRate || 18
                    )
                  }
                  className={`px-2.5 py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    current.gstType === 'intra'
                      ? 'border-[#08221B] bg-[#08221B] text-white font-semibold'
                      : 'border-[#ACBEA3]/40 bg-[#F8F4ED] text-[#2C3330] hover:border-[#08221B]'
                  }`}
                >
                  Intra-State
                  <span className="block text-[9px] opacity-75 font-space-mono">
                    CGST + SGST (9%+9%)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      current.discountType,
                      current.discountValue,
                      current.discountReason,
                      'inter',
                      current.gstRate || 18
                    )
                  }
                  className={`px-2.5 py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    current.gstType === 'inter'
                      ? 'border-[#08221B] bg-[#08221B] text-white font-semibold'
                      : 'border-[#ACBEA3]/40 bg-[#F8F4ED] text-[#2C3330] hover:border-[#08221B]'
                  }`}
                >
                  Inter-State
                  <span className="block text-[9px] opacity-75 font-space-mono">
                    IGST (18%)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      current.discountType,
                      current.discountValue,
                      current.discountReason,
                      'zero',
                      0
                    )
                  }
                  className={`px-2.5 py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    current.gstType === 'zero'
                      ? 'border-[#08221B] bg-[#08221B] text-white font-semibold'
                      : 'border-[#ACBEA3]/40 bg-[#F8F4ED] text-[#2C3330] hover:border-[#08221B]'
                  }`}
                >
                  Zero Tax
                  <span className="block text-[9px] opacity-75 font-space-mono">
                    Export / SEZ
                  </span>
                </button>
              </div>
            </div>

            {current.gstType !== 'zero' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                    GST RATE SLAB
                  </span>
                  <select
                    value={current.gstRate}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const rate = parseFloat(e.target.value) || 0;
                      recompute(
                        current.items,
                        current.discountType,
                        current.discountValue,
                        current.discountReason,
                        current.gstType,
                        rate
                      );
                    }}
                    className="w-full px-3 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
                  >
                    <option value={18}>18% (Standard Graphic Services)</option>
                    <option value={12}>12% (Print Goods / Books)</option>
                    <option value={5}>5% (Concessional)</option>
                    <option value={28}>28% (Luxury / Specific)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

                <div>
                  <span className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                    COMPENSATION CESS (%)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={current.cessRate || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      recompute(
                        current.items,
                        current.discountType,
                        current.discountValue,
                        current.discountReason,
                        current.gstType,
                        current.gstRate,
                        current.billingType,
                        current.singleBillPaid,
                        current.singleBillPaidAt,
                        current.milestones,
                        val
                      );
                    }}
                    className="w-full px-3 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none text-right"
                  />
                </div>
              </div>
            )}

            {/* TDS Section 194J Calculation Module */}
            <div className="p-3 bg-[#F8F4ED]/80 border border-[#ACBEA3]/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-montserrat font-bold text-xs text-[#08221B]">
                  Client TDS Deduction (Sec. 194J)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextTds = !current.tdsApplicable;
                    recompute(
                      current.items,
                      current.discountType,
                      current.discountValue,
                      current.discountReason,
                      current.gstType,
                      current.gstRate,
                      current.billingType,
                      current.singleBillPaid,
                      current.singleBillPaidAt,
                      current.milestones,
                      current.cessRate,
                      nextTds,
                      nextTds ? (current.tdsRate || 10) : 0
                    );
                  }}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    current.tdsApplicable
                      ? 'bg-[#08221B] text-[#ACBEA3]'
                      : 'bg-white text-[#2C3330] border border-[#ACBEA3]/60'
                  }`}
                >
                  {current.tdsApplicable ? 'TDS Enabled' : 'Enable TDS'}
                </button>
              </div>

              {current.tdsApplicable && (
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <label className="text-[9px] font-montserrat font-bold text-[#2C3330] uppercase block mb-0.5">
                      TDS SECTION &amp; RATE
                    </label>
                    <select
                      value={current.tdsRate || 10}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        const section = rate === 10 ? '194J (10% Professional)' : rate === 2 ? '194J (2% Technical)' : `${rate}% Custom`;
                        recompute(
                          current.items,
                          current.discountType,
                          current.discountValue,
                          current.discountReason,
                          current.gstType,
                          current.gstRate,
                          current.billingType,
                          current.singleBillPaid,
                          current.singleBillPaidAt,
                          current.milestones,
                          current.cessRate,
                          true,
                          rate,
                          section
                        );
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#ACBEA3]/40 rounded-lg text-xs font-space-mono outline-none"
                    >
                      <option value={10}>Sec. 194J — 10% (Professional)</option>
                      <option value={2}>Sec. 194J — 2% (Technical Services)</option>
                      <option value={1}>Sec. 194C — 1% (Contractor Ind.)</option>
                    </select>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-montserrat font-bold text-[#2C3330] uppercase block mb-0.5">
                      TDS AMOUNT DEDUCTED
                    </span>
                    <span className="font-space-mono text-xs font-bold text-red-600 block pt-1">
                      - {formatIndianCurrency(current.tdsAmount || 0)}
                    </span>
                    <span className="text-[10px] text-[#2C3330]/70 font-poppins block">
                      Net in Bank: {formatIndianCurrency(current.netReceivableAfterTds || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comprehensive Discount Studio */}
        <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFA400]" />
              <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
                Discount &amp; Concession Engine
              </h3>
            </div>
            {current.discountAmount > 0 && (
              <span className="text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-space-mono">
                Saving ₹{current.discountAmount.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Mode Selector & Custom Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
                DISCOUNT CALCULATION MODE
              </span>
              {current.discountValue > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      current.discountType,
                      0,
                      '',
                      current.gstType,
                      current.gstRate
                    )
                  }
                  className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear Discount (0)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      'percentage',
                      current.discountValue,
                      current.discountReason,
                      current.gstType,
                      current.gstRate
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    current.discountType === 'percentage'
                      ? 'bg-[#08221B] text-[#ACBEA3] font-semibold'
                      : 'text-[#2C3330] hover:text-[#08221B]'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      'flat',
                      current.discountValue,
                      current.discountReason,
                      current.gstType,
                      current.gstRate
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    current.discountType === 'flat'
                      ? 'bg-[#08221B] text-[#ACBEA3] font-semibold'
                      : 'text-[#2C3330] hover:text-[#08221B]'
                  }`}
                >
                  Flat Amount (₹)
                </button>
              </div>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  value={current.discountValue}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    recompute(
                      current.items,
                      current.discountType,
                      val,
                      current.discountReason,
                      current.gstType,
                      current.gstRate
                    );
                  }}
                  className="w-full pl-14 pr-3 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none text-right font-bold"
                />
                <span className="pointer-events-none absolute left-2.5 top-2 text-[10px] text-[#2C3330]/60 font-semibold uppercase">
                  {current.discountType === 'percentage' ? '% OFF' : '₹ FLAT'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Chips for Faster Workflow */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
              QUICK DISCOUNT PRESETS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[0, 5, 10, 15, 20, 25, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      'percentage',
                      pct,
                      current.discountReason,
                      current.gstType,
                      current.gstRate
                    )
                  }
                  className={`px-2.5 py-1 text-xs rounded-lg border font-space-mono font-medium transition-all cursor-pointer ${
                    current.discountType === 'percentage' && current.discountValue === pct
                      ? 'bg-[#08221B] text-[#FFA400] border-[#08221B]'
                      : 'bg-[#F8F4ED] text-[#2C3330] border-[#ACBEA3]/40 hover:border-[#08221B]'
                  }`}
                >
                  {pct === 0 ? 'No Disc.' : `${pct}%`}
                </button>
              ))}

              {[1000, 2500, 5000, 10000].map((flatVal) => (
                <button
                  key={flatVal}
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      'flat',
                      flatVal,
                      current.discountReason,
                      current.gstType,
                      current.gstRate
                    )
                  }
                  className={`px-2.5 py-1 text-xs rounded-lg border font-space-mono font-medium transition-all cursor-pointer ${
                    current.discountType === 'flat' && current.discountValue === flatVal
                      ? 'bg-[#08221B] text-[#FFA400] border-[#08221B]'
                      : 'bg-[#F8F4ED] text-[#2C3330] border-[#ACBEA3]/40 hover:border-[#08221B]'
                  }`}
                >
                  ₹{flatVal.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Reason / Promo Code (Reflected on Live Bill) */}
          <div className="space-y-1.5 pt-2 border-t border-[#ACBEA3]/20">
            <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase">
              DISCOUNT TITLE / REASON (APPEARS ON LIVE BILL)
            </label>
            <input
              type="text"
              value={current.discountReason || ''}
              onChange={(e) => {
                const reason = e.target.value;
                recompute(
                  current.items,
                  current.discountType,
                  current.discountValue,
                  reason,
                  current.gstType,
                  current.gstRate
                );
              }}
              placeholder="e.g. Agency Retainer Discount / Early Bird Concession"
              className="w-full px-3 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
            />
            {/* Quick Reason Suggestions */}
            <div className="flex flex-wrap gap-1 pt-1">
              {discountReasonSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() =>
                    recompute(
                      current.items,
                      current.discountType,
                      current.discountValue || 10,
                      sug,
                      current.gstType,
                      current.gstRate
                    )
                  }
                  className="px-2 py-0.5 bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 border border-[#ACBEA3]/40 rounded text-[10px] text-[#2C3330] transition-colors cursor-pointer"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Financial Summary */}
          <div className="p-3 bg-[#F8F4ED]/80 border border-[#ACBEA3]/30 rounded-xl space-y-1.5 text-xs font-poppins mt-2">
            <div className="flex justify-between">
              <span className="text-[#2C3330]">Gross Subtotal:</span>
              <span className="font-space-mono font-semibold text-[#08221B]">
                {formatIndianCurrency(current.subtotal)}
              </span>
            </div>
            {current.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount Deduction:</span>
                <span className="font-space-mono font-bold">
                  - {formatIndianCurrency(current.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#ACBEA3]/20 pt-1">
              <span className="text-[#2C3330] font-medium">Net Taxable Base:</span>
              <span className="font-space-mono font-semibold text-[#08221B]">
                {formatIndianCurrency(current.taxableAmount)}
              </span>
            </div>
            <div className="flex justify-between text-[#2C3330]">
              <span>Taxes ({current.gstType === 'zero' ? '0%' : `${current.gstRate}%`}):</span>
              <span className="font-space-mono text-[#08221B]">
                + {formatIndianCurrency(current.totalTax)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#08221B]/15 pt-1.5 text-sm font-bold font-montserrat text-[#08221B]">
              <span>Total Invoice Payable:</span>
              <span className="font-space-mono text-[#08221B]">
                {formatIndianCurrency(current.totalAmountDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT DISBURSEMENT SCHEDULE: SINGLE BILL OR 40-40-20 MILESTONE */}
      <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
        {current.billingType === 'single' ? (
          /* Single Bill Payment Settlement Card */
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#ACBEA3]/20">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFA400]" />
                <div>
                  <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
                    Single Bill Payment Status (100% Full Payment)
                  </h3>
                  <p className="text-xs text-[#2C3330]/70">
                    One-time payment for the entire invoice amount.
                  </p>
                </div>
              </div>
              <span
                className={`font-poppins text-xs font-semibold px-3 py-1 rounded-full ${
                  current.singleBillPaid || current.masterStatus === 'PAID'
                    ? 'bg-[#08221B] text-[#ACBEA3]'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {current.singleBillPaid || current.masterStatus === 'PAID' ? 'PAID' : 'DUE / UNPAID'}
              </span>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F8F4ED]/60 border border-[#ACBEA3]/30 rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-sm text-[#08221B]">
                    Full Settlement (100%)
                  </span>
                  {current.singleBillPaid && current.singleBillPaidAt && (
                    <span className="text-xs text-[#2C3330]/70 font-poppins">
                      Cleared on {current.singleBillPaidAt}
                    </span>
                  )}
                </div>
                <div className="font-space-mono text-lg font-bold text-[#08221B]">
                  {formatIndianCurrency(current.totalAmountDue)}
                </div>
                <p className="text-xs text-[#2C3330]/70">
                  Due on {current.dueDate || 'Upon delivery'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSingleBillPaid}
                  className={`px-4 py-2 rounded-xl text-xs font-poppins font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    current.singleBillPaid || current.masterStatus === 'PAID'
                      ? 'bg-[#08221B] text-[#ACBEA3] hover:bg-[#08221B]/90'
                      : 'bg-[#FFA400] text-[#08221B] hover:bg-[#e69400] shadow-xs active:scale-95'
                  }`}
                >
                  {current.singleBillPaid || current.masterStatus === 'PAID' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#ACBEA3]" />
                      <span>MARK AS UNPAID / DUE</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#08221B]" />
                      <span>MARK FULL BILL AS PAID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 40% - 40% - 20% Milestone Schedule */
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#08221B]" />
                <div>
                  <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
                    40% — 40% — 20% Milestone Schedule
                  </h3>
                  <p className="text-xs text-[#2C3330]/70">
                    Independent phase toggles sync master status automatically.
                  </p>
                </div>
              </div>
              <span
                className={`font-poppins text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  current.masterStatus === 'PAID'
                    ? 'bg-[#08221B] text-[#ACBEA3]'
                    : current.masterStatus === 'PARTIALLY PAID'
                    ? 'bg-[#FFA400]/20 text-[#08221B] border border-[#FFA400]/60'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {current.masterStatus}
              </span>
            </div>

            <div className="space-y-2.5 pt-2">
              {current.milestones.map((phase) => {
                const isPaid = phase.status === 'PAID';
                return (
                  <div
                    key={phase.phaseId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isPaid
                        ? 'bg-[#ACBEA3]/15 border-[#ACBEA3]'
                        : 'bg-[#F8F4ED]/50 border-[#ACBEA3]/30'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-montserrat font-bold text-xs text-[#08221B]">
                          Phase {phase.phaseId} ({phase.percentage}%)
                        </span>
                        {phase.paidAt && (
                          <span className="text-[10px] text-[#2C3330]/70">
                            Cleared {phase.paidAt}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#2C3330]/80">
                        {phase.name.split(':')[1]?.trim() || phase.name}
                      </p>
                      <div className="font-space-mono text-sm font-bold text-[#08221B]">
                        ₹{phase.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMilestoneToggle(phase.phaseId)}
                      className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-poppins font-semibold flex items-center gap-1.5 transition-all ${
                        isPaid
                          ? 'bg-[#08221B] text-[#ACBEA3]'
                          : 'bg-white text-[#08221B] border border-[#ACBEA3] hover:bg-[#ACBEA3]/20'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> MARK DUE
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" /> MARK PAID
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bank Settlement & Terms */}
      <div className="p-6 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#ACBEA3]/20">
          <CreditCard className="w-4 h-4 text-[#FFA400]" />
          <h3 className="text-sm font-bold font-montserrat text-[#08221B]">
            Settlement Instructions &amp; Contractual Terms
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
              BANK NAME
            </label>
            <input
              type="text"
              value={current.bankDetails.bankName}
              onChange={(e) => {
                const val = e.target.value;
                const updated = {
                  ...current,
                  bankDetails: { ...current.bankDetails, bankName: val },
                };
                setCurrent(updated);
                onLiveUpdate?.(updated);
              }}
              className="w-full px-2.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
              ACCOUNT NUMBER
            </label>
            <input
              type="text"
              value={current.bankDetails.accountNumber}
              onChange={(e) => {
                const val = e.target.value;
                const updated = {
                  ...current,
                  bankDetails: {
                    ...current.bankDetails,
                    accountNumber: val,
                  },
                };
                setCurrent(updated);
                onLiveUpdate?.(updated);
              }}
              className="w-full px-2.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
              UPI ID (VPA) FOR QR CODE
            </label>
            <input
              type="text"
              value={current.bankDetails.upiId}
              onChange={(e) => {
                const val = e.target.value;
                const updated = {
                  ...current,
                  bankDetails: { ...current.bankDetails, upiId: val },
                };
                setCurrent(updated);
                onLiveUpdate?.(updated);
              }}
              placeholder="theindianpixel@okaxis"
              className="w-full px-2.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
            TERMS &amp; CONDITIONS (EDITABLE)
          </label>
          <textarea
            rows={3}
            value={current.termsAndConditions}
            onChange={(e) => {
              const val = e.target.value;
              const updated = { ...current, termsAndConditions: val };
              setCurrent(updated);
              onLiveUpdate?.(updated);
            }}
            className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#2C3330] focus:border-[#08221B] outline-none resize-none font-poppins"
          />
        </div>
      </div>
    </div>
  );
}
