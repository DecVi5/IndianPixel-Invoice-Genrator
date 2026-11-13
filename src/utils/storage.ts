import { Invoice, StudioConfig } from '../types/invoice.ts';
import {
  calculateInvoiceFinancials,
  calculateMilestones,
  formatDateToDDMMYYYY,
} from './financials.ts';
import { BRAND_LOGO_DATA_URL } from '../assets/brandLogoData.ts';

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  studioName: 'Indian Pixel',
  address: '', // Completely online studio
  phone: '+91 7585999426',
  email: 'theindianpixel@gmail.com',
  web: 'website-indianpixel.vercel.app',
  gstin: 'Unregistered / Exempt under Section 22 of CGST Act',
  isGstRegistered: false,
  pan: 'KJKPD8069P',
  bankName: 'HDFC Bank Ltd',
  accountName: 'Indian Pixel Studio LLP',
  accountNumber: '50200084729104',
  ifscCode: 'HDFC0000240',
  upiId: 'theindianpixel@okaxis',
  logoDataUrl: BRAND_LOGO_DATA_URL,
  defaultTerms:
    '1. 100% single settlement due upon completion or as per contractual schedule.\n2. Invoicing issued as exempt under Section 22 of CGST Act (Turnover within threshold).\n3. Late settlements incur 1.5% interest per billing cycle.',
  financialGoal: 500000,
};

const STORAGE_KEYS = {
  CONFIG: 'ips_studio_config_prod_v1',
  INVOICES: 'ips_invoices_prod_v1',
  NEXT_INV_SEQ: 'ips_next_seq_prod_v1',
};

// Purge any older legacy keys from earlier testing so user gets fresh start
export function purgeLegacyStorage(): void {
  try {
    const legacyKeys = [
      'ips_invoices',
      'ips_studio_config',
      'ips_next_inv_seq',
      'ips_invoices_v2',
      'ips_studio_config_v2',
      'ips_invoices_apple_v3',
      'ips_studio_config_apple_v3',
      'ips_next_seq_apple_v3',
      'ips_studio_config_apple_v4',
      'ips_invoices_apple_v4',
      'ips_next_seq_apple_v4',
      'ips_studio_config_apple_v5',
      'ips_invoices_apple_v5',
      'ips_next_seq_apple_v5',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error('Failed to purge legacy keys:', e);
  }
}

export function loadStudioConfig(): StudioConfig {
  try {
    const keysToTry = [
      STORAGE_KEYS.CONFIG,
      'ips_studio_config_apple_v5',
      'ips_studio_config_apple_v4',
      'ips_studio_config_apple_v3',
      'ips_studio_config_v2',
      'ips_studio_config',
    ];
    for (const key of keysToTry) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Clean out legacy address (company is completely online)
        if (
          parsed.address &&
          (parsed.address.includes('Green Park') ||
            parsed.address.includes('Design Loft') ||
            parsed.address.includes('New Delhi 110016'))
        ) {
          parsed.address = '';
        }
        // Ensure Indian Pixel default GST status is Unregistered / Exempt under Section 22 of CGST Act
        if (
          parsed.gstin === '07AABCU9603R1ZX' ||
          parsed.gstin === '33AABCI9876Q1Z0' ||
          parsed.isGstRegistered === undefined
        ) {
          parsed.isGstRegistered = false;
          parsed.gstin = 'Unregistered / Exempt under Section 22 of CGST Act';
        }
        if (!parsed.pan || parsed.pan.includes('[') || parsed.pan.trim() === '') {
          parsed.pan = 'KJKPD8069P';
        }
        if (
          !parsed.logoDataUrl ||
          parsed.logoDataUrl.trim() === '' ||
          parsed.logoDataUrl.includes('placeholder') ||
          parsed.logoDataUrl === '/logo.svg' ||
          parsed.logoDataUrl === '/vite.svg' ||
          parsed.logoDataUrl.includes('svg+xml')
        ) {
          parsed.logoDataUrl = BRAND_LOGO_DATA_URL;
        }
        return {
          ...DEFAULT_STUDIO_CONFIG,
          ...parsed,
          pan: parsed.pan || 'KJKPD8069P',
          address: parsed.address || '',
          logoDataUrl: parsed.logoDataUrl || BRAND_LOGO_DATA_URL,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load studio config:', e);
  }
  return DEFAULT_STUDIO_CONFIG;
}

const IDB_NAME = 'IndianPixelStudioDB';
const IDB_STORE = 'kv_store';

function openStudioIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openStudioIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadPersistedFromIndexedDB(): Promise<{
  studioConfig?: StudioConfig;
  invoices?: Invoice[];
}> {
  const db = await openStudioIdb();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const cfgReq = store.get(STORAGE_KEYS.CONFIG);
      const invReq = store.get(STORAGE_KEYS.INVOICES);
      tx.oncomplete = () => {
        resolve({
          studioConfig: cfgReq.result as StudioConfig | undefined,
          invoices: invReq.result as Invoice[] | undefined,
        });
      };
      tx.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

export function saveStudioConfig(config: StudioConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    void idbSet(STORAGE_KEYS.CONFIG, config);
  } catch (e) {
    console.error('Failed to save studio config:', e);
  }
}

/**
 * Returns invoices, automatically recovering any saved invoices from previous storage versions
 * so custom client invoices (e.g. Broadnet) are never lost across storage version bumps.
 */
export function loadInvoices(): Invoice[] {
  try {
    const invoiceKeys = [
      STORAGE_KEYS.INVOICES,
      'ips_invoices_apple_v5',
      'ips_invoices_apple_v4',
      'ips_invoices_apple_v3',
      'ips_invoices_v2',
      'ips_invoices',
    ];

    const seenIds = new Set<string>();
    const recovered: Invoice[] = [];

    for (const key of invoiceKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const inv of parsed) {
            if (inv && inv.id && !seenIds.has(inv.id)) {
              seenIds.add(inv.id);
              recovered.push({
                ...inv,
                billingType: inv.billingType || 'single',
                singleBillPaid: Boolean(inv.singleBillPaid),
              });
            }
          }
        }
      }
    }

    if (recovered.length > 0) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(recovered));
      return recovered;
    }
  } catch (e) {
    console.error('Failed to load invoices:', e);
  }
  // Default clean state: 0 invoices, 0 rupees
  return [];
}

