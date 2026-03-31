const LEGACY_ID_HOSTS = new Set(["id.tings.info", "id.thap.info"]);
const LEGACY_QR_HOSTS = new Set(["qr.tings.info", "qr.thap.info"]);

export type LegacyTingsDeepLink =
  | { kind: "id"; externalId: string }
  | { kind: "qr"; qrUrl: string };

/**
 * Recognize legacy printed QR / deep links: id.* and qr.* hosts from Tings / Thap.
 * Returns null if the payload is not such a URL (caller continues with normal lookup).
 */
export function parseLegacyTingsDeepLink(payload: string): LegacyTingsDeepLink | null {
  try {
    const url = new URL(payload.trim());
    const host = url.hostname.toLowerCase();

    if (LEGACY_ID_HOSTS.has(host)) {
      const segments = url.pathname.split("/").filter(Boolean);
      const externalId = segments[segments.length - 1];
      if (externalId) return { kind: "id", externalId };
      return null;
    }

    if (LEGACY_QR_HOSTS.has(host)) {
      return { kind: "qr", qrUrl: payload.trim() };
    }

    return null;
  } catch {
    return null;
  }
}
