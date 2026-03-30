import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { FeedCardSkeleton } from "@/components/ProductCardSkeleton";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Leaf,
  Bell,
  Package,
  Scan,
  LogIn,
  Rss,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import type { FeedItemType } from "@shared/types";

const TYPE_CONFIG: Record<
  FeedItemType,
  { icon: typeof Sparkles; iconClass: string; bgClass: string }
> = {
  product_added: {
    icon: Package,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  product_scanned: {
    icon: Scan,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  warranty_alert: {
    icon: Bell,
    iconClass: "text-orange-600",
    bgClass: "bg-orange-100",
  },
  care_tip: {
    icon: Sparkles,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  sustainability_insight: {
    icon: Leaf,
    iconClass: "text-green-600",
    bgClass: "bg-green-100",
  },
};

function formatRelativeTime(isoString: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t("feed.justNow");
  if (minutes < 60) return t("feed.minutesAgo", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("feed.hoursAgo", { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 7) return t("feed.daysAgo", { count: days });

  return new Date(isoString).toLocaleDateString();
}

export default function Feed() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const {
    data: feedItems,
    isLoading,
    isError,
    refetch,
  } = trpc.feed.list.useQuery(undefined, { enabled: isAuthenticated });

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-white border-b border-border">
          <div className="container py-4">
            <h1 className="text-xl font-bold">{t("feed.title")}</h1>
          </div>
        </div>

        <div className="container py-6">
          {!isAuthenticated ? (
            <EmptyState
              icon={LogIn}
              title={t("feed.signInTitle")}
              description={t("feed.signInDescription")}
            />
          ) : isError ? (
            <ErrorRetry
              message={t("feed.errorLoad")}
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <FeedCardSkeleton key={i} />
              ))}
            </div>
          ) : !feedItems || feedItems.length === 0 ? (
            <EmptyState
              icon={Rss}
              title={t("feed.emptyTitle")}
              description={t("feed.emptyDescription")}
              actionLabel={t("feed.emptyAction")}
              onAction={() => navigate("/scan")}
            />
          ) : (
            <div className="space-y-4">
              {feedItems.map((item) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;
                return (
                  <Card
                    key={item.id}
                    className={`p-4 transition-colors ${item.productId ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    onClick={
                      item.productId
                        ? () => navigate(`/product/${item.productId}`)
                        : undefined
                    }
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}
                      >
                        <Icon className={`w-5 h-5 ${config.iconClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {item.title}
                          </h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatRelativeTime(item.timestamp, t)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>{t("feed.caughtUp")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
