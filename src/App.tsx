/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Invoice, StudioConfig, MilestoneStatus, MilestonePhase } from './types/invoice.ts';
import {
  loadStudioConfig,
  saveStudioConfig,
  loadInvoices,
  saveInvoices,
  loadPersistedFromIndexedDB,
  loadDeletedInvoiceIds,
  recordDeletedInvoiceIds,
  getNextInvoiceNumber,
  createBlankInvoice,
  clearAllDataToZero,
  DEFAULT_STUDIO_CONFIG,
} from './utils/storage.ts';
import { isLegacyEmptyBlankDraft } from './data/liveStudioSeed.ts';
import {
  initDriveAuth,
  googleDriveSignIn,
  googleDriveLogout,
  findStudioLedgerFileInDrive,
  loadStudioLedgerFromDrive,
  createNewStudioLedgerInDrive,
  updateExistingStudioLedgerInDrive,
  deleteStudioLedgerFromDrive,
  DRIVE_LEDGER_FILENAME,
  DriveFileMeta,
} from './utils/googleDrive.ts';
import {
  auth as firebaseAuth,
  saveInvoiceToFirestore,
  deleteInvoiceFromFirestore,
  saveStudioConfigToFirestore,
  subscribeToFirestoreLedger,
  fetchServerLedger,
  syncServerLedger,
  deleteInvoiceFromServer,
} from './utils/firestoreSync.ts';
import { deriveMasterStatus, formatDateToDDMMYYYY, formatIndianCurrency } from './utils/financials.ts';
import { Sidebar, MainNavTab } from './components/Sidebar.tsx';
import { TopNavbar } from './components/TopNavbar.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { RevenueHealthDashboard } from './components/RevenueHealthDashboard.tsx';
import { LedgerDashboard } from './components/LedgerDashboard.tsx';
import { InvoiceEditor } from './components/InvoiceEditor.tsx';
import { InvoicePrintSheet } from './components/InvoicePrintSheet.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { StudioSettingsModal } from './components/StudioSettingsModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import {
  ArrowLeft,
  Edit3,
  Eye,
  X,
  CheckCircle2,
  RotateCcw,
  Zap,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Cloud,
  Trash2,
} from 'lucide-react';

