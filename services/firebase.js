import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { signOut } from "firebase/auth";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Persist across reloads/tabs
setPersistence(auth, browserLocalPersistence).catch(() => {});

export async function signInAnonIfNeeded() {
  const u = auth.currentUser;
  // Never override a real user
  if (u && !u.isAnonymous) return u;
  // Already anonymous? done.
  if (u && u.isAnonymous) return u;
  // Otherwise, create an anonymous session for visitors
  const cred = await signInAnonymously(auth);
  return cred.user;
}

// --- Sign in with Google helper ---
import { signInWithPopup } from "firebase/auth";

export async function signInWithGoogle() {
  try {
    // If there’s an active anonymous session, link it to Google
    const user = auth.currentUser;
    if (user && user.isAnonymous) {
      // optional: sign out anon first so the popup isn't blocked
      await signOut(auth);
    }

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error("Google sign-in failed:", err);
    throw err;
  }
}
