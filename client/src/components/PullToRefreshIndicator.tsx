import { Loader2 } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: isRefreshing ? 48 : pullDistance }}
    >
      <div
        className="transition-transform duration-200"
        style={{
          opacity: isRefreshing ? 1 : progress,
          transform: `rotate(${progress * 360}deg)`,
        }}
      >
        <Loader2
          className={`w-6 h-6 text-primary ${isRefreshing ? "animate-spin" : ""}`}
        />
      </div>
    </div>
  );
}
