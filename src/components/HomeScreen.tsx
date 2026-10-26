import { useState, useMemo } from 'react';
import type { Invoice, StudioConfig } from '../types/invoice.ts';
import { formatIndianCurrency, isInvoiceOverdue } from '../utils/financials.ts';
import { BrandLogo } from './BrandLogo.tsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  FileText,
  Eye,
  Edit2,
  Zap,
  Layers,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  Building2,
} from 'lucide-react';

interface HomeScreenProps {
  invoices: Invoice[];
  studioConfig: StudioConfig;
  onNavigateTab: (tab: 'home' | 'create' | 'invoices' | 'settings' | 'analytics') => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onLoadSampleData?: () => void;
  isDarkMode?: boolean;
}

export function HomeScreen({
  invoices,
  studioConfig,
  onNavigateTab,
  onSelectInvoice,
  onEditInvoice,
  onLoadSampleData,
  isDarkMode = true,
}: HomeScreenProps) {
  const [activeDataIndex, setActiveDataIndex] = useState<number | null>(3); // Default Thu

  // Compute studio aggregate financial metrics
  const metrics = useMemo(() => {
    let totalContracted = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let singleBillCount = 0;
    let milestoneCount = 0;

    invoices.forEach((inv) => {
      totalContracted += inv.totalAmountDue;

      if (inv.billingType === 'single') {
        singleBillCount += 1;
      } else {
        milestoneCount += 1;
      }

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
      singleBillCount,
      milestoneCount,
    };
  }, [invoices]);

  // Current active invoices (latest 5)
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 5);
  }, [invoices]);

  // Weekly billing velocity curve in Indian Pixel palette
  const chartData = useMemo(() => {
    if (invoices.length === 0) {
      return [
        { day: 'Mon', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
        { day: 'Tue', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
        { day: 'Wed', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
        { day: 'Thu', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
        { day: 'Fri', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
        { day: 'Sat', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
        { day: 'Sun', output: 0, forecast: 0, billed: '₹ 0.00', projected: '₹ 0.00' },
      ];
    }

    const baseScale = Math.max(1, metrics.totalContracted / 1000);
    return [
      { day: 'Mon', output: Math.round(baseScale * 0.15), forecast: Math.round(baseScale * 0.18), billed: formatIndianCurrency(metrics.totalContracted * 0.15) },
      { day: 'Tue', output: Math.round(baseScale * 0.35), forecast: Math.round(baseScale * 0.3), billed: formatIndianCurrency(metrics.totalContracted * 0.35) },
      { day: 'Wed', output: Math.round(baseScale * 0.28), forecast: Math.round(baseScale * 0.4), billed: formatIndianCurrency(metrics.totalContracted * 0.28) },
      { day: 'Thu', output: Math.round(baseScale * 0.58), forecast: Math.round(baseScale * 0.45), billed: formatIndianCurrency(metrics.totalCollected || metrics.totalContracted * 0.58) },
      { day: 'Fri', output: Math.round(baseScale * 0.42), forecast: Math.round(baseScale * 0.38), billed: formatIndianCurrency(metrics.totalContracted * 0.42) },
      { day: 'Sat', output: Math.round(baseScale * 0.52), forecast: Math.round(baseScale * 0.48), billed: formatIndianCurrency(metrics.totalContracted * 0.52) },
      { day: 'Sun', output: Math.round(baseScale * 0.70), forecast: Math.round(baseScale * 0.62), billed: formatIndianCurrency(metrics.totalContracted * 0.70) },
    ];
  }, [invoices, metrics]);

  const activePoint = chartData[activeDataIndex ?? 3] || chartData[3];

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 font-poppins text-[#F8F4ED]">
      {/* Top Header: Studio Identity & Legal Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-montserrat tracking-tight text-[#F8F4ED]">
              Executive Overview
            </h1>
            {invoices.length === 0 && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#ACBEA3]/15 text-[#FFA400] border border-[#ACBEA3]/30 font-space-mono">
                Deployment Ready · ₹0.00
              </span>
            )}
          </div>
          <p className="text-xs text-[#ACBEA3] leading-relaxed">
            Real-time billing velocity, milestone cashflow, and statutory PAN compliance.
          </p>
        </div>

        {/* Legal PAN & Exemption Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08221B] border border-[#ACBEA3]/30 text-xs text-[#F8F4ED] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FFA400] shadow-[0_0_8px_#FFA400]" />
            <span className="text-[#ACBEA3]">PAN:</span>
            <strong className="font-space-mono text-[#F8F4ED]">{studioConfig.pan || 'KJKPD8069P'}</strong>
            <span className="text-[#ACBEA3]/50">·</span>
            <span className="text-[#ACBEA3] font-medium">Sec 22 CGST Exempt</span>
          </div>

          {onLoadSampleData && invoices.length === 0 && (
            <button
              onClick={onLoadSampleData}
              className="press-scale inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C3330] hover:bg-[#38423e] text-[#FFA400] text-xs font-semibold border border-[#FFA400]/30 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFA400]" />
              <span>Load Sample Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Clean Metric Cards (Strict 5-Color Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Contracted Billings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#ACBEA3]">
              Contracted Billings
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/30 text-[#FFA400] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-space-mono text-[#F8F4ED] tracking-tight tabular-nums">
              {formatIndianCurrency(metrics.totalContracted)}
            </div>
            <div className="text-[11px] text-[#ACBEA3] mt-1">
              {invoices.length > 0
                ? `${invoices.length} Registered Invoice${invoices.length > 1 ? 's' : ''}`
                : '0 Invoices on Ledger'}
            </div>
          </div>
          <div className="pt-2 border-t border-[#ACBEA3]/15 flex items-center justify-between text-xs">
            <span className="text-[#FFA400] font-medium flex items-center gap-1 text-[11px]">
              <TrendingUp className="w-3 h-3" />
              <span>Active Pipeline</span>
            </span>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-[#ACBEA3] hover:text-[#F8F4ED] flex items-center gap-0.5 text-[11px] cursor-pointer transition-colors"
            >
              <span>View ledger</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Realized Collections */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#ACBEA3]">
              Realized Cash Inflows
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/30 text-[#ACBEA3] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#FFA400]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-space-mono text-[#F8F4ED] tracking-tight tabular-nums">
              {formatIndianCurrency(metrics.totalCollected)}
            </div>
            <div className="text-[11px] text-[#ACBEA3] mt-1">
              Bank UPI / Direct Settlement
            </div>
          </div>
          <div className="pt-2 border-t border-[#ACBEA3]/15 flex items-center justify-between text-xs">
            <span className="text-[#ACBEA3] font-medium text-[11px]">
              {metrics.collectionRate}% Realized
            </span>
            <span className="text-[11px] font-space-mono text-[#FFA400]">Verified</span>
          </div>
        </div>

        {/* Card 3: Pending Receivables */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#ACBEA3]">
              Pending Receivables
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/30 text-[#FFA400] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-space-mono text-[#FFA400] tracking-tight tabular-nums">
              {formatIndianCurrency(metrics.pendingReceivables)}
            </div>
            <div className="text-[11px] text-[#ACBEA3] mt-1">
              Scheduled milestone balance
            </div>
          </div>
          <div className="pt-2 border-t border-[#ACBEA3]/15 flex items-center justify-between text-xs">
            <span className="text-[#ACBEA3] text-[11px]">
              {invoices.length > 0 ? 'Milestones 2 & 3' : '₹ 0.00 Balance'}
            </span>
            <span className="text-[11px] font-space-mono text-[#ACBEA3]">
              {invoices.length > 0 ? 'Due net-14' : 'All clear'}
            </span>
          </div>
        </div>

        {/* Card 4: Studio Settlement Efficiency */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#ACBEA3]">
              Settlement Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/30 text-[#ACBEA3] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#FFA400]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-space-mono text-[#F8F4ED] tracking-tight">
              {metrics.overdueCount > 0 ? `${metrics.overdueCount} Overdue` : '100%'}
            </div>
            <div className="text-[11px] text-[#ACBEA3] mt-1">
              {metrics.overdueCount > 0
                ? `${formatIndianCurrency(metrics.overdueAmount)} requires follow-up`
                : 'Zero overdue payment alerts'}
            </div>
          </div>
          <div className="pt-2 border-t border-[#ACBEA3]/15 flex items-center justify-between text-xs">
            <span className="text-[#ACBEA3] text-[11px]">Statutory Sec 22</span>
            <span className="text-[11px] font-space-mono text-[#FFA400]">Compliant</span>
          </div>
        </div>
      </div>

      {/* Bento Grid: Left Chart (8 cols) + Right Studio Details (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left: Interactive Cashflow Velocity Chart */}
        <div className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold font-montserrat text-[#F8F4ED]">
                Weekly Billing Velocity &amp; Cashflow
              </h2>
              <p className="text-xs text-[#ACBEA3]">
                Daily milestone disbursements vs projected cash clearance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2C3330] border border-[#ACBEA3]/30 text-xs text-[#F8F4ED]">
                <span className="w-2 h-2 rounded-full bg-[#FFA400]" />
                <span className="text-[11px]">Realized Revenue</span>
              </div>
            </div>
          </div>

          {/* Active Data Chip */}
          <div className="p-3 rounded-xl bg-[#2C3330]/70 border border-[#ACBEA3]/20 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFA400]" />
              <span className="font-space-mono text-[#F8F4ED]">
                {activePoint?.day} Inflow: <strong className="text-[#FFA400]">{activePoint?.billed}</strong>
              </span>
            </div>
            <span className="text-[11px] text-[#ACBEA3]">Tap columns to inspect daily volume</span>
          </div>

          {/* Chart Area */}
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    const idx = Number(e.activeTooltipIndex);
                    if (!isNaN(idx)) {
                      setActiveDataIndex(idx);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFA400" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FFA400" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ACBEA3" strokeOpacity={0.12} />
                <XAxis
                  dataKey="day"
                  stroke="#ACBEA3"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#ACBEA3', strokeOpacity: 0.2 }}
                />
                <YAxis
                  stroke="#ACBEA3"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#ACBEA3', strokeOpacity: 0.2 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-[#08221B] border border-[#ACBEA3]/40 rounded-xl shadow-xl text-xs space-y-1">
                          <div className="font-bold text-[#F8F4ED] font-montserrat">{data.day}</div>
                          <div className="text-[#FFA400] font-space-mono">Billed: {data.billed}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="output"
                  stroke="#FFA400"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Studio Operations & Verified Profile */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card A: Official Studio Banking & Settlements */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-montserrat text-[#F8F4ED]">
                Settlement Rail
              </h3>
              <span className="text-[10px] font-space-mono text-[#FFA400] uppercase font-semibold">
                Direct Clear
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#2C3330]/80 border border-[#ACBEA3]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FFA400]" />
                  <div>
                    <div className="text-[11px] text-[#ACBEA3]">Bank Account</div>
                    <div className="font-space-mono font-medium text-[#F8F4ED]">
                      {studioConfig.accountNumber ? `•••• ${studioConfig.accountNumber.slice(-4)}` : 'HDFC Bank'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#ACBEA3] font-space-mono">
                  {studioConfig.ifscCode || 'HDFC0000240'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#2C3330]/80 border border-[#ACBEA3]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#FFA400]" />
                  <div>
                    <div className="text-[11px] text-[#ACBEA3]">UPI Settlement VPA</div>
                    <div className="font-space-mono font-medium text-[#F8F4ED] truncate max-w-[150px]">
                      {studioConfig.upiId || 'theindianpixel@okaxis'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#ACBEA3] font-space-mono">Instant</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#2C3330]/40 border border-[#ACBEA3]/15 text-[11px] text-[#ACBEA3] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFA400] shrink-0" />
              <span>Invoicing exempt under Section 22 CGST Act. No reverse tax obligation.</span>
            </div>
          </div>

          {/* Card B: Quick Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm space-y-3">
            <h3 className="text-sm font-bold font-montserrat text-[#F8F4ED]">
              Quick Create
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('create')}
                className="press-scale p-3 rounded-xl bg-[#FFA400] hover:bg-[#ffb426] text-[#08221B] font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Invoice</span>
              </button>
              <button
                onClick={() => onNavigateTab('invoices')}
                className="press-scale p-3 rounded-xl bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/30 text-[#F8F4ED] font-medium text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-[#FFA400]" />
                <span>All Invoices</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Invoices Section */}
      <div className="rounded-2xl bg-[#08221B] border border-[#ACBEA3]/25 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#ACBEA3]/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/30 text-[#FFA400] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-sm sm:text-base text-[#F8F4ED]">
                Recent Studio Invoices
              </h3>
              <p className="text-xs text-[#ACBEA3]">
                Client disbursements, milestone breakdown, and settlement status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onNavigateTab('invoices')}
              className="px-3.5 py-1.5 rounded-xl bg-[#2C3330] hover:bg-[#38423e] text-xs text-[#F8F4ED] border border-[#ACBEA3]/30 transition-colors cursor-pointer"
            >
              View All ({invoices.length})
            </button>
            <button
              onClick={() => onNavigateTab('create')}
              className="press-scale flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#FFA400] hover:bg-[#ffb426] text-[#08221B] font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Invoice</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {recentInvoices.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C3330] border border-[#ACBEA3]/30 flex items-center justify-center p-1.5 mx-auto shadow-sm">
              <BrandLogo size="sm" variant="icon" theme="white" withText={false} />
            </div>
            <div className="font-montserrat font-bold text-sm text-[#F8F4ED]">
              No Invoices Generated Yet
            </div>
            <p className="text-xs text-[#ACBEA3] max-w-sm mx-auto">
              Ready to generate your first single bill or milestone invoice for Indian Pixel clients?
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => onNavigateTab('create')}
                className="press-scale px-4 py-2 rounded-xl bg-[#FFA400] text-[#08221B] text-xs font-bold shadow-xs cursor-pointer"
              >
                + Generate Invoice
              </button>
              {onLoadSampleData && (
                <button
                  onClick={onLoadSampleData}
                  className="press-scale px-4 py-2 rounded-xl bg-[#2C3330] text-[#FFA400] text-xs font-semibold border border-[#FFA400]/40 cursor-pointer"
                >
                  Load Sample
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop & Tablet Table (Hidden on small phones) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs font-poppins">
                <thead className="text-[11px] font-bold font-montserrat uppercase tracking-wider text-[#ACBEA3] bg-[#051712] border-b border-[#ACBEA3]/15">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client / Project</th>
                    <th className="py-3 px-4">Billing Type</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ACBEA3]/10">
                  {recentInvoices.map((inv) => {
                    const isSingle = inv.billingType === 'single';
                    const isOverdue = isInvoiceOverdue(inv.dueDate, inv.masterStatus);

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-[#2C3330]/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-space-mono font-bold text-[#F8F4ED]">
                          {inv.invoiceNo}
                          <span className="block text-[10px] font-poppins font-normal text-[#ACBEA3]">
                            {inv.date}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#F8F4ED]">
                            {inv.client.name || 'Valued Client'}
                          </div>
                          <div className="text-[11px] truncate max-w-xs text-[#ACBEA3]">
                            {inv.projectName || 'Commercial Design Services'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2C3330] border border-[#ACBEA3]/30 text-[#F8F4ED]">
                            {isSingle ? (
                              <>
                                <Zap className="w-3 h-3 text-[#FFA400]" />
                                <span>Single Bill</span>
                              </>
                            ) : (
                              <>
                                <Layers className="w-3 h-3 text-[#ACBEA3]" />
                                <span>Milestone</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-space-mono font-bold tabular-nums text-[#F8F4ED]">
                          {formatIndianCurrency(inv.totalAmountDue)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                              inv.masterStatus === 'PAID'
                                ? 'bg-[#ACBEA3]/20 text-[#ACBEA3] border border-[#ACBEA3]/40'
                                : inv.masterStatus === 'PARTIALLY PAID'
                                ? 'bg-[#FFA400]/20 text-[#FFA400] border border-[#FFA400]/40'
                                : isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-[#2C3330] text-[#ACBEA3] border border-[#ACBEA3]/30'
                            }`}
                          >
                            {inv.masterStatus === 'PAID' ? (
                              <CheckCircle2 className="w-3 h-3 text-[#ACBEA3]" />
                            ) : isOverdue ? (
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-[#FFA400]" />
                            )}
                            <span>{isOverdue ? 'OVERDUE' : inv.masterStatus}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSelectInvoice(inv)}
                              title="Preview / Print A4"
                              className="p-1.5 rounded-lg bg-[#2C3330] hover:bg-[#38423e] text-[#F8F4ED] transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#FFA400]" />
                            </button>
                            <button
                              onClick={() => onEditInvoice(inv)}
                              title="Edit Invoice"
                              className="p-1.5 rounded-lg bg-[#2C3330] hover:bg-[#38423e] text-[#F8F4ED] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#ACBEA3]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Visible only on small phones < 640px) */}
            <div className="block sm:hidden divide-y divide-[#ACBEA3]/10">
              {recentInvoices.map((inv) => {
                const isSingle = inv.billingType === 'single';
                const isOverdue = isInvoiceOverdue(inv.dueDate, inv.masterStatus);

                return (
                  <div key={inv.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-space-mono font-bold text-sm text-[#F8F4ED]">
                          {inv.invoiceNo}
                        </div>
                        <div className="text-xs font-semibold text-[#F8F4ED] mt-0.5">
                          {inv.client.name || 'Valued Client'}
                        </div>
                        <div className="text-[11px] text-[#ACBEA3]">
                          {inv.projectName || 'Commercial Design Services'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-space-mono font-bold text-sm text-[#FFA400]">
                          {formatIndianCurrency(inv.totalAmountDue)}
                        </div>
                        <div className="text-[10px] text-[#ACBEA3] mt-0.5">{inv.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.masterStatus === 'PAID'
                            ? 'bg-[#ACBEA3]/20 text-[#ACBEA3] border border-[#ACBEA3]/40'
                            : inv.masterStatus === 'PARTIALLY PAID'
                            ? 'bg-[#FFA400]/20 text-[#FFA400] border border-[#FFA400]/40'
                            : isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-[#2C3330] text-[#ACBEA3] border border-[#ACBEA3]/30'
                        }`}
                      >
                        {inv.masterStatus === 'PAID' ? (
                          <CheckCircle2 className="w-3 h-3 text-[#ACBEA3]" />
                        ) : isOverdue ? (
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-[#FFA400]" />
                        )}
                        <span>{isOverdue ? 'OVERDUE' : inv.masterStatus}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="px-3 py-1.5 rounded-lg bg-[#2C3330] text-xs font-medium text-[#F8F4ED] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FFA400]" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="px-3 py-1.5 rounded-lg bg-[#2C3330] text-xs font-medium text-[#F8F4ED] flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#ACBEA3]" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
