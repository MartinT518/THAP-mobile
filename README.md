# Thap - Product Lifecycle Manager

A mobile-first Progressive Web App (PWA) for managing product lifecycles, built with React, TypeScript, and tRPC. Thap helps users track their products from discovery through ownership to end-of-life, with AI-powered assistance for product-related questions.

## Features

### Core Functionality

- **QR Code Scanning**: Scan product QR codes using device camera to add products to your collection
- **Legacy Deep-Link Resolution**: Resolve `id.tings.info` / `qr.tings.info` QR codes via the Tings v2 API
- **Product Management**: Track owned products with purchase details, warranty information, and custom notes
- **Product Registration**: Register products directly with manufacturers via in-app forms
- **Tag Management**: Organise products with custom tags (create, rename, delete)
- **Scan History**: View, delete, and clear previously scanned products
- **Product Search**: Real-time search across all products by name, brand, model, or category; external product lookup via Icecat
- **Document Attachments**: Upload receipts, photos, manuals, and notes to product instances (S3 storage)
- **Brand Feed**: Curated news and promotional content matched to products by brand

### AI Assistant

- **Context-Aware Questions**: 50+ pre-defined questions organised by product lifecycle stage
  - **Discovery Stage**: Pre-purchase questions about product features, pricing, and comparisons
  - **Ownership Stage**: Usage, maintenance, troubleshooting, and care instructions
  - **End-of-Life Stage**: Resale value, recycling, and disposal information
- **Domain-Specific Questions**: Specialised question sets for electronics, clothing, furniture, tools, vehicles, and more
- **8 Universal Categories**: Product info, Quality & materials, Price & value, Usage & maintenance, Compatibility, Warranty & support, Sustainability, Resale & reuse
- **Server-Side AI**: OpenAI-compatible chat completions via `THAP_SERVICES_BASE_URL`
- **Per-User Provider Settings**: Users can store their own API keys for different providers
- **Conversation History**: Persistent per-product AI chat threads

### User Experience

- **Mobile-First Design**: Optimised for mobile devices with touch-friendly interface
- **Bottom Navigation**: Home, Search, Scan, Feed, and Menu
- **Route-Level Code Splitting**: Lazy-loaded pages for fast initial load
- **Loading Skeletons**: Smooth loading states with animated placeholders
- **Pull-to-Refresh**: Native-feeling refresh on scrollable views
- **Error Boundaries**: Graceful error handling with retry
- **Animated Transitions**: Page and card animations via Framer Motion
- **PWA Support**: Installable on mobile devices, offline fallback, service worker caching
- **Multi-Language Support**: 14 languages (English, Estonian, Finnish, Swedish, Norwegian, Danish, German, French, Spanish, Italian, Portuguese, Polish, Russian, Chinese)

### Settings & Customisation

- **User Account Management**: View profile, statistics, edit name/email
- **Language & Country Selection**: Localised content in 14 languages
- **AI Provider Configuration**: Store API keys for different AI providers
- **Notification & Privacy Settings**: Manage notification preferences and privacy controls
- **Database Cleanup**: Remove duplicate products and scan history
- **Help & Support / Legal Pages**: In-app help and legal information

## Tech Stack

### Frontend
- **React 19** with hooks and concurrent features
- **TypeScript 5.9**
- **Tailwind CSS 4** (utility-first styling)
- **Wouter 3** (lightweight routing)
- **shadcn/ui** (Radix-based component library)
- **TanStack Query 5** (data fetching and caching)
- **tRPC 11** (end-to-end typesafe APIs)
- **Framer Motion** (animations)
- **i18next + react-i18next** (internationalisation)
- **@yudiel/react-qr-scanner** (QR scanning)
- **Lucide React** (icons)
- **Sonner** (toast notifications)
- **Recharts** (charts, installed but not currently used)

### Backend
- **Node.js 20+** (JavaScript runtime)
- **Express 4** (web framework)
- **tRPC 11** (type-safe API layer)
- **Drizzle ORM** (TypeScript ORM with MySQL)
- **MySQL 8 / TiDB** (database)
- **OpenAI SDK** (AI chat completions)
- **Axios + Cheerio** (OpenGraph scraping, Icecat API)
- **jose** (JWT / cookie auth)
- **AWS S3** (document storage)
- **Superjson** (JSON serialisation with Date support)

### Development Tools
- **Vite 7** (build tool)
- **Vitest 2** (unit testing)
- **TSX** (TypeScript execution)
- **ESLint + Prettier** (code quality)
- **pnpm 10** (package manager)
- **Docker Compose** (local MySQL)
- **Sharp** (PWA icon generation)

## Project Structure

