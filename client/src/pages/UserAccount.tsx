import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, User, Mail, Key, Calendar, Package, Scan, Tag, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

function DeleteAccountDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const deleteMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
    },
    onError: () => {
      toast.error(t("userAccount.deleteFailed"));
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmText(""); }}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
        >
          {t("userAccount.deleteAccount")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <AlertDialogTitle>{t("userAccount.deleteDialogTitle")}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <span className="block">{t("userAccount.deleteDialogDesc")}</span>
            <span className="block text-sm font-medium">{t("userAccount.deleteDialogConfirmLabel")}</span>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("userAccount.deleteDialogPlaceholder")}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={confirmText !== "DELETE" || deleteMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t("userAccount.deleteConfirmButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function UserAccount() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: myProducts } = trpc.products.myProducts.useQuery();
  const { data: scanHistory } = trpc.scanHistory.list.useQuery();
  
  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("userAccount.title")} onBack={() => navigate("/menu")} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }
  
  if (!user) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("userAccount.title")} onBack={() => navigate("/menu")} />
        <div className="container py-6">
          <p className="text-center text-muted-foreground">{t("userAccount.pleaseSignIn")}</p>
        </div>
      </MobileLayout>
    );
  }
  
  // Calculate statistics
  const totalProducts = myProducts?.length || 0;
  const totalScans = scanHistory?.length || 0;
  const allTags = myProducts?.flatMap(p => (p.instance?.tags as string[]) || []) || [];
  const uniqueTags = new Set(allTags);

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("userAccount.title")} onBack={() => navigate("/menu")} />
      
      <div className="container py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name || t("userAccount.userFallback")}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("userAccount.email")}</span>
              <span className="font-medium">{user.email || t("userAccount.notProvided")}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Key className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("userAccount.loginMethod")}</span>
              <span className="font-medium capitalize">{user.loginMethod || t("userAccount.unknown")}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("userAccount.memberSince")}</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("userAccount.lastSignIn")}</span>
              <span className="font-medium">
                {new Date(user.lastSignedIn).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
        
        {/* Statistics Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("userAccount.statistics")}</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <div className="text-xs text-muted-foreground">{t("userAccount.products")}</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Scan className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalScans}</div>
              <div className="text-xs text-muted-foreground">{t("userAccount.scans")}</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{uniqueTags.size}</div>
              <div className="text-xs text-muted-foreground">{t("userAccount.tags")}</div>
            </div>
          </div>
        </Card>
        
        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate("/profile-edit")}
          >
            {t("userAccount.editProfile")}
          </Button>
          
          <DeleteAccountDialog />
        </div>
        
        {/* Additional Info */}
        <Card className="p-4 bg-muted">
          <p className="text-sm text-muted-foreground">
            {t("userAccount.privacyBlurb")}
          </p>
        </Card>
      </div>
    </MobileLayout>
  );
}
