import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function HelpSupportPage() {
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
            <h1 className="text-lg font-bold">{t("helpPage.title")}</h1>
          </div>
        </div>

        <div className="container py-6 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground">{t("helpPage.intro")}</p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("helpPage.scanTitle")}
            </h2>
            <p>{t("helpPage.scanBody")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("helpPage.feedTitle")}
            </h2>
            <p>{t("helpPage.feedBody")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("helpPage.aiTitle")}
            </h2>
            <p>{t("helpPage.aiBody")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t("helpPage.moreTitle")}
            </h2>
            <p>{t("helpPage.moreBody")}</p>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
}
