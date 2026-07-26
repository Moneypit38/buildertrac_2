import { useRef, useState } from "react";

const THRESHOLD = 72;

export function usePullToRefresh(onRefresh) {
  const startY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = async (e) => {
    if (refreshing) return;
    const delta = e.changedTouches[0].clientY - startY.current;
    const el = e.currentTarget;
    const atTop = el ? el.scrollTop === 0 : window.scrollY === 0;
    if (delta > THRESHOLD && atTop) {
      setRefreshing(true);
      try { await onRefresh(); } finally { setRefreshing(false); }
    }
  };

  return { refreshing, touchHandlers: { onTouchStart, onTouchEnd } };
}