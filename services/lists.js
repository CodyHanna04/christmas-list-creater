// services/lists.js
import { db } from "./firebase";
import {
  addDoc, collection, doc, getDoc, query, where, getDocs,
  serverTimestamp
} from "firebase/firestore";

export async function createList({ ownerUid, title, url }) {
  if (!url) throw new Error("URL path required");
  const exists = await getListByUrl(url);
  if (exists) throw new Error("That URL is already taken");

  const ref = await addDoc(collection(db, "lists"), {
    ownerUid,
    title,
    url, // <— use 'url'
    antiSpoiler: true,
    showClaimerNames: true,
    theme: "holiday",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getListByUrl(url) {
  const q = query(collection(db, "lists"), where("url", "==", url));
  const res = await getDocs(q);
  if (res.empty) return null;
  const d = res.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getListById(id) {
  const snap = await getDoc(doc(db, "lists", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
