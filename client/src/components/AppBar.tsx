import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface AppBarProps {
  title?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  elevated?: boolean;
  className?: string;
}

export function AppBar({ title, onBack, actions, elevated = false, className }: AppBarProps) {
  const { t } = useTranslation();
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 bg-card border-b border-border z-40 safe-top",
        elevated && "elevation-2",
        className
      )}
    >
      <div className="flex items-center h-14 px-4">
        {onBack !== undefined && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label={t("appBar.goBack")}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        
        {title && (
          <h1 className="headline-small flex-1 truncate">
            {title}
          </h1>
        )}
        
        {actions && (
          <div className="flex items-center gap-2 ml-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
