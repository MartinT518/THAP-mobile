# Thap — Local Development Guide

**Stack**: React 19 + TypeScript 5.9 + Tailwind 4 + tRPC 11 + Express 4 + Drizzle ORM (MySQL)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 10+ | `npm install -g pnpm` |
| Git | any | https://git-scm.com |

---

## 1. Clone & Install

```bash
git clone <repository-url>
cd thap-mobile
pnpm install
```

---

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values. See `docs/03-development/ENVIRONMENT_VARIABLE_SOURCES.md` for where each value comes from.

```env
# Database (MySQL / TiDB)
DATABASE_URL=mysql://user:password@127.0.0.1:3306/thap

# Auth (Google Sign-In)
JWT_SECRET=change-me-to-a-long-random-string
VITE_GOOGLE_CLIENT_ID=

# User with this openId gets admin role on first sync
OWNER_OPEN_ID=

VITE_APP_TITLE=Thap

# Dev-only: skip OAuth by auto-creating a user with this openId
DEV_AUTH_OPEN_ID=

# Legacy QR deep links (id.tings.info / qr.tings.info)
TINGS_API_BASE=https://tingsapi.test.mindworks.ee
TINGS_API_BEARER_TOKEN=

# Icecat product lookup by GTIN/EAN
ICECAT_SHOPNAME=
ICECAT_API_TOKEN=

# Optional: server-side integrations (OpenAI-compatible chat, storage proxy, maps, notifications)
THAP_SERVICES_BASE_URL=
THAP_SERVICES_API_KEY=

# Optional: browser Google Maps via your maps proxy
VITE_MAPS_PROXY_BASE_URL=
VITE_MAPS_PROXY_API_KEY=
```

> **Note**: If you are running this project inside Manus, environment variables are injected automatically — no `.env` file needed.

---

## 3. Database Setup

The project uses **Drizzle ORM** with MySQL/TiDB. A `docker-compose.yml` is included for local MySQL 8.4:

```bash
docker compose up -d         # start MySQL
pnpm db:push                 # generate and apply migrations
```

Schema is defined in `drizzle/schema.ts` (9 tables). All query helpers live in `server/db.ts`.

---

## 4. Run Locally

```bash
pnpm dev
```

The app runs on **http://localhost:3000** by default.

- Frontend (Vite): served via Express proxy with HMR
- Backend (tRPC): available at `/api/trpc`
- OAuth callback: `/api/oauth/callback`

---

## 5. Run Tests

```bash
pnpm test
```

Test files live in `server/*.test.ts`. There are **20 test files** covering:
- AI assistant, AI chat, and question framework
- Product management (create, edit, delete, QR lookup, registration, removal)
- Authentication (logout), account deletion, profile update
- Feed, scan history, documents, settings, sharing
- OpenGraph scraping, deep-link resolution
- Crypto utilities, cleanup

Tests use mocked contexts — no database required.

---

## 6. Project Structure

```
thap-mobile/
├── client/
│   ├── src/
│   │   ├── pages/          ← 24 feature pages
│   │   ├── components/     ← Reusable UI (11 app + 28 shadcn/ui)
│   │   ├── _core/hooks/    ← useAuth hook
│   │   ├── locales/        ← i18n (14 languages)
│   │   ├── lib/trpc.ts     ← tRPC client binding
│   │   ├── const.ts        ← Client constants
│   │   ├── App.tsx         ← Routes and layout
│   │   └── index.css       ← Global styles and Tailwind theme
│   └── public/
│       ├── manifest.json   ← PWA manifest
│       ├── sw.js           ← Service worker (offline support)
│       └── assets/         ← Static images
├── server/
│   ├── routers.ts          ← All tRPC procedures (API layer)
│   ├── db.ts               ← Database query helpers
│   ├── storage.ts          ← S3 file storage helpers
│   ├── opengraph.ts        ← OpenGraph URL scraping
│   ├── deeplinkTings.ts    ← Legacy Tings deep-link resolver
│   ├── icecat.ts           ← Icecat product lookup
│   ├── *.test.ts           ← 20 Vitest test files
│   └── _core/              ← Framework internals (OAuth, LLM, crypto, etc.)
├── drizzle/
│   ├── schema.ts           ← Database schema (9 tables, source of truth)
│   └── *.sql               ← Generated migration files
├── shared/
│   ├── types.ts            ← Shared TypeScript types
│   ├── aiQuestions.ts       ← AI question definitions
│   ├── const.ts            ← Shared constants
│   └── _core/errors.ts     ← Error definitions
├── scripts/                 ← Build and utility scripts
├── serviceScripts/          ← Docker service management (sh + ps1)
├── docker-compose.yml       ← Local MySQL 8.4
└── LOCAL_DEVELOPMENT.md     ← This file
```

---

