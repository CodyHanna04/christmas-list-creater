// lib/recents.js
const RECENTS_KEY = "cc_recent_lists";   // [{ url, title, ownerUid, viewedAt }]
const BOOKMARKS_KEY = "cc_bookmarks";    // [{ url, title, addedAt }]

function loadJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJSON(key, val) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function emit(type) {
  if (typeof window === "undefined") return;
  try { window.dispatchEvent(new CustomEvent(`cc:${type}-updated`)); } catch {}
}

/** Add/refresh a recent view (keeps max 3). Skips if viewer is the owner. */
export function addRecent({ url, title, ownerUid, currentUserUid }) {
  if (!url) return;
  if (ownerUid && currentUserUid && ownerUid === currentUserUid) return;

  const recents = loadJSON(RECENTS_KEY, []);
  const clean = url.replace(/^\/?l\//, "");
  const filtered = recents.filter(r => (r.url || "").replace(/^\/?l\//,"") !== clean);
  const next = [{ url: clean, title: title || clean, ownerUid: ownerUid || null, viewedAt: Date.now() }, ...filtered].slice(0, 3);
  saveJSON(RECENTS_KEY, next);
  emit("recents");
}

export function getRecents() {
  return loadJSON(RECENTS_KEY, []);
}

export function clearRecent(url) {
  const clean = (url || "").replace(/^\/?l\//, "");
  const recents = loadJSON(RECENTS_KEY, []);
  const next = recents.filter(r => (r.url || "").replace(/^\/?l\//,"") !== clean);
  saveJSON(RECENTS_KEY, next);
  emit("recents");
  return next;
}

/** Bookmarks (unchanged pattern) */
export function addBookmark({ url, title }) {
  if (!url) return getBookmarks();
  const clean = url.replace(/^\/?l\//, "");
  const bms = loadJSON(BOOKMARKS_KEY, []);
  if (bms.some(b => (b.url || "").replace(/^\/?l\//,"") === clean)) return bms;
  const next = [{ url: clean, title: title || clean, addedAt: Date.now() }, ...bms];
  saveJSON(BOOKMARKS_KEY, next);
  emit("bookmarks");
  return next;
}
export function removeBookmark(url) {
  const clean = (url || "").replace(/^\/?l\//, "");
  const bms = loadJSON(BOOKMARKS_KEY, []);
  const next = bms.filter(b => (b.url || "").replace(/^\/?l\//,"") !== clean);
  saveJSON(BOOKMARKS_KEY, next);
  emit("bookmarks");
  return next;
}
export function getBookmarks() { return loadJSON(BOOKMARKS_KEY, []); }
export function isBookmarked(url) {
  const clean = (url || "").replace(/^\/?l\//, "");
  return getBookmarks().some(b => (b.url || "").replace(/^\/?l\//,"") === clean);
}
