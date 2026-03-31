import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function LegalPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-white border-b border-border">
          <div className="container flex items-center gap-2 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/menu")} aria-label="Back">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold">{t("legalPage.title")}</h1>
          </div>
        </div>

        <div className="container py-6 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground">{t("legalPage.intro")}</p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("legalPage.termsTitle")}
            </h2>
            <p>{t("legalPage.termsBody")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("legalPage.privacyTitle")}
            </h2>
            <p>{t("legalPage.privacyBody")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("legalPage.contactTitle")}
            </h2>
            <p>{t("legalPage.contactBody")}</p>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
}