```
thap-mobile/
├── client/                    # Frontend application
│   ├── public/
│   │   ├── assets/           # Static image assets
│   │   ├── manifest.json     # PWA manifest
│   │   ├── sw.js             # Service worker
│   │   ├── favicon.svg       # SVG favicon
│   │   ├── icon-192.png      # PWA icon 192px
│   │   └── icon-512.png      # PWA icon 512px
│   ├── src/
│   │   ├── _core/
│   │   │   └── hooks/useAuth.ts   # Authentication hook
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # shadcn/ui primitives (28 components)
│   │   │   ├── AnimatedCard.tsx
│   │   │   ├── AppBar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorRetry.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   ├── ProductCardSkeleton.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── PullToRefreshIndicator.tsx
│   │   │   └── QRCodeSheet.tsx
│   │   ├── pages/            # Page components (24 pages)
│   │   │   ├── Home.tsx
│   │   │   ├── Search.tsx
│   │   │   ├── Scan.tsx
│   │   │   ├── Feed.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── MenuPage.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── ProductEdit.tsx
│   │   │   ├── ProductRegister.tsx
│   │   │   ├── SharedProduct.tsx
│   │   │   ├── AIChat.tsx
│   │   │   ├── AISettings.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── TagManagement.tsx
│   │   │   ├── LanguageSelection.tsx
│   │   │   ├── CountrySelection.tsx
│   │   │   ├── ScanHistory.tsx
│   │   │   ├── UserAccount.tsx
│   │   │   ├── ProfileEdit.tsx
│   │   │   ├── NotificationSettings.tsx
│   │   │   ├── PrivacySettings.tsx
│   │   │   ├── HelpSupportPage.tsx
│   │   │   ├── LegalPage.tsx
│   │   │   └── NotFound.tsx
│   │   ├── locales/          # i18n translation files (14 languages)
│   │   ├── lib/trpc.ts       # tRPC client binding
│   │   ├── const.ts          # Client constants
│   │   ├── App.tsx           # Routes and layout
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles and Tailwind theme
│   └── index.html            # HTML template
├── server/                    # Backend application
│   ├── _core/                # Framework internals
│   │   ├── index.ts          # Express + Vite server entry
│   │   ├── trpc.ts           # tRPC base (router, procedures)
│   │   ├── context.ts        # Request context (auth, user)
│   │   ├── env.ts            # Environment variable loading
│   │   ├── oauth.ts          # Google OAuth callback
│   │   ├── googleAuth.ts     # Google ID token verify + session JWT
│   │   ├── devAuth.ts        # Dev-mode auth bypass
│   │   ├── cookies.ts        # Cookie helpers
│   │   ├── crypto.ts         # Encryption utilities
│   │   ├── llm.ts            # LLM chat completion
│   │   ├── aiProviders.ts    # AI provider registry
│   │   ├── vite.ts           # Vite dev middleware
│   │   ├── notification.ts   # Push notification helpers
│   │   ├── systemRouter.ts   # System health + admin procedures
│   │   └── types/            # Type declarations
│   ├── db.ts                 # Database query helpers
│   ├── routers.ts            # All tRPC procedures (API layer)
│   ├── storage.ts            # S3 file storage helpers
│   ├── opengraph.ts          # OpenGraph URL scraping
│   ├── deeplinkTings.ts      # Legacy Tings deep-link resolver
│   ├── icecat.ts             # Icecat product lookup
│   ├── _testHelpers.ts       # Shared test utilities
│   └── *.test.ts             # 20 Vitest test files
├── drizzle/                   # Database
│   ├── schema.ts             # Table definitions (source of truth)
│   ├── *.sql                 # Generated migration files
│   └── meta/                 # Drizzle migration metadata
├── shared/                    # Code shared between client and server
│   ├── types.ts              # Shared TypeScript types
│   ├── const.ts              # Shared constants
│   ├── aiQuestions.ts         # AI question framework
│   └── _core/errors.ts       # Error definitions
├── scripts/                   # Build and utility scripts
│   ├── generate-pwa-icons.mjs
│   ├── seed-brand-feed.ts
│   └── services-cli.mjs
├── serviceScripts/            # Docker service management (sh + ps1)
├── docker-compose.yml         # Local MySQL 8.4
├── .env.example               # Environment variable template
├── LOCAL_SETUP.md             # Step-by-step local setup
├── LOCAL_DEVELOPMENT.md       # Developer guide
└── DEPLOYMENT_CHECKLIST.md    # Pre-launch verification
```

## Database Schema

### Tables

**users** — User authentication and profile information
- Fields: id, openId, name, email, loginMethod, role, languageCode, countryCode, postalCode, tagOrder, createdAt, updatedAt, lastSignedIn

**products** — Product catalogue with specifications
- Fields: id, productId (external), name, brand, model, category, imageUrl, barcode, metadata (JSON), createdAt, updatedAt

**productInstances** — User-owned products with custom data
- Fields: id, userId, productId, nickname, purchaseDate, purchasePrice, purchaseLocation, warrantyExpiry, notes, tags (JSON), addedAt, updatedAt

**scanHistory** — Track scanned products
- Fields: id, userId, productId, scannedAt

**aiConversations** — AI chat history
- Fields: id, userId, productId, provider, messages (JSON), createdAt, updatedAt

**aiProviderSettings** — AI provider configurations per user
- Fields: id, userId, provider, apiKey, isActive, createdAt, updatedAt

