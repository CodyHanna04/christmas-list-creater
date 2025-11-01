// app/page.js
"use client";
import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { auth } from "@/services/firebase";
import { db } from "@/services/firebase";
import { createList } from "@/services/lists";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  collection as subcollection,
  orderBy,
  limit,
} from "firebase/firestore";

export default function Home() {
  return (
    <AuthGate>
      <DashboardHome />
    </AuthGate>
  );
}

function DashboardHome() {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    setUid(auth.currentUser?.uid ?? null);
  }, []);

  return (
    <div className="container">
      <header style={{ marginBottom: 12 }}>
        <h1>Your Christmas Lists</h1>
        <p className="muted">Preview your lists below or create a new one. 🎄</p>
      </header>

      <div className="dashboard-grid">
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

function UserLists({ uid }) {
  const [lists, setLists] = useState([]);
  const [previews, setPreviews] = useState({}); // { [listId]: items[] }

  // Subscribe to user's lists
  useEffect(() => {
    if (!uid) return;
    const qLists = query(collection(db, "lists"), where("ownerUid", "==", uid));
    const unsub = onSnapshot(qLists, (ss) => {
      const docs = ss.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLists(docs);
    });
    return () => unsub();
  }, [uid]);

  // For each list, subscribe to up to 3 items for preview
  useEffect(() => {
    const unsubs = [];

    lists.forEach((lst) => {
      const itemsRef = subcollection(doc(db, "lists", lst.id), "items");
      // Prefer most-recently updated or, as a fallback, name order
      const qItems =
        lst?.updatedAt
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

  if (!uid) {
    return <div className="muted">Loading your lists…</div>;
  }

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
        <ListCard
          key={lst.id}
          list={lst}
          previewItems={previews[lst.id] || []}
        />
      ))}
    </div>
  );
}

function ListCard({ list, previewItems }) {
  return (
    <article className="list-card">
      <div className="list-head">
        <h3 className="list-title">{list.title || "Untitled list"}</h3>
        <div className="list-slug muted">/l/{list.slug || list.url}</div>
      </div>

      {!!previewItems.length && (
        <div className="preview-items">
          {previewItems.map((it) => (
            <div key={it.id} className={`preview-row status-${it.status}`}>
              <span className={`chip chip-${it.status || "available"}`}>
                {it.status || "available"}
              </span>
              <span className="preview-name">{it.name}</span>
              {typeof it.price === "number" && (
                <span className="preview-price">
                  {formatPrice(it.price, it.currency)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!previewItems.length && (
        <div className="muted">No items yet—open the dashboard to add some.</div>
      )}

      <div className="list-actions">
        <a className="btn secondary" href={`/l/${list.slug || list.url}`} target="_blank" rel="noreferrer">
          View Public Page
        </a>
        <a className="btn" href={`/l/${list.slug || list.url}/manage`}>
          Open Dashboard
        </a>
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
  try {
    return n.toLocaleString(undefined, { style: "currency", currency });
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}
