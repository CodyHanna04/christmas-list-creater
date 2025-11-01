// services/items.js
import { db } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export async function addItem(listId, item) {
  return addDoc(collection(db, "lists", listId, "items"), {
    name: item.name || "",
    links: item.links || [], // [{platform, url}]
    price: item.price ?? null,
    currency: "USD",
    image: item.image || null,
    color: item.color || null,
    size: item.size || null,
    priority: item.priority || "medium",
    quantity: 1,
    note: item.note || null,

    status: "available",
    reservedByUid: null,
    reservedByName: null,
    reservedAt: null,
    purchasedByUid: null,
    purchasedByName: null,
    purchasedAt: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateItem(listId, itemId, patch) {
  return updateDoc(doc(db, "lists", listId, "items", itemId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function removeItem(listId, itemId) {
  return deleteDoc(doc(db, "lists", listId, "items", itemId));
}

// Client-side transaction for claim changes
export async function changeStatus(listId, itemId, action, me) {
  const ref = doc(db, "lists", listId, "items", itemId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Item missing");
    const it = snap.data();

    const now = serverTimestamp();

    if (action === "reserve") {
      if (it.status !== "available") throw new Error("Already taken");
      tx.update(ref, {
        status: "reserved",
        reservedByUid: me.uid,
        reservedByName: me.name,
        reservedAt: now,
        purchasedByUid: null,
        purchasedByName: null,
        purchasedAt: null,
        updatedAt: now,
      });
    } else if (action === "unreserve") {
      if (it.status !== "reserved" || it.reservedByUid !== me.uid)
        throw new Error("Not your reservation");
      tx.update(ref, {
        status: "available",
        reservedByUid: null,
        reservedByName: null,
        reservedAt: null,
        updatedAt: now,
      });
    } else if (action === "purchase") {
      const canBuy =
        it.status === "available" ||
        (it.status === "reserved" && it.reservedByUid === me.uid);
      if (!canBuy) throw new Error("Reserved by someone else");
      tx.update(ref, {
        status: "purchased",
        purchasedByUid: me.uid,
        purchasedByName: me.name,
        purchasedAt: now,
        updatedAt: now,
      });
    } else if (action === "unpurchase") {
      if (it.status !== "purchased" || it.purchasedByUid !== me.uid)
        throw new Error("Not your purchase");
      const backToReserved = it.reservedByUid === me.uid && it.reservedAt;
      tx.update(ref, {
        status: backToReserved ? "reserved" : "available",
        purchasedByUid: null,
        purchasedByName: null,
        purchasedAt: null,
        updatedAt: now,
      });
    } else {
      throw new Error("Unknown action");
    }
  });
}
