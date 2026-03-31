# Thap — Deployment Checklist

Pre-launch verification for the Thap PWA. Go through each section before deploying to production.

## Build & Environment

- [ ] `pnpm build` completes without errors
- [ ] `pnpm check` passes TypeScript checks
- [ ] `pnpm test` — all 20 test files pass
- [ ] Environment variables set: `DATABASE_URL`, `JWT_SECRET`, `VITE_GOOGLE_CLIENT_ID`
- [ ] Optional services configured: `THAP_SERVICES_BASE_URL`, `THAP_SERVICES_API_KEY` (for AI, uploads, notifications)
- [ ] No secrets in committed files (`.env`, credentials)
- [ ] Production `NODE_ENV=production` is set

## Database

- [ ] `pnpm db:push` applied — all 9 tables present: `users`, `products`, `product_instances`, `scan_history`, `ai_conversations`, `ai_provider_settings`, `product_documents`, `brand_feed_items`, `product_shares`
- [ ] Indexes exist on `userId`, `productId`, `productInstanceId` columns
- [ ] Duplicate cleanup has been run if migrating from existing data

## PWA & Service Worker

- [ ] `manifest.json` has correct `name`, `short_name`, `start_url`, `theme_color`
- [ ] PWA icons present: `favicon.svg`, `icon-192.png`, `icon-512.png` in `/client/public/`
- [ ] Service worker registers on page load
- [ ] Offline fallback page loads when network is down
- [ ] Cache versioning: bump `CACHE_VERSION` in `sw.js` on each deploy
- [ ] Lighthouse PWA score >= 90

## Performance

- [ ] Lighthouse Performance score >= 90
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] JS bundle < 300KB gzipped (check `pnpm build` output)
- [ ] Route-based code splitting active (16 lazy-loaded pages in `App.tsx`)
- [ ] Images use `loading="lazy"` where below the fold

## Accessibility (WCAG 2.1 AA)

- [ ] Skip-to-content link present and functional
- [ ] All interactive elements have focus-visible outlines
- [ ] `prefers-reduced-motion` respected for animations
- [ ] All images have `alt` attributes (or `aria-hidden` for decorative)
- [ ] Navigation has `role="navigation"` and `aria-label`
- [ ] Touch targets >= 44px x 44px
- [ ] Color contrast ratio >= 4.5:1 for text, >= 3:1 for large text
- [ ] Form inputs have associated labels

## Mobile Testing

- [ ] iOS Safari — app loads, scan works, navigation works
- [ ] Android Chrome — app loads, scan works, navigation works
- [ ] 320px viewport — no horizontal overflow, text readable
- [ ] 375px viewport — primary target, all features functional
- [ ] 428px viewport — large phone, layout fills correctly
- [ ] Camera permission prompt appears and is handled gracefully
- [ ] Add to Home Screen produces correct app experience
- [ ] Safe areas (notch, Dynamic Island) don't overlap content

## Security

- [ ] All user-scoped procedures use `protectedProcedure`
- [ ] No raw `userId` from client — always `ctx.user.id`
- [ ] AI API keys are encrypted at rest (`server/_core/crypto.ts`)
- [ ] CORS configured correctly for production domain
- [ ] `credentials: "include"` on all API calls
- [ ] Session cookie has `HttpOnly`, `Secure`, `SameSite` flags
- [ ] Input validation on all tRPC procedures (string max lengths, enums via Zod)
- [ ] `DEV_AUTH_OPEN_ID` bypass is disabled in production (`NODE_ENV` check)

## Functional Smoke Tests

- [ ] Sign in via OAuth
- [ ] View home page with My Things
- [ ] Scan a QR code → product detail
- [ ] Scan a legacy Tings QR code → deep-link resolution
- [ ] Add product to My Things
- [ ] Remove product from My Things
- [ ] Edit product (nickname, notes, tags, warranty, purchase info)
- [ ] Register a product via manufacturer form
- [ ] Share product via QR/link and view shared product page
- [ ] Accept a shared product
- [ ] Upload and delete a document (receipt, photo, manual, note)
- [ ] AI chat — ask a question, get streaming response
- [ ] Tag management — create, rename, delete tags
- [ ] Change language → app translates (14 languages)
- [ ] Change country
- [ ] View scan history, delete entries, clear all
- [ ] View brand feed
- [ ] Edit profile (name, email)
- [ ] Notification settings
- [ ] Privacy settings
- [ ] Help & support page
- [ ] Legal page
- [ ] Delete account
- [ ] Sign out

## Post-Deployment

- [ ] Error monitoring active
- [ ] Service worker update flow works (users get new version)
- [ ] Verify no console errors in production build
- [ ] Brand feed items seeded if needed (`scripts/seed-brand-feed.ts`)
