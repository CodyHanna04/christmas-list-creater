// components/EmailAuth.jsx
"use client";
import { useState } from "react";
import { auth } from "@/services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  signOut,
} from "firebase/auth";

export default function EmailAuth() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const u = auth.currentUser;

      if (mode === "signup") {
        // If visiting as anonymous, LINK the anon user to email/password
        if (u && u.isAnonymous) {
          const cred = EmailAuthProvider.credential(email, pass);
          await linkWithCredential(u, cred);
        } else {
          await createUserWithEmailAndPassword(auth, email, pass);
        }
      } else {
        // For sign-in, clear anon session first so we don't conflict
        if (u && u.isAnonymous) {
          try { await signOut(auth); } catch (_) {}
        }
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) {
      // Friendly-ish error fallback
      const txt =
        (e && (e.message || e.code)) ||
        "Authentication failed. Please try again.";
      setMsg(txt);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <label>Email</label>
      <input
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
        disabled={busy}
      />

      <label>Password</label>
      <input
        type="password"
        placeholder="password"
        value={pass}
        onChange={(e)=>setPass(e.target.value)}
        required
        disabled={busy}
      />

      <button type="submit" disabled={busy}>
        {busy ? (mode === "signup" ? "Creating…" : "Signing in…") : (mode === "signup" ? "Sign up" : "Sign in")}
      </button>

      <div className="auth-options">
        <button
          type="button"
          className="link"
          onClick={()=>setMode(mode==="signup" ? "signin" : "signup")}
          disabled={busy}
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
        </button>
      </div>

      {msg && <div className="muted">{msg}</div>}
    </form>
  );
}
