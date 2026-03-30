import { Card } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-full" />
      </div>
    </Card>
  );
}

export function FeedCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-4/5" />
        </div>
      </div>
    </Card>
  );
}

export function SettingsItemSkeleton() {
  return (
    <div className="w-full flex items-center gap-4 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="w-5 h-5 bg-muted rounded" />
    </div>
  );
}

export function ScanHistoryCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36 animate-pulse">
      <div className="w-36 h-40 bg-muted rounded-lg mb-2" />
      <div className="h-3 bg-muted rounded w-3/4 mb-1" />
      <div className="h-3 bg-muted rounded w-full" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Image skeleton */}
      <div className="w-full aspect-square bg-muted rounded-lg" />
      
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-6 bg-muted rounded w-2/3" />
      </div>
      
      {/* Buttons skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded flex-1" />
        <div className="h-10 bg-muted rounded flex-1" />
      </div>
      
      {/* Sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 bg-muted rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
