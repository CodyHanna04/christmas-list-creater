// app/l/[url]/page.js
"use client";
import { use, useEffect, useRef, useState } from "react";
import { getListByUrl } from "@/services/lists";
import useRealtimeItems from "@/lib/useRealtimeItems";
import ItemCard from "@/components/ItemCard";
import { auth, signInWithGoogle } from "@/services/firebase";
import {
  addRecent, addBookmark, removeBookmark, isBookmarked
} from "@/lib/recents";

function InlineSignIn() {
  return (
    <div className="panel" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
      <div className="muted">Sign in to reserve or mark purchased.</div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={signInWithGoogle}>Continue with Google</button>
        <a href="/" className="btn secondary">Email / Password</a>
      </div>
    </div>
  );
}

export default function PublicList(props) {
  const { url } = use(props.params);
  const [list, setList] = useState(undefined); // undefined loading, null not found
  const [user, setUser] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const recordedRef = useRef(false); // ensure we add recent only once per view

  // auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // load list by public url
  useEffect(() => {
    let cancelled = false;
    recordedRef.current = false; // reset guard when url changes
    (async () => {
      if (!url) return;
      const l = await getListByUrl(url);
      if (!cancelled) setList(l || null);
    })();
    return () => { cancelled = true; };
  }, [url]);

  // record "recent" on view (skip if viewer is owner), once
  useEffect(() => {
    if (!list || recordedRef.current) return;
    recordedRef.current = true;

    try {
      const currentUserUid = user && !user.isAnonymous ? user.uid : null;
      const effectiveUrl = (list.url || url || "").replace(/^\/?l\//, "");
      addRecent({
        url: effectiveUrl,
        title: list.title || effectiveUrl,
        ownerUid: list.ownerUid || null,
        currentUserUid,
      });
      setBookmarked(isBookmarked(effectiveUrl));
    } catch {}
  }, [list, user, url]);

  const items = useRealtimeItems(list?.id);

  if (list === undefined) return <div className="container">Loading…</div>;
  if (list === null) return <div className="container">List not found.</div>;

  const isAuthed = !!user && !user.isAnonymous;
  const me = {
    uid: isAuthed ? user.uid : "",
    name: isAuthed ? (user.displayName || user.email || "User") : "",
    ready: isAuthed,
  };

  function toggleBookmark() {
    const u = (list.url || url || "").replace(/^\/?l\//, "");
    if (bookmarked) {
      removeBookmark(u);
      setBookmarked(false);
    } else {
      addBookmark({ url: u, title: list.title || u });
      setBookmarked(true);
    }
  }

  return (
    <div className="container">
      <header className="public-header">
        <h1>{list.title}</h1>
        <div className="row" style={{ gap: 10 }}>
          <button
            className={bookmarked ? "btn secondary" : "btn"}
            onClick={toggleBookmark}
            title={bookmarked ? "Remove bookmark" : "Bookmark this list"}
          >
            {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
          <div className="muted">
            {isAuthed ? (
              <>Signed in as <strong>{user.displayName || user.email}</strong></>
            ) : (
              <>Browsing as guest</>
            )}
          </div>
        </div>
      </header>

      {!isAuthed && <InlineSignIn />}

      {!items && <div>Loading items…</div>}
      {items?.length === 0 && <div>No items yet.</div>}

      <div className="grid">
        {items?.map((item) => (
          <ItemCard
            key={item.id}
            listId={list.id}
            item={item}
            me={me}
          />
        ))}
      </div>
    </div>
  );
}
