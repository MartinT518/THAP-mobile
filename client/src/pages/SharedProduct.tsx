import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { ErrorRetry } from "@/components/ErrorRetry";
import { AppBar } from "@/components/AppBar";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Users, Package } from "lucide-react";

export default function SharedProduct() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/share/:token");
  const token = params?.token ?? "";

  const { data, isLoading, isError, refetch } = trpc.sharing.getByToken.useQuery(
    { token },
    { enabled: !!token },
  );

  const acceptMutation = trpc.sharing.accept.useMutation({
    onSuccess: (result) => {
      toast.success(t("sharing.shareAccepted"));
      navigate(`/product/${result.productId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const dismissMutation = trpc.sharing.dismiss.useMutation({
    onSuccess: () => {
      toast.success(t("sharing.shareDismissed"));
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("sharing.sharedProduct")} onBack={() => navigate("/")} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (isError || !data) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("sharing.sharedProduct")} onBack={() => navigate("/")} />
        <ErrorRetry message={t("sharing.shareNotFound")} onRetry={() => refetch()} />
      </MobileLayout>
    );
  }

  const { product, share, senderName } = data;
  const isAlreadyUsed = share.status !== "pending";
  const isPending = !acceptMutation.isPending && !dismissMutation.isPending;

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("sharing.sharedProduct")} onBack={() => navigate("/")} />

      <div className="container py-6 space-y-6">
        {/* Product Preview Card */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          {product.imageUrl && (
            <div className="aspect-[4/3] bg-muted overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-5 space-y-3">
            {product.brand && (
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            )}
            <h2 className="text-xl font-bold">{product.name}</h2>
            {product.category && (
              <span className="inline-block px-3 py-1 bg-muted rounded-full text-sm">
                {product.category}
              </span>
            )}
          </div>
        </div>

        {/* Shared By Info */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {t("sharing.sharedBy", { name: senderName ?? t("sharing.someone") })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("sharing.sharedProductDescription")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isAlreadyUsed ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("sharing.alreadyUsed")}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
              {t("common.goHome")}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => acceptMutation.mutate({ token })}
              disabled={!isPending}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t("sharing.acceptShare")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => dismissMutation.mutate({ token })}
              disabled={!isPending}
            >
              <XCircle className="w-5 h-5 mr-2" />
              {t("sharing.dismissShare")}
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
