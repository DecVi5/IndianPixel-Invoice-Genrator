import { useState, useMemo } from 'react';
import { Invoice, MasterPaymentStatus, StudioConfig } from '../types/invoice.ts';
import { formatIndianCurrency, isInvoiceOverdue } from '../utils/financials.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { RevenueHealthDashboard } from './RevenueHealthDashboard.tsx';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  Edit2,
  Copy,
  Trash2,
  FolderOpen,
  Sparkles,
  Zap,
  Layers,
  Tag,
} from 'lucide-react';

interface LedgerDashboardProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onToggleMilestone: (invoiceId: string, phaseId: 1 | 2 | 3) => void;
  onCreateNewInvoice: () => void;
  onLoadSampleData?: () => void;
  studioConfig?: StudioConfig;
  isDarkMode?: boolean;
}

export function LedgerDashboard({
  invoices,
  onSelectInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onToggleMilestone,
  onCreateNewInvoice,
  onLoadSampleData,
  studioConfig,
  isDarkMode = true,
}: LedgerDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | MasterPaymentStatus | 'OVERDUE'
  >('ALL');

  // Compute studio-wide aggregate financial metrics
  const metrics = useMemo(() => {
    let totalContracted = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    invoices.forEach((inv) => {
      totalContracted += inv.totalAmountDue;

      let invoiceCollected = 0;
      if (inv.billingType === 'single') {
        invoiceCollected =
          inv.singleBillPaid || inv.masterStatus === 'PAID' ? inv.totalAmountDue : 0;
      } else {
        inv.milestones?.forEach((m) => {
          if (m.status === 'PAID') {
            invoiceCollected += m.amount;
          }
        });
      }

      totalCollected += invoiceCollected;

      const isOverdue = isInvoiceOverdue(inv.dueDate, inv.masterStatus);
      if (isOverdue) {
        overdueCount += 1;
        overdueAmount += Math.max(0, inv.totalAmountDue - invoiceCollected);
      }
    });

    const pendingReceivables = Math.max(0, totalContracted - totalCollected);
    const collectionRate =
      totalContracted > 0 ? Math.round((totalCollected / totalContracted) * 100) : 0;

    return {
      totalContracted,
      totalCollected,
      pendingReceivables,
      overdueCount,
      overdueAmount,
      collectionRate,
    };
  }, [invoices]);

  // Filter & Search Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const isOverdue = isInvoiceOverdue(inv.dueDate, inv.masterStatus);

      // Status filter
      if (statusFilter === 'OVERDUE' && !isOverdue) return false;
      if (
        statusFilter !== 'ALL' &&
        statusFilter !== 'OVERDUE' &&
        inv.masterStatus !== statusFilter
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = inv.invoiceNo.toLowerCase().includes(q);
        const matchClient = inv.client.name.toLowerCase().includes(q);
        const matchProject = (inv.projectName || '').toLowerCase().includes(q);
        return matchNo || matchClient || matchProject;
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12 font-poppins">
      {/* Top Banner: Studio Executive Header with Company Logo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center p-2 shadow-md shrink-0 transition-colors ${
              isDarkMode
                ? 'bg-[#08221B] border border-[#ACBEA3]/40 shadow-[0_0_15px_rgba(172,190,163,0.15)]'
                : 'bg-[#08221B] border border-[#08221B]'
            }`}
          >
            <BrandLogo
              customLogoUrl={studioConfig?.logoDataUrl}
              size="sm"
              variant="icon"
              theme="white"
              withText={false}
            />
          </div>
          <div>
            <h2
              className={`text-xl font-bold font-montserrat tracking-tight transition-colors ${
                isDarkMode ? 'text-white' : 'text-[#08221B]'
              }`}
            >
              Revenue &amp; Settlement Health
            </h2>
            <p
              className={`text-xs mt-0.5 transition-colors ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/75'
              }`}
            >
              Single bill and 40% - 40% - 20% studio payment lifecycle tracking.
            </p>
          </div>
        </div>

        <button
          onClick={onCreateNewInvoice}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FFA400] hover:bg-[#e69400] text-[#08221B] font-montserrat font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* 4 Stat Cards with Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Contracted Revenue */}
        <div
          className={`p-5 rounded-2xl transition-all duration-200 space-y-3 ${
            isDarkMode
              ? 'bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm hover:border-[#ACBEA3]/40'
              : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-montserrat font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
              }`}
            >
              CONTRACTED REVENUE
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDarkMode
                  ? 'bg-white/10 text-[#ACBEA3]'
                  : 'bg-[#F8F4ED] text-[#08221B]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-space-mono tabular-nums ${
              isDarkMode ? 'text-white' : 'text-[#08221B]'
            }`}
          >
            {formatIndianCurrency(metrics.totalContracted)}
          </div>
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-poppins ${
                isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
              }`}
            >
              <span>{invoices.length} Studio Invoices</span>
              <span>100% Pipeline</span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/10' : 'bg-[#F8F4ED]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDarkMode ? 'bg-[#ACBEA3]' : 'bg-[#08221B]'
                }`}
                style={{ width: invoices.length > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Cash Collected */}
        <div
          className={`p-5 rounded-2xl transition-all duration-200 space-y-3 ${
            isDarkMode
              ? 'bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm hover:border-[#ACBEA3]/40'
              : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-montserrat font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
              }`}
            >
              CASH COLLECTED
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[#ACBEA3]/20 text-[#08221B]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-space-mono tabular-nums ${
              isDarkMode ? 'text-white' : 'text-[#08221B]'
            }`}
          >
            {formatIndianCurrency(metrics.totalCollected)}
          </div>
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-poppins ${
                isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
              }`}
            >
              <span>Realized Liquidity</span>
              <span
                className={`font-semibold font-space-mono ${
                  isDarkMode ? 'text-emerald-400' : 'text-[#08221B]'
                }`}
              >
                {metrics.collectionRate}%
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/10' : 'bg-[#F8F4ED]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDarkMode ? 'bg-emerald-400' : 'bg-[#08221B]'
                }`}
                style={{ width: `${metrics.collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Receivables */}
        <div
          className={`p-5 rounded-2xl transition-all duration-200 space-y-3 ${
            isDarkMode
              ? 'bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm hover:border-[#ACBEA3]/40'
              : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-montserrat font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
              }`}
            >
              PENDING RECEIVABLES
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDarkMode
                  ? 'bg-[#FFA400]/20 text-[#FFA400]'
                  : 'bg-[#FFA400]/20 text-[#08221B]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#FFA400]" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-space-mono tabular-nums ${
              isDarkMode ? 'text-white' : 'text-[#08221B]'
            }`}
          >
            {formatIndianCurrency(metrics.pendingReceivables)}
          </div>
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-poppins ${
                isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
              }`}
            >
              <span>Scheduled Inflow</span>
              <span
                className={`font-semibold font-space-mono ${
                  isDarkMode ? 'text-[#FFA400]' : 'text-[#08221B]'
                }`}
              >
                {metrics.totalContracted > 0 ? 100 - metrics.collectionRate : 0}%
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/10' : 'bg-[#F8F4ED]'
              }`}
            >
              <div
                className="bg-[#FFA400] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    metrics.totalContracted > 0 ? 100 - metrics.collectionRate : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Overdue Attention */}
        <div
          className={`p-5 rounded-2xl transition-all duration-200 space-y-3 ${
            isDarkMode
              ? 'bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm hover:border-[#ACBEA3]/40'
              : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-montserrat font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
              }`}
            >
              OVERDUE ATTENTION
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDarkMode
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-space-mono tabular-nums ${
              metrics.overdueCount > 0
                ? 'text-rose-400'
                : isDarkMode
                ? 'text-white'
                : 'text-[#08221B]'
            }`}
          >
            {formatIndianCurrency(metrics.overdueAmount)}
          </div>
          <div
            className={`text-[10px] font-poppins pt-1 flex items-center justify-between ${
              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
            }`}
          >
            <span>
              {metrics.overdueCount === 0
                ? 'All settlements in good standing'
                : `${metrics.overdueCount} payment${
                    metrics.overdueCount > 1 ? 's' : ''
                  } delayed`}
            </span>
            {metrics.overdueCount > 0 && (
              <span
                className={`px-1.5 py-0.5 font-bold rounded ${
                  isDarkMode
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                Action Req.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Health Visual Dashboard Powered by Recharts */}
      <RevenueHealthDashboard
        invoices={invoices}
        onLoadSampleData={onLoadSampleData}
        onCreateNewInvoice={onCreateNewInvoice}
        isDarkMode={isDarkMode}
      />

      {/* Main Ledger Section with Glassmorphism */}
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm'
            : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs'
        }`}
      >
        {/* Controls Bar: Search & Status Filters */}
        <div
          className={`p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b ${
            isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
          }`}
        >
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/60'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, client, or project..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none font-poppins transition-colors ${
                isDarkMode
                  ? 'bg-white/[0.05] border border-white/10 text-white placeholder-slate-400 focus:border-[#FFA400]'
                  : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] placeholder-[#2C3330]/50 focus:border-[#08221B]'
              }`}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'ALL', label: 'All Invoices' },
                { id: 'UNPAID', label: 'Unpaid' },
                { id: 'PARTIALLY PAID', label: 'Partially Paid' },
                { id: 'PAID', label: 'Fully Paid' },
                { id: 'OVERDUE', label: 'Overdue' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1.5 text-xs font-poppins rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === filter.id
                    ? isDarkMode
                      ? 'bg-[#FFA400] text-[#08221B] font-bold shadow-xs'
                      : 'bg-[#08221B] text-[#ACBEA3] font-semibold shadow-xs'
                    : isDarkMode
                    ? 'bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
                    : 'bg-[#F8F4ED] text-[#2C3330] hover:text-[#08221B] hover:bg-[#ACBEA3]/20 border border-transparent'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List / Empty Zero State */}
        {invoices.length === 0 ? (
          <div className="p-12 sm:p-16 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#08221B] mx-auto flex items-center justify-center shadow-lg p-3 border border-[#ACBEA3]/30">
              <BrandLogo
                customLogoUrl={studioConfig?.logoDataUrl}
                size="md"
                variant="icon"
                theme="white"
                withText={false}
              />
            </div>
            <div className="space-y-1.5">
              <h3
                className={`font-montserrat font-bold text-lg ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Studio Ledger is at ₹0.00
              </h3>
              <p
                className={`text-xs leading-relaxed font-poppins ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/75'
                }`}
              >
                All metrics have been reset to zero. Start crafting professional single bills or milestone invoices for Indian Pixel clients.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onCreateNewInvoice}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#FFA400] hover:bg-[#e69400] text-[#08221B] font-montserrat font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Invoice</span>
              </button>

              {onLoadSampleData && (
                <button
                  onClick={onLoadSampleData}
                  className={`w-full sm:w-auto px-4 py-2.5 font-poppins font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                    isDarkMode
                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                      : 'bg-white hover:bg-[#F8F4ED] text-[#08221B] border-[#ACBEA3]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Load Sample Invoice</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-poppins">
              <thead>
                <tr
                  className={`font-montserrat text-[10px] uppercase tracking-wider ${
                    isDarkMode
                      ? 'bg-white/[0.04] text-slate-300 border-b border-white/10'
                      : 'bg-[#08221B] text-white'
                  }`}
                >
                  <th className="py-3 px-4">INVOICE &amp; DATE</th>
                  <th className="py-3 px-4">CLIENT &amp; PROJECT</th>
                  <th className="py-3 px-4">PAYMENT STRUCTURE</th>
                  <th className="py-3 px-4 text-right">CONTRACT VALUE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? 'divide-white/5' : 'divide-[#ACBEA3]/25'
                }`}
              >
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className={`py-12 text-center ${
                        isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
                      }`}
                    >
                      <FolderOpen className="w-8 h-8 mx-auto text-[#FFA400] mb-2 opacity-60" />
                      <p
                        className={`font-semibold text-sm ${
                          isDarkMode ? 'text-white' : 'text-[#08221B]'
                        }`}
                      >
                        No invoices match criteria
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/60'
                        }`}
                      >
                        Try adjusting search terms or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isOverdue = isInvoiceOverdue(inv.dueDate, inv.masterStatus);
                    const isSingle = inv.billingType === 'single';

                    return (
                      <tr
                        key={inv.id}
                        className={`transition-colors group ${
                          isDarkMode
                            ? 'hover:bg-white/[0.04]'
                            : 'hover:bg-[#F8F4ED]/40'
                        }`}
                      >
                        {/* Invoice No & Dates */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className={`font-bold transition-colors text-left block font-space-mono cursor-pointer ${
                              isDarkMode
                                ? 'text-white hover:text-[#FFA400]'
                                : 'text-[#08221B] hover:text-[#FFA400]'
                            }`}
                          >
                            {inv.invoiceNo}
                          </button>
                          <div
                            className={`text-[11px] flex items-center gap-1.5 mt-0.5 ${
                              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
                            }`}
                          >
                            <span>{inv.date}</span>
                            <span className="text-[#ACBEA3]">→</span>
                            <span
                              className={
                                isOverdue
                                  ? 'text-rose-400 font-semibold'
                                  : isDarkMode
                                  ? 'text-slate-300'
                                  : ''
                              }
                            >
                              {inv.dueDate}
                            </span>
                          </div>
                          {inv.discountAmount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.2 rounded mt-1 font-space-mono">
                              <Tag className="w-2.5 h-2.5" />
                              -₹{inv.discountAmount.toLocaleString('en-IN')} disc.
                            </span>
                          )}
                        </td>

                        {/* Client & Project */}
                        <td className="py-3.5 px-4">
                          <div
                            className={`font-semibold truncate max-w-xs font-poppins ${
                              isDarkMode ? 'text-white' : 'text-[#08221B]'
                            }`}
                          >
                            {inv.projectName || 'Untitled Project'}
                          </div>
                          <div
                            className={`text-[11px] truncate max-w-xs mt-0.5 font-poppins ${
                              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
                            }`}
                          >
                            {inv.client.name || 'Unnamed Client'}
                          </div>
                        </td>

                        {/* Payment Structure */}
                        <td className="py-3.5 px-4">
                          {isSingle ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMilestone(inv.id, 1);
                              }}
                              title={`Single Bill 100%: ₹${inv.totalAmountDue.toLocaleString(
                                'en-IN'
                              )} — Click to toggle Paid/Due`}
                              className={`group/btn flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-poppins transition-all cursor-pointer ${
                                inv.singleBillPaid || inv.masterStatus === 'PAID'
                                  ? isDarkMode
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : 'bg-[#08221B] border-[#08221B] text-[#ACBEA3]'
                                  : isDarkMode
                                  ? 'bg-white/5 border-white/10 text-slate-300 hover:border-[#FFA400]/50'
                                  : 'bg-white border-[#ACBEA3]/50 text-[#2C3330] hover:border-[#FFA400]'
                              }`}
                            >
                              <Zap
                                className={`w-3.5 h-3.5 ${
                                  inv.singleBillPaid || inv.masterStatus === 'PAID'
                                    ? 'text-emerald-400'
                                    : 'text-[#FFA400]'
                                }`}
                              />
                              <span className="font-semibold">Single Bill 100%</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-space-mono ${
                                  inv.singleBillPaid || inv.masterStatus === 'PAID'
                                    ? 'bg-emerald-400/20 text-emerald-300 font-bold'
                                    : 'bg-white/10 text-slate-300'
                                }`}
                              >
                                {inv.singleBillPaid || inv.masterStatus === 'PAID'
                                  ? 'PAID'
                                  : 'DUE'}
                              </span>
                            </button>
                          ) : (
                            /* 3 Milestone Badges */
                            <div className="flex flex-wrap items-center gap-1.5">
                              {inv.milestones?.map((m) => {
                                const isPaid = m.status === 'PAID';
                                return (
                                  <button
                                    key={m.phaseId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleMilestone(inv.id, m.phaseId);
                                    }}
                                    title={`Phase ${m.phaseId}: ${m.name} (${
                                      m.percentage
                                    }% = ₹${m.amount.toLocaleString(
                                      'en-IN'
                                    )}) — Click to toggle`}
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-space-mono transition-all cursor-pointer flex items-center gap-1 ${
                                      isPaid
                                        ? isDarkMode
                                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                                          : 'bg-[#08221B] border-[#08221B] text-[#ACBEA3] font-bold'
                                        : isDarkMode
                                        ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                        : 'bg-white border-[#ACBEA3]/40 text-[#2C3330] hover:border-[#08221B]'
                                    }`}
                                  >
                                    <span>
                                      {m.phaseId === 1
                                        ? '40% Adv'
                                        : m.phaseId === 2
                                        ? '40% Mid'
                                        : '20% Final'}
                                    </span>
                                    {isPaid ? (
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Clock className="w-2.5 h-2.5 text-[#FFA400] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Contract Value */}
                        <td
                          className={`py-3.5 px-4 text-right font-space-mono font-bold tabular-nums ${
                            isDarkMode ? 'text-white' : 'text-[#08221B]'
                          }`}
                        >
                          {formatIndianCurrency(inv.totalAmountDue)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                              inv.masterStatus === 'PAID'
                                ? isDarkMode
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-[#08221B] text-[#ACBEA3]'
                                : inv.masterStatus === 'PARTIALLY PAID'
                                ? isDarkMode
                                  ? 'bg-[#FFA400]/20 text-[#FFA400] border border-[#FFA400]/40'
                                  : 'bg-[#FFA400]/20 text-[#08221B] border border-[#FFA400]/60'
                                : isOverdue
                                ? isDarkMode
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-rose-100 text-rose-700 border border-rose-300'
                                : isDarkMode
                                ? 'bg-white/10 text-slate-300 border border-white/15'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}
                          >
                            {inv.masterStatus === 'PAID' ? (
                              <CheckCircle2
                                className={`w-3 h-3 ${
                                  isDarkMode ? 'text-emerald-400' : 'text-[#ACBEA3]'
                                }`}
                              />
                            ) : isOverdue ? (
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-[#FFA400]" />
                            )}
                            <span>{isOverdue ? 'OVERDUE' : inv.masterStatus}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onSelectInvoice(inv)}
                              title="Print A4 / View Preview"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDarkMode
                                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                                  : 'text-[#2C3330] hover:text-[#08221B] hover:bg-[#F8F4ED]'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditInvoice(inv)}
                              title="Edit In Direct Workspace"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDarkMode
                                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                                  : 'text-[#2C3330] hover:text-[#08221B] hover:bg-[#F8F4ED]'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDuplicateInvoice(inv)}
                              title="Duplicate invoice"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDarkMode
                                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                                  : 'text-[#2C3330] hover:text-[#08221B] hover:bg-[#F8F4ED]'
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteInvoice(inv.id)}
                              title="Delete invoice"
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
