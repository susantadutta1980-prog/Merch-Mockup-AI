import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudioPreset } from '../types/merch';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the provisioned custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Operation Types for Error Handling
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

// Standard Firestore Error Formatter as mandated by skill
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
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: client appears offline or connecting.');
    }
  }
}
testFirestoreConnection();

// Sign In With Google
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      // Sync or initialize user profile document in Firestore
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Atelier Designer',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
        });
      }
    }
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Sign Out
export async function logoutUser() {
  await signOut(auth);
}

// Auth State Subscriber
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// --- CLOUD FIRESTORE PRESET STORAGE HELPERS ---

export async function savePresetToCloud(userId: string, preset: StudioPreset) {
  const path = `users/${userId}/presets/${preset.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'presets', preset.id);
    await setDoc(docRef, {
      id: preset.id,
      userId,
      name: preset.name,
      description: preset.description || '',
      author: preset.author || 'You',
      isCustom: true,
      createdAt: preset.createdAt || Date.now(),
      tags: preset.tags || ['Custom'],
      config: preset.config,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserPresetsFromCloud(userId: string): Promise<StudioPreset[]> {
  const path = `users/${userId}/presets`;
  try {
    const colRef = collection(db, 'users', userId, 'presets');
    const snapshot = await getDocs(colRef);
    const presets: StudioPreset[] = [];
    snapshot.forEach((d) => {
      presets.push(d.data() as StudioPreset);
    });
    return presets;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deletePresetFromCloud(userId: string, presetId: string) {
  const path = `users/${userId}/presets/${presetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'presets', presetId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