**productDocuments** — Receipts, photos, manuals, notes attached to products
- Fields: id, productInstanceId, userId, documentType, title, fileUrl, fileKey, mimeType, textContent, createdAt

**brandFeedItems** — Curated brand news and promotional content
- Fields: id, brandKey, kind (news/commercial), title, summary, imageUrl, linkUrl, publishedAt, createdAt

**productShares** — Product sharing between users
- Fields: id, productInstanceId, senderUserId, recipientUserId, shareToken, status (pending/accepted/dismissed/revoked), createdAt, updatedAt

## API Endpoints (tRPC)

### Authentication
- `auth.me` — Get current user
- `auth.logout` — Sign out
- `auth.deleteAccount` — Delete user account and all data

### Products
- `products.myProducts` — List owned products
- `products.getById` — Get product details
- `products.getByProductId` — Get product by external product ID
- `products.getInstance` — Get product instance
- `products.addToMyThings` — Add product to collection
- `products.removeFromMyThings` — Remove product from collection
- `products.updateProductInstance` — Update product instance
- `products.lookupByQR` — Resolve QR code to product (incl. Tings deep links)
- `products.searchExternal` — External product search (Icecat)
- `products.scrapeUrl` — OpenGraph URL scraping
- `products.getRegistrationForm` — Get product registration form
- `products.registerProduct` — Submit product registration
- `products.sendFeedback` — Send product feedback

### Tags
- `tags.list` — List user tags
- `tags.rename` — Rename a tag
- `tags.delete` — Delete a tag
- `tags.reorder` — Reorder tags (update tag order)

### Scan History
- `scanHistory.list` — List scan history
- `scanHistory.add` — Add scan entry
- `scanHistory.delete` — Delete scan entry
- `scanHistory.clear` — Clear all scan history

### AI
- `ai.getProviders` — List available AI providers
- `ai.getActiveProvider` — Get user's active provider
- `ai.saveProvider` — Save AI provider settings
- `ai.getConversations` — List AI conversations
- `ai.getConversation` — Get conversation by ID
- `ai.getConversationByProduct` — Get conversation for product
- `ai.chat` — Send message to AI

### Feed
- `feed.list` — List brand feed items for user's products

### Sharing
- `sharing.createShareLink` — Create a share link for a product instance
- `sharing.getByToken` — Get share details by token
- `sharing.accept` — Accept a shared product
- `sharing.dismiss` — Dismiss a share invitation
- `sharing.revoke` — Revoke a pending share
- `sharing.sharedWithMe` — List products shared with current user
- `sharing.myOutgoingShares` — List shares sent by current user

### Documents
- `documents.list` — List documents for product instance
- `documents.upload` — Upload document (base64 data via storage proxy)
- `documents.create` — Create document record
- `documents.delete` — Delete document

### User Settings
- `userSettings.get` — Get user preferences
- `userSettings.update` — Update preferences
- `userSettings.updateProfile` — Update name/email

### Demo & Cleanup
- `demo.seedData` — Load demo products
- `cleanup.removeDuplicates` — Remove duplicate products

### System
- `system.health` — Health check
- `system.notifyOwner` — Send notification to admin

## Setup Instructions

### Prerequisites
- Node.js 20+
- pnpm 10+
- MySQL 8+ (or use Docker Compose)

### Quick Start

```bash
git clone <repository-url>
cd thap-mobile
pnpm install

# Start MySQL (if using Docker)
docker compose up -d

# Create .env from template
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET

# Apply database schema
pnpm db:push

# Start development server
pnpm dev        # → http://localhost:3000

# Run tests
pnpm test
```

See [`LOCAL_SETUP.md`](LOCAL_SETUP.md) for detailed step-by-step instructions and [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md) for the developer guide.

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start dev server (Vite HMR + Express + tRPC) on port 3000 |
| `pnpm build` | Production build (Vite frontend + esbuild server) |
| `pnpm start` | Run production build |
| `pnpm test` | Run Vitest test suite (20 test files) |
| `pnpm check` | TypeScript type check (`tsc --noEmit`) |
| `pnpm format` | Format code with Prettier |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm icons` | Generate PWA icons from source SVG |
| `pnpm services:start` | Start Docker services (MySQL) |
| `pnpm services:stop` | Stop Docker services |
| `pnpm services:restart` | Restart Docker services |

## Testing

20 test files in `server/` covering:
- AI assistant, AI chat, AI question framework
- Product management (create, edit, delete, QR lookup, registration, removal)
- Authentication (logout), account deletion, profile update
- Feed, scan history, documents, settings, sharing
- OpenGraph scraping, deep-link resolution
- Crypto utilities, cleanup

Tests use Vitest with mocked contexts — no database required.

```bash
pnpm test
```

## Deployment

The app is designed to be deployed on the Manus platform:

1. `pnpm build` — compiles frontend to `dist/public/`, bundles server to `dist/index.js`
2. `pnpm start` — runs the production build
3. Environment variables must be set in production (see `.env.example`)
4. SSL certificates are automatically managed on Manus

See [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) for full pre-launch verification.

## License

MIT

---

**Last Updated**: March 2026
**Status**: Active Development
