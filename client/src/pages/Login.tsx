import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { GOOGLE_CLIENT_ID } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useEffect, useRef, useCallback, useState } from "react";

type GisApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme?: string;
          size?: string;
          width?: number;
          type?: string;
          shape?: string;
          text?: string;
          locale?: string;
        },
      ) => void;
    };
  };
};

function getGis(): GisApi | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).google as GisApi | undefined;
}

export default function Login() {
  const { t } = useTranslation();
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const buttonRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await fetch("/api/auth/google/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (res.ok) {
          await refresh();
        }
      } catch {
        // Silently fail — user can retry
      }
    },
    [refresh],
  );

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || scriptLoaded.current) return;

    const initializeGoogle = () => {
      const gis = getGis();
      if (!gis || !buttonRef.current) return;
      gis.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      gis.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        type: "standard",
        shape: "pill",
        text: "signin_with",
      });
      setGoogleReady(true);
    };

    if (getGis()) {
      initializeGoogle();
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogle();
      scriptLoaded.current = true;
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [handleCredentialResponse]);

  const handleDevSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await refresh();
    } finally {
      setSigningIn(false);
    }
  }, [refresh]);

  if (isAuthenticated && !loading) return null;

  const showGoogleButton = Boolean(GOOGLE_CLIENT_ID);
  const showFallbackButton = !showGoogleButton || !googleReady;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
          <img
            src="/assets/logo.svg"
            alt="thap."
            className="w-48 h-auto mb-10"
          />

          <img
            src="/assets/login-pyramid.png"
            alt=""
            className="w-64 h-auto mb-10"
            width={256}
            height={256}
          />

          <h2 className="title-large mb-2 text-center">
            {t("login.welcome")}
          </h2>
          <p className="body-medium text-muted-foreground mb-10 text-center max-w-xs">
            {t("login.description")}
          </p>

          {showGoogleButton && (
            <div ref={buttonRef} className="flex justify-center min-h-[44px]" />
          )}

          {showFallbackButton && (
            <Button
              onClick={handleDevSignIn}
              size="lg"
              className="rounded-full min-w-[200px]"
              disabled={signingIn}
            >
              {signingIn ? t("common.loading") : t("common.signIn")}
            </Button>
          )}

          <p className="body-small text-muted-foreground mt-6 text-center">
            {t("login.terms")}
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
