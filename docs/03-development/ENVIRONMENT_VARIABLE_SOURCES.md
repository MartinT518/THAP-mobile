# Where environment variables come from

This document explains **what each variable is for**, **where you obtain a value**, and **what works with the current codebase** (as implemented in `server/_core/env.ts`, `server/_core/sdk.ts`, and related modules).

Copy the variable list from [`.env.example`](../../.env.example) at the repo root. Local setup steps stay in [`LOCAL_SETUP.md`](../../LOCAL_SETUP.md).

---

## Quick reference

| Variable | You get it from | Required? |
|----------|-----------------|-----------|
| `DATABASE_URL` | Your MySQL (or TiDB-MySQL) host — connection string you create | Yes |
| `JWT_SECRET` | You generate locally (not from a vendor dashboard) | Yes |
| `OAUTH_SERVER_URL` | Backend that implements the auth API Thap calls today | For login |
| `VITE_OAUTH_PORTAL_URL` | Same identity system’s **browser login host** (must support `/app-auth` flow) | For login |
| `VITE_OAUTH_CLIENT_ID` | Same system’s OAuth **client / app id** (exposed to the browser) | For login |
| `OWNER_OPEN_ID` | Your account’s stable user id (`openId`) after you know it | No |
| `VITE_APP_TITLE` | Any string you choose | No |
| `THAP_SERVICES_BASE_URL` | One HTTP origin used for **several** server integrations (see below) | No* |
| `THAP_SERVICES_API_KEY` | Bearer token that origin accepts | No* |
| `VITE_MAPS_PROXY_BASE_URL` | Base URL of a **maps JS proxy** (or your own) | No |
| `VITE_MAPS_PROXY_API_KEY` | Key accepted by that proxy for the Maps script URL | No |

\* Optional: if unset, features that call these services fail until you configure them or change the code.

**Legacy aliases** (still read if new names are empty): `VITE_APP_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`. Prefer the names in `.env.example`.

---

## `DATABASE_URL`

**What it is:** MySQL connection URI for Drizzle (`drizzle.config.ts`, `server/db.ts`).

**Format:**

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Where to get it:**

