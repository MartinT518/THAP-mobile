import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
];

export default function LanguageSelection() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: settings } = trpc.userSettings.get.useQuery(undefined, {
    enabled: isAuthenticated
  });
  
  const updateSettingsMutation = trpc.userSettings.update.useMutation({
    onSuccess: () => {
      toast.success(t("languageSelection.updated"));
      navigate("/settings");
    },
    onError: (err) => toast.error(err.message || t("languageSelection.updateFailed")),
  });
  
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    if (settings?.language) {
      setSelectedLanguage(settings.language);
    }
  }, [settings?.language]);

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    i18n.changeLanguage(languageCode);

    if (isAuthenticated) {
      await updateSettingsMutation.mutateAsync({ language: languageCode });
    } else {
      // Store in localStorage for non-authenticated users
      localStorage.setItem("thap_language", languageCode);
      navigate("/settings");
    }
  };

  return (
    <MobileLayout>
      <AppBar title={t("languageSelection.title")} onBack={() => navigate("/settings")} />
      
      <div className="container py-6">
        <div className="space-y-2">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="w-full"
            >
              <Card className={`p-4 hover:bg-muted transition-colors ${
                selectedLanguage === language.code ? 'border-primary' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-semibold">{language.name}</p>
                    <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                  </div>
                  {selectedLanguage === language.code && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
