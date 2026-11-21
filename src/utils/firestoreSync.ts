import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Invoice, StudioConfig, MilestonePhase } from '../types/invoice.ts';
import { DEFAULT_STUDIO_CONFIG } from './storage.ts';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

// Sanitize document IDs to match ^[a-zA-Z0-9_\-]+$ and maxLength 128
export function sanitizeValidId(rawId: string): string {
  const cleaned = String(rawId || 'doc-1')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'doc-1';
}

function truncateStr(val: unknown, maxLen: number, fallback = ''): string {
  const s = typeof val === 'string' ? val : val !== undefined && val !== null ? String(val) : fallback;
  return s.slice(0, maxLen);
}

function safeNonNegativeNum(val: unknown, maxVal?: number): number {
  const n = Number(val);
  const clean = isNaN(n) || n < 0 ? 0 : n;
  return maxVal !== undefined ? Math.min(clean, maxVal) : clean;
}

/**
 * Sanitizes an Invoice object to strictly conform to StudioInvoice in firebase-blueprint.json & firestore.rules.
 */
function buildValidatedInvoicePayload(
  inv: Invoice,
  ownerId: string,
  existingCreatedAt?: unknown
): Record<string, unknown> {
  const validBillingType = inv.billingType === 'milestone' ? 'milestone' : 'single';
  const validDiscountType = inv.discountType === 'flat' ? 'flat' : 'percentage';
  const validGstType =
    inv.gstType === 'intra' || inv.gstType === 'inter' ? inv.gstType : 'zero';
  const validMasterStatus = ['PAID', 'PARTIALLY PAID', 'UNPAID', 'VOID'].includes(
    inv.masterStatus
  )
    ? inv.masterStatus
    : 'UNPAID';

  const rawItems = Array.isArray(inv.items) && inv.items.length > 0 ? inv.items.slice(0, 50) : [
    {
      id: 'item-1',
      description: 'Commercial Design Services',
      qty: 1,
      unit: 'Sprint',
      rate: 0,
      amount: 0,
    },
  ];

  const cleanItems = rawItems.map((it, idx) => ({
    id: truncateStr(it.id || `item-${idx + 1}`, 64),
    description: truncateStr(it.description, 500),
    sacCode: truncateStr(it.sacCode || '998311', 32),
    qty: safeNonNegativeNum(it.qty),
    unit: truncateStr(it.unit || 'Sprint', 32),
    rate: safeNonNegativeNum(it.rate),
    itemDiscountType: it.itemDiscountType === 'flat' ? 'flat' : 'percentage',
    itemDiscountValue: safeNonNegativeNum(it.itemDiscountValue),
    itemDiscountAmount: safeNonNegativeNum(it.itemDiscountAmount),
    amount: safeNonNegativeNum(it.amount),
  }));

  const defaultMilestones: MilestonePhase[] = [
    { phaseId: 1, name: 'Phase 1: Kickoff & Discovery (40%)', percentage: 40, amount: 0, status: 'DUE' },
    { phaseId: 2, name: 'Phase 2: Midpoint Review (40%)', percentage: 40, amount: 0, status: 'DUE' },
    { phaseId: 3, name: 'Phase 3: Final Master Handover (20%)', percentage: 20, amount: 0, status: 'DUE' },
  ];

  const rawMilestones =
    Array.isArray(inv.milestones) && inv.milestones.length === 3
      ? inv.milestones
      : defaultMilestones;

  const cleanMilestones = rawMilestones.slice(0, 3).map((m, i) => ({
    phaseId: (i + 1) as 1 | 2 | 3,
    name: truncateStr(m.name || `Phase ${i + 1}`, 120),
    percentage: safeNonNegativeNum(m.percentage, 100),
    amount: safeNonNegativeNum(m.amount),
    status: m.status === 'PAID' ? 'PAID' : 'DUE',
    paidAt: truncateStr(m.paidAt || '', 32),
  }));

  return {
    ownerId: sanitizeValidId(ownerId),
    invoiceNo: truncateStr(inv.invoiceNo || 'INV-2026-0001', 64, 'INV-2026-0001'),
    date: truncateStr(inv.date || '01/01/2026', 32, '01/01/2026'),
    dueDate: truncateStr(inv.dueDate || '15/01/2026', 32, '15/01/2026'),
    projectName: truncateStr(inv.projectName || '', 300),
    billingType: validBillingType,
    singleBillPaid: Boolean(inv.singleBillPaid),
    subtotal: safeNonNegativeNum(inv.subtotal),
    discountType: validDiscountType,
    discountValue: safeNonNegativeNum(inv.discountValue),
    discountAmount: safeNonNegativeNum(inv.discountAmount),
    discountReason: truncateStr(inv.discountReason || '', 300),
    taxableAmount: safeNonNegativeNum(inv.taxableAmount),
    gstType: validGstType,
    gstRate: safeNonNegativeNum(inv.gstRate, 100),
    cgstRate: safeNonNegativeNum(inv.cgstRate),
    cgstAmount: safeNonNegativeNum(inv.cgstAmount),
    sgstRate: safeNonNegativeNum(inv.sgstRate),
    sgstAmount: safeNonNegativeNum(inv.sgstAmount),
    igstRate: safeNonNegativeNum(inv.igstRate),
    igstAmount: safeNonNegativeNum(inv.igstAmount),
    totalTax: safeNonNegativeNum(inv.totalTax),
    totalAmountDue: safeNonNegativeNum(inv.totalAmountDue),
    amountInWords: truncateStr(inv.amountInWords || 'Indian Rupees Zero Only', 500),
    masterStatus: validMasterStatus,
    client: {
      name: truncateStr(inv.client?.name || '', 200),
      address: truncateStr(inv.client?.address || '', 500),
      phone: truncateStr(inv.client?.phone || '', 64),
      email: truncateStr(inv.client?.email || '', 128),
      gstin: truncateStr(inv.client?.gstin || '', 64),
      stateCode: truncateStr(inv.client?.stateCode || '', 16),
    },
    items: cleanItems,
    milestones: cleanMilestones,
    termsAndConditions: truncateStr(inv.termsAndConditions || '', 2000),
    createdAt: existingCreatedAt ? existingCreatedAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Saves an invoice document to Firestore if the user is authenticated with Firebase Auth.
 */
export async function saveInvoiceToFirestore(inv: Invoice): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const docId = sanitizeValidId(inv.id);
  const path = `invoices/${docId}`;
  const docRef = doc(db, 'invoices', docId);

  try {
    let existingCreatedAt: unknown = undefined;
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        existingCreatedAt = snap.data()?.createdAt;
      }
    } catch {
      existingCreatedAt = undefined;
    }
    const payload = buildValidatedInvoicePayload(inv, user.uid, existingCreatedAt);
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes an invoice document from Firestore if the user is authenticated.
 */
export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const docId = sanitizeValidId(invoiceId);
  const path = `invoices/${docId}`;
  try {
    await deleteDoc(doc(db, 'invoices', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves the StudioConfig document to Firestore if the user is authenticated.
 */
export async function saveStudioConfigToFirestore(cfg: StudioConfig): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const docId = sanitizeValidId(user.uid);
  const path = `studioConfigs/${docId}`;
  const docRef = doc(db, 'studioConfigs', docId);

  try {
    let existingCreatedAt: unknown = undefined;
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        existingCreatedAt = snap.data()?.createdAt;
      }
    } catch {
      existingCreatedAt = undefined;
    }
    const payload = {
      ownerId: docId,
      studioName: truncateStr(cfg.studioName || 'Indian Pixel', 200),
      address: truncateStr(cfg.address || '', 500),
      phone: truncateStr(cfg.phone || '', 64),
      email: truncateStr(cfg.email || '', 128),
      web: truncateStr(cfg.web || '', 200),
      gstin: truncateStr(cfg.gstin || '', 64),
      pan: truncateStr(cfg.pan || 'KJKPD8069P', 32),
      isGstRegistered: Boolean(cfg.isGstRegistered),
      bankName: truncateStr(cfg.bankName || '', 200),
      accountName: truncateStr(cfg.accountName || '', 200),
      accountNumber: truncateStr(cfg.accountNumber || '', 64),
      ifscCode: truncateStr(cfg.ifscCode || '', 32),
      upiId: truncateStr(cfg.upiId || '', 128),
      defaultTerms: truncateStr(cfg.defaultTerms || '', 2000),
      financialGoal: safeNonNegativeNum(cfg.financialGoal ?? 500000),
      createdAt: existingCreatedAt ? existingCreatedAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function timestampToIso(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'string' && ts.length > 0) {
    return ts;
  }
  return new Date().toISOString();
}

/**
 * Subscribes to the user's Firestore invoices & studioConfig when authenticated.
 */
export function subscribeToFirestoreLedger(
  uid: string,
  onInvoicesUpdate: (cloudInvoices: Invoice[]) => void,
  onConfigUpdate: (cloudConfig: Partial<StudioConfig>) => void
): () => void {
  const safeUid = sanitizeValidId(uid);
  const invoicesQuery = query(
    collection(db, 'invoices'),
    where('ownerId', '==', safeUid)
  );

  const unsubInvoices = onSnapshot(
    invoicesQuery,
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          invoiceNo: String(d.invoiceNo || 'INV-2026-0001'),
          date: String(d.date || ''),
          dueDate: String(d.dueDate || ''),
          projectName: String(d.projectName || ''),
          client: d.client || { name: '', address: '', phone: '', email: '', gstin: '' },
          items: Array.isArray(d.items) ? d.items : [],
          billingType: d.billingType === 'milestone' ? 'milestone' : 'single',
          singleBillPaid: Boolean(d.singleBillPaid),
          discountType: d.discountType === 'flat' ? 'flat' : 'percentage',
          discountValue: Number(d.discountValue) || 0,
          discountAmount: Number(d.discountAmount) || 0,
          discountReason: String(d.discountReason || ''),
          subtotal: Number(d.subtotal) || 0,
          taxableAmount: Number(d.taxableAmount) || 0,
          gstType: d.gstType || 'zero',
          gstRate: Number(d.gstRate) || 0,
          cgstRate: Number(d.cgstRate) || 0,
          cgstAmount: Number(d.cgstAmount) || 0,
          sgstRate: Number(d.sgstRate) || 0,
          sgstAmount: Number(d.sgstAmount) || 0,
          igstRate: Number(d.igstRate) || 0,
          igstAmount: Number(d.igstAmount) || 0,
          totalTax: Number(d.totalTax) || 0,
          totalAmountDue: Number(d.totalAmountDue) || 0,
          amountInWords: String(d.amountInWords || ''),
          milestones: d.milestones as [MilestonePhase, MilestonePhase, MilestonePhase],
          masterStatus: d.masterStatus || 'UNPAID',
          bankDetails: {
            bankName: DEFAULT_STUDIO_CONFIG.bankName,
            accountName: DEFAULT_STUDIO_CONFIG.accountName,
            accountNumber: DEFAULT_STUDIO_CONFIG.accountNumber,
            ifscCode: DEFAULT_STUDIO_CONFIG.ifscCode,
            upiId: DEFAULT_STUDIO_CONFIG.upiId,
          },
          termsAndConditions: String(d.termsAndConditions || ''),
          createdAt: timestampToIso(d.createdAt),
          updatedAt: timestampToIso(d.updatedAt),
        });
      });
      if (list.length > 0) {
        onInvoicesUpdate(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    }
  );

  const configDocRef = doc(db, 'studioConfigs', safeUid);
  const unsubConfig = onSnapshot(
    configDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        onConfigUpdate({
          studioName: d.studioName,
          address: d.address,
          phone: d.phone,
          email: d.email,
          web: d.web,
          gstin: d.gstin,
          pan: d.pan,
          isGstRegistered: d.isGstRegistered,
          bankName: d.bankName,
          accountName: d.accountName,
          accountNumber: d.accountNumber,
          ifscCode: d.ifscCode,
          upiId: d.upiId,
          defaultTerms: d.defaultTerms,
          financialGoal: d.financialGoal,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `studioConfigs/${safeUid}`);
    }
  );

  return () => {
    unsubInvoices();
    unsubConfig();
  };
}

