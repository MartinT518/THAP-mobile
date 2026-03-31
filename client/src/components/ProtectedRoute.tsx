import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, Loader2 } from "lucide-react";
interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 elevation-1 max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <LogIn className="w-10 h-10 text-primary" />
              </div>
              <h2 className="title-large mb-2">{t("protectedRoute.title")}</h2>
              <p className="body-medium text-muted-foreground mb-6">
                {t("protectedRoute.description")}
              </p>
              <Button
                size="lg"
                className="rounded-full w-full"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                {t("common.signIn")}
              </Button>
            </div>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return <>{children}</>;
}
