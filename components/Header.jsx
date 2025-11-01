// components/Header.jsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleSignOut() {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  }

  return (
    <header className="main-header">
      <div className="header-left">
        <Link href="/" className="brand">🎁 Christmas Lists</Link>
      </div>

      <div className="header-right">
        {user ? (
          <>
            <span className="signed-in-as">
              Signed in as <strong>{user.displayName || user.email || "Anonymous"}</strong>
            </span>
            <Link href="/" className="btn secondary">Dashboard</Link>
            <button className="btn danger" onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <Link href="/" className="btn">Sign in</Link>
        )}
      </div>
    </header>
  );
}
