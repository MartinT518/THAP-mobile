import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Shield, Eye, BarChart3, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface PrivacyPreferences {
  analyticsEnabled: boolean;
  scanHistoryVisible: boolean;
}

const STORAGE_KEY = "thap-privacy-prefs";

const defaultPreferences: PrivacyPreferences = {
  analyticsEnabled: true,
  scanHistoryVisible: true,
};

function loadPreferences(): PrivacyPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch {}
  return defaultPreferences;
}

function savePreferences(prefs: PrivacyPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function PrivacySettings() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [prefs, setPrefs] = useState<PrivacyPreferences>(loadPreferences);

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  const toggle = (key: keyof PrivacyPreferences) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success(t("privacySettings.updated"));
      return updated;
    });
  };

  const handleExportData = () => {
    toast.info(t("privacySettings.exportSoon"));
  };

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("privacySettings.title")} onBack={() => navigate("/settings")} />

      <div className="container py-6 space-y-6">
        {/* Data Practices */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">{t("privacySettings.dataPractices")}</h3>
          <Card className="p-4 space-y-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("privacySettings.encryptionTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("privacySettings.encryptionDesc")}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("privacySettings.dataAccessTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("privacySettings.dataAccessDesc")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Privacy Controls */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">{t("privacySettings.privacyControls")}</h3>
          <Card className="divide-y divide-border">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <Label htmlFor="analytics" className="body-large font-medium cursor-pointer">
                  {t("privacySettings.analytics")}
                </Label>
                <p className="body-small text-muted-foreground">{t("privacySettings.analyticsDesc")}</p>
              </div>
              <Switch
                id="analytics"
                checked={prefs.analyticsEnabled}
                onCheckedChange={() => toggle("analyticsEnabled")}
              />
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <Label htmlFor="scanHistory" className="body-large font-medium cursor-pointer">
                  {t("privacySettings.scanHistoryVisibility")}
                </Label>
                <p className="body-small text-muted-foreground">{t("privacySettings.scanHistoryVisibilityDesc")}</p>
              </div>
              <Switch
                id="scanHistory"
                checked={prefs.scanHistoryVisible}
                onCheckedChange={() => toggle("scanHistoryVisible")}
              />
            </div>
          </Card>
        </div>

        {/* Data Export */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">{t("privacySettings.yourData")}</h3>
          <Card className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              {t("privacySettings.exportData")}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              {t("privacySettings.exportDataDesc")}
            </p>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-muted">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {t("privacySettings.disclaimer")}
            </p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
