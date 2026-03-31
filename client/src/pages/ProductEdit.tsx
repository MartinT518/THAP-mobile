import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Receipt,
  BookOpen,
  Trash2,
  Camera,
} from "lucide-react";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const DOC_TYPE_OPTIONS = [
  { value: "photo" as const, label: "Photo", icon: ImageIcon },
  { value: "receipt" as const, label: "Receipt", icon: Receipt },
  { value: "manual" as const, label: "Manual", icon: BookOpen },
  { value: "note" as const, label: "Note", icon: FileText },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProductEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id },
  );

  const { data: userProducts } = trpc.products.myProducts.useQuery();
  const userProduct = userProducts?.find(
    (p) => p.product?.id === parseInt(id!),
  );

  const instanceId = userProduct?.instance?.id;

  const { data: documents, refetch: refetchDocuments } =
    trpc.documents.list.useQuery(
      { productInstanceId: instanceId! },
      { enabled: !!instanceId },
    );

  const utils = trpc.useUtils();

  const addToMyThingsMutation = trpc.products.addToMyThings.useMutation({
    onSuccess: () => {
      toast.success(t("productEdit.addedToMyThings"));
      navigate(`/product/${id}`);
    },
    onError: (error) => {
      toast.error(error.message || t("productEdit.addFailed"));
    },
  });

  const updateProductMutation =
    trpc.products.updateProductInstance.useMutation({
      onSuccess: () => {
        toast.success(t("productEdit.updated"));
        navigate(`/product/${id}`);
      },
      onError: (error) => {
        toast.error(error.message || t("productEdit.updateFailed"));
      },
    });

  const uploadDocumentMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success(t("productEdit.docUploaded"));
      refetchDocuments();
    },
    onError: (error) => {
      toast.error(error.message || t("productEdit.uploadFailed"));
    },
  });

  const deleteDocumentMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success(t("productEdit.docRemoved"));
      refetchDocuments();
    },
    onError: (error) => {
      toast.error(error.message || t("productEdit.deleteFailed"));
    },
  });

  const [formData, setFormData] = useState({
    nickname: "",
    purchaseDate: "",
    purchasePrice: "",
    purchaseLocation: "",
    warrantyExpiry: "",
    notes: "",
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");
  const [selectedDocType, setSelectedDocType] =
    useState<(typeof DOC_TYPE_OPTIONS)[number]["value"]>("photo");

  useEffect(() => {
    if (userProduct?.instance) {
      setFormData({
        nickname: userProduct.instance.nickname || "",
        purchaseDate: userProduct.instance.purchaseDate
          ? new Date(userProduct.instance.purchaseDate)
              .toISOString()
              .split("T")[0]
          : "",
        purchasePrice: userProduct.instance.purchasePrice
          ? (userProduct.instance.purchasePrice / 100).toFixed(2)
          : "",
        purchaseLocation: userProduct.instance.purchaseLocation || "",
        warrantyExpiry: userProduct.instance.warrantyExpiry
          ? new Date(userProduct.instance.warrantyExpiry)
              .toISOString()
              .split("T")[0]
          : "",
        notes: userProduct.instance.notes || "",
        tags: (userProduct.instance.tags as string[]) || [],
      });
    }
  }, [userProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !product.product) return;

    const submitData = {
      productId: product.product.id,
      nickname: formData.nickname || undefined,
      purchaseDate: formData.purchaseDate
        ? new Date(formData.purchaseDate)
        : undefined,
      purchasePrice: formData.purchasePrice
        ? Math.round(parseFloat(formData.purchasePrice) * 100)
        : undefined,
      purchaseLocation: formData.purchaseLocation || undefined,
      warrantyExpiry: formData.warrantyExpiry
        ? new Date(formData.warrantyExpiry)
        : undefined,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    if (userProduct?.instance) {
      await updateProductMutation.mutateAsync({
        instanceId: userProduct.instance!.id,
        ...submitData,
      });
    } else {
      await addToMyThingsMutation.mutateAsync(submitData);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      toast.error(t("productEdit.unsupportedFileType"));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("productEdit.fileTooLarge"));
      return;
    }

    if (!instanceId) {
      toast.error(t("productEdit.saveFirst"));
      return;
    }

    const base64Data = await fileToBase64(file);

    await uploadDocumentMutation.mutateAsync({
      productInstanceId: instanceId,
      documentType: selectedDocType,
      fileName: file.name,
      mimeType: file.type,
      base64Data,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = (documentId: number) => {
    deleteDocumentMutation.mutate({ documentId });
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar
          title={t("productEdit.editProduct")}
          onBack={() => navigate(`/product/${id}`)}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!product) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("productEdit.editProduct")} onBack={() => navigate("/")} />
        <div className="container py-6">
          <p className="text-center text-muted-foreground">
            {t("productEdit.productNotFound")}
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar
        title={userProduct?.instance ? t("productEdit.editProduct") : t("productEdit.addToMyThings")}
        onBack={() => navigate(`/product/${id}`)}
      />

      <form onSubmit={handleSubmit} className="container py-6 space-y-6">
        <Card className="p-4 space-y-4">
          <div>
            <Label htmlFor="nickname">{t("productEdit.nickname")}</Label>
            <Input
              id="nickname"
              placeholder={t("productEdit.nicknamePlaceholder")}
              value={formData.nickname}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nickname: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="purchaseDate">{t("productEdit.purchaseDate")}</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  purchaseDate: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="purchasePrice">{t("productEdit.purchasePrice")}</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              placeholder={t("productEdit.purchasePricePlaceholder")}
              value={formData.purchasePrice}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  purchasePrice: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="purchaseLocation">{t("productEdit.purchaseLocation")}</Label>
            <Input
              id="purchaseLocation"
              placeholder={t("productEdit.purchaseLocationPlaceholder")}
              value={formData.purchaseLocation}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  purchaseLocation: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="warrantyExpiry">{t("productEdit.warrantyExpiry")}</Label>
            <Input
              id="warrantyExpiry"
              type="date"
              value={formData.warrantyExpiry}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  warrantyExpiry: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="notes">{t("productEdit.notes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("productEdit.notesPlaceholder")}
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="tags">{t("productEdit.tags")}</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                placeholder={t("productEdit.tagPlaceholder")}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                {t("productEdit.addTag")}
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Documents section — only for existing product instances */}
        {instanceId && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">{t("productEdit.documentsTitle")}</h3>

            {/* Document type selector + upload */}
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto">
                {DOC_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedDocType(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedDocType === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t(`productEdit.doc${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`)}
                    </button>
                  );
                })}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_MIME_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {(selectedDocType === "photo" || selectedDocType === "receipt") ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={uploadDocumentMutation.isPending}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    {uploadDocumentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {t("productEdit.takePhoto")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={uploadDocumentMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadDocumentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {t("productEdit.chooseFile")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploadDocumentMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadDocumentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {t("productEdit.upload")} {t(`productEdit.doc${selectedDocType.charAt(0).toUpperCase() + selectedDocType.slice(1)}`)}
                </Button>
              )}
            </div>

            {/* Existing documents */}
            {documents && documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("productEdit.documentCount", { count: documents.length })}
                </p>
                {documents.map((doc) => {
                  const isImage = doc.mimeType?.startsWith("image/");
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      {isImage && doc.fileUrl ? (
                        <img
                          src={doc.fileUrl}
                          alt={doc.title ?? t("common.document")}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-background flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-muted-foreground" />
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
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deleteDocumentMutation.isPending}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            addToMyThingsMutation.isPending || updateProductMutation.isPending
          }
        >
          {(addToMyThingsMutation.isPending ||
            updateProductMutation.isPending) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {userProduct?.instance ? t("productEdit.saveChanges") : t("productEdit.addToMyThings")}
        </Button>
      </form>
    </MobileLayout>
  );
}
