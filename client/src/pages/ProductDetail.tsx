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
  ChevronDown,
  Building2,
  ClipboardList,
  X,
  Play,
  FileDown,
  QrCode,
  Users,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, openExternalLink } from "@/lib/utils";
import { ProductDetailSkeleton } from "@/components/ProductCardSkeleton";
import { AppBar } from "@/components/AppBar";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import DOMPurify from "dompurify";
import { QRCodeSheet } from "@/components/QRCodeSheet";

export default function ProductDetail() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const { data: productData, isLoading, isError, refetch } = trpc.products.getById.useQuery(
    { id: productId! },
    { enabled: !!productId }
  );

  const { data: me } = trpc.auth.me.useQuery();

  const utils = trpc.useUtils();

  const instanceId = productData?.instance?.id;

  const { data: documents } = trpc.documents.list.useQuery(
    { productInstanceId: instanceId! },
    { enabled: !!instanceId },
  );

  const registrationProductId = productData?.product?.productId ?? "";
  const { data: registrationForm } = trpc.products.getRegistrationForm.useQuery(
    { productId: registrationProductId },
    {
      enabled: !!(productData && productData.instance) && !!registrationProductId,
      staleTime: 60_000,
    },
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQrSheet, setShowQrSheet] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const profilePrefilled = useRef(false);

  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setSelectedImage(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on("select", onCarouselSelect);
    return () => { carouselApi.off("select", onCarouselSelect); };
  }, [carouselApi, onCarouselSelect]);

  const feedbackMutation = trpc.products.sendFeedback.useMutation({
    onSuccess: () => {
      toast.success(t("productDetail.feedbackSuccess"));
      setFeedbackText("");
    },
    onError: (err) =>
      toast.error(err.message || t("productDetail.feedbackError")),
  });

  const shareLinkMutation = trpc.sharing.createShareLink.useMutation({
    onSuccess: async (data) => {
      try {
        await navigator.clipboard.writeText(data.shareUrl);
        toast.success(t("sharing.linkCopied"));
      } catch {
        toast.success(t("sharing.shareLinkCreated"));
      }
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!me || profilePrefilled.current) return;
    if (typeof me.name === "string" && me.name.trim()) setFeedbackName(me.name.trim());
    if (typeof me.email === "string" && me.email.trim()) setFeedbackEmail(me.email.trim());
    profilePrefilled.current = true;
  }, [me]);

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
    if (typeof navigator.share === "function") {
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
  const metadata = product.metadata as Record<string, unknown> | null;
  const images: string[] = [
    product.imageUrl,
    ...((metadata?.images as string[] | undefined) ?? []),
  ].filter((u): u is string => typeof u === "string" && u.length > 0);
  const videos = ((metadata?.videos as string[] | undefined) ?? []).filter(
    (u): u is string => typeof u === "string" && u.startsWith("http"),
  );
  const htmlContent = (metadata?.htmlContent as Array<{ title?: string; body: string }> | undefined) ?? [];
  const description = typeof metadata?.description === "string" ? metadata.description : undefined;
  const specifications = (metadata?.specifications ?? {}) as Record<string, string>;
  const careInstructions = (metadata?.careInstructions ?? []) as string[];
  const warrantyInfo = typeof metadata?.warrantyInfo === "string" ? metadata.warrantyInfo : undefined;
  const sustainabilityScore = typeof metadata?.sustainabilityScore === "number" ? metadata.sustainabilityScore : undefined;

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
        {/* Image Carousel */}
        {images.length > 0 && (
          <div className="bg-muted">
            <Carousel
              opts={{ loop: images.length > 1 }}
              setApi={setCarouselApi}
              className="w-full"
            >
              <CarouselContent className="ml-0">
                {images.map((img, idx) => (
                  <CarouselItem key={idx} className="pl-0">
                    <div className="aspect-square relative overflow-hidden">
                      <Zoom>
                        <img
                          src={img}
                          alt={`${product.name} – ${idx + 1}`}
                          className="w-full h-full object-cover cursor-zoom-in"
                        />
                      </Zoom>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => carouselApi?.scrollTo(idx)}
                    aria-label={`Go to image ${idx + 1}`}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      selectedImage === idx ? "bg-primary" : "bg-border",
                    )}
                  />
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

          {instance && registrationForm && (
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => navigate(`/product/${product.id}/register`)}
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              {t("productDetail.registerProduct")}
            </Button>
          )}

          {/* Share, QR & Share Link */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (typeof navigator.share === "function") {
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowQrSheet(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {t("productDetail.qrCode")}
              </Button>
            )}
          </div>

          {instance && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => shareLinkMutation.mutate({ productInstanceId: instance.id })}
                disabled={shareLinkMutation.isPending}
              >
                <Users className="w-4 h-4 mr-2" />
                {t("sharing.createShareLink")}
              </Button>

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
            </div>
          )}

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

          {/* Manufacturer feedback */}
          <Collapsible open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold hover:bg-muted/60 transition-colors min-h-[44px]">
                <span className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                  {t("productDetail.feedbackTitle")}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200",
                    feedbackOpen && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
                  {product.productId.startsWith("icecat-") ? (
                    <p className="text-sm text-muted-foreground pt-3">
                      {t("productDetail.feedbackCatalogOnly")}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 pt-3">
                        <Label htmlFor="producer-feedback">{t("productDetail.feedbackMessageLabel")}</Label>
                        <Textarea
                          id="producer-feedback"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder={t("productDetail.feedbackPlaceholder")}
                          className="min-h-[120px] resize-y"
                          maxLength={5000}
                          disabled={feedbackMutation.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="producer-feedback-name">{t("productDetail.feedbackNameLabel")}</Label>
                        <Input
                          id="producer-feedback-name"
                          value={feedbackName}
                          onChange={(e) => setFeedbackName(e.target.value)}
                          autoComplete="name"
                          disabled={feedbackMutation.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="producer-feedback-email">{t("productDetail.feedbackEmailLabel")}</Label>
                        <Input
                          id="producer-feedback-email"
                          type="email"
                          inputMode="email"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          autoComplete="email"
                          disabled={feedbackMutation.isPending}
                        />
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={feedbackMutation.isPending}
                        onClick={() => {
                          const trimmed = feedbackText.trim();
                          if (!trimmed) {
                            toast.error(t("productDetail.feedbackRequired"));
                            return;
                          }
                          feedbackMutation.mutate({
                            productId: product.productId,
                            feedback: trimmed,
                            name: feedbackName.trim() || undefined,
                            email: feedbackEmail.trim() || undefined,
                          });
                        }}
                      >
                        {t("productDetail.feedbackSubmit")}
                      </Button>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Video Media */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.videos")}</h3>
              </div>
              <div className="space-y-3">
                {videos.map((url, idx) => (
                  <video
                    key={idx}
                    src={url}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full rounded-lg bg-black"
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {t("productDetail.downloadVideo")}
                    </a>
                  </video>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.description")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Rich HTML Content Blocks */}
          {htmlContent.length > 0 && (
            <div className="space-y-4">
              {htmlContent.map((block, idx) => (
                <div key={idx} className="space-y-2">
                  {block.title && (
                    <h3 className="font-semibold">{block.title}</h3>
                  )}
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    onClick={(e) => {
                      const anchor = (e.target as HTMLElement).closest("a[href]");
                      if (anchor) {
                        e.preventDefault();
                        openExternalLink(anchor.getAttribute("href")!);
                      }
                    }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(block.body, {
                        ALLOWED_TAGS: [
                          "p", "br", "strong", "em", "b", "i", "u",
                          "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
                          "a", "img", "table", "thead", "tbody", "tr", "th", "td",
                          "blockquote", "code", "pre", "span", "div", "hr", "sub", "sup",
                        ],
                        ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style", "width", "height"],
                      }),
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Specifications */}
          {Object.keys(specifications).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.specifications")}</h3>
              </div>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Care Instructions */}
          {careInstructions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.careInstructions")}</h3>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <ul className="space-y-2">
                  {careInstructions.map((instruction, idx) => (
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
          {warrantyInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">{t("productDetail.warrantyInfo")}</h3>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{warrantyInfo}</p>
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
                  const isPdf = doc.mimeType === "application/pdf";
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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isPdf && doc.fileUrl && (
                          <button
                            onClick={() => setPdfViewerUrl(doc.fileUrl!)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                            aria-label={t("productDetail.viewPdf")}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sustainability Score */}
          {sustainabilityScore !== undefined && (
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="font-semibold">{t("productDetail.sustainability")}</h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("productDetail.sustainabilityScore")}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${sustainabilityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{t("productDetail.scoreFormat", { score: sustainabilityScore })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Sheet */}
      {instance && (
        <QRCodeSheet
          open={showQrSheet}
          onOpenChange={setShowQrSheet}
          productUrl={getShareUrl(product.id)}
          productName={product.name}
        />
      )}

      {/* Inline PDF Viewer */}
      {pdfViewerUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          onClick={() => setPdfViewerUrl(null)}
        >
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <h3 className="font-semibold truncate">{t("productDetail.pdfViewer")}</h3>
            <div className="flex items-center gap-2">
              <a
                href={pdfViewerUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <FileDown className="w-5 h-5" />
              </a>
              <button
                onClick={() => setPdfViewerUrl(null)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <iframe
            src={pdfViewerUrl}
            className="flex-1 w-full bg-white"
            title={t("productDetail.pdfViewer")}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </MobileLayout>
  );
}
