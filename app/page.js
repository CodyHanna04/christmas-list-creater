// app/page.js
"use client";
import { useState } from "react";
import AuthGate from "@/components/AuthGate";
import { auth } from "@/services/firebase";
import { createList } from "@/services/lists";

export default function Home() {
  return (
    <AuthGate>
      <CreateListForm />
    </AuthGate>
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
    <div className="container">
      <h1>Create your Christmas List</h1>
      <label>List title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />

      <label>Public URL path</label>
      <div className="row">
        <span className="muted">/l/</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>

      <button onClick={onCreate} disabled={creating || !title || !url}>
        {creating ? "Creating…" : "Create List"}
      </button>
      {msg && <div className="muted">{msg}</div>}
    </div>
  );
}
