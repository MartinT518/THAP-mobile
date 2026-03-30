import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Bell, Package, Shield, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface NotificationPreferences {
  warrantyReminders: boolean;
  careTips: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
}

const STORAGE_KEY = "thap-notification-prefs";

const defaultPreferences: NotificationPreferences = {
  warrantyReminders: true,
  careTips: true,
  productUpdates: false,
  securityAlerts: true,
};

function loadPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch {}
  return defaultPreferences;
}

function savePreferences(prefs: NotificationPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [prefs, setPrefs] = useState(loadPreferences);

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success(t("notificationSettings.updated"));
      return updated;
    });
  };

  const items = [
    {
      key: "warrantyReminders" as const,
      icon: Shield,
      label: t("notificationSettings.warrantyReminders"),
      description: t("notificationSettings.warrantyRemindersDesc"),
    },
    {
      key: "careTips" as const,
      icon: Sparkles,
      label: t("notificationSettings.careTips"),
      description: t("notificationSettings.careTipsDesc"),
    },
    {
      key: "productUpdates" as const,
      icon: Package,
      label: t("notificationSettings.productUpdates"),
      description: t("notificationSettings.productUpdatesDesc"),
    },
    {
      key: "securityAlerts" as const,
      icon: Bell,
      label: t("notificationSettings.securityAlerts"),
      description: t("notificationSettings.securityAlertsDesc"),
    },
  ];

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("notificationSettings.title")} onBack={() => navigate("/settings")} />

      <div className="container py-6 space-y-6">
        <Card className="divide-y divide-border">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={item.key} className="body-large font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="body-small text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={prefs[item.key]}
                  onCheckedChange={() => toggle(item.key)}
                />
              </div>
            );
          })}
        </Card>

        <Card className="p-4 bg-muted">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {t("notificationSettings.disclaimer")}
            </p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
