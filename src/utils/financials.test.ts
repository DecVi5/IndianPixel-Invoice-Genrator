import test from 'node:test';
import assert from 'node:assert/strict';
import {
  numberToIndianWords,
  formatIndianCurrency,
  calculateInvoiceFinancials,
  calculateMilestones,
  deriveMasterStatus,
  generateUpiUrl,
  determineGstTypeFromGstins,
  getStateCodeFromGstin,
} from './financials.ts';

test('numberToIndianWords converts Indian currency numbers correctly', () => {
  assert.equal(numberToIndianWords(0), 'Indian Rupees Zero Only');
  assert.equal(numberToIndianWords(45000), 'Indian Rupees Forty-Five Thousand Only');
  assert.equal(
    numberToIndianWords(1250000),
    'Indian Rupees Twelve Lakh Fifty Thousand Only'
  );
  assert.equal(
    numberToIndianWords(10000000),
    'Indian Rupees One Crore Only'
  );
  assert.equal(
    numberToIndianWords(2500.5),
    'Indian Rupees Two Thousand Five Hundred and Fifty Paise Only'
  );
});

test('formatIndianCurrency formats numbers with proper Indian separators', () => {
  assert.equal(formatIndianCurrency(45000), '₹ 45,000.00');
  assert.equal(formatIndianCurrency(150000), '₹ 1,50,000.00');
  assert.equal(formatIndianCurrency(10000000), '₹ 1,00,00,000.00');
});

test('calculateInvoiceFinancials correctly computes subtotal, discounts, and intra-state GST', () => {
  const result = calculateInvoiceFinancials({
    items: [
      { id: '1', description: 'Design Sprint', qty: 2, unit: 'Sprints', rate: 25000, amount: 50000 },
      { id: '2', description: 'Asset Pack', qty: 1, unit: 'Pack', rate: 10000, amount: 10000 },
    ],
    discountType: 'percentage',
    discountValue: 10,
    gstType: 'intra',
    gstRate: 18,
  });

  assert.equal(result.subtotal, 60000);
  assert.equal(result.discountAmount, 6000);
  assert.equal(result.taxableAmount, 54000);
  assert.equal(result.cgstRate, 9);
  assert.equal(result.sgstRate, 9);
  assert.equal(result.cgstAmount, 4860);
  assert.equal(result.sgstAmount, 4860);
  assert.equal(result.igstAmount, 0);
  assert.equal(result.totalTax, 9720);
  assert.equal(result.totalAmountDue, 63720);
  assert.equal(result.amountInWords, 'Indian Rupees Sixty-Three Thousand Seven Hundred Twenty Only');
});

test('calculateInvoiceFinancials correctly computes inter-state IGST', () => {
  const result = calculateInvoiceFinancials({
    items: [
      { id: '1', description: 'Web Dev', qty: 1, unit: 'Project', rate: 100000, amount: 100000 },
    ],
    discountType: 'flat',
    discountValue: 0,
    gstType: 'inter',
    gstRate: 18,
  });

  assert.equal(result.subtotal, 100000);
  assert.equal(result.taxableAmount, 100000);
  assert.equal(result.cgstAmount, 0);
  assert.equal(result.sgstAmount, 0);
  assert.equal(result.igstRate, 18);
  assert.equal(result.igstAmount, 18000);
  assert.equal(result.totalAmountDue, 118000);
});

test('calculateInvoiceFinancials handles TDS and Cess calculation accurately', () => {
  const result = calculateInvoiceFinancials({
    items: [
      { id: '1', description: 'Brand Rebuild', qty: 1, unit: 'Project', rate: 100000, amount: 100000 },
    ],
    discountType: 'flat',
    discountValue: 0,
    gstType: 'inter',
    gstRate: 18,
    cessRate: 1,
    tdsApplicable: true,
    tdsRate: 10, // 10% on taxable base (100,000) = 10,000
  });

  assert.equal(result.taxableAmount, 100000);
  assert.equal(result.igstAmount, 18000);
  assert.equal(result.cessAmount, 1000);
  assert.equal(result.totalTax, 19000);
  assert.equal(result.totalAmountDue, 119000);
  assert.equal(result.tdsAmount, 10000);
  assert.equal(result.netReceivableAfterTds, 109000);
});

test('determineGstTypeFromGstins detects intra vs inter-state automatically', () => {
  assert.equal(getStateCodeFromGstin('07AABCU9603R1ZX'), '07');
  assert.equal(getStateCodeFromGstin('27AABCM4491D1ZL'), '27');

  // Both Delhi (07) -> intra
  assert.equal(
    determineGstTypeFromGstins('07AABCU9603R1ZX', '07AABCU9603R1ZZ'),
    'intra'
  );

  // Delhi (07) to Maharashtra (27) -> inter
  assert.equal(
    determineGstTypeFromGstins('07AABCU9603R1ZX', '27AABCM4491D1ZL'),
    'inter'
  );
});

test('calculateMilestones locks strictly into 40% - 40% - 20% distribution and matches sum', () => {
  const total = 118000;
  const milestones = calculateMilestones(total);

  assert.equal(milestones.length, 3);
  assert.equal(milestones[0].percentage, 40);
  assert.equal(milestones[0].amount, 47200);
  assert.equal(milestones[1].percentage, 40);
  assert.equal(milestones[1].amount, 47200);
  assert.equal(milestones[2].percentage, 20);
  assert.equal(milestones[2].amount, 23600);

  const sum = milestones[0].amount + milestones[1].amount + milestones[2].amount;
  assert.equal(sum, total);
});

test('deriveMasterStatus accurately reflects unpaid, partially paid, and paid states', () => {
  const m1 = calculateMilestones(100000);
  assert.equal(deriveMasterStatus(m1), 'UNPAID');

  m1[0].status = 'PAID';
  assert.equal(deriveMasterStatus(m1), 'PARTIALLY PAID');

  m1[1].status = 'PAID';
  assert.equal(deriveMasterStatus(m1), 'PARTIALLY PAID');

  m1[2].status = 'PAID';
  assert.equal(deriveMasterStatus(m1), 'PAID');

  // Single Bill tests
  assert.equal(deriveMasterStatus(m1, 'single', false), 'UNPAID');
  assert.equal(deriveMasterStatus(m1, 'single', true), 'PAID');
});

test('generateUpiUrl generates valid UPI payment deep link with encoded params', () => {
  const url = generateUpiUrl({
    vpa: 'theindianpixel@okaxis',
    name: 'Indian Pixel Design',
    amount: 47200,
    note: 'Invoice INV-2026-0042 Phase 1',
  });

  assert.match(url, /^upi:\/\/pay\?/);
  assert.ok(url.includes('pa=theindianpixel%40okaxis'));
  assert.ok(url.includes('am=47200.00'));
  assert.ok(url.includes('cu=INR'));
});
