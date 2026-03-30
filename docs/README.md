# Thap — Documentation Index

This folder contains all documentation for the **Thap Product Lifecycle Manager** application.

---

## Folder Structure

```
docs/
├── 01-product/              ← Product vision, requirements, roadmap
├── 02-architecture/         ← Technical architecture decisions
├── 03-development/        ← Local setup, env vars, dev workflows
├── 04-validation/           ← Capacitor validation plan and logs
└── 05-analysis/             ← Research and analysis documents
```

---

## 03 — Development

| Document | Description |
|----------|-------------|
| `ENVIRONMENT_VARIABLE_SOURCES.md` | **Where to get each `.env` value** (DB, JWT, OAuth, services API, maps) and how they map to the code. |

*(Repo root: `LOCAL_SETUP.md` for install steps; `.env.example` for the variable list.)*

---

## 01 — Product

| Document | Description |
|----------|-------------|
| `PRD_Product_Requirements_Document.md` | **Start here.** Full product requirements, functional specs, non-functional requirements, roadmap, and risk register. |

---

## 02 — Architecture

| Document | Description |
|----------|-------------|
| `THAP_ARCHITECTURAL_RECOMMENDATION.md` | **Decision document.** Tailored architectural recommendation (React PWA + Capacitor) based on specific product requirements. |
| `ARCHITECTURAL_COMPARISON_UNBIASED.md` | Unbiased comparison of Flutter (legacy) vs. React PWA vs. React PWA + Capacitor. Decision-grade analysis. |
| `DESIGN_DOCUMENTATION.md` | UI/UX design decisions, colour palette, typography, component patterns. |

---

## 04 — Validation

| Document | Description |
|----------|-------------|
| `CAPACITOR_SETUP_INSTRUCTIONS.md` | Capacitor setup and prerequisites. |
| `VALIDATION_ROADMAP.md` | 3-week Capacitor validation plan. Week-by-week breakdown of what to test and how to make the GO/NO-GO decision. |
| `VALIDATION_LOG.md` | Log template for test results. |

---

## 05 — Analysis

| Document | Description |
|----------|-------------|
| `LEGACY_APP_NOTES.md` | Analysis notes of the original Flutter app. |

---

## Quick Reference

### What is Thap?

A consumer mobile app for product lifecycle management. Users scan QR codes and NFC tags to access full product history, materials, care instructions, and AI-assisted product discovery.

### Current Status

- **v1.0 Demo**: Complete. React 19 + TypeScript + tRPC web app, PWA-installable on mobile.
- **v1.1 Native**: In planning. Capacitor integration for push notifications, NFC, offline DB, file system.

### Architecture Decision

**React PWA + Capacitor (Android-first)** — chosen over Flutter legacy app and pure PWA.

Key reasons:
- Must-have features (NFC, push, offline DB, file system) all supported by Capacitor plugins
- Android-first eliminates iOS Safari limitations
- Web development velocity (AI-assisted, fast iteration)
- 65-67% lower cost vs. Flutter rebuild
- Validation-first approach: 3-week sprint before full commitment

### Key Contacts

- **Product & AI**: Mr. Martin (Head of Product & AI)

---

**Last updated**: March 2026
