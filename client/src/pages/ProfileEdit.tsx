import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function ProfileEdit() {
  const { t } = useTranslation();
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const updateMutation = trpc.userSettings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("profileEdit.saved"));
      refresh();
      navigate("/user-account");
    },
    onError: () => {
      toast.error(t("profileEdit.saveFailed"));
    },
  });

  const handleSave = () => {
    const updates: { name?: string; email?: string } = {};
    if (name !== (user?.name || "")) updates.name = name;
    if (email !== (user?.email || "")) updates.email = email;

    if (Object.keys(updates).length === 0) {
      navigate("/user-account");
      return;
    }

    updateMutation.mutate(updates);
  };

  const hasChanges = name !== (user?.name || "") || email !== (user?.email || "");

  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("profileEdit.title")} onBack={() => navigate("/user-account")} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("profileEdit.title")} onBack={() => navigate("/user-account")} />
        <div className="container py-6">
          <p className="text-center text-muted-foreground">{t("userAccount.pleaseSignIn")}</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("profileEdit.title")} onBack={() => navigate("/user-account")} />

      <div className="container py-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("profileEdit.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("profileEdit.subtitle")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("profileEdit.name")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profileEdit.namePlaceholder")}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("profileEdit.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("profileEdit.emailPlaceholder")}
                maxLength={320}
              />
              <p className="text-xs text-muted-foreground">
                {t("profileEdit.emailHint")}
              </p>
            </div>
          </div>
        </Card>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={updateMutation.isPending || !hasChanges}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("profileEdit.saving")}
            </>
          ) : (
            t("profileEdit.save")
          )}
        </Button>
      </div>
    </MobileLayout>
  );
}
