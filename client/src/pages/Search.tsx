import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Search as SearchIcon,
  X,
  Tag,
  Loader2,
  CheckCircle,
  Plus,
  ExternalLink,
  Globe,
} from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

function SearchResultSkeleton() {
  return (
    <div className="w-full bg-white border border-border rounded-lg p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

function MyProductsTab() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  const isLoading = productsLoading || scanHistoryLoading;
  const isError = productsError || scanHistoryError;

  const { data: orderedTags } = trpc.tags.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const allTags = useMemo(() => {
    if (orderedTags?.length) return orderedTags.map((t) => t.name);
    if (!myProducts?.length) return [];
    const tagSet = new Set<string>();
    for (const item of myProducts) {
      const tags = item.instance.tags as string[] | null;
      if (tags) tags.forEach((tag) => tagSet.add(tag));
    }
    return Array.from(tagSet).sort();
  }, [orderedTags, myProducts]);

  const allProducts = useMemo(
    () => [
      ...(myProducts?.map((p) => ({
        ...p.product,
        isOwned: true,
        tags: (p.instance.tags as string[] | null) ?? [],
      })) ?? []),
      ...(scanHistory
        ?.map((h) => ({
          ...h.product,
          isOwned: false,
          tags: [] as string[],
        }))
        .filter((p) => p.id != null) ?? []),
    ],
    [myProducts, scanHistory],
  );

  const filteredProducts = useMemo(() => {
    let results = allProducts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.model?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query),
      );
    }

    if (selectedTag) {
      results = results.filter((product) => product.tags.includes(selectedTag));
    }

    const seen = new Set<number>();
    return results.filter((product) => {
      if (!product.id || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }, [allProducts, searchQuery, selectedTag]);

  const showResults = searchQuery.trim() || selectedTag;

  return (
    <div>
      <div className="space-y-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
      </div>

      {isError ? (
        <ErrorRetry
          message={t("search.errorLoad")}
          onRetry={() => {
            refetchProducts();
            refetchScanHistory();
          }}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </div>
      ) : !showResults ? (
        <EmptyState
          icon={SearchIcon}
          title={t("search.emptyTitle")}
          description={t("search.emptyDescription")}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={t("search.noResultsTitle")}
          description={t("search.noResultsDescription")}
          actionLabel={selectedTag ? t("search.clearTagFilter") : undefined}
          onAction={selectedTag ? () => setSelectedTag(null) : undefined}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("search.resultCount", { count: filteredProducts.length })}
          </p>
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="w-full bg-white border border-border rounded-lg p-4 hover:bg-muted transition-colors text-left"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {product.brand && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.brand}
                      </p>
                    )}
                    <p className="font-semibold text-sm line-clamp-2 mb-1">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {product.category && (
                        <span className="text-xs text-muted-foreground">
                          {product.category}
                        </span>
                      )}
                      {product.isOwned ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t("search.owned")}
                        </span>
                      ) : (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {t("search.scanned")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExternalSearchTab() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const utils = trpc.useUtils();

  const searchMutation = trpc.products.searchExternal.useMutation();

  const addToThingsMutation = trpc.products.addToMyThings.useMutation({
    onSuccess: () => {
      toast.success(t("search.addedToMyThings"));
      utils.products.myProducts.invalidate();
    },
    onError: () => {
      toast.error(t("search.addFailed"));
    },
  });

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    searchMutation.mutate({ query: trimmed });
  };

  const result = searchMutation.data;
  const products = result?.products ?? [];

  const sourceLabel = (source: string) => {
    if (source === "icecat") return t("search.fromIcecat");
    if (source === "tings") return t("search.fromTings");
    return t("search.fromLocal");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.externalPlaceholder")}
            className="pl-10 pr-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                searchMutation.reset();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={query.trim().length < 2 || searchMutation.isPending}
        >
          {searchMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t("search.searchExternal")
          )}
        </Button>
      </div>

      {searchMutation.isPending && (
        <Card className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("search.searchingExternal")}
            </p>
          </div>
        </Card>
      )}

      {searchMutation.isError && (
        <Card className="p-6 border-destructive/30 bg-destructive/5">
          <p className="text-sm text-destructive text-center">
            {searchMutation.error.data?.code === "NOT_FOUND"
              ? t("search.externalNotFound")
              : t("search.externalError")}
          </p>
        </Card>
      )}

      {products.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-primary">
              {t("search.resultCount", { count: products.length })}
            </p>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
              {result ? sourceLabel(result.source) : ""}
            </span>
          </div>

          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {product.brand && (
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {product.brand}
                    </p>
                  )}
                  <p className="font-semibold text-sm line-clamp-2 mb-1">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {product.category && (
                      <span className="text-xs text-muted-foreground">
                        {product.category}
                      </span>
                    )}
                    {product.barcode && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {product.barcode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  {t("search.viewProduct")}
                </Button>
                {isAuthenticated && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      addToThingsMutation.mutate({ productId: product.id })
                    }
                    disabled={addToThingsMutation.isPending}
                  >
                    {addToThingsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1.5" />
                    )}
                    {t("search.addToMyThings")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!searchMutation.isPending && !searchMutation.isError && products.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title={t("search.externalEmptyTitle")}
          description={t("search.externalEmptyDescription")}
        />
      )}
    </div>
  );
}

function GoogleSearchTab() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.googlePlaceholder")}
            className="pl-10 pr-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={!query.trim()}>
          {t("search.googleSearch")}
        </Button>
      </div>

      <EmptyState
        icon={Globe}
        title={t("search.googleEmptyTitle")}
        description={t("search.googleEmptyDescription")}
      />
    </div>
  );
}

export default function Search() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-white border-b border-border">
          <div className="container py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold">{t("nav.search")}</h1>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>

        <div className="container py-4">
          <Tabs defaultValue="my-products">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="my-products" className="flex-1">
                <SearchIcon className="w-4 h-4 mr-1.5" />
                {t("search.tabMyProducts")}
              </TabsTrigger>
              <TabsTrigger value="external" className="flex-1">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                {t("search.tabExternalSearch")}
              </TabsTrigger>
              <TabsTrigger value="google" className="flex-1">
                <Globe className="w-4 h-4 mr-1.5" />
                {t("search.tabGoogleSearch")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-products">
              <MyProductsTab />
            </TabsContent>
            <TabsContent value="external">
              <ExternalSearchTab />
            </TabsContent>
            <TabsContent value="google">
              <GoogleSearchTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </MobileLayout>
  );
}
