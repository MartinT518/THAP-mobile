import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MoreVertical,
  LayoutGrid,
  List,
  Tag,
  X,
  Package,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import {
  ProductCardSkeleton,
  ScanHistoryCardSkeleton,
} from "@/components/ProductCardSkeleton";
import { AnimatedCard } from "@/components/AnimatedCard";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";

type ViewMode = "grid" | "list";

export default function Home() {
  const { t } = useTranslation();
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const {
    data: myProducts,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = trpc.products.myProducts.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const {
    data: scanHistory,
    isLoading: scanHistoryLoading,
    isError: scanHistoryError,
    refetch: refetchScanHistory,
  } = trpc.scanHistory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const seedDemoMutation = trpc.demo.seedData.useMutation({
    onSuccess: () => {
      toast.success(t("home.demoAdded"));
      window.location.reload();
    },
    onError: (err) => toast.error(err.message || t("home.demoFailed")),
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchProducts(), refetchScanHistory()]);
  }, [refetchProducts, refetchScanHistory]);

  const { isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    isEnabled: isAuthenticated,
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const categories = useMemo(() => {
    if (!myProducts?.length) return ["All"];
    const cats = new Set<string>();
    for (const item of myProducts) {
      if (item.product?.category) cats.add(item.product.category);
    }
    return ["All", ...Array.from(cats).sort()];
  }, [myProducts]);

  const allTags = useMemo(() => {
    if (!myProducts?.length) return [];
    const tagSet = new Set<string>();
    for (const item of myProducts) {
      const tags = item.instance.tags as string[] | null;
      if (tags) tags.forEach((tag) => tagSet.add(tag));
    }
    return Array.from(tagSet).sort();
  }, [myProducts]);

  const filteredProducts = useMemo(() => {
    if (!myProducts) return [];
    return myProducts.filter((item) => {
      if (!item.product) return false;
      if (
        selectedCategory !== "All" &&
        item.product.category !== selectedCategory
      )
        return false;
      if (selectedTag) {
        const tags = item.instance.tags as string[] | null;
        if (!tags?.includes(selectedTag)) return false;
      }
      return true;
    });
  }, [myProducts, selectedCategory, selectedTag]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <h1 className="text-4xl font-bold mb-4">thap.</h1>
          <p className="text-muted-foreground mb-8 text-center">
            {t("home.tagline")}
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            size="lg"
            className="rounded-full"
          >
            {t("common.signIn")}
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">thap.</h1>
          <button className="p-2">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Scan History Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t("home.scanHistory")}</h2>
            <button
              onClick={() => navigate("/scan-history")}
              className="text-sm font-medium"
            >
              {t("home.showAll")}
            </button>
          </div>

          {scanHistoryLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <ScanHistoryCardSkeleton key={i} />
              ))}
            </div>
          ) : scanHistoryError ? (
            <ErrorRetry message={t("home.scanHistoryError")} onRetry={() => refetchScanHistory()} />
          ) : !scanHistory || scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t("home.noScansYet")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
              >
                {t("home.loadDemoProducts")}
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {scanHistory.map((item) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div
                    key={item.history.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="flex-shrink-0 w-36 cursor-pointer"
                  >
                    <div className="w-36 h-40 bg-muted rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width={144}
                          height={160}
                        />
                      ) : (
                        <div className="text-4xl" aria-hidden="true">📦</div>
                      )}
                    </div>
                    <p className="text-sm font-medium line-clamp-2 leading-tight">
                      {product.name}
                      {product.model && ` | ${product.model}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Things Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t("home.myThings")}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-black text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label={t("home.gridView")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-black text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label={t("home.listView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-black text-white"
                    : "bg-white border border-border text-foreground hover:bg-muted"
                }`}
              >
                {category === "All" ? t("home.categoryAll") : category}
              </button>
            ))}
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors whitespace-nowrap"
                >
                  <X className="w-3 h-3" />
                  {t("common.clearTag")}
                </button>
              )}
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {productsError ? (
            <ErrorRetry message={t("home.productsError")} onRetry={() => refetchProducts()} />
          ) : productsLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : !myProducts || myProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("home.emptyTitle")}
              description={t("home.emptyDescription")}
              actionLabel={t("home.emptyAction")}
              onAction={() => navigate("/scan")}
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("home.noMatchTitle")}
              description={
                selectedTag
                  ? t("home.noMatchWithTag", { tag: selectedTag })
                  : t("home.noMatchCategory", { category: selectedCategory })
              }
              actionLabel={t("common.clearFilters")}
              onAction={() => {
                setSelectedCategory("All");
                setSelectedTag(null);
              }}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((item, idx) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <AnimatedCard
                    key={item.instance.id}
                    index={idx}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden flex items-center justify-center relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width={200}
                          height={200}
                        />
                      ) : (
                        <span className="text-5xl" aria-hidden="true">📦</span>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/90 text-white">
                        {t("home.owned")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {product.brand || t("common.unknownBrand")}
                    </p>
                    <p className="text-sm font-semibold line-clamp-2 leading-tight">
                      {product.name}
                    </p>
                  </AnimatedCard>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((item) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <button
                    key={item.instance.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-full bg-white border border-border rounded-lg p-3 hover:bg-muted transition-colors text-left flex gap-3"
                  >
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width={64}
                          height={64}
                        />
                      ) : (
                        <span className="text-2xl" aria-hidden="true">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {product.brand || t("common.unknownBrand")}
                      </p>
                      <p className="text-sm font-semibold line-clamp-2 leading-tight mb-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {product.category && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {product.category}
                          </span>
                        )}
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t("home.owned")}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </MobileLayout>
  );
}
