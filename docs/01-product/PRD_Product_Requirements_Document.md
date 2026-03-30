# Thap — Product Requirements Document (PRD)
---

## 1. Executive Summary

Thap is a **consumer mobile application** for product lifecycle management, enabling users to scan, track, and understand the full lifecycle of physical products through QR codes and NFC tags. The application provides AI-assisted product discovery, Digital Product Passport (DPP) compliance, and a seamless mobile-first experience.

The current version is a **production-ready demo** built with React 19 + TypeScript + tRPC, targeting Android-first distribution via direct APK, with iOS planned for a later phase.

---

## 2. Product Vision

> **"Make every product's story accessible to the people who own it."**

Thap bridges the gap between physical products and their digital identities, giving consumers transparency into what they own, where it came from, and how to care for it responsibly.

---

## 3. Target Users

### Persona 1: Tech-Savvy Minimalist (Primary)
- Age: 25-40
- Behaviour: Early adopter, values transparency and sustainability
- Goal: Understand the full story of products they purchase
- Pain point: No easy way to access product lifecycle data
- How Thap helps: One scan reveals full product history, materials, and care instructions

### Persona 2: Sustainability-Conscious Consumer
- Age: 28-45
- Behaviour: Researches brands before buying, tracks product impact
- Goal: Make informed purchasing decisions aligned with values
- Pain point: Greenwashing is rampant, hard to verify claims
- How Thap helps: Verified product data via Digital Product Passport standards

### Persona 3: Product Manager / Brand Owner (Secondary)
- Age: 30-50
- Behaviour: Manages product portfolios, needs lifecycle visibility
- Goal: Track product instances, manage product data
- Pain point: Fragmented data across systems
- How Thap helps: Centralised product management with AI assistance

---

## 4. Platform & Distribution

| Dimension | Current State | Future State |
|-----------|--------------|--------------|
| Primary platform | Android (APK direct distribution) | Android + iOS |
| Distribution method | Direct APK / PWA install | Google Play + App Store |
| Architecture | React PWA + Capacitor (planned) | Same |
| Offline support | Planned (Capacitor SQLite) | Full offline-first |
| App store presence | Not required for demo phase | Required for public launch |

---

## 5. Must-Have Features (Non-Negotiable)

These features are **required** for production readiness. They are not optional.

| Feature | Priority | Status | Implementation Path |
|---------|----------|--------|---------------------|
| Push notifications | P0 | Planned | Firebase + Capacitor Push Notifications plugin |
| NFC tag reading | P0 | Planned | Capacitor NFC plugin |
| Offline-first database | P0 | Planned | Capacitor SQLite plugin |
| File system access | P0 | Planned | Capacitor Filesystem plugin |
| QR code scanning | P0 | Implemented | Browser camera API |
| AI assistant | P0 | Implemented | tRPC + LLM integration |
| User authentication | P0 | Implemented | Manus OAuth |

---

## 6. Nice-to-Have Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Bluetooth connectivity | P2 | For device pairing |
| Biometric authentication | P2 | Fingerprint/face unlock |
| Background scanning | P2 | Requires native integration |
| Product comparison | P2 | Compare two products side by side |
| Export to PDF/CSV | P2 | Product data export |
| Multi-language (EN + ET) | P2 | English and Estonian |

---

## 7. Functional Requirements

### FR-1: User Authentication

**FR-1.1** Users must be able to log in via OAuth (Manus OAuth provider).  
**FR-1.2** Users must be able to log out from any screen.  
**FR-1.3** Session must persist across app restarts.  
**FR-1.4** Unauthenticated users must be redirected to login screen.  
**FR-1.5** Users must be able to select their country during onboarding.  
**FR-1.6** Users must be able to select their preferred language during onboarding.

**Acceptance criteria**: User can complete full auth flow in under 60 seconds.

---

### FR-2: QR Code Scanning

**FR-2.1** Users must be able to scan QR codes using the device camera.  
**FR-2.2** Scan must resolve to a product detail page within 2 seconds.  
**FR-2.3** Scan history must be persisted and accessible from the main navigation.  
**FR-2.4** Users must be able to clear scan history.  
**FR-2.5** Unsupported QR codes must show a clear error message.

**Acceptance criteria**: Scan success rate >95% under normal lighting conditions.

---

### FR-3: NFC Tag Reading (Planned — Capacitor)

**FR-3.1** Users must be able to read NFC tags by tapping device to tag.  
**FR-3.2** NFC scan must resolve to same product detail flow as QR scan.  
**FR-3.3** App must handle NFC unavailable gracefully (older devices).  
**FR-3.4** NFC reading must work when app is in foreground.

**Acceptance criteria**: NFC read success rate >90% on compatible devices.

---

### FR-4: Product Catalog & Discovery

**FR-4.1** Users must be able to browse a product catalog.  
**FR-4.2** Users must be able to search products by name, brand, or category.  
**FR-4.3** Users must be able to filter products by category.  
**FR-4.4** Product list must load within 2 seconds.  
**FR-4.5** Users must be able to view product detail including: name, brand, description, category, materials, care instructions, sustainability score.

---

### FR-5: Product Management

