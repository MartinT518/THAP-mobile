import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsItemSkeleton } from "@/components/ProductCardSkeleton";
import { Sparkles, Globe, MapPin, Bell, Shield, ChevronRight, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const cleanupMutation = trpc.cleanup.removeDuplicates.useMutation();
  
  const handleCleanup = async () => {
    if (!confirm(t("settings.confirmCleanup"))) {
      return;
    }
    
    try {
      const result = await cleanupMutation.mutateAsync();
      toast.success(t("settings.cleanupSuccess", { instances: result.removedInstances, scans: result.removedScans }));
      window.location.reload();
    } catch (error) {
      toast.error(t("settings.cleanupFailed"));
    }
  };
  
  const { data: settings, isLoading: settingsLoading, isError: settingsError, refetch: refetchSettings } = trpc.userSettings.get.useQuery(undefined, {
    enabled: isAuthenticated
  });
  
  const settingsItems = [
    { 
      icon: Sparkles, 
      label: t("settings.aiAssistant"), 
      description: t("settings.aiAssistantDesc"),
      action: () => navigate("/ai-settings")
    },
    { 
      icon: Globe, 
      label: t("settings.language"), 
      description: t(`languages.${settings?.language || 'en'}`),
      action: () => navigate("/language-selection")
    },
    { 
      icon: MapPin, 
      label: t("settings.country"), 
      description: settings?.country ? (t(`countries.${settings.country}`) || settings.country) : t("settings.countryNotSet"),
      action: () => navigate("/country-selection")
    },
    { 
      icon: Bell, 
      label: t("settings.notifications"), 
      description: t("settings.notificationsDesc"),
      action: () => navigate("/notification-settings")
    },
    { 
      icon: Shield, 
      label: t("settings.privacy"), 
      description: t("settings.privacyDesc"),
      action: () => navigate("/privacy-settings")
    },
  ];

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("settings.title")} onBack={() => navigate("/menu")} />
      
      <div className="container py-6 space-y-6">
        {settingsError ? (
          <ErrorRetry message={t("settings.errorLoad")} onRetry={() => refetchSettings()} />
        ) : settingsLoading ? (
          <Card className="elevation-1 divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <SettingsItemSkeleton key={i} />
            ))}
          </Card>
        ) : (
        <Card className="elevation-1 divide-y divide-border">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left min-h-[56px]"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="body-large font-medium">{item.label}</p>
                  <p className="body-small text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </Card>
        )}
        
        {/* Database Maintenance */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">{t("settings.dbMaintenance")}</h3>
          <Card className="p-4">
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {cleanupMutation.isPending ? t("settings.cleaningUp") : t("settings.removeDuplicates")}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              {t("settings.removeDuplicatesHelp")}
            </p>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
