import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { Invoice } from '../types/invoice.ts';
import { formatIndianCurrency } from '../utils/financials.ts';
import { BrandLogo } from './BrandLogo.tsx';
import {
  computeMonthlyRevenueTrends,
  computePaymentStatusDistribution,
  computeMilestoneCompletionTrends,
} from '../utils/analytics.ts';
import {
  PieChart as PieChartIcon,
  Layers,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RevenueHealthDashboardProps {
  invoices: Invoice[];
  onLoadSampleData?: () => void;
  onCreateNewInvoice?: () => void;
  isDarkMode?: boolean;
}

export function RevenueHealthDashboard({
  invoices,
  onLoadSampleData,
  isDarkMode = true,
}: RevenueHealthDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'monthly' | 'distribution' | 'milestones'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Compute analytics data
  const monthlyData = useMemo(() => computeMonthlyRevenueTrends(invoices), [invoices]);
  const statusData = useMemo(() => computePaymentStatusDistribution(invoices), [invoices]);
  const milestoneData = useMemo(() => computeMilestoneCompletionTrends(invoices), [invoices]);

  // Quick studio summary metrics
  const summary = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    invoices.forEach((inv) => {
      totalBilled += inv.totalAmountDue;
      if (inv.billingType === 'single') {
        if (inv.singleBillPaid || inv.masterStatus === 'PAID') {
          totalCollected += inv.totalAmountDue;
        }
      } else {
        inv.milestones?.forEach((m) => {
          if (m.status === 'PAID') totalCollected += m.amount;
        });
      }
    });

    const avgInvoice = invoices.length > 0 ? Math.round(totalBilled / invoices.length) : 0;
    const realizationRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalCollected,
      avgInvoice,
      realizationRate,
      invoiceCount: invoices.length,
    };
  }, [invoices]);

  // Custom tooltips with dark/light glassmorphic design
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b101b]/95 backdrop-blur-xl text-white p-3 rounded-xl shadow-2xl border border-white/20 text-xs font-poppins space-y-1">
          <div className="font-montserrat font-bold text-xs text-[#ACBEA3] border-b border-white/10 pb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-space-mono font-bold text-white">
                {formatIndianCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#0b101b]/95 backdrop-blur-xl text-white p-3 rounded-xl shadow-2xl border border-white/20 text-xs font-poppins space-y-1">
          <div className="font-montserrat font-bold text-xs flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-slate-300">Amount:</span>
            <span className="font-space-mono font-bold text-[#FFA400]">
              {formatIndianCurrency(data.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Invoices:</span>
            <span className="font-space-mono font-bold text-white">
              {data.payload.count}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (invoices.length === 0) {
    return (
      <div
        className={`p-6 rounded-2xl transition-all duration-200 space-y-4 ${
          isDarkMode
            ? 'bg-[#18202F]/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
            : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#08221B] flex items-center justify-center p-1.5 shadow-sm border border-[#ACBEA3]/30">
              <BrandLogo size="xs" variant="icon" theme="white" withText={false} />
            </div>
            <div>
              <h3
                className={`font-montserrat font-bold text-sm ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Revenue Health &amp; Visual Analytics
              </h3>
              <p
                className={`text-[11px] ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/70'
                }`}
              >
                Interactive Recharts tracking monthly volume, settlement split, and milestone funnels.
              </p>
            </div>
          </div>
          {onLoadSampleData && (
            <button
              onClick={onLoadSampleData}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-montserrat transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isDarkMode
                  ? 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200'
                  : 'bg-[#08221B] hover:bg-[#2C3330] text-[#ACBEA3]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFA400]" />
              <span>Load Sample Data</span>
            </button>
          )}
        </div>

        <div
          className={`p-8 border border-dashed rounded-xl text-center space-y-2 transition-colors ${
            isDarkMode
              ? 'border-white/15 bg-white/[0.02]'
              : 'border-[#ACBEA3]/50 bg-[#F8F4ED]/50'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#08221B] flex items-center justify-center mx-auto p-2 shadow-sm border border-[#ACBEA3]/30">
            <BrandLogo size="xs" variant="icon" theme="white" withText={false} />
          </div>
          <div
            className={`font-montserrat font-bold text-sm ${
              isDarkMode ? 'text-white' : 'text-[#08221B]'
            }`}
          >
            Waiting for Ledger Activity
          </div>
          <p
            className={`text-xs max-w-md mx-auto leading-relaxed ${
              isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/75'
            }`}
          >
            Charts will populate with monthly totals, payment distributions, and milestone completion trends once invoices are created or loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 ${
        isDarkMode
          ? 'bg-[#18202F]/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
          : 'bg-white/90 backdrop-blur-md border border-[#ACBEA3]/40 shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b ${
          isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#08221B] flex items-center justify-center p-1.5 shadow-sm border border-[#ACBEA3]/30 shrink-0">
            <BrandLogo size="xs" variant="icon" theme="white" withText={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`font-montserrat font-bold text-sm sm:text-base ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Revenue Health Dashboard
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-space-mono ${
                  isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-[#08221B] text-[#ACBEA3]'
                }`}
              >
                Recharts Live
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/70'
              }`}
            >
              Visualizing monthly cashflow velocity, status distribution, and milestone delivery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Tab Selector */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl text-xs font-poppins border ${
              isDarkMode
                ? 'bg-white/[0.06] border-white/10'
                : 'bg-[#F8F4ED] border-[#ACBEA3]/40'
            }`}
          >
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'all'
                  ? isDarkMode
                    ? 'bg-[#FFA400] text-[#08221B] font-bold shadow-xs'
                    : 'bg-[#08221B] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-[#2C3330] hover:text-[#08221B]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'monthly'
                  ? isDarkMode
                    ? 'bg-[#FFA400] text-[#08221B] font-bold shadow-xs'
                    : 'bg-[#08221B] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-[#2C3330] hover:text-[#08221B]'
              }`}
            >
              Monthly Inflows
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'distribution'
                  ? isDarkMode
                    ? 'bg-[#FFA400] text-[#08221B] font-bold shadow-xs'
                    : 'bg-[#08221B] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-[#2C3330] hover:text-[#08221B]'
              }`}
            >
              Status Split
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'milestones'
                  ? isDarkMode
                    ? 'bg-[#FFA400] text-[#08221B] font-bold shadow-xs'
                    : 'bg-[#08221B] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-[#2C3330] hover:text-[#08221B]'
              }`}
            >
              Milestones
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Charts' : 'Expand Charts'}
            className={`p-2 rounded-xl transition-colors cursor-pointer border ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 text-[#08221B] border-[#ACBEA3]/40'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div
        className={`px-5 py-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-poppins ${
          isDarkMode
            ? 'bg-white/[0.03] border-white/10 text-white'
            : 'bg-[#F8F4ED]/60 border-[#ACBEA3]/20'
        }`}
      >
        <div>
          <span
            className={`text-[10px] uppercase font-montserrat font-bold block ${
              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
            }`}
          >
            Average Ticket Size
          </span>
          <span
            className={`font-space-mono font-bold text-sm ${
              isDarkMode ? 'text-white' : 'text-[#08221B]'
            }`}
          >
            {formatIndianCurrency(summary.avgInvoice)}
          </span>
        </div>
        <div>
          <span
            className={`text-[10px] uppercase font-montserrat font-bold block ${
              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
            }`}
          >
            Cash Liquidity Ratio
          </span>
          <span className="font-space-mono font-bold text-emerald-400 text-sm">
            {summary.realizationRate}% Realized
          </span>
        </div>
        <div>
          <span
            className={`text-[10px] uppercase font-montserrat font-bold block ${
              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
            }`}
          >
            Active Billings
          </span>
          <span
            className={`font-space-mono font-bold text-sm ${
              isDarkMode ? 'text-white' : 'text-[#08221B]'
            }`}
          >
            {summary.invoiceCount} Deals Logged
          </span>
        </div>
        <div>
          <span
            className={`text-[10px] uppercase font-montserrat font-bold block ${
              isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
            }`}
          >
            Outstanding Pipeline
          </span>
          <span className="font-space-mono font-bold text-[#FFA400] text-sm">
            {formatIndianCurrency(Math.max(0, summary.totalBilled - summary.totalCollected))}
          </span>
        </div>
      </div>

      {/* Main Charts Body */}
      {isExpanded && (
        <div className="p-5 space-y-6">
          {/* Section 1: Monthly Invoice Totals & Collections */}
          {(activeTab === 'all' || activeTab === 'monthly') && (
            <div
              className={`p-4 rounded-2xl space-y-3 border ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-[#F8F4ED]/30 border-[#ACBEA3]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FFA400]" />
                  <h4
                    className={`font-montserrat font-bold text-xs uppercase tracking-wider ${
                      isDarkMode ? 'text-white' : 'text-[#08221B]'
                    }`}
                  >
                    Monthly Invoiced vs Cash Collected
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-poppins">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDarkMode ? 'bg-[#ACBEA3]' : 'bg-[#08221B]'
                      }`}
                    />
                    <span className={isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'}>
                      Billed Total
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFA400]" />
                    <span className={isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'}>
                      Cash Collected
                    </span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    barGap={6}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : '#ACBEA3'}
                      opacity={isDarkMode ? 1 : 0.25}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: isDarkMode ? '#94a3b8' : '#2C3330',
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      }}
                      axisLine={{
                        stroke: isDarkMode ? 'rgba(255,255,255,0.15)' : '#ACBEA3',
                        opacity: 0.5,
                      }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fill: isDarkMode ? '#94a3b8' : '#2C3330',
                        fontSize: 10,
                        fontFamily: 'Space Mono',
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomMonthlyTooltip />} />
                    <Bar
                      dataKey="billed"
                      name="Billed Amount"
                      fill={isDarkMode ? '#ACBEA3' : '#08221B'}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="collected"
                      name="Cash Collected"
                      fill="#FFA400"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Grid: 2 Side-by-side charts for Status Split & Milestone Completion */}
          {(activeTab === 'all' || activeTab === 'distribution' || activeTab === 'milestones') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 2: Payment Status Distribution (Donut Chart) */}
              {(activeTab === 'all' || activeTab === 'distribution') && (
                <div
                  className={`p-4 rounded-2xl space-y-3 flex flex-col justify-between border ${
                    isDarkMode
                      ? 'bg-white/[0.02] border-white/10'
                      : 'bg-[#F8F4ED]/30 border-[#ACBEA3]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-[#FFA400]" />
                      <h4
                        className={`font-montserrat font-bold text-xs uppercase tracking-wider ${
                          isDarkMode ? 'text-white' : 'text-[#08221B]'
                        }`}
                      >
                        Payment Status Breakdown
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-space-mono ${
                        isDarkMode ? 'text-slate-400' : 'text-[#2C3330]'
                      }`}
                    >
                      {invoices.length} Invoices Total
                    </span>
                  </div>

                  <div className="h-56 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          stroke={isDarkMode ? '#18202F' : '#ffffff'}
                          strokeWidth={2}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Collection Rate */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span
                        className={`font-space-mono font-bold text-lg ${
                          isDarkMode ? 'text-white' : 'text-[#08221B]'
                        }`}
                      >
                        {summary.realizationRate}%
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-montserrat ${
                          isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'
                        }`}
                      >
                        Collected
                      </span>
                    </div>
                  </div>

                  {/* Custom Legend Chips */}
                  <div
                    className={`grid grid-cols-2 gap-2 pt-2 border-t ${
                      isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
                    }`}
                  >
                    {statusData.map((item) => (
                      <div
                        key={item.name}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-poppins border ${
                          isDarkMode
                            ? 'bg-white/[0.05] border-white/10 text-white'
                            : 'bg-white border-[#ACBEA3]/30 text-[#2C3330]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span
                            className={`truncate text-[11px] font-medium ${
                              isDarkMode ? 'text-slate-200' : 'text-[#2C3330]'
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span
                          className={`font-space-mono font-bold text-[11px] shrink-0 ${
                            isDarkMode ? 'text-[#FFA400]' : 'text-[#08221B]'
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart 3: Milestone & Settlement Completion Trends */}
              {(activeTab === 'all' || activeTab === 'milestones') && (
                <div
                  className={`p-4 rounded-2xl space-y-3 flex flex-col justify-between border ${
                    isDarkMode
                      ? 'bg-white/[0.02] border-white/10'
                      : 'bg-[#F8F4ED]/30 border-[#ACBEA3]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#FFA400]" />
                      <h4
                        className={`font-montserrat font-bold text-xs uppercase tracking-wider ${
                          isDarkMode ? 'text-white' : 'text-[#08221B]'
                        }`}
                      >
                        Milestone Completion Funnel
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-poppins ${
                        isDarkMode ? 'text-slate-400' : 'text-[#2C3330]'
                      }`}
                    >
                      Single Bill &amp; 3-Phase Delivery
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {milestoneData.map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-poppins">
                          <span
                            className={`font-semibold text-[11.5px] truncate ${
                              isDarkMode ? 'text-white' : 'text-[#08221B]'
                            }`}
                          >
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 font-space-mono text-[11px]">
                            <span
                              className={isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/80'}
                            >
                              {item.completed} / {item.total} settled
                            </span>
                            <span
                              className={`font-bold ${
                                isDarkMode ? 'text-[#FFA400]' : 'text-[#08221B]'
                              }`}
                            >
                              ({item.completionRate}%)
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div
                          className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
                            isDarkMode
                              ? 'bg-white/10 border-white/10'
                              : 'bg-white border-[#ACBEA3]/40'
                          }`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#ACBEA3] to-[#FFA400]"
                            style={{ width: `${item.completionRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`p-2.5 rounded-xl text-[10.5px] font-poppins flex items-center gap-2 border ${
                      isDarkMode
                        ? 'bg-white/[0.04] border-white/10 text-slate-300'
                        : 'bg-white border-[#ACBEA3]/30 text-[#2C3330]/80'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#FFA400] shrink-0" />
                    <span>
                      Guarantees zero delivery before 40% Advance lock and strict IP handover upon 20% final settlement.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
