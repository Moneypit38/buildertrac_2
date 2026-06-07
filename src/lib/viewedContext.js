import { createContext, useContext } from "react";

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