## 7. Key Development Patterns

### Adding a New Feature

1. **Define schema** in `drizzle/schema.ts` → run `pnpm db:push`
2. **Add query helpers** in `server/db.ts`
3. **Add tRPC procedure** in `server/routers.ts`
4. **Build UI** in `client/src/pages/FeatureName.tsx`
5. **Register route** in `client/src/App.tsx`
6. **Write tests** in `server/featureName.test.ts`

### Calling the Backend from Frontend

```tsx
// Query (read)
const { data, isLoading } = trpc.products.myProducts.useQuery();

// Mutation (write)
const addProduct = trpc.products.addToMyThings.useMutation({
  onSuccess: () => utils.products.myProducts.invalidate()
});
```

### Protected vs Public Procedures

```ts
// server/routers.ts
export const appRouter = router({
  products: router({
    // Public: accessible without login
    getByProductId: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(({ input }) => db.getProductByProductId(input.productId)),

    // Protected: requires authenticated user — ctx.user is available
    myProducts: protectedProcedure.query(({ ctx }) => {
      return db.getProductsByUser(ctx.user.id);
    }),
  }),
});
```

### Dev Auth Bypass

Set `DEV_AUTH_OPEN_ID` in `.env` to skip OAuth during development. A user is auto-created with that `openId` on first request. Only works when `NODE_ENV !== "production"`.

---

## 8. Routes

### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | Home | My Things dashboard |
| `/search` | Search | Product search |
| `/scan` | Scan | QR code scanner |
| `/login` | Login | Sign-in page |
| `/menu` | MenuPage | Navigation menu |
| `/language-selection` | LanguageSelection | Choose language |
| `/country-selection` | CountrySelection | Choose country |
| `/legal` | LegalPage | Legal information |
| `/help-support` | HelpSupportPage | Help and support |
| `/share/:token` | SharedProduct | View shared product |

### Protected Routes (require auth)
| Path | Page | Description |
|------|------|-------------|
| `/settings` | Settings | App settings |
| `/ai-settings` | AISettings | AI provider config |
| `/tags` | TagManagement | Manage product tags |
| `/product/:id/edit` | ProductEdit | Edit product instance |
| `/product/:id/register` | ProductRegister | Register product |
| `/product/:id` | ProductDetail | Product details |
| `/scan-history` | ScanHistory | Scan history |
| `/ai-chat/:productId` | AIChat | AI chat for product |
| `/user-account` | UserAccount | Account overview |
| `/profile-edit` | ProfileEdit | Edit name/email |
| `/feed` | Feed | Brand feed |
| `/notification-settings` | NotificationSettings | Notification prefs |
| `/privacy-settings` | PrivacySettings | Privacy controls |

Lazy-loaded pages (16): Feed, Settings, AISettings, ProductDetail, ScanHistory, AIChat, ProductEdit, ProductRegister, TagManagement, UserAccount, ProfileEdit, NotificationSettings, PrivacySettings, LegalPage, HelpSupportPage, SharedProduct.

---

## 9. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API layer | tRPC 11 | End-to-end type safety, no REST boilerplate |
| ORM | Drizzle | Lightweight, type-safe, fast migrations |
| UI components | shadcn/ui + Radix | Accessible, composable, Tailwind-native |
| State management | TanStack Query cache | No Redux/Zustand needed for server state |
| Auth | Google Sign-In + JWT cookies | Google ID token verification, with dev bypass mode |
| Animations | Framer Motion | Page transitions, card animations |
| i18n | i18next | 14 languages, browser detection |
| Mobile distribution | PWA (Capacitor planned) | Web-first with native plugin access |

---

## 10. Useful Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Run production bundle
pnpm test             # Run test suite (20 files)
pnpm check            # TypeScript type check
pnpm format           # Format with Prettier
pnpm db:push          # Generate and apply migrations
pnpm icons            # Generate PWA icons
pnpm services:start   # Start Docker MySQL
pnpm services:stop    # Stop Docker MySQL
pnpm services:restart # Restart Docker MySQL
```

---

## 11. Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes and write tests
3. Run `pnpm test` and `pnpm check` — all must pass
4. Open a pull request with a clear description

---

## 12. Related Documents

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `LOCAL_SETUP.md` | Step-by-step local setup |
| `DEPLOYMENT_CHECKLIST.md` | Pre-launch verification |
| `.env.example` | Environment variable template |
| `docs/03-development/ENVIRONMENT_VARIABLE_SOURCES.md` | Where each env var comes from |
| `docs/01-product/PRD_Product_Requirements_Document.md` | Full product requirements |
| `docs/02-architecture/DESIGN_DOCUMENTATION.md` | UI/UX design decisions |
| `docs/04-validation/VALIDATION_ROADMAP.md` | Capacitor validation plan |

---

**Last updated**: March 2026
