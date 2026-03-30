import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t("errorRetry.defaultMessage");

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{displayMessage}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {t("errorRetry.hint")}
      </p>
      <Button onClick={onRetry} variant="outline">
        {t("common.retry")}
      </Button>
    </div>
  );
}
