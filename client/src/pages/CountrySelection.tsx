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

const COUNTRIES = [
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
];

export default function CountrySelection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: settings } = trpc.userSettings.get.useQuery(undefined, {
    enabled: isAuthenticated
  });
  
  const updateSettingsMutation = trpc.userSettings.update.useMutation({
    onSuccess: () => {
      toast.success(t("countrySelection.updated"));
      navigate("/settings");
    },
    onError: (err) => toast.error(err.message || t("countrySelection.updateFailed")),
  });
  
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    if (settings?.country) {
      setSelectedCountry(settings.country);
    }
  }, [settings?.country]);

  const handleCountrySelect = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    
    if (isAuthenticated) {
      await updateSettingsMutation.mutateAsync({ country: countryCode });
    } else {
      // Store in localStorage for non-authenticated users
      localStorage.setItem("thap_country", countryCode);
      navigate("/settings");
    }
  };

  return (
    <MobileLayout>
      <AppBar title={t("countrySelection.title")} onBack={() => navigate("/settings")} />
      
      <div className="container py-6">
        <div className="space-y-2">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              onClick={() => handleCountrySelect(country.code)}
              className="w-full"
            >
              <Card className={`p-4 hover:bg-muted transition-colors ${
                selectedCountry === country.code ? 'border-primary' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{t(`countries.${country.code}`)}</p>
                  {selectedCountry === country.code && (
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
