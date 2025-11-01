import { useEffect, useState } from "react";
import { auth, signInAnonIfNeeded } from "@/services/firebase";
import { getVisitorName, setVisitorName } from "./cookies";

export default function useVisitor() {
  const [uid, setUid] = useState(null);
  const [name, setNameState] = useState(getVisitorName());
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Kick anon auth immediately
    (async () => {
      await signInAnonIfNeeded();
    })();

    const unsub = auth.onAuthStateChanged((u) => {
      if (cancelled) return;
      if (u) {
        setUid(u.uid);
        setAuthed(true);
      } else {
        setUid(null);
        setAuthed(false);
      }
    });

    return () => { cancelled = true; unsub && unsub(); };
  }, []);

  function setName(n) {
    // normalize empty -> truly empty cookie so modal triggers
    const next = (n || "").trim();
    if (next) setVisitorName(next); else setVisitorName(""); // overwrite old value
    setNameState(next);
  }

  // Ready only when both anon uid and name exist
  const ready = Boolean(authed && uid && name);

  return { uid, name, setName, ready, authed };
}
