# Thap Mobile App - Current TODO

This file was cleaned up to reflect the current codebase.
Duplicate entries were merged, outdated unchecked items that are already implemented were removed from the active backlog, and completed work was grouped separately.

## Actual TODO

### Account & Settings
- [x] Implement real profile editing for user name/email instead of routing "Edit profile" to general settings
- [x] Implement account deletion end to end (currently still a placeholder)
- [x] Add real notifications settings instead of a "coming soon" toast
- [x] Add real privacy settings instead of a "coming soon" toast

### Product Management
- [x] Add "Remove from My Things" in the UI with confirmation
- [x] Add clearer ownership status in the UI where scanned and owned states should be distinguished
- [x] Add product sharing functionality

### Platform & Quality
- [x] Verify and harden offline access for owned products beyond the current cached app shell
- [x] Implement remaining design polish: animations and micro-interactions
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [x] Verify WCAG 2.1 AA compliance
- [x] Optimize performance to keep app launch under 3 seconds
- [ ] Test camera permissions on real mobile devices
- [x] Verify responsive behavior across target mobile screen sizes
- [x] Add unit tests for critical features that still lack coverage
- [x] Create a final deployment checkpoint/checklist

## Done

### Core App Foundation
- [x] PWA manifest and service worker are in place
- [x] Mobile-first design system, typography, spacing, app bar, and bottom navigation are implemented
- [x] Reusable UI components and loading skeletons are in place

### Backend & Data
- [x] Core database schema is implemented for products, product instances, scan history, user settings, AI conversations, and tags
- [x] Database migrations and duplicate-cleanup utilities are implemented
- [x] QR lookup supports local lookup plus external product API fallback

### Authentication & User Preferences
- [x] Google OAuth login, session persistence, and sign out are implemented
- [x] Language selection and country selection pages exist
- [x] Language and country preferences persist for the user
- [x] i18n is configured with 14 languages

### Product Flows
- [x] Home page shows "My Things" with grid/list views, category filters, and tag filters
- [x] Search page exists with product filtering
- [x] Scan flow uses the device camera, handles permission/error states, tracks scan history, and navigates to product details
- [x] Scan history views are implemented
- [x] Product detail page exists with gallery, specs, care instructions, warranty information, sustainability info, and purchase details
- [x] Product editing supports notes, purchase info, tags, warranty expiry, and saving updates
- [x] Document attachments support upload, listing, download, and deletion

### AI Features
- [x] AI settings page exists with provider selection and API key storage flow
- [x] Ask AI entry points exist on product pages
- [x] AI chat supports contextual questions, multi-turn conversation, and stored history
- [x] Product lifecycle question framework and category-based filtering are implemented

### Additional App Features
- [x] Feed page exists with loading, error, signed-out, and empty states
- [x] Empty states, toast notifications, 404 handling, and pull-to-refresh are implemented
- [x] User account page exists with profile info, account stats, and menu navigation
- [x] Duplicate product issues were investigated and addressed
