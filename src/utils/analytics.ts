import type { Invoice } from '../types/invoice.ts';
import { isInvoiceOverdue } from './financials.ts';

export interface MonthlyTrendData {
  month: string; // e.g. "Oct 2026"
  timestamp: number;
  billed: number;
  collected: number;
  pending: number;
  invoiceCount: number;
}

export interface StatusDistributionItem {
  name: string;
  count: number;
  value: number;
  color: string;
}

export interface MilestoneTrendData {
  name: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

/**
 * Parses DD/MM/YYYY or ISO date string into a Date object
 */
export function parseInvoiceDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Computes monthly totals for billed, collected, and pending amounts.
 */
export function computeMonthlyRevenueTrends(invoices: Invoice[]): MonthlyTrendData[] {
  if (!invoices || invoices.length === 0) {
    return [];
  }

  const map = new Map<string, { billed: number; collected: number; timestamp: number; count: number }>();

  invoices.forEach((inv) => {
    const d = parseInvoiceDate(inv.date);
    const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const sortTimestamp = new Date(d.getFullYear(), d.getMonth(), 1).getTime();

    let collected = 0;
    if (inv.billingType === 'single') {
      collected = inv.singleBillPaid || inv.masterStatus === 'PAID' ? inv.totalAmountDue : 0;
    } else {
      inv.milestones?.forEach((m) => {
        if (m.status === 'PAID') {
          collected += m.amount;
        }
      });
    }

    const current = map.get(monthKey) || { billed: 0, collected: 0, timestamp: sortTimestamp, count: 0 };
    current.billed += inv.totalAmountDue;
    current.collected += collected;
    current.count += 1;
    map.set(monthKey, current);
  });

  return Array.from(map.entries())
    .map(([month, data]) => ({
      month,
      timestamp: data.timestamp,
      billed: Math.round(data.billed),
      collected: Math.round(data.collected),
      pending: Math.max(0, Math.round(data.billed - data.collected)),
      invoiceCount: data.count,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Computes distribution of invoices across payment statuses.
 */
export function computePaymentStatusDistribution(invoices: Invoice[]): StatusDistributionItem[] {
  let paidCount = 0;
  let paidValue = 0;
  let partialCount = 0;
  let partialValue = 0;
  let unpaidCount = 0;
  let unpaidValue = 0;
  let overdueCount = 0;
  let overdueValue = 0;

  invoices.forEach((inv) => {
    let collected = 0;
    if (inv.billingType === 'single') {
      collected = inv.singleBillPaid || inv.masterStatus === 'PAID' ? inv.totalAmountDue : 0;
    } else {
      inv.milestones?.forEach((m) => {
        if (m.status === 'PAID') collected += m.amount;
      });
    }

    const isOverdue = isInvoiceOverdue(inv.dueDate, inv.masterStatus);

    if (isOverdue) {
      overdueCount += 1;
      overdueValue += Math.max(0, inv.totalAmountDue - collected);
    } else if (inv.masterStatus === 'PAID') {
      paidCount += 1;
      paidValue += inv.totalAmountDue;
    } else if (inv.masterStatus === 'PARTIALLY PAID') {
      partialCount += 1;
      partialValue += inv.totalAmountDue;
    } else {
      unpaidCount += 1;
      unpaidValue += inv.totalAmountDue;
    }
  });

  const list: StatusDistributionItem[] = [
    { name: 'Fully Paid', count: paidCount, value: Math.round(paidValue), color: '#08221B' },
    { name: 'Partially Paid', count: partialCount, value: Math.round(partialValue), color: '#ACBEA3' },
    { name: 'Unpaid (Due)', count: unpaidCount, value: Math.round(unpaidValue), color: '#FFA400' },
  ];

  if (overdueCount > 0) {
    list.push({ name: 'Overdue', count: overdueCount, value: Math.round(overdueValue), color: '#DC2626' });
  }

  return list;
}

/**
 * Computes milestone and settlement completion trends across invoices.
 */
export function computeMilestoneCompletionTrends(invoices: Invoice[]): MilestoneTrendData[] {
  let singleTotal = 0;
  let singlePaid = 0;

  let p1Total = 0;
  let p1Paid = 0;

  let p2Total = 0;
  let p2Paid = 0;

  let p3Total = 0;
  let p3Paid = 0;

  invoices.forEach((inv) => {
    if (inv.billingType === 'single') {
      singleTotal += 1;
      if (inv.singleBillPaid || inv.masterStatus === 'PAID') {
        singlePaid += 1;
      }
    } else {
      const ms = inv.milestones || [];
      if (ms[0]) {
        p1Total += 1;
        if (ms[0].status === 'PAID') p1Paid += 1;
      }
      if (ms[1]) {
        p2Total += 1;
        if (ms[1].status === 'PAID') p2Paid += 1;
      }
      if (ms[2]) {
        p3Total += 1;
        if (ms[2].status === 'PAID') p3Paid += 1;
      }
    }
  });

  const results: MilestoneTrendData[] = [];

  if (singleTotal > 0) {
    results.push({
      name: 'Single Bill (100%)',
      total: singleTotal,
      completed: singlePaid,
      pending: singleTotal - singlePaid,
      completionRate: Math.round((singlePaid / singleTotal) * 100),
    });
  }

  results.push(
    {
      name: 'Phase 1: Advance (40%)',
      total: p1Total,
      completed: p1Paid,
      pending: p1Total - p1Paid,
      completionRate: p1Total > 0 ? Math.round((p1Paid / p1Total) * 100) : 0,
    },
    {
      name: 'Phase 2: Midpoint (40%)',
      total: p2Total,
      completed: p2Paid,
      pending: p2Total - p2Paid,
      completionRate: p2Total > 0 ? Math.round((p2Paid / p2Total) * 100) : 0,
    },
    {
      name: 'Phase 3: Handover (20%)',
      total: p3Total,
      completed: p3Paid,
      pending: p3Total - p3Paid,
      completionRate: p3Total > 0 ? Math.round((p3Paid / p3Total) * 100) : 0,
    }
  );

  return results;
}
