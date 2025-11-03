// app/page.js
"use client";
import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { auth, db } from "@/services/firebase";
import { createList } from "@/services/lists";
import {
  collection, query, where, onSnapshot, doc,
  collection as subcollection, orderBy, limit
} from "firebase/firestore";
import {
  getRecents, getBookmarks, removeBookmark, addBookmark
} from "@/lib/recents";

export default function Home() {
  return (
    <AuthGate>
      <DashboardHome />
    </AuthGate>
  );
}

function DashboardHome() {
  const [uid, setUid] = useState(null);
  const [recents, setRecents] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const refreshLocal = () => {
    setRecents(getRecents());
    setBookmarks(getBookmarks());
  };

  useEffect(() => {
    setUid(auth.currentUser?.uid ?? null);
    refreshLocal();

    // refresh when public page emits custom events
    const onRecents = () => setRecents(getRecents());
    const onBookmarks = () => setBookmarks(getBookmarks());
    window.addEventListener("cc:recents-updated", onRecents);
    window.addEventListener("cc:bookmarks-updated", onBookmarks);

    // refresh when tab becomes visible (navigate back)
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshLocal();
    };
    document.addEventListener("visibilitychange", onVisible);

    // cross-tab/localStorage updates
    const onStorage = (e) => {
      if (e.key === "cc_recent_lists") setRecents(getRecents());
      if (e.key === "cc_bookmarks") setBookmarks(getBookmarks());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("cc:recents-updated", onRecents);
      window.removeEventListener("cc:bookmarks-updated", onBookmarks);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function onRemoveBookmark(url) {
    const next = removeBookmark(url);
    setBookmarks(next);
  }
  function onAddBookmark(url, title) {
    addBookmark({ url, title });
    setBookmarks(getBookmarks());
  }

  return (
    <div className="container">
      <header style={{ marginBottom: 12 }}>
        <h1>Your Christmas Lists</h1>
        <p className="muted">Preview your lists below or create a new one. 🎄</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel">
          <h3 style={{ marginTop: 0 }}>Recently viewed</h3>
          <RecentLists recents={recents} />
        </section>

        <section className="panel">
          <h3 style={{ marginTop: 0 }}>Bookmarks</h3>
          <Bookmarks
            bookmarks={bookmarks}
            onRemove={onRemoveBookmark}
            onAdd={onAddBookmark}
          />
        </section>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <UserLists uid={uid} />
        </section>

        <section className="panel">
          <CreateListForm />
        </section>
      </div>
    </div>
  );
}

function RecentLists({ recents }) {
  if (!recents?.length) return <div className="muted">No recent lists yet.</div>;
  return (
    <div className="stack">
      {recents.map((r) => (
        <div key={r.url} className="row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="chip">/l/{r.url}</span>
            <span>{r.title}</span>
          </div>
          <a className="btn secondary" href={`/l/${r.url}`} target="_blank" rel="noreferrer">
            Open
          </a>
        </div>
      ))}
    </div>
  );
}

function Bookmarks({ bookmarks, onRemove, onAdd }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  function add(e) {
    e.preventDefault();
    const clean = url.trim().replace(/^\/?l\//, "");
    if (!clean) return;
    onAdd(clean, title.trim() || clean);
    setUrl(""); setTitle("");
  }

  return (
    <div className="stack">
      <form onSubmit={add} className="row wrap" style={{ gap: 10 }}>
        <span className="muted">/l/</span>
        <input className="grow" placeholder="public-url" value={url} onChange={(e)=>setUrl(e.target.value)} />
        <input className="grow" placeholder="Optional title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <button type="submit">Bookmark</button>
      </form>

      {!bookmarks?.length && <div className="muted">No bookmarks yet.</div>}

      {!!bookmarks?.length && (
        <div className="stack">
          {bookmarks.map((b) => (
            <div key={b.url} className="row" style={{ justifyContent: "space-between" }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="chip">/l/{b.url}</span>
                <span>{b.title}</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <a className="btn secondary" href={`/l/${b.url}`} target="_blank" rel="noreferrer">Open</a>
                <button className="btn danger" type="button" onClick={() => onRemove(b.url)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserLists({ uid }) {
  const [lists, setLists] = useState([]);
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    if (!uid) return;
    const qLists = query(collection(db, "lists"), where("ownerUid", "==", uid));
    const unsub = onSnapshot(qLists, (ss) => {
      const docs = ss.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLists(docs);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const unsubs = [];
    lists.forEach((lst) => {
      const itemsRef = subcollection(doc(db, "lists", lst.id), "items");
      const qItems = lst?.updatedAt
        ? query(itemsRef, orderBy("updatedAt", "desc"), limit(3))
        : query(itemsRef, orderBy("name"), limit(3));
      const u = onSnapshot(qItems, (ss) => {
        setPreviews((prev) => ({
          ...prev,
          [lst.id]: ss.docs.map((d) => ({ id: d.id, ...d.data() })),
        }));
      });
      unsubs.push(u);
    });
    return () => unsubs.forEach((fn) => fn && fn());
  }, [lists]);

  if (!uid) return <div className="muted">Loading your lists…</div>;

  if (!lists.length) {
    return (
      <div className="empty-state">
        <p className="muted">You don’t have any lists yet.</p>
        <p className="muted">Create one on the right to get started ✨</p>
      </div>
    );
  }

  return (
    <div className="list-grid">
      {lists.map((lst) => (
        <ListCard key={lst.id} list={lst} previewItems={previews[lst.id] || []} />
      ))}
    </div>
  );
}

function ListCard({ list, previewItems }) {
  const url = list.slug || list.url;
  return (
    <article className="list-card">
      <div className="list-head">
        <h3 className="list-title">{list.title || "Untitled list"}</h3>
        <div className="list-slug muted">/l/{url}</div>
      </div>

      {!!previewItems.length ? (
        <div className="preview-items">
          {previewItems.map((it) => (
            <div key={it.id} className={`preview-row status-${it.status}`}>
              <span className={`chip chip-${it.status || "available"}`}>{it.status || "available"}</span>
              <span className="preview-name">{it.name}</span>
              {typeof it.price === "number" && (
                <span className="preview-price">{formatPrice(it.price, it.currency)}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="muted">No items yet—open the dashboard to add some.</div>
      )}

      <div className="list-actions">
        <a className="btn secondary" href={`/l/${url}`} target="_blank" rel="noreferrer">View Public Page</a>
        <a className="btn" href={`/l/${url}/manage`}>Open Dashboard</a>
      </div>
    </article>
  );
}

function CreateListForm() {
  const [title, setTitle] = useState("My Christmas List");
  const [url, setUrl] = useState("my-2025-list");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  async function onCreate() {
    setMsg("");
    setCreating(true);
    try {
      await createList({
        ownerUid: auth.currentUser.uid,
        title: title.trim(),
        url: url.trim().toLowerCase(),
      });
      setMsg("Created! Opening your dashboard…");
      window.location.href = `/l/${url}/manage`;
    } catch (e) {
      setMsg(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="stack">
      <h2>Create a new list</h2>

      <div className="stack">
        <label>List title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="stack">
        <label>Public URL path</label>
        <div className="row">
          <span className="muted">/l/</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>

      <div className="form-actions">
        <button onClick={onCreate} disabled={creating || !title || !url}>
          {creating ? "Creating…" : "Create List"}
        </button>
      </div>

      {msg && <div className="muted">{msg}</div>}
    </div>
  );
}

function formatPrice(n, currency = "USD") {
  try { return n.toLocaleString(undefined, { style: "currency", currency }); }
  catch { return `$${Number(n).toFixed(2)}`; }
}
