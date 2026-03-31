import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import i18n from "i18next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Opens an external URL and shows a "return to app" toast so
 * the user can easily navigate back after leaving the PWA context.
 */
export function openExternalLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");

  toast(i18n.t("externalLink.opened"), {
    description: i18n.t("externalLink.returnHint"),
    action: {
      label: i18n.t("externalLink.backToApp"),
      onClick: () => window.focus(),
    },
    duration: 6000,
  });
}
