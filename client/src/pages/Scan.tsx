import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { useCallback, useRef, useState } from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type BarcodeFormat =
  | "qr_code"
  | "ean_13"
  | "ean_8"
  | "upc_a"
  | "upc_e"
  | "code_128"
  | "code_39"
  | "itf"
  | "data_matrix";

type ScanState = "scanning" | "looking_up" | "found" | "not_found" | "error";

const SCAN_FORMATS: BarcodeFormat[] = [
  "qr_code",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "data_matrix",
];

export default function Scan() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [state, setState] = useState<ScanState>("scanning");
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [resolvedProductId, setResolvedProductId] = useState<number | null>(null);
  const processingRef = useRef(false);

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
      processingRef.current = false;
    },
  });

  const addToHistoryMutation = trpc.scanHistory.add.useMutation({
    onError: () => {
      toast.error(t("scan.saveHistoryFailed"));
    },
  });

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (processingRef.current || detectedCodes.length === 0) return;
      const code = detectedCodes[0].rawValue;
      if (!code) return;

      processingRef.current = true;
      setScannedCode(code);
      setState("looking_up");
      lookupMutation.mutate({ payload: code });
    },
    [lookupMutation],
  );

  const handleError = useCallback(
    (err: unknown) => {
      console.error("Scanner error:", err);
      const raw =
        err instanceof Error ? err.message : typeof err === "string" ? err : "";
      const lower = raw.toLowerCase();

      if (lower.includes("notallowed") || lower.includes("permission")) {
        setError(t("scan.cameraPermissionDenied"));
      } else if (
        lower.includes("notfound") ||
        lower.includes("requested device not found")
      ) {
        setError(t("scan.cameraNotFound"));
      } else if (
        lower.includes("notreadable") ||
        lower.includes("could not start")
      ) {
        setError(t("scan.cameraInUse"));
      } else if (raw) {
        setError(raw);
      } else {
        setError(t("scan.cameraFallback"));
      }
      setState("error");
    },
    [t],
  );

  const resetScan = () => {
    setScannedCode(null);
    setResolvedProductId(null);
    setError(null);
    processingRef.current = false;
    setState("scanning");
  };

  return (
    <MobileLayout>
      <AppBar title={t("scan.title")} onBack={() => navigate("/")} />

      <div className="container py-6 space-y-6">
        {/* Sign-in hint for unauthenticated users */}
        {!isAuthenticated && state === "scanning" && (
          <Card className="p-4 elevation-1 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="body-small text-muted-foreground flex-1">
                {t("scan.signInHint")}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full flex-shrink-0"
                onClick={() => navigate("/login")}
              >
                {t("common.signIn")}
              </Button>
            </div>
          </Card>
        )}

        {/* Camera error */}
        {state === "error" && error && (
          <Card className="p-6 elevation-1 bg-destructive/10 border-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="title-medium text-destructive mb-1">
                  {t("scan.cameraError")}
                </h3>
                <p className="body-medium text-destructive/90">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={resetScan}
                >
                  {t("scan.tryAgain")}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Active scanning — camera starts automatically */}
        {state === "scanning" && (
          <Card className="overflow-hidden elevation-2">
            <div className="aspect-[3/4] w-full">
              <Scanner
                formats={SCAN_FORMATS}
                onScan={handleScan}
                onError={handleError}
                allowMultiple={false}
                scanDelay={300}
                components={{ finder: true, torch: true }}
                styles={{ container: { width: "100%", height: "100%" } }}
                constraints={{ facingMode: "environment" }}
              />
            </div>
          </Card>
        )}

        {state === "scanning" && (
          <p className="body-medium text-muted-foreground text-center">
            {t("scan.positionHint")}
          </p>
        )}

        {/* Looking up product */}
        {state === "looking_up" && (
          <Card className="p-8 elevation-1">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <h3 className="title-medium mb-2">{t("scan.lookingUp")}</h3>
              <p className="body-small text-muted-foreground">
                {t("scan.code")}{" "}
                <span className="font-mono text-sm">{scannedCode}</span>
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
                <h3 className="title-medium text-accent mb-1">
                  {t("scan.productFound")}
                </h3>
                <p className="body-small text-muted-foreground mb-4">
                  {t("scan.code")}{" "}
                  <span className="font-mono text-sm">{scannedCode}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/product/${resolvedProductId}`)}
                  >
                    {t("scan.viewProduct")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetScan}>
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
                <h3 className="title-medium text-destructive mb-1">
                  {t("scan.notFoundTitle")}
                </h3>
                <p className="body-medium text-muted-foreground mb-2">
                  {t("scan.notFoundDescription")}
                </p>
                <p className="body-small text-muted-foreground mb-4">
                  {t("scan.code")}{" "}
                  <span className="font-mono text-sm">{scannedCode}</span>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={resetScan}>
                    {t("scan.scanAgain")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/")}
                  >
                    {t("common.goHome")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        {state === "scanning" && (
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
