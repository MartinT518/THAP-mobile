import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "./components/AnimatedPage";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Scan from "./pages/Scan";
import MenuPage from "./pages/MenuPage";
import Login from "./pages/Login";
import LanguageSelection from "./pages/LanguageSelection";
import CountrySelection from "./pages/CountrySelection";
import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const Feed = lazy(() => import("./pages/Feed"));
const Settings = lazy(() => import("./pages/Settings"));
const AISettings = lazy(() => import("./pages/AISettings"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ScanHistory = lazy(() => import("./pages/ScanHistory"));
const AIChat = lazy(() => import("./pages/AIChat"));
const ProductEdit = lazy(() => import("./pages/ProductEdit"));
const UserAccount = lazy(() => import("./pages/UserAccount"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <AnimatedPage key={location}>
        <Suspense fallback={<PageFallback />}>
          <Switch>
            {/* Public routes */}
            <Route path="/" component={Home} />
            <Route path="/search" component={Search} />
            <Route path="/scan" component={Scan} />
            <Route path="/login" component={Login} />
            <Route path="/menu" component={MenuPage} />
            <Route path="/language-selection" component={LanguageSelection} />
            <Route path="/country-selection" component={CountrySelection} />

            {/* Protected routes */}
            <Route path="/settings">{() => <ProtectedRoute><Settings /></ProtectedRoute>}</Route>
            <Route path="/ai-settings">{() => <ProtectedRoute><AISettings /></ProtectedRoute>}</Route>
            <Route path="/product/:id/edit">{() => <ProtectedRoute><ProductEdit /></ProtectedRoute>}</Route>
            <Route path="/product/:id">{() => <ProtectedRoute><ProductDetail /></ProtectedRoute>}</Route>
            <Route path="/scan-history">{() => <ProtectedRoute><ScanHistory /></ProtectedRoute>}</Route>
            <Route path="/ai-chat/:productId">{() => <ProtectedRoute><AIChat /></ProtectedRoute>}</Route>
            <Route path="/user-account">{() => <ProtectedRoute><UserAccount /></ProtectedRoute>}</Route>
            <Route path="/profile-edit">{() => <ProtectedRoute><ProfileEdit /></ProtectedRoute>}</Route>
            <Route path="/feed">{() => <ProtectedRoute><Feed /></ProtectedRoute>}</Route>
            <Route path="/notification-settings">{() => <ProtectedRoute><NotificationSettings /></ProtectedRoute>}</Route>
            <Route path="/privacy-settings">{() => <ProtectedRoute><PrivacySettings /></ProtectedRoute>}</Route>

            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </AnimatedPage>
    </AnimatePresence>
  );
}

function LanguageSync() {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: settings } = trpc.userSettings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (settings?.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language, i18n]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <LanguageSync />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
