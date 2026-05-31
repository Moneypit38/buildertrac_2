import { useRef, useState } from "react";

const THRESHOLD = 72;

export function usePullToRefresh(onRefresh) {
  const startY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = async (e) => {
    const delta = e.changedTouches[0].clientY - startY.current;
    const atTop = window.scrollY === 0 || document.documentElement.scrollTop === 0;
    if (delta > THRESHOLD && atTop && !refreshing) {
      setRefreshing(true);
      try { await onRefresh(); } finally { setRefreshing(false); }
    }
  };

  return { refreshing, touchHandlers: { onTouchStart, onTouchEnd } };
}