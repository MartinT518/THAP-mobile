# Thap — Local Development Guide

**Stack**: React 19 + TypeScript + Tailwind 4 + tRPC 11 + Express 4 + Drizzle ORM (MySQL)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
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

# Auth (provider-agnostic OAuth — set URLs/keys for your stack)
JWT_SECRET=change-me-to-a-long-random-string
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
VITE_OAUTH_CLIENT_ID=

# User with this openId gets admin role on first sync
OWNER_OPEN_ID=

VITE_APP_TITLE=Thap

# Optional: server-side integrations (OpenAI-compatible chat, storage proxy, maps, notifications)
THAP_SERVICES_BASE_URL=
THAP_SERVICES_API_KEY=

# Optional: browser Google Maps via your maps proxy
VITE_MAPS_PROXY_BASE_URL=
VITE_MAPS_PROXY_API_KEY=
```

> **Note**: If you are running this project inside Manus, environment variables are injected automatically — no `.env` file needed. Legacy env names (`VITE_APP_ID`, `BUILT_IN_FORGE_API_*`) still work as fallbacks.

---

## 3. Database Setup

The project uses **Drizzle ORM** with MySQL/TiDB.

```bash
# Generate migrations and apply them to the database
pnpm db:push
```

Schema is defined in `drizzle/schema.ts`. All query helpers live in `server/db.ts`.

---

## 4. Run Locally

```bash
pnpm dev
```

The app runs on **http://localhost:3000** by default.

- Frontend (Vite): served via Express proxy
- Backend (tRPC): available at `/api/trpc`
- OAuth callback: `/api/oauth/callback`

---

## 5. Run Tests

```bash
pnpm test
```

Test files live in `server/*.test.ts`. There are currently **16 test files** covering:
- AI assistant, AI chat, and question framework
- Product management (create, edit, delete, QR lookup)
- Authentication (logout), account deletion, profile update
- Feed, scan history, documents, settings
- Crypto utilities and cleanup

---

## 6. Project Structure

```
thap-mobile/
├── client/
│   ├── src/
│   │   ├── pages/          ← Feature pages (Home, Products, AI, etc.)
│   │   ├── components/     ← Reusable UI components (shadcn/ui based)
│   │   ├── contexts/       ← React contexts (Theme, etc.)
│   │   ├── hooks/          ← Custom hooks
│   │   ├── lib/trpc.ts     ← tRPC client binding
│   │   ├── App.tsx         ← Routes and layout
│   │   └── index.css       ← Global styles and Tailwind theme
│   └── public/
│       ├── manifest.json   ← PWA manifest
│       └── sw.js           ← Service worker (offline support)
├── server/
│   ├── routers.ts          ← All tRPC procedures (API layer)
│   ├── db.ts               ← Database query helpers
│   ├── storage.ts          ← S3 file storage helpers
│   ├── *.test.ts           ← Vitest test files
│   └── _core/              ← Framework internals (OAuth, LLM, etc.)
├── drizzle/
│   ├── schema.ts           ← Database schema (source of truth)
│   └── *.sql               ← Migration files
├── shared/
│   ├── types.ts            ← Shared TypeScript types
│   ├── aiQuestions.ts      ← AI question definitions
│   └── const.ts            ← Shared constants
├── todo.md                 ← Feature and bug tracking
└── LOCAL_DEVELOPMENT.md    ← This file
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
const { data, isLoading } = trpc.products.getAll.useQuery();

// Mutation (write)
const createProduct = trpc.products.create.useMutation({
  onSuccess: () => utils.products.getAll.invalidate()
});
```

### Protected vs Public Procedures

```ts
// server/routers.ts
export const appRouter = router({
  // Accessible without login
  products: publicProcedure.query(() => { ... }),

  // Requires authenticated user — ctx.user is available
  myProducts: protectedProcedure.query(({ ctx }) => {
    return db.getProductsByUser(ctx.user.id);
  }),
});
```

---

## 8. Connecting Legacy App Features

This project was rebuilt from the legacy Flutter app (`thap_mobile_clone`). To port features from the legacy codebase:

1. **Identify the feature** in `source/lib/` of the legacy repo
2. **Map the data model** — legacy uses local SQLite, this app uses MySQL via Drizzle
3. **Add schema** in `drizzle/schema.ts` for any new tables needed
4. **Implement server procedure** in `server/routers.ts`
5. **Build the UI** using React + shadcn/ui components

**Key legacy features already ported**:
- ✅ Product catalog (browse, search, filter)
- ✅ Product detail view
- ✅ QR code scanning
- ✅ User authentication
- ✅ AI assistant with contextual questions
- ✅ Settings and preferences
- ✅ PWA (installable on mobile)

**Legacy features pending**:
- ⬜ NFC tag reading (requires Capacitor integration — see validation project)
- ⬜ Offline-first database (requires Capacitor SQLite plugin)
- ⬜ Push notifications (requires Firebase + Capacitor)
- ⬜ File system access (requires Capacitor Filesystem plugin)

---

## 9. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API layer | tRPC | End-to-end type safety, no REST boilerplate |
| ORM | Drizzle | Lightweight, type-safe, fast migrations |
| UI components | shadcn/ui | Accessible, composable, Tailwind-native |
| State management | tRPC query cache | No Redux/Zustand needed for server state |
| Auth | Manus OAuth | Pre-integrated, zero config |
| Mobile distribution | PWA + Capacitor (planned) | Web-first with native plugin access |

---

## 10. Useful Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm test         # Run test suite
pnpm check        # TypeScript type check
pnpm db:push      # Generate migrations and apply to database
```

---

## 11. Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes and write tests
3. Run `pnpm test` — all tests must pass
4. Open a pull request with a clear description

---

## 12. Related Documents

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview and template documentation |
| `todo.md` | Current feature backlog and bug tracker |
| `docs/01-product/PRD_Product_Requirements_Document.md` | Full product requirements |
| `docs/02-architecture/DESIGN_DOCUMENTATION.md` | UI/UX design decisions |
| `docs/02-architecture/ARCHITECTURAL_COMPARISON.md` | Legacy vs. rebuilt comparison |
| `docs/02-architecture/THAP_ARCHITECTURAL_RECOMMENDATION.md` | Architecture decision rationale |
| `docs/04-validation/VALIDATION_ROADMAP.md` | Capacitor validation plan (Week 1-3) |

---

**Last updated**: March 2026
