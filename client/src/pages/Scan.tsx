import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type ScanState = "idle" | "scanning" | "looking_up" | "found" | "not_found";

export default function Scan() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [resolvedProductId, setResolvedProductId] = useState<number | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const lookupMutation = trpc.products.lookupByQR.useMutation({
    onSuccess: (product) => {
      setResolvedProductId(product.id);
      setState("found");

      if (isAuthenticated) {
        addToHistoryMutation.mutate({ productId: product.id });
      }
    },
    onError: (err) => {
      setState("not_found");
      toast.error(err.message || t("scan.productNotFound"));
    },
  });

  const addToHistoryMutation = trpc.scanHistory.add.useMutation({
    onError: () => {
      toast.error(t("scan.saveHistoryFailed"));
    },
  });

  const startScanning = async () => {
    try {
      setError(null);
      setState("scanning");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          setScannedCode(decodedText);
          stopScanning();
          setState("looking_up");
          lookupMutation.mutate({ payload: decodedText });
        },
        (errorMessage) => {
          console.debug("QR scan error:", errorMessage);
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("scan.cameraFallback");
      setError(message);
      setState("idle");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch {
        // ignore stop errors
      }
    }
    if (state === "scanning") {
      setState("idle");
    }
  };

  const resetScan = () => {
    setScannedCode(null);
    setResolvedProductId(null);
    setError(null);
    setState("idle");
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <MobileLayout>
      <AppBar title={t("scan.title")} onBack={() => navigate("/")} />

      <div className="container py-6 space-y-6">
        {/* Idle — start scanning prompt */}
        {state === "idle" && !error && (
          <Card className="p-8 elevation-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Camera className="w-16 h-16 text-primary" />
              </div>
              <h2 className="title-large mb-2">{t("scan.idleTitle")}</h2>
              <p className="body-medium text-muted-foreground mb-6">
                {t("scan.idleDescription")}
              </p>
              <Button
                size="lg"
                className="rounded-full w-full max-w-xs"
                onClick={startScanning}
              >
                {t("scan.startScanning")}
              </Button>
            </div>
          </Card>
        )}

        {/* Camera error */}
        {error && (
          <Card className="p-6 elevation-1 bg-destructive/10 border-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="title-medium text-destructive mb-1">{t("scan.cameraError")}</h3>
                <p className="body-medium text-destructive/90">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setError(null);
                    startScanning();
                  }}
                >
                  {t("scan.tryAgain")}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Active scanning */}
        {state === "scanning" && (
          <div className="space-y-4">
            <Card className="p-4 elevation-2 overflow-hidden">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            </Card>
            <div className="text-center">
              <p className="body-medium text-muted-foreground mb-4">
                {t("scan.positionHint")}
              </p>
              <Button variant="outline" onClick={stopScanning} className="rounded-full">
                {t("scan.cancelScanning")}
              </Button>
            </div>
          </div>
        )}

        {/* Looking up product */}
        {state === "looking_up" && (
          <Card className="p-8 elevation-1">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <h3 className="title-medium mb-2">{t("scan.lookingUp")}</h3>
              <p className="body-small text-muted-foreground">
                {t("scan.code")} <span className="font-mono text-sm">{scannedCode}</span>
              </p>
            </div>
          </Card>
        )}

        {/* Product found */}
        {state === "found" && resolvedProductId && (
          <Card className="p-6 elevation-1 bg-accent/10 border-accent">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="title-medium text-accent mb-1">{t("scan.productFound")}</h3>
                <p className="body-small text-muted-foreground mb-4">
                  {t("scan.code")} <span className="font-mono text-sm">{scannedCode}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/product/${resolvedProductId}`)}
                  >
                    {t("scan.viewProduct")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetScan();
                      startScanning();
                    }}
                  >
                    {t("scan.scanAnother")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Product not found */}
        {state === "not_found" && (
          <Card className="p-6 elevation-1 bg-destructive/10 border-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="title-medium text-destructive mb-1">{t("scan.notFoundTitle")}</h3>
                <p className="body-medium text-muted-foreground mb-2">
                  {t("scan.notFoundDescription")}
                </p>
                <p className="body-small text-muted-foreground mb-4">
                  {t("scan.code")} <span className="font-mono text-sm">{scannedCode}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      resetScan();
                      startScanning();
                    }}
                  >
                    {t("scan.scanAgain")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                    {t("common.goHome")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        {(state === "idle" || state === "scanning") && (
          <Card className="p-6 elevation-1">
            <h3 className="title-medium mb-3">{t("scan.howToScan")}</h3>
            <ul className="space-y-2 body-medium text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>{t("scan.step1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>{t("scan.step2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>{t("scan.step3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>{t("scan.step4")}</span>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
