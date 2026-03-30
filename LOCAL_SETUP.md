# Thap — Local Setup (Step-by-Step)

Everything you need to run Thap on your own machine.

---

## Prerequisites

| Tool | Version | How to check | Install |
|------|---------|--------------|---------|
| **Node.js** | 20+ | `node -v` | https://nodejs.org (LTS recommended) |
| **pnpm** | 10+ | `pnpm -v` | `npm install -g pnpm@10` |
| **MySQL** | 8+ | `mysql --version` | See [Database options](#1-database) below |
| **Git** | any | `git --version` | https://git-scm.com |

> The CI runs on Node 20. The `packageManager` field pins pnpm 10.4.1.

---

## 1. Database

You need a running MySQL 8+ instance. Pick one option:

### Option A — Docker (recommended)

```bash
docker run -d \
  --name thap-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=thap \
  -p 3306:3306 \
  mysql:8
```

Connection string: `mysql://root:root@localhost:3306/thap`

### Option B — Local MySQL install

Install MySQL 8 via your OS package manager or installer, then:

```sql
CREATE DATABASE thap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Option C — TiDB Cloud (free tier)

Create a free Serverless cluster at https://tidbcloud.com and copy the connection string.

---

## 2. Clone & install dependencies

```bash
git clone <repository-url>
cd thap-mobile
pnpm install
```

`pnpm install` reads the lockfile and patches (e.g. `wouter@3.7.1`). If you see a corepack prompt, run `corepack enable` first.

---

## 3. Environment variables

Copy `.env.example` to `.env` or create `.env` in the project root. For **where each value comes from** (dashboards, CLI commands, caveats), see [`docs/03-development/ENVIRONMENT_VARIABLE_SOURCES.md`](docs/03-development/ENVIRONMENT_VARIABLE_SOURCES.md).

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Signs the session cookie (HS256 via jose) |
| `OAUTH_SERVER_URL` | For login | Base URL of an OAuth backend that implements the WebDev-style exchange in `server/_core/sdk.ts` (`ExchangeToken`, `GetUserInfo`, …) |
| `VITE_OAUTH_PORTAL_URL` | For login | Where the browser sends users to sign in (must match your IdP’s hosted login + `/app-auth` flow expected by `client/src/const.ts`) |
| `VITE_OAUTH_CLIENT_ID` | For login | OAuth client id (exposed to the browser as `VITE_*`) |
| `OWNER_OPEN_ID` | No | First user with this `openId` is promoted to admin (`server/db.ts`) |
| `VITE_APP_TITLE` | No | App title in the UI |
| `THAP_SERVICES_BASE_URL` | No* | Base URL for server integrations: OpenAI-compatible `POST /v1/chat/completions`, storage proxy, server-side maps helpers, notifications, etc. |
| `THAP_SERVICES_API_KEY` | No* | Bearer token for that base URL |
| `VITE_MAPS_PROXY_BASE_URL` | No | Browser: base URL for Google Maps JS loader (`…/v1/maps/proxy`) |
| `VITE_MAPS_PROXY_API_KEY` | No | Key for that maps proxy |

\* Without services URL/key, AI chat, file uploads, voice transcription, and some admin tools fail until you configure them or replace those code paths.

**Legacy env names** (still read if the new names are unset): `VITE_APP_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`.

### What happens without optional vars?

| Missing variable | Impact |
|------------------|--------|
| `THAP_SERVICES_API_KEY` / `THAP_SERVICES_BASE_URL` | AI chat, file uploads, image generation, voice transcription, and related server calls fail |
| `VITE_MAPS_PROXY_*` | Map component skips loading (empty map area + console warning) |
| `OAUTH_SERVER_URL` / portal / client id | Login redirect is broken — you cannot authenticate |
| `OWNER_OPEN_ID` | No automatic admin promotion by OpenID |

---

## 4. Push the database schema

```bash
pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` — it generates migration SQL from `drizzle/schema.ts` and applies it to your database.

Verify tables were created:

```bash
mysql -u root -proot -e "USE thap; SHOW TABLES;"
```

You should see: `users`, `products`, `product_instances`, `scan_history`, `ai_conversations`, `ai_provider_settings`, `product_documents`.

---

## 5. Start the dev server

```bash
pnpm dev
```

This runs `cross-env NODE_ENV=development tsx watch server/_core/index.ts` so it works on Windows and Unix without extra shell syntax.

Once started you'll see:

```
Server running on http://localhost:3000/
```

The server serves both the Vite frontend (with HMR) and the tRPC API — no separate frontend process needed.

| URL | What it is |
|-----|------------|
| http://localhost:3000 | App UI |
| http://localhost:3000/api/trpc | tRPC endpoint |
| http://localhost:3000/api/oauth/callback | OAuth redirect target |

---

## 6. Run tests

```bash
pnpm test
```

Tests use Vitest and **do not require a database** — they call tRPC procedures with mocked contexts. There are 11 test files in `server/`:

```
aiChat.test.ts       ai.test.ts           aiQuestions.test.ts
auth.logout.test.ts  cleanup.test.ts      crypto.test.ts
documents.test.ts    productEdit.test.ts  products.test.ts
scanHistory.test.ts  settings.test.ts
```

CI also runs `pnpm check` (TypeScript type check) — run it locally too before pushing:

```bash
pnpm check
```

---

## 7. Build for production (optional)

```bash
pnpm build
pnpm start
```

`build` compiles the Vite frontend to `dist/public/` and bundles the server to `dist/index.js`. `start` runs the production bundle.

---

## Quick-start checklist

```
[ ] Node 20+ installed
[ ] pnpm 10+ installed
[ ] MySQL 8+ running with a `thap` database
[ ] .env file created with at least DATABASE_URL and JWT_SECRET
[ ] pnpm install — no errors
[ ] pnpm db:push — tables created
[ ] pnpm dev — server starts on localhost:3000
[ ] pnpm test — all tests pass
```

---

## Troubleshooting

### `NODE_ENV=development` is not recognized (Windows)

The `dev` script uses `cross-env` — if you still see errors, run `pnpm install` and try again.

### `Port 3000 is busy, using port 3001 instead`

Another process is using port 3000. The server auto-scans ports 3000–3019. Kill the other process or let it use the next port.

### `DATABASE_URL is required to run drizzle commands`

Your `.env` file is missing or `DATABASE_URL` is not set. Drizzle reads it directly from `process.env`.

### `pnpm install` fails with patch errors

The project patches `wouter@3.7.1`. Make sure you have the `patches/` directory from the repo. Run `pnpm install` again after cloning fresh.

### Tests fail with import errors

Run `pnpm install` to ensure all dependencies are resolved, then `pnpm test` again.

---

## Available scripts

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start dev server (Vite HMR + Express + tRPC) on port 3000 |
| `pnpm build` | Production build (Vite frontend + esbuild server) |
| `pnpm start` | Run production build |
| `pnpm test` | Run Vitest test suite |
| `pnpm check` | TypeScript type check (`tsc --noEmit`) |
| `pnpm format` | Format code with Prettier |
| `pnpm db:push` | Generate and apply database migrations |
