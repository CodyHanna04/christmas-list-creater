// services/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, };
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// NEW: set local persistence explicitly (survives reloads/tabs)
setPersistence(auth, browserLocalPersistence).catch(() => { /* ignore */ });

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

// HARDEN: always try anon sign-in if currentUser is null
export async function signInAnonIfNeeded() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (_) {
      // Some browsers block storage in strict modes.
      // You can surface a friendly banner if needed.
    }
  }
}

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
