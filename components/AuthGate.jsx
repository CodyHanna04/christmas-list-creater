// components/AuthGate.jsx
"use client";
import { useEffect, useState } from "react";
import { auth, signInWithGoogle } from "@/services/firebase";
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

  if (!u) {
    return (
      <div className="center auth-card">
        <h2>Owner sign in</h2>
        <p>Sign in to create and manage your gift list.</p>

        <div className="auth-buttons">
          <button onClick={signInWithGoogle}>Continue with Google</button>
          <div className="or">or</div>

          {/* wrap the email/password form for spacing */}
          <div className="auth-form-wrapper">
            <EmailAuth />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
