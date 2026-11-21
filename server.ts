import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LIVE_BROADNET_INVOICE,
  LEGACY_EMPTY_DRAFT_IDS,
  isLegacyEmptyBlankDraft,
} from './src/data/liveStudioSeed.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const LEDGER_FILE = path.join(DATA_DIR, 'studio-ledger.json');

interface ServerLedgerData {
  studioConfig: Record<string, unknown> | null;
  invoices: Array<Record<string, unknown>>;
  deletedInvoiceIds: string[];
  updatedAt: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultDeletedIds(): string[] {
  return Array.from(LEGACY_EMPTY_DRAFT_IDS);
}

function normalizeServerLedger(raw: Partial<ServerLedgerData>): ServerLedgerData {
  const deletedSet = new Set<string>([
    ...getDefaultDeletedIds(),
    ...(Array.isArray(raw.deletedInvoiceIds) ? raw.deletedInvoiceIds.map(String) : []),
  ]);

  const rawInvoices = Array.isArray(raw.invoices) ? raw.invoices : [];
  const filteredInvoices = rawInvoices.filter((inv) => {
    const id = String(inv?.id || '');
    if (!id) return false;
    if (deletedSet.has(id)) return false;
    if (isLegacyEmptyBlankDraft(inv)) return false;
    return true;
  });

  // Always ensure the canonical live Broadnet invoice is present unless explicitly deleted
  if (
    !deletedSet.has(LIVE_BROADNET_INVOICE.id) &&
    !filteredInvoices.some((inv) => String(inv.id) === LIVE_BROADNET_INVOICE.id)
  ) {
    filteredInvoices.unshift(LIVE_BROADNET_INVOICE as unknown as Record<string, unknown>);
  }

  return {
    studioConfig: raw.studioConfig || null,
    invoices: filteredInvoices,
    deletedInvoiceIds: Array.from(deletedSet),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function readServerLedger(): ServerLedgerData {
  try {
    ensureDataDir();
    if (fs.existsSync(LEDGER_FILE)) {
      const raw = fs.readFileSync(LEDGER_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return normalizeServerLedger(parsed);
    }
  } catch (err) {
    console.error('Failed to read server ledger:', err);
  }
  const seeded = normalizeServerLedger({
    studioConfig: null,
    invoices: [LIVE_BROADNET_INVOICE as unknown as Record<string, unknown>],
    deletedInvoiceIds: getDefaultDeletedIds(),
    updatedAt: new Date().toISOString(),
  });
  writeServerLedger(seeded);
  return seeded;
}

function writeServerLedger(data: ServerLedgerData): void {
  try {
    ensureDataDir();
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write server ledger:', err);
  }
}

function mergeInvoices(
  existing: Array<Record<string, unknown>>,
  incoming: Array<Record<string, unknown>>,
  deletedSet: Set<string>
): Array<Record<string, unknown>> {
  const byId = new Map<string, Record<string, unknown>>();

  for (const inv of existing) {
    const id = String(inv.id || '');
    if (id && !deletedSet.has(id) && !isLegacyEmptyBlankDraft(inv)) {
      byId.set(id, inv);
    }
  }

  for (const inv of incoming) {
    const id = String(inv.id || '');
    if (!id || deletedSet.has(id) || isLegacyEmptyBlankDraft(inv)) continue;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, inv);
    } else {
      const prevTime = new Date(String(prev.updatedAt || prev.createdAt || 0)).getTime();
      const nextTime = new Date(String(inv.updatedAt || inv.createdAt || 0)).getTime();
      if (isNaN(prevTime) || nextTime >= prevTime) {
        byId.set(id, inv);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const tA = new Date(String(a.createdAt || a.updatedAt || 0)).getTime();
    const tB = new Date(String(b.createdAt || b.updatedAt || 0)).getTime();
    return tB - tA;
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Cross-browser shared ledger GET endpoint
  app.get('/api/ledger', (_req, res) => {
    const current = readServerLedger();
    res.json(current);
  });

  // Cross-browser shared ledger POST (merge or replace) endpoint
  app.post('/api/ledger', (req, res) => {
    const current = readServerLedger();
    const { studioConfig, invoices, deletedInvoiceIds, mode = 'merge' } = req.body || {};

    const deletedSet = new Set<string>([
      ...current.deletedInvoiceIds,
      ...(Array.isArray(deletedInvoiceIds) ? deletedInvoiceIds.map(String) : []),
    ]);

    const nextConfig =
      studioConfig && typeof studioConfig === 'object'
        ? { ...(current.studioConfig || {}), ...studioConfig }
        : current.studioConfig;

    let nextInvoices = current.invoices;
    if (Array.isArray(invoices)) {
      if (mode === 'replace') {
        if (invoices.length === 0) {
          // Explicit reset-to-zero marks existing invoices as deleted so they don't resurrect
          current.invoices.forEach((inv) => {
            if (inv.id) deletedSet.add(String(inv.id));
          });
          deletedSet.add(LIVE_BROADNET_INVOICE.id);
        }
        nextInvoices = invoices.filter(
          (inv) => inv && inv.id && !isLegacyEmptyBlankDraft(inv)
        );
      } else {
        nextInvoices = mergeInvoices(current.invoices, invoices, deletedSet);
      }
    }

    const updated: ServerLedgerData = {
      studioConfig: nextConfig,
      invoices: nextInvoices,
      deletedInvoiceIds: Array.from(deletedSet),
      updatedAt: new Date().toISOString(),
    };

    writeServerLedger(updated);
    res.json(updated);
  });

  // Delete a specific invoice across all browsers
  app.delete('/api/ledger/invoice/:id', (req, res) => {
    const current = readServerLedger();
    const targetId = req.params.id;
    const deletedSet = new Set<string>([...current.deletedInvoiceIds, targetId]);
    const filtered = current.invoices.filter((inv) => String(inv.id) !== targetId);
    const updated: ServerLedgerData = {
      ...current,
      invoices: filtered,
      deletedInvoiceIds: Array.from(deletedSet),
      updatedAt: new Date().toISOString(),
    };
    writeServerLedger(updated);
    res.json(updated);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Indian Pixel Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