export function saveInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    void idbSet(STORAGE_KEYS.INVOICES, invoices);
  } catch (e) {
    console.error('Failed to save invoices:', e);
  }
}

export function clearAllDataToZero(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.NEXT_INV_SEQ);
    purgeLegacyStorage();
    void idbSet(STORAGE_KEYS.INVOICES, []);
    void idbSet(STORAGE_KEYS.CONFIG, DEFAULT_STUDIO_CONFIG);
  } catch (e) {
    console.error('Failed to clear data:', e);
  }
}

export function getNextInvoiceNumber(invoices: Invoice[]): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  invoices.forEach((inv) => {
    const match = inv.invoiceNo.match(/INV-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `INV-${currentYear}-${nextSeq}`;
}

export function createBlankInvoice(config: StudioConfig, invoiceNo: string): Invoice {
  const today = formatDateToDDMMYYYY(new Date());
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const dueDateStr = formatDateToDDMMYYYY(dueDate);

  const initialItems = [
    {
      id: `item-${Date.now()}-1`,
      description: '',
      qty: 1,
      unit: 'Sprint',
      rate: 0,
      amount: 0,
    },
  ];

  // If studio is Unregistered / Exempt under Section 22 of CGST Act, default to zero tax
  const defaultGstType = config.isGstRegistered ? 'intra' : 'zero';
  const defaultGstRate = config.isGstRegistered ? 18 : 0;

  const calc = calculateInvoiceFinancials({
    items: initialItems,
    discountType: 'percentage',
    discountValue: 0,
    gstType: defaultGstType,
    gstRate: defaultGstRate,
  });

  const milestones = calculateMilestones(calc.totalAmountDue);

  return {
    id: `inv-${Date.now()}`,
    invoiceNo,
    date: today,
    dueDate: dueDateStr,
    projectName: '',
    client: {
      name: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
    },
    items: initialItems,
    billingType: 'single', // Default to single bill
    singleBillPaid: false,
    discountType: 'percentage',
    discountValue: 0,
    subtotal: 0,
    discountAmount: 0,
    taxableAmount: 0,
    gstType: defaultGstType,
    gstRate: defaultGstRate,
    cgstRate: calc.cgstRate,
    cgstAmount: 0,
    sgstRate: calc.sgstRate,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalTax: 0,
    totalAmountDue: 0,
    amountInWords: 'Indian Rupees Zero Only',
    milestones,
    masterStatus: 'UNPAID',
    bankDetails: {
      bankName: config.bankName,
      accountName: config.accountName,
      accountNumber: config.accountNumber,
      ifscCode: config.ifscCode,
      upiId: config.upiId,
    },
    termsAndConditions: config.defaultTerms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
