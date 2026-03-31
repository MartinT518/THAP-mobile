import { useTranslation } from "react-i18next";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface QRCodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productUrl: string;
  productName: string;
}

export function QRCodeSheet({
  open,
  onOpenChange,
  productUrl,
  productName,
}: QRCodeSheetProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${productName.replace(/[^a-zA-Z0-9]/g, "_")}_qr.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error(t("productDetail.downloadQrFailed"));
    }
  }, [productName, t]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="text-center">
          <SheetTitle>{t("productDetail.qrCode")}</SheetTitle>
          <SheetDescription>{t("productDetail.qrCodeDescription")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div
            ref={canvasRef}
            className="bg-white p-4 rounded-xl shadow-sm border border-border"
          >
            <QRCodeCanvas
              value={productUrl}
              size={200}
              level="M"
              marginSize={2}
            />
          </div>

          <p className="text-sm font-medium text-center max-w-[260px] line-clamp-2">
            {productName}
          </p>

          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t("productDetail.downloadQr")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
