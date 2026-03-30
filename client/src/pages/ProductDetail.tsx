import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { ErrorRetry } from "@/components/ErrorRetry";
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
import {
  ArrowLeft,
  MessageSquare,
  Package,
  FileText,
  Shield,
  Info,
  Edit,
  Paperclip,
  Download,
  Trash2,
  Share2,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ProductDetailSkeleton } from "@/components/ProductCardSkeleton";
import { AppBar } from "@/components/AppBar";
import { toast } from "sonner";

export default function ProductDetail() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const { data: productData, isLoading, isError, refetch } = trpc.products.getById.useQuery(
    { id: productId! },
    { enabled: !!productId }
  );

  const utils = trpc.useUtils();

  const instanceId = productData?.instance?.id;

  const { data: documents } = trpc.documents.list.useQuery(
    { productInstanceId: instanceId! },
    { enabled: !!instanceId },
  );

  const removeMutation = trpc.products.removeFromMyThings.useMutation({
    onSuccess: () => {
      toast.success(t("productDetail.removeSuccess"));
      utils.products.myProducts.invalidate();
      utils.products.getById.invalidate({ id: productId! });
    },
    onError: (err) => toast.error(err.message || t("productDetail.removeFailed")),
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  function getShareUrl(id: number) {
    return `${window.location.origin}/product/${id}`;
  }

  async function handleCopyLink(id: number) {
    try {
      await navigator.clipboard.writeText(getShareUrl(id));
      setLinkCopied(true);
      toast.success(t("productDetail.linkCopied"));
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = getShareUrl(id);
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setLinkCopied(true);
      toast.success(t("productDetail.linkCopied"));
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  async function handleNativeShare(name: string, id: number) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: t("productDetail.shareDialogDescription"),
          url: getShareUrl(id),
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          toast.error(t("productDetail.nativeShareFailed"));
        }
      }
    }
  }

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productDetail.title")} onBack={() => navigate("/")} />
        <div className="container py-6">
          <ProductDetailSkeleton />
        </div>
      </MobileLayout>
    );
  }

  if (isError) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productDetail.title")} onBack={() => navigate("/")} />
        <ErrorRetry message={t("productDetail.errorLoad")} onRetry={() => refetch()} />
      </MobileLayout>
    );
  }

  if (!productData) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <p className="text-muted-foreground mb-4">{t("productDetail.notFound")}</p>
          <Button onClick={() => navigate("/")}>{t("common.goHome")}</Button>
        </div>
      </MobileLayout>
    );
  }

  const { product, instance } = productData;
  const metadata = product.metadata as any;
  const images = [product.imageUrl].filter(Boolean);

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="container flex items-center gap-4 py-4">
          <button onClick={() => navigate("/")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold flex-1 truncate">{t("productDetail.title")}</h1>
        </div>
      </div>

      <div className="pb-24">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="bg-muted">
            <div className="aspect-square relative overflow-hidden">
              <img
                src={images[selectedImage] ?? ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img ?? ""} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="container py-6 space-y-6">
          {/* Product Header */}
          <div>
            {product.brand && (
              <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
            )}
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            {product.model && (
              <p className="text-sm text-muted-foreground">{t("productDetail.model", { model: product.model })}</p>
            )}
            {product.category && (
              <span className="inline-block mt-2 px-3 py-1 bg-muted rounded-full text-sm">
                {product.category}
              </span>
            )}
          </div>

          {/* Ownership Status Badge */}
          <div className="flex items-center gap-2">
            {instance ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("productDetail.owned")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                {t("productDetail.scannedOnly")}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/product/${product.id}/edit`)}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Edit className="w-5 h-5 mr-2" />
              {instance ? t("productDetail.edit") : t("productDetail.addToMyThings")}
            </Button>
            <Button
              onClick={() => navigate(`/ai-chat/${product.id}?owned=${!!instance}`)}
              className="flex-1"
              size="lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t("productDetail.askAi")}
            </Button>
          </div>

          {/* Share & Remove Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (navigator.share) {
                  handleNativeShare(product.name, product.id);
                } else {
                  setShowShareDialog(true);
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t("productDetail.share")}
            </Button>

            {instance && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("productDetail.removeFromMyThings")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("productDetail.removeDialogTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("productDetail.removeDialogDescription", { name: product.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => removeMutation.mutate({ instanceId: instance.id })}
                      disabled={removeMutation.isPending}
                    >
                      {t("productDetail.removeFromMyThings")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Share Dialog (fallback for browsers without native share) */}
          {showShareDialog && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowShareDialog(false)}>
              <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t("productDetail.shareDialogTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("productDetail.shareDialogDescription")}</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{getShareUrl(product.id)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(product.id)}
                  >
                    {linkCopied ? t("productDetail.linkCopied") : t("productDetail.copyLink")}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowShareDialog(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          {metadata?.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.description")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {metadata.description}
              </p>
            </div>
          )}

          {/* Specifications */}
          {metadata?.specifications && Object.keys(metadata.specifications).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.specifications")}</h3>
              </div>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {Object.entries(metadata.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Care Instructions */}
          {metadata?.careInstructions && metadata.careInstructions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.careInstructions")}</h3>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <ul className="space-y-2">
                  {metadata.careInstructions.map((instruction: string, idx: number) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Warranty Information */}
          {metadata?.warrantyInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.warrantyInfo")}</h3>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{metadata.warrantyInfo}</p>
              </div>
            </div>
          )}

          {/* User Instance Info */}
          {instance && (
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="font-semibold">{t("productDetail.myProductInfo")}</h3>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {instance.purchaseDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("productDetail.purchaseDate")}</span>
                    <span className="font-medium">
                      {new Date(instance.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {instance.purchaseLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("productDetail.purchasedFrom")}</span>
                    <span className="font-medium">{instance.purchaseLocation}</span>
                  </div>
                )}
                {instance.warrantyExpiry && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("productDetail.warrantyExpires")}</span>
                    <span className="font-medium">
                      {new Date(instance.warrantyExpiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {instance.notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">{instance.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {documents && documents.length > 0 && (
            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.documents")}</h3>
              </div>
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isImage = doc.mimeType?.startsWith("image/");
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 bg-muted rounded-lg p-3"
                    >
                      {isImage && doc.fileUrl ? (
                        <img
                          src={doc.fileUrl}
                          alt={doc.title ?? t("common.document")}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.title || t("common.untitled")}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {doc.documentType}
                          {doc.createdAt &&
                            ` · ${new Date(doc.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sustainability Score */}
          {metadata?.sustainabilityScore !== undefined && (
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="font-semibold">{t("productDetail.sustainability")}</h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("productDetail.sustainabilityScore")}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${metadata.sustainabilityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{t("productDetail.scoreFormat", { score: metadata.sustainabilityScore })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
