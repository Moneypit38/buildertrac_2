/**
 * Tracks when the user last viewed each section using localStorage.
 * Keys: lastViewed_docs, lastViewed_photos, lastViewed_projects, lastViewed_notes
 */

const KEYS = {
  docs: "lastViewed_docs",
  photos: "lastViewed_photos",
  projects: "lastViewed_projects",
  notes: "lastViewed_notes",
  tasks: "lastViewed_tasks",
};

export function getLastViewed(section) {
  const val = localStorage.getItem(KEYS[section]);
  return val ? new Date(val) : null;
}

export function markViewed(section) {
  // Set to a time 10 seconds in the future to ensure all currently-loaded items are covered
  const ts = new Date(Date.now() + 10000).toISOString();
  localStorage.setItem(KEYS[section], ts);
}

/**
 * Returns true if an item is "new" — created within 72h AND after the last viewed timestamp.
 */
export function isNew(createdDate, section) {
  const now = new Date();
  const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const created = new Date(createdDate);

  if (created < cutoff72h) return false; // older than 72h, never counts

  const lastViewed = getLastViewed(section);
  if (!lastViewed) return true; // never viewed → everything in 72h window is new

  return created > lastViewed;
}