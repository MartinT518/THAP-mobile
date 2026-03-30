import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Package, Trash2, Plus, X, Scan } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ScanHistory() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: history, isLoading, isError, refetch } = trpc.scanHistory.list.useQuery();
  const { data: myProducts } = trpc.products.myProducts.useQuery();

  const ownedProductIds = new Set(
    myProducts?.map((p) => p.product?.id).filter(Boolean) ?? [],
  );

  const deleteMutation = trpc.scanHistory.delete.useMutation({
    onSuccess: () => {
      utils.scanHistory.list.invalidate();
      toast.success(t("scanHistory.entryRemoved"));
    },
    onError: (err) => toast.error(err.message || t("scanHistory.deleteFailed")),
  });

  const clearMutation = trpc.scanHistory.clear.useMutation({
    onSuccess: () => {
      utils.scanHistory.list.invalidate();
      toast.success(t("scanHistory.cleared"));
    },
    onError: (err) => toast.error(err.message || t("scanHistory.clearFailed")),
  });

  const { isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: () => Promise.all([
      utils.scanHistory.list.invalidate(),
      utils.products.myProducts.invalidate(),
    ]),
  });

  const addToMyThingsMutation = trpc.products.addToMyThings.useMutation({
    onSuccess: () => {
      utils.products.myProducts.invalidate();
      toast.success(t("scanHistory.addedToMyThings"));
    },
    onError: (err) => toast.error(err.message || t("scanHistory.addFailed")),
  });

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("scanHistory.title")} onBack={() => window.history.back()} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (isError) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("scanHistory.title")} onBack={() => window.history.back()} />
        <ErrorRetry message={t("scanHistory.errorLoad")} onRetry={() => refetch()} />
      </MobileLayout>
    );
  }

  const hasHistory = history && history.length > 0;

  return (
    <MobileLayout showBottomNav={false}>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />
      <AppBar
        title={t("scanHistory.title")}
        onBack={() => window.history.back()}
        actions={
          hasHistory ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("scanHistory.clear")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("scanHistory.dialogTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("scanHistory.dialogDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("scanHistory.dialogCancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("scanHistory.dialogClearAll")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      />

      <div className="container py-6 space-y-4">
        {hasHistory ? (
          history.map((item) => {
            const product = item.product;
            if (!product) return null;
            const isOwned = ownedProductIds.has(product.id);

            return (
              <Card
                key={item.history.id}
                className="p-4 elevation-1 transition-all"
              >
                <div className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="title-medium mb-1 truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="body-small text-muted-foreground mb-2">{product.brand}</p>
                    <p className="label-small text-muted-foreground">
                      {t("scanHistory.scanned")} {new Date(item.history.scannedAt).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2 mt-3">
                      {!isOwned && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={addToMyThingsMutation.isPending}
                          onClick={() =>
                            addToMyThingsMutation.mutate({ productId: product.id })
                          }
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {t("scanHistory.addToMyThings")}
                        </Button>
                      )}
                      {isOwned && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {t("scanHistory.inMyThings")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive ml-auto"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          deleteMutation.mutate({ historyId: item.history.id })
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={Scan}
            title={t("scanHistory.emptyTitle")}
            description={t("scanHistory.emptyDescription")}
            actionLabel={t("scanHistory.emptyAction")}
            onAction={() => navigate("/scan")}
          />
        )}
      </div>
    </MobileLayout>
  );
}
