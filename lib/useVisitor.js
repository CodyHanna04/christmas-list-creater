"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { auth, signInAnonIfNeeded } from "@/services/firebase";
import { getVisitorName, setVisitorName } from "./cookies";

export default function useVisitor(opts = {}) {
  const pathname = usePathname();

  // Infer public list page: /l/[slug] but NOT /manage under it
  const inferredPublicPage =
    !!pathname && /^\/l\/[^/]+$/.test(pathname) && !/\/manage(\/|$)/.test(pathname);

  const enableAnon = typeof opts.enableAnon === "boolean"
    ? opts.enableAnon
    : inferredPublicPage;

  const [uid, setUid] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [name, setNameState] = useState(getVisitorName());
  const [authResolved, setAuthResolved] = useState(false);
  const anonAttemptedRef = useRef(false);

  // Watch auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUid(u ? u.uid : null);
      setAuthed(!!u);
      setAuthResolved(true);
    });
    return () => unsub();
  }, []);

  // Only anon sign-in on public pages & when no user exists
  useEffect(() => {
    if (!authResolved) return;
    if (auth.currentUser) return; // respect existing (real or anon)
    if (!enableAnon) return;
    if (anonAttemptedRef.current) return;

    anonAttemptedRef.current = true;
    signInAnonIfNeeded().catch(() => {
      // ignore; page can still render read-only
    });
  }, [authResolved, enableAnon]);

  function setName(n) {
    const next = (n || "").trim();
    setVisitorName(next || ""); // overwrite (empty allowed)
    setNameState(next);
  }

  // Ready when authed + uid + visitor name exist
  const ready = Boolean(authed && uid && name);

  return { uid, name, setName, ready, authed, authResolved };
}
