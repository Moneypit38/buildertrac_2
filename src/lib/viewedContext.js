import { createContext, useContext, useEffect, useState } from "react";

export const ViewedContext = createContext({ photos: null, docs: null });

export function useViewedTimes() {
  return useContext(ViewedContext);
}

/**
 * Returns true if an item is "new" — created within 72h AND after the last viewed timestamp.
 * Pass the lastViewed timestamp from ViewedContext so it's driven by React state.
 */
export function isNewItem(createdDate, lastViewed) {
  const now = new Date();
  const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const created = new Date(createdDate);
  if (created < cutoff72h) return false;
  if (!lastViewed) return true;
  return created > new Date(lastViewed);
}

// --- Per-photo seen tracking ---
const SEEN_PHOTOS_KEY = "seenPhotoIds";

export function getSeenPhotoIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_PHOTOS_KEY) || "[]")); }
  catch { return new Set(); }
}

export function markPhotoSeen(photoId) {
  const ids = getSeenPhotoIds();
  if (ids.has(photoId)) return;
  ids.add(photoId);
  localStorage.setItem(SEEN_PHOTOS_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event("photos-seen-updated"));
}

// --- Per-document seen tracking (same idea as photos: opening it clears its alert) ---
const SEEN_DOCS_KEY = "seenDocIds";

export function getSeenDocIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_DOCS_KEY) || "[]")); }
  catch { return new Set(); }
}

export function markDocSeen(docId) {
  const ids = getSeenDocIds();
  if (ids.has(docId)) return;
  ids.add(docId);
  localStorage.setItem(SEEN_DOCS_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event("docs-seen-updated"));
}

// True if the item was uploaded in the last 72h and hasn't been opened yet.
export function isUnseenRecent(createdDate, seenIds, id) {
  const cutoff72h = Date.now() - 72 * 60 * 60 * 1000;
  return new Date(createdDate).getTime() > cutoff72h && !seenIds.has(id);
}

// Re-render a component whenever photos/docs are marked seen.
export function useSeenIds() {
  const [photoIds, setPhotoIds] = useState(() => getSeenPhotoIds());
  const [docIds, setDocIds] = useState(() => getSeenDocIds());
  useEffect(() => {
    const onPhotos = () => setPhotoIds(getSeenPhotoIds());
    const onDocs = () => setDocIds(getSeenDocIds());
    window.addEventListener("photos-seen-updated", onPhotos);
    window.addEventListener("docs-seen-updated", onDocs);
    return () => {
      window.removeEventListener("photos-seen-updated", onPhotos);
      window.removeEventListener("docs-seen-updated", onDocs);
    };
  }, []);
  return { seenPhotoIds: photoIds, seenDocIds: docIds };
}