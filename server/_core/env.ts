/** First non-empty value among env keys (for backward-compatible renames). */
function envFirst(...keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

/**
 * Central server env. OAuth + optional “services” base (OpenAI-compatible chat,
 * storage proxy, maps proxy, etc.) are provider-agnostic — set URLs/keys from your stack.
 *
 * Legacy names still work: VITE_APP_ID, BUILT_IN_FORGE_API_*, VITE_FRONTEND_FORGE_*.
 */
export const ENV = {
  /** OAuth client id (browser login URL + token exchange). */
  oauthClientId: envFirst(
    "OAUTH_CLIENT_ID",
    "VITE_OAUTH_CLIENT_ID",
    "VITE_APP_ID"
  ),
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  /** First user with this `openId` is treated as admin (see server/db.ts). */
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
};
