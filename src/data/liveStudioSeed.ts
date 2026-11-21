import type { Invoice } from '../types/invoice.ts';

/**
 * Legacy accidental blank ₹0 drafts created during earlier browser testing.
 * Automatically pruned so only real client invoices appear in the live ledger.
 */
export const LEGACY_EMPTY_DRAFT_IDS = new Set<string>([
  'inv-1794527919772',
  'inv-1794140642892',
  'inv-1793356944995',
  'inv-1793271870733',
  'inv-1793271869237',
]);

export function isLegacyEmptyBlankDraft(inv: Partial<Invoice> | null | undefined): boolean {
  if (!inv || !inv.id) return false;
  if (!LEGACY_EMPTY_DRAFT_IDS.has(inv.id)) return false;
  const hasClient = Boolean(inv.client?.name && inv.client.name.trim().length > 0);
  const hasProject = Boolean(inv.projectName && inv.projectName.trim().length > 0);
  const hasAmount = (Number(inv.subtotal) || 0) > 0 || (Number(inv.totalAmountDue) || 0) > 0;
  return !hasClient && !hasProject && !hasAmount;
}

/**
 * Canonical live studio invoice: IP2026001 — Broadnet Internet Services
 * Embedded so it is always live across all browsers, devices, and deployments.
 */
export const LIVE_BROADNET_INVOICE: Invoice = {
  id: 'inv-ip2026001-broadnet',
  invoiceNo: 'IP2026001',
  date: '15/11/2026',
  dueDate: '15/11/2026',
  projectName: 'Broadnet Internet Services',
  client: {
    name: 'Broadnet Internet Services',
    address: '1093, Fire Station Road, TNHB, Avadi, Chennai – 600054',
    phone: '+91 8681888111',
    email: 'admin@broadnet.in',
    gstin: '',
  },
  items: [
    {
      id: 'item-ip2026001-1',
      description: 'Dynamic Website Design Package',
      sacCode: 'W2',
      qty: 1,
      unit: '1',
      rate: 22999,
      itemDiscountType: 'flat',
      itemDiscountValue: 16000,
      itemDiscountAmount: 16000,
      amount: 6999,
    },
  ],
  billingType: 'single',
  singleBillPaid: true,
  singleBillPaidAt: '12/11/2026',
  subtotal: 6999,
  discountType: 'percentage',
  discountValue: 100,
  discountAmount: 6999,
  discountReason: 'First Client Offer',
  taxableAmount: 0,
  gstType: 'zero',
  gstRate: 0,
  cgstRate: 0,
  cgstAmount: 0,
  sgstRate: 0,
  sgstAmount: 0,
  igstRate: 0,
  igstAmount: 0,
  totalTax: 0,
  totalAmountDue: 0,
  amountInWords: 'Indian Rupees Zero Only',
  milestones: [
    {
      phaseId: 1,
      name: 'Phase 1: Advance to commence work',
      percentage: 40,
      amount: 0,
      status: 'PAID',
      paidAt: '12/11/2026',
    },
    {
      phaseId: 2,
      name: 'Phase 2: On completion of work',
      percentage: 40,
      amount: 0,
      status: 'PAID',
      paidAt: '12/11/2026',
    },
    {
      phaseId: 3,
      name: 'Phase 3: Before final deliverables are handed over',
      percentage: 20,
      amount: 0,
      status: 'PAID',
      paidAt: '12/11/2026',
    },
  ],
  masterStatus: 'PAID',
  bankDetails: {
    bankName: 'Punjab National Bank',
    accountName: 'Indian Pixel Studio LLP',
    accountNumber: '6940001500066258',
    ifscCode: 'HDFC0000240',
    upiId: 'dvshpillai@oksbi',
  },
  termsAndConditions:
    '1. Founding Partner Waiver: 100% of studio engineering and design fees are waived under the Indian Pixel Founding Cohort Initiative (Net Payable: ₹0.00).\n2. Tax Exemption: Issued as a Commercial Bill of Supply—exempt from GST registration under Section 22 of the CGST Act, 2017 (aggregate turnover within statutory threshold).\n3. Handover & Attribution: Full commercial rights to final deliverables transfer upon project sign-off, in exchange for an official client testimonial and portfolio showcase rights on indianpixel.in.\n4. Founding Partner Referral Privilege: Refer a fellow founder or business to Indian Pixel—they receive a 10% Partner Privilege Discount on their first sprint, and you unlock 15% studio credit toward your next expansion phase, UI upgrade, or retainer.',
  createdAt: '2026-11-15T10:00:00.000Z',
  updatedAt: '2026-11-19T15:15:00.000Z',
};

export const LIVE_STUDIO_INVOICES: Invoice[] = [LIVE_BROADNET_INVOICE];