**FR-5.1** Authenticated users must be able to create new product entries.  
**FR-5.2** Users must be able to edit products they own.  
**FR-5.3** Users must be able to delete products they own.  
**FR-5.4** Product edits must be validated before saving.  
**FR-5.5** Users must be able to add product instances (physical items).

---

### FR-6: AI Assistant

**FR-6.1** Users must be able to ask questions about any product.  
**FR-6.2** The AI must provide contextual suggested questions based on product type.  
**FR-6.3** The AI must support at minimum 50 contextual question types.  
**FR-6.4** Users must be able to configure their AI provider (API key, model).  
**FR-6.5** AI responses must render markdown formatting correctly.  
**FR-6.6** Chat history must persist within a session.  
**FR-6.7** Users must be able to clear chat history.

**Acceptance criteria**: AI response time <5 seconds for standard queries.

---

### FR-7: Push Notifications (Planned — Firebase + Capacitor)

**FR-7.1** App must request notification permission on first launch.  
**FR-7.2** App must receive push notifications when in foreground.  
**FR-7.3** App must receive push notifications when in background.  
**FR-7.4** App must receive push notifications when closed.  
**FR-7.5** Tapping a notification must deep-link to the relevant screen.  
**FR-7.6** Users must be able to manage notification preferences in Settings.

**Acceptance criteria**: Notification delivery rate >95%, latency <5 seconds.

---

### FR-8: Offline Support (Planned — Capacitor SQLite)

**FR-8.1** App must function without internet connection for core features.  
**FR-8.2** Previously viewed products must be accessible offline.  
**FR-8.3** Scan history must be available offline.  
**FR-8.4** App must sync data when connection is restored.  
**FR-8.5** Offline state must be clearly indicated to the user.

---

### FR-9: File System (Planned — Capacitor Filesystem)

**FR-9.1** Users must be able to export product data as a file.  
**FR-9.2** Users must be able to save product images to device storage.  
**FR-9.3** App must handle storage permission request gracefully.

---

### FR-10: Settings & Preferences

**FR-10.1** Users must be able to change language.  
**FR-10.2** Users must be able to change country.  
**FR-10.3** Users must be able to manage AI provider settings.  
**FR-10.4** Users must be able to manage notification preferences.  
**FR-10.5** Users must be able to view account information.  
**FR-10.6** Users must be able to delete their account.

---

## 8. Non-Functional Requirements

### NFR-1: Performance

| Metric | Target |
|--------|--------|
| Page load time | <2 seconds |
| API response time | <500ms (p95) |
| QR scan to product detail | <2 seconds |
| AI response time | <5 seconds |
| Build time (incremental) | <30 seconds |
| Build time (clean) | <5 minutes |

### NFR-2: Reliability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Crash rate | <0.1% of sessions |
| Data loss | Zero tolerance |
| Push notification delivery | >95% |

### NFR-3: Scalability

| Metric | Target |
|--------|--------|
| Concurrent users | 100,000 |
| Registered users | 1,000,000 |
| Products in catalog | 10,000,000 |
| API requests/second | 10,000 |

### NFR-4: Security

- All API communication over HTTPS
- OAuth 2.0 for authentication
- JWT tokens with expiry
- API rate limiting
- No sensitive data in client-side storage
- Input validation on all user-submitted data

### NFR-5: Compatibility

| Platform | Minimum Version |
|----------|----------------|
| Android | 8.0 (API 26) |
| iOS (future) | 14.0 |
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 88+ |

### NFR-6: Accessibility

- WCAG 2.1 AA target
- Minimum touch target size: 44×44px
- Sufficient colour contrast ratios
- Screen reader compatibility

---

## 9. Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| UI Components | shadcn/ui |
| API Layer | tRPC 11 (end-to-end type safety) |
| Backend | Express 4, Node.js |
| ORM | Drizzle ORM |
| Database | MySQL / TiDB |
| Auth | Manus OAuth (JWT sessions) |
| AI | Configurable LLM (user-provided API key) |
| File Storage | S3-compatible |
| Mobile (planned) | Capacitor 6 |
| Build Tool | Vite |
| Testing | Vitest |

### Architecture Pattern

```
Client (React PWA)
    ↕ tRPC (type-safe RPC over HTTP)
Server (Express + tRPC)
    ↕ Drizzle ORM
Database (MySQL/TiDB)
    +
    ↕ S3 (file storage)
    ↕ LLM API (AI features)
    ↕ Firebase (push notifications — planned)
```

### Key Design Decisions

1. **tRPC over REST**: Eliminates API contract drift, provides end-to-end type safety without code generation
2. **Drizzle ORM**: Lightweight, type-safe, fast migrations — schema-first workflow
3. **PWA + Capacitor**: Web-first development velocity with native plugin access for must-have features
4. **Android-first**: Avoids iOS Safari Web API restrictions during validation phase
5. **User-provided AI keys**: Avoids AI cost absorption; users bring their own API keys

---

## 10. Database Schema (Current)

### Core Tables

