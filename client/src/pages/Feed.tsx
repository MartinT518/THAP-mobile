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
  Newspaper,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { openExternalLink } from "@/lib/utils";
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
  brand_news: {
    icon: Newspaper,
    iconClass: "text-sky-700",
    bgClass: "bg-sky-100",
  },
  brand_commercial: {
    icon: Megaphone,
    iconClass: "text-violet-700",
    bgClass: "bg-violet-100",
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
                const isBrandItem =
                  item.type === "brand_news" || item.type === "brand_commercial";
                const openExternal = item.linkUrl
                  ? () => openExternalLink(item.linkUrl!)
                  : undefined;
                const goProduct =
                  item.productId && !item.linkUrl
                    ? () => navigate(`/product/${item.productId}`)
                    : undefined;
                const onCardClick = openExternal ?? goProduct;
                return (
                  <Card
                    key={item.id}
                    className={`p-4 transition-colors overflow-hidden ${
                      onCardClick ? "cursor-pointer hover:bg-muted/50" : ""
                    }`}
                    onClick={onCardClick}
                  >
                    {item.feedImageUrl ? (
                      <div className="-mx-4 -mt-4 mb-3 aspect-[2/1] max-h-36 bg-muted">
                        <img
                          src={item.feedImageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}
                      >
                        <Icon className={`w-5 h-5 ${config.iconClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            {isBrandItem ? (
                              <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                                {item.type === "brand_news"
                                  ? t("feed.badgeNews")
                                  : t("feed.badgeCommercial")}
                              </span>
                            ) : null}
                            <h3 className="font-semibold text-sm">
                              {item.title}
                            </h3>
                            {item.brand ? (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t("feed.fromBrand", { brand: item.brand })}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatRelativeTime(item.timestamp, t)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.content}
                        </p>
                        {item.linkUrl ? (
                          <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                            {t("feed.openLink")}
                          </p>
                        ) : null}
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
