import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/MobileLayout";
import { User, Settings, FileText, HelpCircle, LogOut, ChevronRight, MoreVertical } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MenuPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      window.location.href = "/";
    } catch (error) {
      toast.error(t("menu.logoutFailed"));
    }
  };

  const menuItems = [
    { 
      icon: User, 
      label: t("menu.userAccount"), 
      action: () => navigate("/user-account")
    },
    { 
      icon: Settings, 
      label: t("menu.settings"), 
      action: () => navigate("/settings")
    },
    { 
      icon: FileText, 
      label: t("menu.legal"), 
      action: () => toast.info(t("menu.legalSoon"))
    },
    { 
      icon: HelpCircle, 
      label: t("menu.helpSupport"), 
      action: () => toast.info(t("menu.helpSoon"))
    },
    { 
      icon: LogOut, 
      label: t("menu.signOut"), 
      action: handleLogout
    },
  ];

  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{t("menu.pleaseSignIn")}</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">thap.</h1>
          <button className="p-2">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="container py-8">
        {/* User Profile Section */}
        <div className="flex flex-col items-center mb-8 pb-8">
          <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-1">{user?.name || t("menu.userFallback")}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
        </div>

        {/* Menu Items */}
        <div className="space-y-0 border-t border-border">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center justify-between py-5 border-b border-border hover:bg-muted/30 transition-colors ${
                  index === 0 ? "pt-6" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-6 h-6 text-foreground" />
                  <span className="text-base font-normal">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
