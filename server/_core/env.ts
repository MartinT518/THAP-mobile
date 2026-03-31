/** First non-empty value among env keys (for backward-compatible renames). */
function envFirst(...keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

/**
 * Central server env. Google Sign-In + optional "services" base (OpenAI-compatible chat,
 * storage proxy, maps proxy, etc.) are provider-agnostic — set URLs/keys from your stack.
 */
export const ENV = {
  /** Google OAuth 2.0 Client ID (used to verify ID tokens on the server). */
  googleClientId: envFirst("GOOGLE_CLIENT_ID", "VITE_GOOGLE_CLIENT_ID"),
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** First user with this `openId` (Google sub) is treated as admin (see server/db.ts). */
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** Base URL for server-side integrations (LLM `/v1/chat/completions`, storage, maps API, etc.). */
  servicesBaseUrl: envFirst(
    "THAP_SERVICES_BASE_URL",
    "BUILT_IN_FORGE_API_URL"
  ),
  servicesApiKey: envFirst(
    "THAP_SERVICES_API_KEY",
    "BUILT_IN_FORGE_API_KEY"
  ),
  /** Legacy Tings / Thap QR host resolution (`lookupByQR`). Override base if the API moves. */
  tingsApiBase:
    envFirst("TINGS_API_BASE") || "https://tingsapi.test.mindworks.ee",
  /** Optional Bearer for `/api/v2/products/*` (required if the host returns 401 without auth). */
  tingsApiBearerToken: envFirst("TINGS_API_BEARER_TOKEN", "TINGS_API_TOKEN"),
};
