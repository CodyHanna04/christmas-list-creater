// app/l/[url]/page.js
"use client";
import { use, useEffect, useState } from "react";
import { getListByUrl } from "@/services/lists";
import useVisitor from "@/lib/useVisitor";
import useRealtimeItems from "@/lib/useRealtimeItems";
import NamePrompt from "@/components/NamePrompt";
import ItemCard from "@/components/ItemCard";

export default function PublicList(props) {
  const { url } = use(props.params); // ✅ unwrap params
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const { uid, name, setName, ready } = useVisitor();

  useEffect(() => {
    (async () => {
      if (!url) return;
      const l = await getListByUrl(url);
      setList(l);
      setLoading(false);
    })();
  }, [url]);

  const items = useRealtimeItems(list?.id);
  const me = { uid: uid || "", name: name || "", ready };

  if (loading) return <div className="container">Loading…</div>;
  if (!list) return <div className="container">List not found.</div>;

  return (
    <>
      {!name && <NamePrompt initial="" onSave={setName} />}

      <div className="container">
        <header className="public-header">
          <h1>{list.title}</h1>
          <div className="muted">
            You are: <strong>{name || "—"}</strong>{" "}
            <button className="link" onClick={() => setName("")}>Change</button>
          </div>
        </header>

        {!items && <div>Loading items…</div>}
        {items?.length === 0 && <div>No items yet.</div>}

        <div className="grid">
        {items?.map((item) => (
          <ItemCard key={item.id} listId={list.id} item={item} me={{ uid, name, ready }} />
        ))}
      </div>
      </div>
    </>
  );
}
