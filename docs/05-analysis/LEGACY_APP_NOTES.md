# Legacy App Analysis Notes

**Legacy repository**: `thap_mobile_clone-main (legacy)`  
**Framework**: Flutter (Dart)  
**Analysis date**: March 2026

---

## Legacy App Overview

The original Thap app was built with Flutter and Dart. Key characteristics:

| Property | Value |
|----------|-------|
| Framework | Flutter |
| Language | Dart |
| Database | Local SQLite (drift package) |
| State management | Riverpod |
| Navigation | go_router |
| QR scanning | mobile_scanner |
| NFC | flutter_nfc_kit |
| HTTP client | dio |
| Build system | Gradle (Android), Xcode (iOS) |
| Test coverage | 0 test files, 0 test cases |

---

## Feature Inventory (Legacy)

Features identified in `source/lib/`:

| Feature | Legacy Implementation | Rebuilt? |
|---------|----------------------|---------|
| Product catalog | `features/products/` | ✅ Yes |
| Product detail | `features/product_detail/` | ✅ Yes |
| QR scanning | `features/scan/` | ✅ Yes |
| Scan history | `features/scan_history/` | ✅ Yes |
| User authentication | `features/auth/` | ✅ Yes |
| Settings | `features/settings/` | ✅ Yes |
| Language selection | `features/onboarding/` | ✅ Yes |
| Country selection | `features/onboarding/` | ✅ Yes |
| NFC reading | `features/nfc/` | ⬜ Planned (Capacitor) |
| Offline database | SQLite via drift | ⬜ Planned (Capacitor SQLite) |
| Push notifications | firebase_messaging | ⬜ Planned (Firebase + Capacitor) |
| AI assistant | Not present | ✅ New feature added |
| Digital Product Passport | Partial | ✅ Enhanced |

---

## Key Differences

### Data Layer

**Legacy**: Local SQLite database (drift ORM), data lives on device, no server sync  
**Rebuilt**: MySQL/TiDB server database via Drizzle ORM, with planned offline SQLite layer via Capacitor

**Implication for migration**: Legacy app data cannot be automatically migrated. Users will start fresh or a migration script will be needed.

### Authentication

**Legacy**: Custom auth implementation  
**Rebuilt**: Manus OAuth (JWT sessions)

**Implication**: Users will need to re-authenticate. No shared user identity.

### AI Features

**Legacy**: Not present  
**Rebuilt**: Full AI assistant with 50+ contextual question types, configurable providers

### NFC Implementation

**Legacy**: `flutter_nfc_kit` — mature, production-tested  
**Rebuilt**: `@capacitor/nfc` — to be validated in Week 2 of validation sprint

**Risk**: NFC plugin maturity difference. Legacy plugin has more production deployments.

---

## Porting Guide for Team Members

When porting a feature from legacy to the rebuilt app:

1. **Find the feature** in `source/lib/features/<feature_name>/`
2. **Understand the data model** — legacy uses local SQLite tables
3. **Map to server schema** — add tables to `drizzle/schema.ts`
4. **Port business logic** — translate Dart to TypeScript
5. **Add tRPC procedure** in `server/routers.ts`
6. **Build UI** using React + shadcn/ui (reference legacy screens for UX patterns)
7. **Write tests** in `server/<feature>.test.ts`

### Dart → TypeScript Patterns

| Dart Pattern | TypeScript Equivalent |
|-------------|----------------------|
| `Future<T>` | `Promise<T>` |
| `Stream<T>` | `AsyncGenerator<T>` or tRPC subscription |
| `Riverpod Provider` | tRPC query cache |
| `drift Table` | Drizzle table schema |
| `go_router` | wouter (used in this project) |
| `dio` HTTP client | tRPC procedure (no direct HTTP) |

---

## Legacy Code Location

The legacy repository ZIP is available at: `thap_mobile_clone-main(legacy).zip`

Key directories:
```
source/
  lib/
    features/     ← Feature implementations
    core/         ← Shared utilities
    data/         ← Data models and repositories
    domain/       ← Business logic
  test/           ← (empty — no tests)
  pubspec.yaml    ← Dependencies
```

---

**Last updated**: March 2026
