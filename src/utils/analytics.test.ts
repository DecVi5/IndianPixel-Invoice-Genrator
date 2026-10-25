import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInvoiceDate,
  computeMonthlyRevenueTrends,
  computePaymentStatusDistribution,
  computeMilestoneCompletionTrends,
} from './analytics.ts';
import type { Invoice } from '../types/invoice.ts';

function createMockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'mock-1',
    invoiceNo: 'INV-2026-0001',
    date: '15/10/2026',
    dueDate: '29/10/2026',
    projectName: 'Brand Identity',
    client: { name: 'Acme', address: 'Delhi', phone: '', email: '' },
    items: [],
    billingType: 'single',
    singleBillPaid: false,
    discountType: 'percentage',
    discountValue: 0,
    subtotal: 100000,
    discountAmount: 0,
    taxableAmount: 100000,
    gstType: 'zero',
    gstRate: 0,
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalTax: 0,
    totalAmountDue: 100000,
    amountInWords: 'Indian Rupees One Lakh Only',
    milestones: [
      { phaseId: 1, name: 'Phase 1: Advance', percentage: 40, amount: 40000, status: 'DUE' },
      { phaseId: 2, name: 'Phase 2: Midpoint', percentage: 40, amount: 40000, status: 'DUE' },
      { phaseId: 3, name: 'Phase 3: Handover', percentage: 20, amount: 20000, status: 'DUE' },
    ],
    masterStatus: 'UNPAID',
    bankDetails: {
      bankName: 'HDFC',
      accountName: 'Indian Pixel',
      accountNumber: '12345',
      ifscCode: 'HDFC0001',
      upiId: 'pixel@upi',
    },
    termsAndConditions: 'Terms',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

test('parseInvoiceDate correctly parses DD/MM/YYYY format', () => {
  const d = parseInvoiceDate('25/12/2026');
  assert.equal(d.getDate(), 25);
  assert.equal(d.getMonth(), 11);
  assert.equal(d.getFullYear(), 2026);
});

test('computeMonthlyRevenueTrends groups invoices by month and sums billed/collected', () => {
  const inv1 = createMockInvoice({
    date: '10/09/2026',
    totalAmountDue: 50000,
    singleBillPaid: true,
    masterStatus: 'PAID',
  });
  const inv2 = createMockInvoice({
    date: '20/10/2026',
    totalAmountDue: 80000,
    singleBillPaid: false,
    masterStatus: 'UNPAID',
  });

  const trends = computeMonthlyRevenueTrends([inv1, inv2]);
  assert.equal(trends.length, 2);

  const sep = trends.find((t) => t.month.includes('Sep'));
  assert.ok(sep);
  assert.equal(sep.billed, 50000);
  assert.equal(sep.collected, 50000);
  assert.equal(sep.pending, 0);

  const oct = trends.find((t) => t.month.includes('Oct'));
  assert.ok(oct);
  assert.equal(oct.billed, 80000);
  assert.equal(oct.collected, 0);
  assert.equal(oct.pending, 80000);
});

test('computePaymentStatusDistribution counts and sums by status', () => {
  const invPaid = createMockInvoice({
    masterStatus: 'PAID',
    totalAmountDue: 50000,
  });
  const invUnpaid = createMockInvoice({
    masterStatus: 'UNPAID',
    totalAmountDue: 75000,
  });

  const dist = computePaymentStatusDistribution([invPaid, invUnpaid]);
  const paid = dist.find((d) => d.name === 'Fully Paid');
  const unpaid = dist.find((d) => d.name === 'Unpaid (Due)');

  assert.equal(paid?.count, 1);
  assert.equal(paid?.value, 50000);
  assert.equal(unpaid?.count, 1);
  assert.equal(unpaid?.value, 75000);
});

test('computeMilestoneCompletionTrends tracks phases correctly', () => {
  const invSingle = createMockInvoice({
    billingType: 'single',
    singleBillPaid: true,
    masterStatus: 'PAID',
  });
  const invMilestone = createMockInvoice({
    billingType: 'milestone',
    milestones: [
      { phaseId: 1, name: 'Phase 1: Advance', percentage: 40, amount: 40000, status: 'PAID' },
      { phaseId: 2, name: 'Phase 2: Midpoint', percentage: 40, amount: 40000, status: 'DUE' },
      { phaseId: 3, name: 'Phase 3: Handover', percentage: 20, amount: 20000, status: 'DUE' },
    ],
    masterStatus: 'PARTIALLY PAID',
  });

  const trends = computeMilestoneCompletionTrends([invSingle, invMilestone]);
  const single = trends.find((t) => t.name.includes('Single Bill'));
  assert.equal(single?.total, 1);
  assert.equal(single?.completed, 1);

  const p1 = trends.find((t) => t.name.includes('Phase 1'));
  assert.equal(p1?.completed, 1);
  assert.equal(p1?.completionRate, 100);

  const p2 = trends.find((t) => t.name.includes('Phase 2'));
  assert.equal(p2?.completed, 0);
  assert.equal(p2?.completionRate, 0);
});