**users** — Authenticated user accounts  
**products** — Product catalog entries  
**product_instances** — Physical instances of products  
**scan_history** — QR/NFC scan records  
**ai_conversations** — AI chat sessions  
**ai_messages** — Individual AI chat messages  
**user_settings** — Per-user preferences  

Full schema defined in `drizzle/schema.ts`.

---

## 11. API Endpoints (tRPC Procedures)

### Public Procedures
- `products.getAll` — Browse product catalog
- `products.getById` — Get product detail
- `products.search` — Search products

### Protected Procedures (require auth)
- `products.create` — Create product
- `products.update` — Update product
- `products.delete` — Delete product
- `scanHistory.getAll` — Get user's scan history
- `scanHistory.add` — Record a scan
- `ai.chat` — Send message to AI assistant
- `ai.getHistory` — Get chat history
- `settings.get` — Get user settings
- `settings.update` — Update user settings
- `auth.me` — Get current user
- `auth.logout` — Log out

---

## 12. Current Implementation Status

### Implemented (v1.0)

| Feature | Status | Notes |
|---------|--------|-------|
| User authentication | ✅ Complete | Manus OAuth |
| Product catalog | ✅ Complete | Browse, search, filter |
| Product detail | ✅ Complete | Full product view |
| Product management | ✅ Complete | Create, edit, delete |
| QR code scanning | ✅ Complete | Camera API |
| Scan history | ✅ Complete | Persisted per user |
| AI assistant | ✅ Complete | 50+ question types |
| AI provider settings | ✅ Complete | Configurable API key/model |
| User settings | ✅ Complete | Language, country, preferences |
| PWA manifest | ✅ Complete | Installable on mobile |
| Service worker | ✅ Complete | Basic offline caching |
| Mobile-first UI | ✅ Complete | Bottom navigation |
| Dark/light theme | ✅ Complete | |
| Feed / notifications | ✅ Complete | Basic feed |

### Planned (v1.1 — Capacitor Integration)

| Feature | Status | Notes |
|---------|--------|-------|
| Push notifications | ⬜ Planned | Firebase + Capacitor |
| NFC tag reading | ⬜ Planned | Capacitor NFC plugin |
| Offline-first DB | ⬜ Planned | Capacitor SQLite |
| File system access | ⬜ Planned | Capacitor Filesystem |
| APK build pipeline | ⬜ Planned | Android Studio + Capacitor |

---

## 13. Test Coverage

| File | Test Cases | Status |
|------|-----------|--------|
| `server/aiQuestions.test.ts` | 26 | ✅ Passing |
| `server/ai.test.ts` | 6 | ⚠️ 4 passing, 2 failing |
| `server/products.test.ts` | 4 | ✅ Passing |
| `server/productEdit.test.ts` | 3 | ✅ Passing |
| `server/auth.logout.test.ts` | 1 | ✅ Passing |
| **Total** | **40** | **38 passing, 2 failing** |

**CI/CD**: Not yet configured. No GitHub Actions, no pre-commit hooks, no automated test gating.

**Target**: 70% code coverage with CI/CD gating by v1.1.

---

## 14. Product Roadmap

### v1.0 — Demo Ready (Current)
- ✅ Full web app with all core features
- ✅ PWA installable on mobile
- ✅ AI assistant with configurable providers
- ✅ 40 backend tests

### v1.1 — Native Mobile (Q2 2026)
- ⬜ Capacitor integration validated (3-week validation sprint)
- ⬜ Push notifications (Firebase)
- ⬜ NFC tag reading
- ⬜ Offline-first database (SQLite)
- ⬜ File system access
- ⬜ APK distribution pipeline
- ⬜ CI/CD with GitHub Actions

### v1.2 — Production Hardening (Q3 2026)
- ⬜ Full i18n (English + Estonian)
- ⬜ Product comparison feature
- ⬜ Export to PDF/CSV
- ⬜ Digital Product Passport compliance
- ⬜ 70%+ test coverage
- ⬜ Performance optimisation

### v2.0 — Market Ready (Q4 2026)
- ⬜ Google Play Store submission
- ⬜ iOS support (App Store)
- ⬜ B2B features (brand portal)
- ⬜ Marketplace integration
- ⬜ Investor demo package

---

## 15. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Capacitor plugin compatibility issues | Medium | High | 3-week validation sprint before full commitment |
| iOS Safari Web API restrictions | Low | Medium | Android-first strategy defers this risk |
| AI API key friction for consumers | High | Medium | Evaluate embedded key model for v2.0 |
| Database performance at scale | Low | High | TiDB auto-scaling, query optimisation |
| NFC not available on all devices | Medium | Medium | Graceful fallback to QR scanning |
| Test coverage gaps | High | Medium | CI/CD setup in v1.1 sprint |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| DPP | Digital Product Passport — EU standard for product lifecycle data |
| NFC | Near Field Communication — short-range wireless technology for tag reading |
| PWA | Progressive Web App — web app installable on mobile devices |
| Capacitor | Cross-platform native runtime for web apps (by Ionic) |
| tRPC | TypeScript Remote Procedure Call — type-safe API layer |
| TWA | Trusted Web Activity — Android wrapper for PWAs |
| APK | Android Package — Android app distribution format |

---