/**
 * Cross-Browser Server API Persistence (/api/ledger)
 * Works immediately across all browsers & incognito sessions even without Google OAuth popup.
 */
export async function fetchServerLedger(): Promise<{
  studioConfig: StudioConfig | null;
  invoices: Invoice[];
  deletedInvoiceIds: string[];
} | null> {
  try {
    const res = await fetch('/api/ledger');
    if (!res.ok) return null;
    const data = await res.json();
    return {
      studioConfig: (data.studioConfig as StudioConfig) || null,
      invoices: Array.isArray(data.invoices) ? (data.invoices as Invoice[]) : [],
      deletedInvoiceIds: Array.isArray(data.deletedInvoiceIds)
        ? (data.deletedInvoiceIds as string[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function syncServerLedger(
  studioConfig: StudioConfig,
  invoices: Invoice[],
  mode: 'merge' | 'replace' = 'merge',
  deletedInvoiceIds: string[] = []
): Promise<{
  studioConfig: StudioConfig | null;
  invoices: Invoice[];
  deletedInvoiceIds: string[];
} | null> {
  try {
    const res = await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioConfig, invoices, deletedInvoiceIds, mode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      studioConfig: (data.studioConfig as StudioConfig) || null,
      invoices: Array.isArray(data.invoices) ? (data.invoices as Invoice[]) : [],
      deletedInvoiceIds: Array.isArray(data.deletedInvoiceIds)
        ? (data.deletedInvoiceIds as string[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function deleteInvoiceFromServer(invoiceId: string): Promise<void> {
  try {
    await fetch(`/api/ledger/invoice/${encodeURIComponent(invoiceId)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore transient offline error
  }
}
