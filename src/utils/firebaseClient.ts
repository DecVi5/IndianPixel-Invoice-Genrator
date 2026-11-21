import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export interface ResolvedFirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

// Build-safe lookup of firebase-applet-config.json:
// - Uses firebase-applet-config.json automatically whenever present (AI Studio / local / committed repos)
// - Never breaks external CI/CD builds (e.g. Vercel / GitHub) if firebase-applet-config.json is omitted from Git
const configModules = import.meta.glob<{ default?: ResolvedFirebaseConfig } & ResolvedFirebaseConfig>(
  '../../firebase-applet-config.json',
  { eager: true }
);

function resolveFirebaseConfig(): ResolvedFirebaseConfig | null {
  const mod = Object.values(configModules)[0];
  const fileConfig = mod ? (mod.default ?? mod) : null;

  if (fileConfig && fileConfig.apiKey && fileConfig.projectId) {
    return fileConfig;
  }

  const env = import.meta.env;
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: String(env.VITE_FIREBASE_API_KEY),
      authDomain: String(
        env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
      ),
      projectId: String(env.VITE_FIREBASE_PROJECT_ID),
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET
        ? String(env.VITE_FIREBASE_STORAGE_BUCKET)
        : undefined,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID
        ? String(env.VITE_FIREBASE_MESSAGING_SENDER_ID)
        : undefined,
      appId: String(env.VITE_FIREBASE_APP_ID || ''),
      firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID
        ? String(env.VITE_FIREBASE_DATABASE_ID)
        : undefined,
    };
  }

  return null;
}

export const firebaseConfig = resolveFirebaseConfig();
export const isFirebaseConfigured = Boolean(firebaseConfig);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (firebaseConfig) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
  } catch (err) {
    console.error('Failed to initialize Firebase client:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
