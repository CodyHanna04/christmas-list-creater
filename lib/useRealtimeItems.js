// lib/useRealtimeItems.js
import { useEffect, useState } from "react";
import { db } from "@/services/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function useRealtimeItems(listId) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!listId) return;
    const q = query(
      collection(db, "lists", listId, "items"),
      orderBy("priority", "asc"),
      // you can add another orderBy like name later
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    return () => unsub();
  }, [listId]);

  return items;
}
