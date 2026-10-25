export type GstType = 'intra' | 'inter' | 'zero';
export type DiscountType = 'flat' | 'percentage';
export type BillingType = 'single' | 'milestone';
export type MilestoneStatus = 'DUE' | 'PAID';
export type MasterPaymentStatus = 'UNPAID' | 'PARTIALLY PAID' | 'PAID';

export interface MilestonePhase {
  phaseId: 1 | 2 | 3;
  name: string;
  percentage: number; // 40, 40, 20
  amount: number;
  status: MilestoneStatus;
  paidAt?: string;
}

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
  sacCode?: string; // e.g. 9983 for Graphic Design
  addonType?: 'rush' | 'revisions' | 'subbrand' | 'trademark';
  itemDiscountType?: DiscountType;
  itemDiscountValue?: number;
  itemDiscountAmount?: number;
  amount: number; // Net amount after any item discount
}

export interface ClientInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  stateCode?: string; // e.g. 07 for Delhi, 27 for Maharashtra
}

export interface StudioConfig {
  studioName: string;
  address: string;
  phone: string;
  email: string;
  web: string;
  gstin: string;
  isGstRegistered: boolean;
  pan: string;
  logoDataUrl?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  defaultTerms: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  projectName: string;
  client: ClientInfo;
  items: LineItem[];
  billingType: BillingType; // 'single' for single full payment, 'milestone' for 40-40-20
  singleBillPaid?: boolean;
  singleBillPaidAt?: string;
  discountType: DiscountType;
  discountValue: number;
  discountReason?: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstType: GstType;
  gstRate: number; // e.g. 18, 12, 5, 28, 0
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate?: number;
  cessAmount?: number;
  totalTax: number;
  totalAmountDue: number;
  tdsApplicable?: boolean;
  tdsSection?: string; // e.g. '194J (10% Professional)' or '194J (2% Technical)'
  tdsRate?: number;
  tdsAmount?: number;
  netReceivableAfterTds?: number;
  reverseCharge?: boolean;
  placeOfSupply?: string;
  amountInWords: string;
  milestones: [MilestonePhase, MilestonePhase, MilestonePhase];
  masterStatus: MasterPaymentStatus;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
  termsAndConditions: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerMetrics {
  totalContracted: number;
  totalCollected: number;
  pendingReceivables: number;
  overdueInvoicesCount: number;
  overdueAmount: number;
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;
}