| Setup | How |
|--------|-----|
| **Docker (local)** | You choose `USER` / `PASSWORD` when you run the container (e.g. `root` / `root`) and create database `thap`. Host is `127.0.0.1`, port `3306` unless you mapped another port. |
| **MySQL installed on your PC** | Create a user and database in MySQL; build the URL from those credentials. |
| **Managed MySQL** (RDS, PlanetScale, etc.) | Use the provider’s console: copy the host, port, user, password, and database name into the URL. |
| **TiDB Serverless** | [TiDB Cloud](https://tidbcloud.com) → cluster → **Connect** → choose standard MySQL client → copy the connection string and adjust if needed. |

**Tip:** Special characters in passwords must be [URL-encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) in the URI.

---

## `JWT_SECRET`

**What it is:** Secret used to sign and verify the session cookie (see `server/_core/sdk.ts` / `jose`).

**Where to get it:** **You generate it.** It is not issued by an external product.

**Examples:**

```bash
# macOS / Linux / Git Bash
openssl rand -hex 32
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use a long random string; never commit the real value; rotate if leaked.

---

## `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_OAUTH_CLIENT_ID`

**What they are:**

- **`OAUTH_SERVER_URL`** — Base URL Thap’s **server** calls for token exchange and user info. Paths are fixed in code, e.g.  
  `/webdev.v1.WebDevAuthPublicService/ExchangeToken`  
  (see `server/_core/sdk.ts`).
- **`VITE_OAUTH_PORTAL_URL`** — Origin users are sent to for sign-in. The client builds  
  `{VITE_OAUTH_PORTAL_URL}/app-auth?...`  
  (see `client/src/const.ts`).
- **`VITE_OAUTH_CLIENT_ID`** — Client / app identifier passed as `appId` in that URL and as `clientId` when exchanging the code.

**Where to get them:** From whatever **identity backend + hosted login** you use **only if** that stack exposes **this exact** portal path and server API shape. Generic OAuth providers (Auth0, Clerk, Google-only OAuth, etc.) **do not** use these paths out of the box — you would need an **adapter service** or **code changes** in `sdk.ts`, `oauth.ts`, and `getLoginUrl`.

**Practical steps if you control the IdP:**

1. Create/register an “application” or “client” in your auth admin UI; copy its **client id** → `VITE_OAUTH_CLIENT_ID` (and optionally set `OAUTH_CLIENT_ID` on the server to the same value if you add that later).
2. Set **`VITE_OAUTH_PORTAL_URL`** to the **public origin** where users log in (must serve `/app-auth` as Thap expects, or you change the client code).
3. Set **`OAUTH_SERVER_URL`** to the **API base** that implements the ExchangeToken / GetUserInfo flow Thap calls.

If you **do not** have such a backend yet, login will not work until you implement or replace this flow — there is no universal “download these three from one website” for arbitrary OAuth.

---

## `OWNER_OPEN_ID`

**What it is:** The `openId` string stored for a user in the database. The first user whose `openId` matches this value is treated as **admin** (`server/db.ts`).

**Where to get it:**

1. **After login works:** Inspect the `users` table (`openId` column) for your account, or decode/log the session payload your server issues (field `openId` in the JWT payload used by Thap).
2. **Before login works:** You cannot know it from Thap alone — it comes from your identity provider’s stable subject / user id once that user is synced into `users`.

Paste that exact string into `OWNER_OPEN_ID` so your account becomes admin on next sign-in / sync.

---

## `VITE_APP_TITLE`

**What it is:** Shown as the app name in the UI (browser title area / branding).

**Where to get it:** Any string you choose (e.g. `Thap`).

---

## `THAP_SERVICES_BASE_URL` and `THAP_SERVICES_API_KEY`

**What they are:** A **single** base URL plus **Bearer** API key used by **multiple** server features:

| Feature | How the code uses the base (simplified) |
|---------|-------------------------------------------|
| AI chat | `POST {base}/v1/chat/completions` (OpenAI-compatible body) — `server/_core/llm.ts` |
| File storage | `{base}/v1/storage/upload`, `{base}/v1/storage/downloadUrl` — `server/storage.ts` |
| Server-side maps helper | Uses base + key — `server/_core/map.ts` |
| Notifications, data API, image generation, transcription | Custom paths under the same base — `server/_core/notification.ts`, `dataApi.ts`, `imageGeneration.ts`, `voiceTranscription.ts` |

**Important:** Pointing **only** at a public API such as `https://api.openai.com` will **not** satisfy storage and the other non-OpenAI routes, because they are combined on **one** `THAP_SERVICES_BASE_URL` today. To use **only** OpenAI for chat you would need a **code change** to split LLM URL/key from storage/proxy URL/key, or run a **small backend** that proxies `/v1/chat/completions` to OpenAI and implements (or stubs) the other routes.

**Where to get values:**

| Goal | Typical source |
|------|----------------|
| OpenAI-style chat only (conceptually) | [OpenAI API keys](https://platform.openai.com/api-keys) — but see caveat above for one-URL limitation. |
| Azure OpenAI | [Azure portal](https://portal.azure.com) → your OpenAI resource → endpoint + key. |
| Self-hosted OpenAI-compatible gateway | Your gateway’s public URL + API key (LiteLLM, vLLM with compatible API, etc.) — still subject to the single-base limitation for storage/other features. |
| Full template-style proxy (chat + storage + maps + …) | Whatever service or internal platform exposes **all** paths your deployment uses, plus its API key from that platform’s dashboard. |

If you leave these empty, the app can still run; AI, uploads, and related procedures will error until configured or refactored.

---

## `VITE_MAPS_PROXY_BASE_URL` and `VITE_MAPS_PROXY_API_KEY`

**What they are:** The browser loads Google Maps JavaScript from:

`{VITE_MAPS_PROXY_BASE_URL}/v1/maps/proxy/maps/api/js?key=...`

(see `client/src/components/Map.tsx`).

**Where to get them:**

| Setup | Where |
|--------|--------|
| **Google Maps directly** | Thap’s current loader expects a **proxy** path (`/v1/maps/proxy/...`), not the raw `https://maps.googleapis.com/...` URL. To use Google alone you’d change `Map.tsx` or put a tiny proxy in front. |
| **Proxy you or your org runs** | Whoever operates the proxy gives you the **base URL** (no trailing slash issues — code normalizes) and the **key** query parameter value. |
| **Google Cloud (for a standard Maps JS key)** | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → enable **Maps JavaScript API** → Credentials → create an API key. You still need a compatible proxy URL in the app unless you change the map loader. |

If either variable is missing, the map component logs a warning and skips loading the map.

---

## Checklist before asking “why doesn’t login / AI / upload work?”

1. **`DATABASE_URL`** — Can you connect with `mysql` CLI or a GUI using the same URI?
2. **`JWT_SECRET`** — Set and non-empty?
3. **Login** — Do `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, and `VITE_OAUTH_CLIENT_ID` match a backend that actually implements the routes and `/app-auth` flow Thap uses?
4. **Services** — Does `THAP_SERVICES_BASE_URL` expose every path your feature needs (chat **and** storage **and** anything else you trigger)?
5. **Maps** — Are both map env vars set and does the proxy URL match what `Map.tsx` builds?

---

## Related files

- Env resolution: `server/_core/env.ts`
- OAuth / session: `server/_core/sdk.ts`, `server/_core/oauth.ts`
- Login URL: `client/src/const.ts`
- LLM: `server/_core/llm.ts`
- Storage: `server/storage.ts`
- Maps (client): `client/src/components/Map.tsx`

---

**Last updated:** March 2026