function mergeInvoiceLists(
  localList: Invoice[],
  remoteList: Invoice[],
  extraDeletedIds: string[] = []
): Invoice[] {
  const deletedSet = new Set<string>([...loadDeletedInvoiceIds(), ...extraDeletedIds]);
  const map = new Map<string, Invoice>();

  for (const inv of localList) {
    if (inv && inv.id && !deletedSet.has(inv.id) && !isLegacyEmptyBlankDraft(inv)) {
      map.set(inv.id, inv);
    }
  }

  for (const inv of remoteList) {
    if (inv && inv.id && !deletedSet.has(inv.id) && !isLegacyEmptyBlankDraft(inv)) {
      const existing = map.get(inv.id);
      if (!existing) {
        map.set(inv.id, inv);
      } else {
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const remoteTime = inv.updatedAt ? new Date(inv.updatedAt).getTime() : 0;
        if (remoteTime > existingTime) {
          map.set(inv.id, {
            ...inv,
            // Preserve invoice-specific bankDetails and singleBillPaidAt if remote snapshot used defaults
            bankDetails: inv.bankDetails?.accountNumber
              ? inv.bankDetails
              : existing.bankDetails,
            singleBillPaidAt: inv.singleBillPaidAt || existing.singleBillPaidAt,
          });
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('ips_authenticated') === 'true' ||
        sessionStorage.getItem('ips_authenticated') === 'true'
      );
    } catch {
      return false;
    }
  });

  const [isDarkMode] = useState<boolean>(true);

  const handleToggleDarkMode = () => {
    // Keep all dark permanently as requested
    try {
      localStorage.setItem('ips_dark_mode', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Sync document root class and background color with dark studio theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#08221B';
    document.body.style.color = '#F8F4ED';
  }, []);

  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() =>
    loadStudioConfig()
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [timeFilter, setTimeFilter] = useState<string>('Last 30 days');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(() => {
    const list = loadInvoices();
    return list[0]?.id || '';
  });
  const [editorSubView, setEditorSubView] = useState<'split' | 'form' | 'preview'>('split');
  const [liveZoomScale, setLiveZoomScale] = useState<number>(0.46);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoicesRef = useRef<Invoice[]>(invoices);
  const studioConfigRef = useRef<StudioConfig>(studioConfig);

  useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);

  useEffect(() => {
    studioConfigRef.current = studioConfig;
  }, [studioConfig]);

  // Google Drive Cloud Persistence State
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(null);
  const [driveFileMeta, setDriveFileMeta] = useState<DriveFileMeta | null>(null);
  const [driveLastSynced, setDriveLastSynced] = useState<string | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);
  const [pendingDriveModal, setPendingDriveModal] = useState<'overwrite' | 'delete' | null>(null);

  // Apple-style transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Recover from IndexedDB + Cross-Browser Server Ledger on mount and periodic sync
  useEffect(() => {
    let active = true;

    const bootstrapPersistence = async () => {
      const persisted = await loadPersistedFromIndexedDB();
      if (!active) return;

      let currentConfig = studioConfigRef.current;
      let currentInvoices = invoicesRef.current;

      if (persisted.studioConfig) {
        currentConfig = { ...currentConfig, ...persisted.studioConfig };
        setStudioConfig(currentConfig);
      }
      if (Array.isArray(persisted.invoices) && persisted.invoices.length > 0) {
        currentInvoices = mergeInvoiceLists(currentInvoices, persisted.invoices);
        setInvoices(currentInvoices);
      }

      // Sync with server-side ledger so invoices created in Browser A appear in Browser B
      const serverData = await syncServerLedger(
        currentConfig,
        currentInvoices,
        'merge',
        loadDeletedInvoiceIds()
      );
      if (!active || !serverData) return;

      if (Array.isArray(serverData.deletedInvoiceIds) && serverData.deletedInvoiceIds.length > 0) {
        recordDeletedInvoiceIds(serverData.deletedInvoiceIds);
      }
      if (serverData.studioConfig) {
        setStudioConfig((curr) => ({ ...curr, ...serverData.studioConfig }));
      }
      if (Array.isArray(serverData.invoices)) {
        setInvoices((curr) => {
          const merged = mergeInvoiceLists(
            curr,
            serverData.invoices || [],
            serverData.deletedInvoiceIds || []
          );
          if (merged.length > 0) {
            setActiveInvoiceId((prevId) => prevId || merged[0].id);
          }
          return merged;
        });
      }
    };

    bootstrapPersistence();

    // Poll every 5 seconds to keep multiple open browsers in sync
    const interval = setInterval(async () => {
      if (!active) return;
      const serverData = await fetchServerLedger();
      if (!active || !serverData) return;
      if (Array.isArray(serverData.deletedInvoiceIds) && serverData.deletedInvoiceIds.length > 0) {
        recordDeletedInvoiceIds(serverData.deletedInvoiceIds);
      }
      if (Array.isArray(serverData.invoices)) {
        setInvoices((curr) => {
          const merged = mergeInvoiceLists(
            curr,
            serverData.invoices || [],
            serverData.deletedInvoiceIds || []
          );
          if (JSON.stringify(merged) !== JSON.stringify(curr)) {
            if (merged.length > 0) {
              setActiveInvoiceId((prevId) => prevId || merged[0].id);
            }
            return merged;
          }
          return curr;
        });
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Dedicated Cloud Firestore real-time listener (persists across reloads independently of Drive OAuth token)
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeFirebaseAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (user && user.emailVerified) {
        setDriveUserEmail((prev) => prev || user.email || user.displayName || 'Connected Account');

        // Push current live invoices and config to Cloud Firestore
        saveStudioConfigToFirestore(studioConfigRef.current);
        invoicesRef.current.forEach((inv) => {
          saveInvoiceToFirestore(inv);
        });

        // Subscribe to real-time Cloud Firestore changes across browsers & devices
        if (unsubscribeFirestore) unsubscribeFirestore();
        unsubscribeFirestore = subscribeToFirestoreLedger(
          user.uid,
          (remoteInvoices: Invoice[]) => {
            if (remoteInvoices.length > 0) {
              setInvoices((curr) => {
                const merged = mergeInvoiceLists(curr, remoteInvoices);
                if (merged.length > 0) {
                  setActiveInvoiceId((prevId) => prevId || merged[0].id);
                }
                return merged;
              });
            }
          },
          (remoteConfig: Partial<StudioConfig>) => {
            if (remoteConfig) {
              setStudioConfig((curr) => ({ ...curr, ...remoteConfig }));
            }
          }
        );
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      unsubscribeFirebaseAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Initialize Firebase Google Drive OAuth Listener
  useEffect(() => {
    const unsubscribeDriveAuth = initDriveAuth(
      (user) => {
        setDriveConnected(true);
        setDriveUserEmail(user.email || user.displayName || 'Connected Account');
      },
      () => {
        setDriveConnected(false);
      }
    );

    return () => {
      unsubscribeDriveAuth();
    };
  }, []);

  // Sync state to LocalStorage + IndexedDB + Server Ledger + Cloud Firestore
  useEffect(() => {
    saveStudioConfig(studioConfig);
    saveStudioConfigToFirestore(studioConfig);
  }, [studioConfig]);

  useEffect(() => {
    saveInvoices(invoices);
    if (invoices.length > 0) {
      syncServerLedger(studioConfigRef.current, invoices, 'merge', loadDeletedInvoiceIds());
    }
  }, [invoices]);

  const handleLoginSuccess = () => {
    try {
      localStorage.setItem('ips_authenticated', 'true');
      sessionStorage.setItem('ips_authenticated', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(true);
    showToast('Authenticated — Welcome to Indian Pixel Studio');
  };

  const handleLockStudio = () => {
    try {
      localStorage.removeItem('ips_authenticated');
      sessionStorage.removeItem('ips_authenticated');
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    showToast('Studio locked');
  };

  // Google Drive Cloud Handlers
  const handleConnectGoogleDrive = async () => {
    try {
      setIsDriveSyncing(true);
      const authResult = await googleDriveSignIn();
      if (!authResult) return;

      setDriveConnected(true);
      setDriveUserEmail(authResult.user.email || authResult.user.displayName || 'Connected');

      // Check if indian-pixel-studio-ledger.json already exists in Google Drive
      const existingFile = await findStudioLedgerFileInDrive();
      if (existingFile) {
        setDriveFileMeta(existingFile);
        const formattedTime = existingFile.modifiedTime
          ? new Date(existingFile.modifiedTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Found in Drive';
        setDriveLastSynced(formattedTime);

        // If local invoices are empty, automatically restore from Google Drive!
        if (invoices.length === 0) {
          const cloudData = await loadStudioLedgerFromDrive(existingFile.id);
          if (cloudData.studioConfig) {
            setStudioConfig(cloudData.studioConfig);
          }
          if (Array.isArray(cloudData.invoices) && cloudData.invoices.length > 0) {
            setInvoices(cloudData.invoices);
            setActiveInvoiceId(cloudData.invoices[0].id);
            showToast(
              `Restored ${cloudData.invoices.length} invoice(s) from Google Drive`
            );
            return;
          }
        }
        showToast('Google Drive connected — Cloud ledger ready');
      } else {
        // Create initial file in Google Drive so data is immediately persisted
        const created = await createNewStudioLedgerInDrive(studioConfig, invoices);
        setDriveFileMeta(created);
        setDriveLastSynced(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        showToast('Connected & created initial ledger in Google Drive');
      }
    } catch (err) {
      console.error('Google Drive connection failed:', err);
      showToast('Google Drive sign-in cancelled or failed');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Initiates Sync to Google Drive (creates if new, or opens confirmation modal before overwriting existing Drive file)
  const handleRequestSyncToGoogleDrive = async () => {
    if (!driveConnected) {
      await handleConnectGoogleDrive();
      return;
    }

    try {
      setIsDriveSyncing(true);
      const existing = driveFileMeta || (await findStudioLedgerFileInDrive());
      if (!existing) {
        const created = await createNewStudioLedgerInDrive(studioConfig, invoices);
        setDriveFileMeta(created);
        setDriveLastSynced(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        showToast(`Created ${DRIVE_LEDGER_FILENAME} in Google Drive`);
      } else {
        setDriveFileMeta(existing);
        // Require explicit user confirmation before overwriting existing file in Google Drive
        setPendingDriveModal('overwrite');
      }
    } catch (err: any) {
      if (err?.message === 'NO_ACCESS_TOKEN') {
        setDriveConnected(false);
        showToast('Session expired — Please sign in with Google again');
      } else {
        console.error('Failed to check Drive before sync:', err);
        showToast('Could not reach Google Drive');
      }
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Executes overwrite in Google Drive after user clicks Confirm in modal
  const handleConfirmOverwriteGoogleDrive = async () => {
    if (!driveFileMeta) return;
    try {
      setPendingDriveModal(null);
      setIsDriveSyncing(true);
      const updated = await updateExistingStudioLedgerInDrive(
        driveFileMeta.id,
        studioConfig,
        invoices
      );
      setDriveFileMeta(updated);
      setDriveLastSynced(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      showToast(`Synced ${invoices.length} invoice(s) to Google Drive`);
    } catch (err: any) {
      if (err?.message === 'NO_ACCESS_TOKEN') {
        setDriveConnected(false);
        showToast('Please sign in with Google to complete sync');
      } else {
        console.error('Failed to update file in Google Drive:', err);
        showToast('Failed to update ledger in Google Drive');
      }
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Restores studioConfig and invoices from Google Drive
  const handleRestoreFromGoogleDrive = async () => {
    if (!driveConnected) {
      await handleConnectGoogleDrive();
      return;
    }
    try {
      setIsDriveSyncing(true);
      const existing = driveFileMeta || (await findStudioLedgerFileInDrive());
      if (!existing) {
        showToast('No saved ledger file found in Google Drive yet');
        return;
      }
      setDriveFileMeta(existing);
      const cloudData = await loadStudioLedgerFromDrive(existing.id);
      if (cloudData.studioConfig) {
        setStudioConfig(cloudData.studioConfig);
      }
      if (Array.isArray(cloudData.invoices)) {
        setInvoices(cloudData.invoices);
        if (cloudData.invoices.length > 0) {
          setActiveInvoiceId(cloudData.invoices[0].id);
        }
      }
      setDriveLastSynced(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      showToast(
        `Restored ${cloudData.invoices?.length || 0} invoice(s) from Google Drive`
      );
    } catch (err: any) {
      if (err?.message === 'NO_ACCESS_TOKEN') {
        setDriveConnected(false);
        showToast('Please sign in with Google to restore');
      } else {
        console.error('Failed to restore from Google Drive:', err);
        showToast('Failed to load ledger from Google Drive');
      }
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Requests deletion of cloud backup file from Google Drive (opens confirmation modal)
  const handleRequestDeleteFromGoogleDrive = async () => {
    if (!driveConnected) return;
    const existing = driveFileMeta || (await findStudioLedgerFileInDrive());
    if (!existing) {
      showToast('No backup file in Google Drive to delete');
      return;
    }
    setDriveFileMeta(existing);
    setPendingDriveModal('delete');
  };

  // Executes deletion in Google Drive after user clicks Confirm in modal
  const handleConfirmDeleteFromGoogleDrive = async () => {
    if (!driveFileMeta) return;
    try {
      setPendingDriveModal(null);
      setIsDriveSyncing(true);
      await deleteStudioLedgerFromDrive(driveFileMeta.id);
      setDriveFileMeta(null);
      setDriveLastSynced(null);
      showToast(`Deleted ${DRIVE_LEDGER_FILENAME} from Google Drive`);
    } catch (err) {
      console.error('Failed to delete file from Google Drive:', err);
      showToast('Failed to delete file from Google Drive');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    await googleDriveLogout();
    setDriveConnected(false);
    setDriveUserEmail(null);
    setDriveFileMeta(null);
    setDriveLastSynced(null);
    showToast('Disconnected from Google Drive');
  };

  // Fallback blank invoice when list is reset to 0
  const fallbackInvoice = createBlankInvoice(studioConfig, 'INV-2026-0001');
  const activeInvoice =
    invoices.find((i) => i.id === activeInvoiceId) || invoices[0] || fallbackInvoice;

  // Actions
  const handleCreateNewInvoice = () => {
    const nextNo = getNextInvoiceNumber(invoices);
    const newInv = createBlankInvoice(studioConfig, nextNo);
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    setActiveInvoiceId(newInv.id);
    saveInvoiceToFirestore(newInv);
    syncServerLedger(studioConfig, updated, 'merge');
    setActiveTab('create');
    setEditorSubView('split');
    setMobileMenuOpen(false);
    showToast(`Created new draft ${nextNo}`);
  };

  const handleSelectInvoiceForPreview = (inv: Invoice) => {
    setActiveInvoiceId(inv.id);
    setActiveTab('editor');
    setEditorSubView('preview');
  };

  const handleSelectInvoiceForEdit = (inv: Invoice) => {
    setActiveInvoiceId(inv.id);
    setActiveTab('editor');
    setEditorSubView('split');
  };

  const handleSaveInvoice = useCallback((updated: Invoice, options?: { isAutoSave?: boolean }) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === updated.id);
      const nextList = exists
        ? prev.map((inv) => (inv.id === updated.id ? updated : inv))
        : [updated, ...prev];
      syncServerLedger(studioConfigRef.current, nextList, 'merge');
      return nextList;
    });
    saveInvoiceToFirestore(updated);
    setActiveInvoiceId(updated.id);
    if (!options?.isAutoSave) {
      showToast(`Invoice ${updated.invoiceNo} saved`);
    }
  }, []);

  // Real-time synchronization while typing for live bill
  const handleLiveUpdate = useCallback((updated: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === updated.id);
      if (exists) {
        return prev.map((inv) => (inv.id === updated.id ? updated : inv));
      }
      return [updated, ...prev];
    });
    saveInvoiceToFirestore(updated);
    setActiveInvoiceId(updated.id);
  }, []);

  const handleDuplicateInvoice = (inv: Invoice) => {
    const nextNo = getNextInvoiceNumber(invoices);
    const duplicated: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNo: nextNo,
      date: formatDateToDDMMYYYY(new Date()),
      masterStatus: 'UNPAID',
      singleBillPaid: false,
      singleBillPaidAt: undefined,
      milestones: [
        { ...inv.milestones[0], status: 'DUE', paidAt: undefined },
        { ...inv.milestones[1], status: 'DUE', paidAt: undefined },
        { ...inv.milestones[2], status: 'DUE', paidAt: undefined },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextList = [duplicated, ...invoices];
    setInvoices(nextList);
    saveInvoiceToFirestore(duplicated);
    syncServerLedger(studioConfig, nextList, 'merge');
    setActiveInvoiceId(duplicated.id);
    showToast(`Duplicated to ${nextNo}`);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    recordDeletedInvoiceIds([invoiceId]);
    const remaining = invoices.filter((inv) => inv.id !== invoiceId);
    setInvoices(remaining);
    deleteInvoiceFromFirestore(invoiceId);
    deleteInvoiceFromServer(invoiceId);
    if (activeInvoiceId === invoiceId) {
      setActiveInvoiceId(remaining[0]?.id || '');
    }
    showToast('Invoice removed from ledger');
  };

  // Milestone or Single Bill toggle
  const handleToggleMilestone = (invoiceId: string, phaseId: 1 | 2 | 3) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        if (inv.billingType === 'single') {
          const nextPaid = !inv.singleBillPaid;
          const nextPaidAt = nextPaid ? formatDateToDDMMYYYY(new Date()) : undefined;
          const masterStatus = nextPaid ? 'PAID' : 'UNPAID';
          const updatedInv: Invoice = {
            ...inv,
            singleBillPaid: nextPaid,
            singleBillPaidAt: nextPaidAt,
            masterStatus,
            updatedAt: new Date().toISOString(),
          };
          saveInvoiceToFirestore(updatedInv);
          return updatedInv;
        }

        const updatedMilestones: [MilestonePhase, MilestonePhase, MilestonePhase] = [
          {
            ...inv.milestones[0],
            status:
              phaseId === 1
                ? inv.milestones[0].status === 'PAID'
                  ? 'DUE'
                  : 'PAID'
                : inv.milestones[0].status,
            paidAt:
              phaseId === 1
                ? inv.milestones[0].status === 'PAID'
                  ? undefined
                  : formatDateToDDMMYYYY(new Date())
                : inv.milestones[0].paidAt,
          },
          {
            ...inv.milestones[1],
            status:
              phaseId === 2
                ? inv.milestones[1].status === 'PAID'
                  ? 'DUE'
                  : 'PAID'
                : inv.milestones[1].status,
            paidAt:
              phaseId === 2
                ? inv.milestones[1].status === 'PAID'
                  ? undefined
                  : formatDateToDDMMYYYY(new Date())
                : inv.milestones[1].paidAt,
          },
          {
            ...inv.milestones[2],
            status:
              phaseId === 3
                ? inv.milestones[2].status === 'PAID'
                  ? 'DUE'
                  : 'PAID'
                : inv.milestones[2].status,
            paidAt:
              phaseId === 3
                ? inv.milestones[2].status === 'PAID'
                  ? undefined
                  : formatDateToDDMMYYYY(new Date())
                : inv.milestones[2].paidAt,
          },
        ];

        const newMasterStatus = deriveMasterStatus(
          updatedMilestones,
          inv.billingType,
          inv.singleBillPaid
        );

        const updatedInv: Invoice = {
          ...inv,
          milestones: updatedMilestones,
          masterStatus: newMasterStatus,
          updatedAt: new Date().toISOString(),
        };
        saveInvoiceToFirestore(updatedInv);
        return updatedInv;
      })
    );
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const data = {
      app: 'Indian Pixel Studio Suite',
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      studioConfig,
      invoices,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Indian-Pixel-Backup-${formatDateToDDMMYYYY(new Date()).replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON backup exported successfully');
  };

  // Trigger file upload for restore
  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.studioConfig) {
          setStudioConfig(parsed.studioConfig);
          saveStudioConfigToFirestore(parsed.studioConfig);
        }
        if (Array.isArray(parsed.invoices)) {
          setInvoices(parsed.invoices);
          parsed.invoices.forEach((inv: Invoice) => saveInvoiceToFirestore(inv));
          syncServerLedger(
            parsed.studioConfig || studioConfig,
            parsed.invoices,
            'merge'
          );
          if (parsed.invoices.length > 0) {
            setActiveInvoiceId(parsed.invoices[0].id);
          }
        }
        showToast('Backup restored successfully');
      } catch (err) {
        console.error('Failed to import JSON backup', err);
        showToast('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Strict Reset to 0: Clears ledger so all metrics start at 0
  const handlePerformResetZero = () => {
    invoices.forEach((inv) => deleteInvoiceFromFirestore(inv.id));
    clearAllDataToZero();
    setInvoices([]);
    setActiveInvoiceId('');
    setStudioConfig(DEFAULT_STUDIO_CONFIG);
    syncServerLedger(DEFAULT_STUDIO_CONFIG, [], 'replace');
    setIsResetModalOpen(false);
    setActiveTab('home');
    showToast('Studio data reset to ₹0.00 — Ready for clean entry');
  };

  // Load sample demo invoice for testing
  const handleLoadSampleDemo = () => {
    const sampleInv: Invoice = {
      id: `inv-demo-${Date.now()}`,
      invoiceNo: 'INV-2026-0042',
      date: formatDateToDDMMYYYY(new Date()),
      dueDate: formatDateToDDMMYYYY(new Date(Date.now() + 14 * 86400000)),
      projectName: 'Mitti & Co. — Dynamic Brand Identity Architecture & Packaging',
      client: {
        name: 'Mitti Clayworks Private Limited',
        address: '42 Pottery Lane, Fort, Mumbai 400001, Maharashtra',
        phone: '+91 98200 12345',
        email: 'accounts@mitticlay.in',
        gstin: '27AABCM8765P1ZT',
        stateCode: '27',
      },
      items: [
        {
          id: 'item-demo-1',
          description: 'Brand Identity Architecture & Motion Guidelines',
          unit: 'Package',
          qty: 1,
          rate: 150000,
          amount: 150000,
        },
        {
          id: 'item-demo-2',
          description: 'Eco-Friendly Product Packaging Suites (5 SKUs)',
          unit: 'Designs',
          qty: 5,
          rate: 18000,
          amount: 90000,
        },
        {
          id: 'item-demo-3',
          description: 'Fast-Track Rush Delivery — Priority Weekend Sprint',
          unit: 'Tier',
          qty: 1,
          rate: 25000,
          amount: 25000,
        },
      ],
      billingType: 'single',
      singleBillPaid: false,
      singleBillPaidAt: undefined,
      subtotal: 265000,
      discountType: 'percentage',
      discountValue: 10,
      discountAmount: 26500,
      discountReason: 'Spring Agency Retainer Partner Privilege (10% OFF)',
      taxableAmount: 238500,
      gstType: 'zero',
      gstRate: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      cessRate: 0,
      cessAmount: 0,
      totalTax: 0,
      tdsApplicable: false,
      tdsRate: 10,
      tdsAmount: 0,
      totalAmountDue: 238500,
      amountInWords: 'Two Lakh Thirty-Eight Thousand Five Hundred Rupees Only',
      milestones: [
        {
          phaseId: 1,
          name: 'Phase 1: Brand Strategy & Architecture Sprint',
          percentage: 40,
          amount: 95400,
          status: 'DUE',
        },
        {
          phaseId: 2,
          name: 'Phase 2: Comprehensive Packaging Design (5 SKUs)',
          percentage: 40,
          amount: 95400,
          status: 'DUE',
        },
        {
          phaseId: 3,
          name: 'Phase 3: Production Signoff & Master Source Handover',
          percentage: 20,
          amount: 47700,
          status: 'DUE',
        },
      ],
      masterStatus: 'UNPAID',
      bankDetails: {
        bankName: studioConfig.bankName,
        accountName: studioConfig.accountName,
        accountNumber: studioConfig.accountNumber,
        ifscCode: studioConfig.ifscCode,
        upiId: studioConfig.upiId,
      },
      termsAndConditions: studioConfig.defaultTerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoices([sampleInv]);
    saveInvoiceToFirestore(sampleInv);
    syncServerLedger(studioConfig, [sampleInv], 'merge');
    setActiveInvoiceId(sampleInv.id);
    showToast('Loaded sample studio invoice with Single Bill & Discount');
  };

  const handleGoogleUnlockStudio = async () => {
    await handleConnectGoogleDrive();
    if (firebaseAuth.currentUser) {
      handleLoginSuccess();
    }
  };

  // If user is not authenticated, render confidential password login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onGoogleSignIn={handleGoogleUnlockStudio}
        logoDataUrl={studioConfig.logoDataUrl}
      />
    );
  }

  return (
    <div className="w-full h-screen min-h-screen overflow-hidden flex flex-col font-poppins antialiased bg-[#08221B] text-[#F8F4ED]">
      {/* Hidden file input for import backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Floating Apple-Style Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#08221B]/95 text-[#F8F4ED] rounded-full border border-[#ACBEA3]/40 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-poppins transition-all animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#FFA400]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Shell: Full-bleed end-to-end viewport layout */}
      <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col transition-colors duration-200 relative bg-[#08221B]">
        {/* Top Navigation Header with Mobile Drawer Trigger, Financial Goal Tracker & Google Drive Sync */}
        <TopNavbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'create') {
              handleCreateNewInvoice();
            } else {
              setActiveTab(tab as MainNavTab);
            }
          }}
          onCreateInvoice={handleCreateNewInvoice}
          studioConfig={studioConfig}
          invoices={invoices}
          onUpdateFinancialGoal={(newGoal) => {
            setStudioConfig((prev) => ({ ...prev, financialGoal: newGoal }));
            showToast(`Financial goal set to ${formatIndianCurrency(newGoal)}`);
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onLockStudio={handleLockStudio}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetDefaults={() => setIsResetModalOpen(true)}
          invoicesCount={invoices.length}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          driveConnected={driveConnected}
          driveUserEmail={driveUserEmail}
          driveFileName={driveFileMeta?.name || DRIVE_LEDGER_FILENAME}
          driveLastSynced={driveLastSynced}
          isDriveSyncing={isDriveSyncing}
          onConnectGoogleDrive={handleConnectGoogleDrive}
          onSyncToGoogleDrive={handleRequestSyncToGoogleDrive}
          onRestoreFromGoogleDrive={handleRestoreFromGoogleDrive}
          onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
        />

        {/* Body Container with Left Sidebar Intact */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Left Sidebar (Always Intact on lg+ screens) */}
          <div className="hidden lg:flex shrink-0 h-full">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                if (tab === 'create') {
                  handleCreateNewInvoice();
                } else {
                  setActiveTab(tab as MainNavTab);
                }
              }}
              studioConfig={studioConfig}
              invoicesCount={invoices.length}
              onOpenSettings={() => setActiveTab('settings')}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDefaults={() => setIsResetModalOpen(true)}
              onLockStudio={handleLockStudio}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          </div>

          {/* Mobile & Tablet Slide-Over Drawer (< lg screens) */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    if (tab === 'create') {
                      handleCreateNewInvoice();
                    } else {
                      setActiveTab(tab as MainNavTab);
                    }
                  }}
                  studioConfig={studioConfig}
                  invoicesCount={invoices.length}
                  onOpenSettings={() => setActiveTab('settings')}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onResetDefaults={() => setIsResetModalOpen(true)}
                  onLockStudio={handleLockStudio}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                  onCloseMobileMenu={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Right Main Canvas — Spans complete page end-to-end with generous negative space */}
          <main className="flex-1 px-6 sm:px-9 lg:px-12 xl:px-14 py-7 sm:py-9 lg:py-10 overflow-y-auto relative flex flex-col transition-colors duration-200 bg-[#2C3330] text-[#F8F4ED]">
          {/* PAGE 1: Home Screen with Financial Goal Tracker, Basic Stats, Current Invoices, Revenue Health Recharts */}
          {activeTab === 'home' && (
            <HomeScreen
              invoices={invoices}
              studioConfig={studioConfig}
              onUpdateFinancialGoal={(newGoal) => {
                setStudioConfig((prev) => ({ ...prev, financialGoal: newGoal }));
                showToast(`Financial goal set to ${formatIndianCurrency(newGoal)}`);
              }}
              onNavigateTab={(tab) => {
                if (tab === 'create') {
                  handleCreateNewInvoice();
                } else {
                  setActiveTab(tab);
                }
              }}
              onSelectInvoice={handleSelectInvoiceForPreview}
              onEditInvoice={handleSelectInvoiceForEdit}
              onLoadSampleData={handleLoadSampleDemo}
              isDarkMode={isDarkMode}
            />
          )}

          {/* PAGE 3: All Invoices (Studio Ledger) */}
          {activeTab === 'invoices' && (
            <LedgerDashboard
              invoices={invoices}
              onSelectInvoice={handleSelectInvoiceForPreview}
              onEditInvoice={handleSelectInvoiceForEdit}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onToggleMilestone={handleToggleMilestone}
              onCreateNewInvoice={handleCreateNewInvoice}
              onLoadSampleData={handleLoadSampleDemo}
              studioConfig={studioConfig}
              isDarkMode={isDarkMode}
            />
          )}

          {/* PAGE: Deep Visual Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <RevenueHealthDashboard
                invoices={invoices}
                onLoadSampleData={handleLoadSampleDemo}
                onCreateNewInvoice={handleCreateNewInvoice}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* PAGE 4: Settings Page */}
          {activeTab === 'settings' && (
            <SettingsPage
              config={studioConfig}
              onSaveConfig={(cfg) => {
                setStudioConfig(cfg);
                showToast('Studio settings and branding saved');
              }}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetData={() => setIsResetModalOpen(true)}
              onLockStudio={handleLockStudio}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              driveConnected={driveConnected}
              driveUserEmail={driveUserEmail}
              driveFileName={driveFileMeta?.name || DRIVE_LEDGER_FILENAME}
              driveLastSynced={driveLastSynced}
              isDriveSyncing={isDriveSyncing}
              onConnectGoogleDrive={handleConnectGoogleDrive}
              onSyncToGoogleDrive={handleRequestSyncToGoogleDrive}
              onRestoreFromGoogleDrive={handleRestoreFromGoogleDrive}
              onDeleteFromGoogleDrive={handleRequestDeleteFromGoogleDrive}
              onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
            />
          )}

          {/* PAGE 2 / EDITOR: Generate Invoice or Edit Invoice */}
          {(activeTab === 'create' || activeTab === 'editor') && (
            <div className="space-y-4">
              {/* Workspace Navigation Bar (Hidden during print) */}
              <div
                className={`no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                  isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/40'
                }`}
              >
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-poppins font-medium cursor-pointer ${
                    isDarkMode
                      ? 'text-slate-300 hover:text-white hover:bg-white/10'
                      : 'text-[#2C3330] hover:text-[#08221B] hover:bg-white'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Invoices</span>
                </button>

                {/* Subview Selector: Live Split vs Form vs Full A4 */}
                <div
                  className={`flex items-center gap-1.5 p-1 rounded-xl shadow-xs border ${
                    isDarkMode
                      ? 'bg-white/[0.06] border-white/10'
                      : 'bg-white border-[#ACBEA3]/40'
                  }`}
                >
                  <button
                    onClick={() => setEditorSubView('split')}
                    className={`px-3.5 py-1.5 text-xs font-poppins font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editorSubView === 'split'
                        ? isDarkMode
                          ? 'bg-[#FFA400] text-[#08221B] shadow-xs'
                          : 'bg-[#08221B] text-[#ACBEA3]'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-white'
                        : 'text-[#2C3330]/70 hover:text-[#08221B]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-[#FFA400]" />
                    <span>Live Split Bill</span>
                    <span className="hidden sm:inline text-[9px] bg-[#08221B] text-[#FFA400] font-bold px-1.5 py-0.2 rounded-full">
                      Live
                    </span>
                  </button>

                  <button
                    onClick={() => setEditorSubView('form')}
                    className={`px-3.5 py-1.5 text-xs font-poppins font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editorSubView === 'form'
                        ? isDarkMode
                          ? 'bg-[#FFA400] text-[#08221B] shadow-xs'
                          : 'bg-[#08221B] text-[#ACBEA3]'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-white'
                        : 'text-[#2C3330]/70 hover:text-[#08221B]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Form Only</span>
                  </button>

                  <button
                    onClick={() => setEditorSubView('preview')}
                    className={`px-3.5 py-1.5 text-xs font-poppins font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editorSubView === 'preview'
                        ? isDarkMode
                          ? 'bg-[#FFA400] text-[#08221B] shadow-xs'
                          : 'bg-[#08221B] text-[#ACBEA3]'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-white'
                        : 'text-[#2C3330]/70 hover:text-[#08221B]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Full A4 Print &amp; PDF</span>
                  </button>
                </div>
              </div>

              {/* View 1: Live Split View (Form on Left, Real-Time Synchronized A4 Bill on Right) */}
              {editorSubView === 'split' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 lg:gap-8 items-start">
                  {/* Left Column: Form Controls (7 cols on XL) */}
                  <div className="xl:col-span-7 space-y-5">
                    <InvoiceEditor
                      key={activeInvoice.id}
                      invoice={activeInvoice}
                      studioConfig={studioConfig}
                      onSaveInvoice={handleSaveInvoice}
                      onViewInvoice={() => setEditorSubView('preview')}
                      onLiveUpdate={handleLiveUpdate}
                      onToggleSplitLiveView={() => setEditorSubView('form')}
                      isSplitLiveActive={true}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Right Column: Real-Time Live Bill Preview (5 cols on XL) */}
                  <div className="xl:col-span-5 sticky top-2 space-y-2">
                    <div className="p-3 rounded-2xl border shadow-xs flex items-center justify-between bg-[#08221B] border-[#ACBEA3]/35 text-[#F8F4ED]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFA400] animate-pulse" />
                        <span className="font-montserrat font-bold text-xs tracking-wide uppercase text-[#F8F4ED]">
                          Live Bill (1-Page A4)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLiveZoomScale(0.46)}
                          title="Fit Live Bill to panel width"
                          className="px-2 py-0.5 rounded text-[10px] font-poppins font-semibold transition-colors cursor-pointer bg-[#2C3330] hover:bg-[#38423e] text-[#F8F4ED] border border-[#ACBEA3]/30"
                        >
                          Fit
                        </button>
                        <button
                          onClick={() =>
                            setLiveZoomScale((curr) =>
                              curr <= 0.36 ? 0.46 : Math.round((curr - 0.05) * 100) / 100
                            )
                          }
                          title="Zoom Out Live Bill"
                          className="p-1 rounded transition-colors cursor-pointer bg-[#2C3330] hover:bg-[#38423e] text-[#F8F4ED] border border-[#ACBEA3]/30"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-space-mono font-semibold px-1 text-[#F8F4ED]">
                          {Math.round(liveZoomScale * 100)}%
                        </span>
                        <button
                          onClick={() =>
                            setLiveZoomScale((curr) =>
                              curr >= 1.0 ? 0.46 : Math.round((curr + 0.05) * 100) / 100
                            )
                          }
                          title="Zoom In Live Bill"
                          className="p-1 rounded transition-colors cursor-pointer bg-[#2C3330] hover:bg-[#38423e] text-[#F8F4ED] border border-[#ACBEA3]/30"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditorSubView('preview')}
                          title="Open Fullscreen A4 Print Sheet"
                          className="p-1 rounded transition-colors cursor-pointer bg-[#2C3330] hover:bg-[#38423e] text-[#FFA400] border border-[#ACBEA3]/30"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scale-Fitted Live Bill Container */}
                    <div className="border rounded-2xl p-2 sm:p-3 overflow-x-auto overflow-y-auto max-h-[calc(88vh-90px)] flex justify-center shadow-inner bg-[#08221B]/60 border-[#ACBEA3]/30">
                      <div
                        style={{
                          width: `calc(210mm * ${liveZoomScale})`,
                          height: `calc(297mm * ${liveZoomScale})`,
                          position: 'relative',
                        }}
                        className="shrink-0 overflow-hidden rounded-sm shadow-xl"
                      >
                        <div
                          style={{
                            transform: `scale(${liveZoomScale})`,
                            transformOrigin: 'top left',
                            width: '210mm',
                            height: '297mm',
                          }}
                        >
                          <InvoicePrintSheet
                            invoice={activeInvoice}
                            studioConfig={studioConfig}
                            hidePrintControls={true}
                            onToggleSingleBillPaid={() =>
                              handleToggleMilestone(activeInvoice.id, 1)
                            }
                            onMilestoneToggle={(phaseId) =>
                              handleToggleMilestone(activeInvoice.id, phaseId)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Form Only View */}
              {editorSubView === 'form' && (
                <InvoiceEditor
                  key={activeInvoice.id}
                  invoice={activeInvoice}
                  studioConfig={studioConfig}
                  onSaveInvoice={handleSaveInvoice}
                  onViewInvoice={() => setEditorSubView('preview')}
                  onLiveUpdate={handleLiveUpdate}
                  onToggleSplitLiveView={() => setEditorSubView('split')}
                  isSplitLiveActive={false}
                  isDarkMode={isDarkMode}
                />
              )}

              {/* View 3: Full A4 Print / PDF Preview */}
              {editorSubView === 'preview' && (
                <InvoicePrintSheet
                  invoice={activeInvoice}
                  studioConfig={studioConfig}
                  onEdit={() => setEditorSubView('split')}
                  onToggleSingleBillPaid={() =>
                    handleToggleMilestone(activeInvoice.id, 1)
                  }
                  onMilestoneToggle={(phaseId) =>
                    handleToggleMilestone(activeInvoice.id, phaseId)
                  }
                />
              )}
            </div>
          )}
        </main>
        </div>
      </div>

      {/* Quick Studio Settings Modal */}
      <StudioSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={studioConfig}
        onSaveConfig={(cfg) => {
          setStudioConfig(cfg);
          showToast('Studio settings and branding saved');
        }}
      />

      {/* Apple-Style Non-blocking Reset Confirmation Dialog */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div
            className={`rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border space-y-5 ${
              isDarkMode
                ? 'bg-[#18202F]/95 backdrop-blur-2xl border-white/15 text-white'
                : 'bg-white border-[#ACBEA3]/40 text-[#08221B]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3
                className={`text-lg font-bold font-montserrat ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Reset All Studio Data to 0?
              </h3>
              <p
                className={`text-xs leading-relaxed font-poppins ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/80'
                }`}
              >
                This will purge all custom invoices, reset revenue metrics to ₹0.00, and restore Indian Pixel default studio configurations.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'border-white/15 bg-white/10 hover:bg-white/15 text-white'
                    : 'border-[#ACBEA3]/60 bg-[#F8F4ED] hover:bg-[#ACBEA3]/20 text-[#08221B]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformResetZero}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold font-montserrat text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Reset to ₹0.00
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#091513] border border-emerald-500/30 shadow-2xl p-5 text-white font-poppins">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
              <span className="text-[#10e599]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice #, client name, or project..."
                autoFocus
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-poppins"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-white/5">
              {invoices
                .filter(
                  (inv) =>
                    !searchQuery ||
                    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inv.projectName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      handleSelectInvoiceForPreview(inv);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-white/5 rounded-2xl flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white font-space-mono group-hover:text-[#10e599] transition-colors">
                        {inv.invoiceNo} · {inv.client.name || 'Valued Client'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {inv.projectName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-space-mono text-emerald-400">
                        {formatIndianCurrency(inv.totalAmountDue)}
                      </div>
                      <div className="text-[10px] text-slate-500">{inv.masterStatus}</div>
                    </div>
                  </div>
                ))}
              {invoices.length === 0 && (
                <div className="p-5 text-center text-xs text-slate-500">
                  No registered invoices found. Click + Generate Invoice to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Google Drive Overwrite / Delete Operations */}
      {pendingDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border bg-[#08221B] border-[#FFA400]/50 text-[#F8F4ED] space-y-5 font-poppins">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                pendingDriveModal === 'delete'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-[#FFA400]/20 border-[#FFA400]/40 text-[#FFA400]'
              }`}
            >
              {pendingDriveModal === 'delete' ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <Cloud className="w-6 h-6" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-montserrat text-[#F8F4ED]">
                {pendingDriveModal === 'delete'
                  ? `Delete '${DRIVE_LEDGER_FILENAME}' from Google Drive?`
                  : `Update '${DRIVE_LEDGER_FILENAME}' in Google Drive?`}
              </h3>
              <p className="text-xs leading-relaxed text-[#ACBEA3]">
                {pendingDriveModal === 'delete'
                  ? `This will permanently delete the backup file '${DRIVE_LEDGER_FILENAME}' from your Google Drive (${driveUserEmail || 'connected account'}). Your local studio invoices will remain untouched.`
                  : `This will overwrite the existing file '${DRIVE_LEDGER_FILENAME}' in your Google Drive with your current studio configuration and ${invoices.length} invoice(s).`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDriveModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#ACBEA3]/40 bg-[#2C3330] hover:bg-[#38423e] text-xs font-semibold text-[#F8F4ED] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {pendingDriveModal === 'delete' ? (
                <button
                  type="button"
                  onClick={handleConfirmDeleteFromGoogleDrive}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold font-montserrat text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Confirm Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmOverwriteGoogleDrive}
                  className="flex-1 py-2.5 rounded-xl bg-[#FFA400] hover:bg-[#e69400] text-xs font-bold font-montserrat text-[#08221B] shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Confirm Sync</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
