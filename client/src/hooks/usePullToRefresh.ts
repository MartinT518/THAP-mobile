import { useRef, useEffect, useCallback, useState } from "react";

const PULL_THRESHOLD = 80;
const RESISTANCE = 2.5;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<unknown> | void;
  isEnabled?: boolean;
}

export function usePullToRefresh({ onRefresh, isEnabled = true }: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!isEnabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && window.scrollY === 0) {
        const distance = Math.min(diff / RESISTANCE, PULL_THRESHOLD * 1.5);
        setPullDistance(distance);
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isEnabled, isRefreshing, pullDistance, handleRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return { isRefreshing, pullDistance, progress };
}
