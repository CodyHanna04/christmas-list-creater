// app/l/[url]/page.js
"use client";
import { use, useEffect, useState } from "react";
import { getListByUrl } from "@/services/lists";
import useVisitor from "@/lib/useVisitor"; // JS version that supports { enableAnon }
import useRealtimeItems from "@/lib/useRealtimeItems";
import NamePrompt from "@/components/NamePrompt";
import ItemCard from "@/components/ItemCard";

export default function PublicList(props) {
  // ✅ unwrap the promise params
  const { url } = use(props.params);

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enable anonymous auth ONLY on public pages
  const { uid, name, setName, ready } = useVisitor({ enableAnon: true });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!url) return;
      const l = await getListByUrl(url); // query by "url" field in Firestore
      if (!cancelled) {
        setList(l || null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const items = useRealtimeItems(list?.id);

  if (loading) return <div className="container">Loading…</div>;
  if (!list) return <div className="container">List not found.</div>;

  return (
    <>
      {/* Ask visitor name if not stored yet */}
      {!name && <NamePrompt initial="" onSave={setName} />}

      <div className="container">
        <header className="public-header">
          <h1>{list.title}</h1>
          <div className="muted">
            You are: <strong>{name || "—"}</strong>{" "}
            <button className="link" onClick={() => setName("")}>
              Change
            </button>
          </div>
        </header>

        {!items && <div>Loading items…</div>}
        {items?.length === 0 && <div>No items yet.</div>}

        <div className="grid">
          {items?.map((item) => (
            <ItemCard
              key={item.id}
              listId={list.id}
              item={item}
              me={{ uid: uid || "", name: name || "", ready }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
