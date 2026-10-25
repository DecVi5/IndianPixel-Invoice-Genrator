import type {
  BillingType,
  DiscountType,
  GstType,
  LineItem,
  MasterPaymentStatus,
  MilestonePhase,
} from '../types/invoice.ts';

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertTwoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const rest = n % 10;
  return TENS[ten] + (rest > 0 ? '-' + ONES[rest] : '');
}

function convertThreeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let str = '';
  if (hundred > 0) {
    str += ONES[hundred] + ' Hundred';
  }
  if (rest > 0) {
    if (str.length > 0) str += ' ';
    str += convertTwoDigits(rest);
  }
  return str;
}

/**
 * Converts a numerical amount to Indian English words in Rupees format.
 * E.g., 45000 -> "Indian Rupees Forty-Five Thousand Only"
 * 1250000 -> "Indian Rupees Twelve Lakh Fifty Thousand Only"
 */
export function numberToIndianWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'Indian Rupees Zero Only';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const wholePart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - wholePart) * 100);

  if (wholePart === 0 && decimalPart === 0) {
    return 'Indian Rupees Zero Only';
  }

  const crores = Math.floor(wholePart / 10000000);
  const remainingAfterCrores = wholePart % 10000000;

  const lakhs = Math.floor(remainingAfterCrores / 100000);
  const remainingAfterLakhs = remainingAfterCrores % 100000;

  const thousands = Math.floor(remainingAfterLakhs / 1000);
  const hundreds = remainingAfterLakhs % 1000;

  const parts: string[] = [];

  if (crores > 0) {
    parts.push(`${convertTwoDigits(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
  }
  if (hundreds > 0) {
    parts.push(convertThreeDigits(hundreds));
  }

  let words = parts.join(' ').trim();
  if (!words) {
    words = 'Zero';
  }

  let result = `Indian Rupees ${words}`;
  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }
  result += ' Only';

  return isNegative ? `Minus ${result}` : result;
}

/**
 * Formats an amount using Indian numbering system (e.g., 1,50,000.00).
 */
export function formatIndianCurrency(amount: number, includeSymbol = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return includeSymbol ? '₹ 0.00' : '0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const fixed = absAmount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian formatting: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  let formatted = lastThree;
  if (otherNumbers !== '') {
    formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const full = `${isNegative ? '-' : ''}${formatted}.${decimalPart}`;
  return includeSymbol ? `₹ ${full}` : full;
}

/**
 * Extracts Indian GST State Code from GSTIN (first 2 digits).
 */
export function getStateCodeFromGstin(gstin: string): string {
  if (!gstin) return '';
  const clean = gstin.trim().toUpperCase();
  const match = clean.match(/^(\d{2})/);
  return match ? match[1] : '';
}

/**
 * Indian State GST Codes Map
 */
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '19': 'West Bengal',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
};

/**
 * Automatically determines if a transaction is Intra-State or Inter-State based on GSTINs.
 */
export function determineGstTypeFromGstins(
  studioGstin: string,
  clientGstin: string
): GstType {
  if (
    !studioGstin ||
    studioGstin.toLowerCase().includes('exempt') ||
    studioGstin.toLowerCase().includes('unregistered')
  ) {
    return 'zero'; // Unregistered / Exempt studio does not levy GST
  }

  const studioState = getStateCodeFromGstin(studioGstin);
  const clientState = getStateCodeFromGstin(clientGstin);

  if (!clientGstin || !clientState) {
    return 'intra'; // Default to intra-state for local / B2C
  }

  return studioState === clientState ? 'intra' : 'inter';
}

/**
 * Calculates subtotal, item discounts, invoice-level discounts, taxable amount, taxes, GST, and TDS.
 */
export function calculateInvoiceFinancials(params: {
  items: LineItem[];
  discountType: DiscountType;
  discountValue: number;
  discountReason?: string;
  gstType: GstType;
  gstRate: number;
  cessRate?: number;
  tdsApplicable?: boolean;
  tdsRate?: number;
}) {
  const {
    items,
    discountType,
    discountValue,
    gstType,
    gstRate,
    cessRate = 0,
    tdsApplicable = false,
    tdsRate = 0,
  } = params;

  // Calculate each item's net amount after any item-level discount
  let grossSubtotal = 0;
  let totalItemDiscount = 0;

  const computedItems = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const itemGross = Math.round(qty * rate * 100) / 100;
    grossSubtotal += itemGross;

    let itemDiscountAmount = 0;
    if (item.itemDiscountType === 'percentage') {
      const pct = Math.max(0, Math.min(100, Number(item.itemDiscountValue) || 0));
      itemDiscountAmount = Math.round(((itemGross * pct) / 100) * 100) / 100;
    } else if (item.itemDiscountType === 'flat') {
      itemDiscountAmount = Math.max(0, Math.min(itemGross, Number(item.itemDiscountValue) || 0));
    }

    totalItemDiscount += itemDiscountAmount;
    const itemNetAmount = Math.max(0, Math.round((itemGross - itemDiscountAmount) * 100) / 100);

    return {
      ...item,
      sacCode: item.sacCode || '998311',
      amount: itemNetAmount,
      itemDiscountAmount,
    };
  });

  const subtotal = Math.round(
    computedItems.reduce((acc, it) => acc + it.amount, 0) * 100
  ) / 100;

  // Invoice-level discount
  let overallDiscount = 0;
  if (discountType === 'percentage') {
    const pct = Math.max(0, Math.min(100, Number(discountValue) || 0));
    overallDiscount = (subtotal * pct) / 100;
  } else {
    overallDiscount = Math.max(0, Math.min(subtotal, Number(discountValue) || 0));
  }

  const discountAmount = Math.round(overallDiscount * 100) / 100;
  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  // Total savings combining item discounts and invoice-level discount
  const totalCombinedSavings = Math.round((totalItemDiscount + discountAmount) * 100) / 100;

  // Taxes
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  let cessAmount = 0;

  const validGstRate = Math.max(0, Number(gstRate) || 0);
  const validCessRate = Math.max(0, Number(cessRate) || 0);

  if (gstType === 'intra') {
    cgstRate = validGstRate / 2;
    sgstRate = validGstRate / 2;
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
  } else if (gstType === 'inter') {
    igstRate = validGstRate;
    igstAmount = (taxableAmount * igstRate) / 100;
  }

  if (validCessRate > 0) {
    cessAmount = (taxableAmount * validCessRate) / 100;
  }

  const totalTax = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const totalAmountDue = Math.round((taxableAmount + totalTax) * 100) / 100;
  const amountInWords = numberToIndianWords(totalAmountDue);

  // TDS Calculation (Under Section 194J/194C on Taxable Amount before GST as per Indian Income Tax guidelines)
  let computedTdsAmount = 0;
  let netReceivableAfterTds = totalAmountDue;

  if (tdsApplicable && tdsRate > 0) {
    computedTdsAmount = Math.round(((taxableAmount * tdsRate) / 100) * 100) / 100;
    netReceivableAfterTds = Math.max(0, Math.round((totalAmountDue - computedTdsAmount) * 100) / 100);
  }

  return {
    grossSubtotal: Math.round(grossSubtotal * 100) / 100,
    totalItemDiscount,
    subtotal,
    discountAmount,
    totalCombinedSavings,
    taxableAmount,
    cgstRate,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstRate,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstRate,
    igstAmount: Math.round(igstAmount * 100) / 100,
    cessRate: validCessRate,
    cessAmount: Math.round(cessAmount * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalAmountDue,
    tdsRate: tdsApplicable ? tdsRate : 0,
    tdsAmount: computedTdsAmount,
    netReceivableAfterTds,
    amountInWords,
    computedItems,
  };
}

/**
 * Calculates 40% - 40% - 20% milestone schedule from total amount due.
 * Preserves existing status if provided.
 */
export function calculateMilestones(
  totalAmountDue: number,
  existingMilestones?: [MilestonePhase, MilestonePhase, MilestonePhase]
): [MilestonePhase, MilestonePhase, MilestonePhase] {
  const p1Amount = Math.round(totalAmountDue * 0.4 * 100) / 100;
  const p2Amount = Math.round(totalAmountDue * 0.4 * 100) / 100;
  // Ensure Phase 3 takes any floating point remainder so sum matches exactly
  const p3Amount = Math.round((totalAmountDue - p1Amount - p2Amount) * 100) / 100;

  const p1Status = existingMilestones?.[0]?.status ?? 'DUE';
  const p2Status = existingMilestones?.[1]?.status ?? 'DUE';
  const p3Status = existingMilestones?.[2]?.status ?? 'DUE';

  return [
    {
      phaseId: 1,
      name: 'Phase 1: Advance to commence work',
      percentage: 40,
      amount: p1Amount,
      status: p1Status,
      paidAt: existingMilestones?.[0]?.paidAt,
    },
    {
      phaseId: 2,
      name: 'Phase 2: On completion of work',
      percentage: 40,
      amount: p2Amount,
      status: p2Status,
      paidAt: existingMilestones?.[1]?.paidAt,
    },
    {
      phaseId: 3,
      name: 'Phase 3: Before final deliverables are handed over',
      percentage: 20,
      amount: p3Amount,
      status: p3Status,
      paidAt: existingMilestones?.[2]?.paidAt,
    },
  ];
}

/**
 * Derives the master payment status from milestone phases or single-bill payment status.
 */
export function deriveMasterStatus(
  milestones: [MilestonePhase, MilestonePhase, MilestonePhase],
  billingType: BillingType = 'milestone',
  singleBillPaid = false
): MasterPaymentStatus {
  if (billingType === 'single') {
    return singleBillPaid ? 'PAID' : 'UNPAID';
  }
  const paidCount = milestones.filter((m) => m.status === 'PAID').length;
  if (paidCount === 3) return 'PAID';
  if (paidCount > 0) return 'PARTIALLY PAID';
  return 'UNPAID';
}

/**
 * Generates standard UPI payment URL for QR generation and click-to-pay deep linking.
 */
export function generateUpiUrl(params: {
  vpa: string;
  name: string;
  amount: number;
  note: string;
}): string {
  const { vpa, name, amount, note } = params;
  if (!vpa) return '';
  const am = Math.max(0, amount).toFixed(2);
  const cleanNote = (note || 'Invoice Payment').substring(0, 50);
  return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name || 'Indian Pixel')}&am=${am}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
}

/**
 * Checks if an invoice is overdue (dueDate is in the past and masterStatus is not PAID).
 * Expects date in DD/MM/YYYY format.
 */
export function isInvoiceOverdue(
  dueDateStr: string,
  masterStatus: MasterPaymentStatus
): boolean {
  if (masterStatus === 'PAID') return false;
  if (!dueDateStr) return false;

  const parts = dueDateStr.split('/');
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const dueDate = new Date(year, month, day, 23, 59, 59);
  const now = new Date();

  return dueDate.getTime() < now.getTime();
}

/**
 * Formats a Date object to DD/MM/YYYY.
 */
export function formatDateToDDMMYYYY(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
