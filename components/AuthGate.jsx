// components/AuthGate.jsx
"use client";
import { useEffect, useState } from "react";
import { auth, signInWithGoogle } from "@/services/firebase";
import { signOut } from "firebase/auth";
import EmailAuth from "./EmailAuth";

export default function AuthGate({ children }) {
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setU(user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="center">Loading…</div>;

  // If not signed in OR signed in anonymously, show owner sign-in UI
  const isAnon = !!u && u.isAnonymous;
  if (!u || isAnon) {
    async function switchAccount() {
      try {
        // Clears anonymous visitor session so owner sign-in works cleanly
        await signOut(auth);
      } catch (_) {}
    }

    async function handleGoogle() {
      // Make Google sign-in resilient if an anon session is active
      if (auth.currentUser?.isAnonymous) {
        try { await signOut(auth); } catch (_) {}
      }
      return signInWithGoogle();
    }

    return (
      <div className="center auth-card">
        <h2>Owner sign in</h2>
        <p>Sign in to create and manage your gift list.</p>

        {isAnon && (
          <div className="badge" style={{ margin: "8px 0 4px" }}>
            You’re currently signed in as a <strong>visitor</strong>.
          </div>
        )}

        <div className="auth-buttons">
          <button onClick={handleGoogle}>Continue with Google</button>
          <div className="or">or</div>

          {/* Email/password login form */}
          <div className="auth-form-wrapper">
            {/* Tip shown only when an anon session is present */}
            {isAnon && (
              <p className="muted" style={{ margin: "0 0 8px" }}>
                To sign in with email/password, first{" "}
                <button className="link" type="button" onClick={switchAccount}>
                  switch accounts
                </button>
                .
              </p>
            )}
            <EmailAuth />
          </div>

          {/* Convenience button to clear anon session explicitly */}
          {isAnon && (
            <button type="button" className="secondary" onClick={switchAccount}>
              Switch accounts (end visitor session)
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fully authenticated (non-anonymous) owner
  return <>{children}</>;
}
