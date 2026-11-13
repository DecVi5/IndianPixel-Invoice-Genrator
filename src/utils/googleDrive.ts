import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Invoice, StudioConfig } from '../types/invoice.ts';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export const DRIVE_LEDGER_FILENAME = 'indian-pixel-studio-ledger.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export interface DriveFileMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

export interface DriveLedgerPayload {
  app: string;
  version: string;
  exportedAt: string;
  studioConfig: StudioConfig;
  invoices: Invoice[];
}

/**
 * Initialize Firebase Auth state listener. Call on app load.
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Must be called from a button click or user interaction.
 */
export const googleDriveSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Drive sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleDriveLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Searches Google Drive for the app's ledger file created by this app.
 */
export const findStudioLedgerFileInDrive = async (): Promise<DriveFileMeta | null> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const query = encodeURIComponent(
    `name = '${DRIVE_LEDGER_FILENAME}' and trashed = false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=5&fields=files(id,name,modifiedTime,size)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to search Google Drive: ${errText}`);
  }

  const data = await res.json();
  const files: DriveFileMeta[] = data.files || [];
  return files.length > 0 ? files[0] : null;
};

/**
 * Downloads and parses the studio ledger JSON file from Google Drive.
 */
export const loadStudioLedgerFromDrive = async (
  fileId: string
): Promise<DriveLedgerPayload> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download ledger from Google Drive: ${errText}`);
  }

  return (await res.json()) as DriveLedgerPayload;
};

/**
 * Builds the multipart/related body for uploading JSON to Google Drive.
 */
const buildMultipartDriveBody = (
  metadata: Record<string, unknown>,
  jsonContent: string
): { body: string; contentType: string } => {
  const boundary = '-------IndianPixelDriveSyncBoundary314159';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    jsonContent +
    closeDelim;

  return {
    body,
    contentType: `multipart/related; boundary=${boundary}`,
  };
};

/**
 * Creates a brand-new studio ledger file in Google Drive when none exists yet.
 */
export const createNewStudioLedgerInDrive = async (
  studioConfig: StudioConfig,
  invoices: Invoice[]
): Promise<DriveFileMeta> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const payload: DriveLedgerPayload = {
    app: 'Indian Pixel Studio Suite',
    version: '4.0.0',
    exportedAt: new Date().toISOString(),
    studioConfig,
    invoices,
  };

  const metadata = {
    name: DRIVE_LEDGER_FILENAME,
    mimeType: 'application/json',
    description: 'Indian Pixel Studio Financial Suite — Cloud Ledger & Configuration',
  };

  const { body, contentType } = buildMultipartDriveBody(
    metadata,
    JSON.stringify(payload, null, 2)
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body,
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create file in Google Drive: ${errText}`);
  }

  return (await res.json()) as DriveFileMeta;
};

/**
 * Updates/overwrites an existing studio ledger file in Google Drive.
 * IMPORTANT: Must only be called after explicit user confirmation in the UI!
 */
export const updateExistingStudioLedgerInDrive = async (
  fileId: string,
  studioConfig: StudioConfig,
  invoices: Invoice[]
): Promise<DriveFileMeta> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const payload: DriveLedgerPayload = {
    app: 'Indian Pixel Studio Suite',
    version: '4.0.0',
    exportedAt: new Date().toISOString(),
    studioConfig,
    invoices,
  };

  const metadata = {
    name: DRIVE_LEDGER_FILENAME,
    mimeType: 'application/json',
  };

  const { body, contentType } = buildMultipartDriveBody(
    metadata,
    JSON.stringify(payload, null, 2)
  );

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,modifiedTime,size`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body,
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update file in Google Drive: ${errText}`);
  }

  return (await res.json()) as DriveFileMeta;
};

/**
 * Deletes the studio ledger file from Google Drive.
 * IMPORTANT: Must only be called after explicit user confirmation in the UI!
 */
export const deleteStudioLedgerFromDrive = async (fileId: string): Promise<void> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${errText}`);
  }
};
