# Thap - Product Lifecycle Manager

A mobile-first Progressive Web App (PWA) for managing product lifecycles, built with React, TypeScript, and tRPC. Thap helps users track their products from discovery through ownership to end-of-life, with AI-powered assistance for product-related questions.

## Features

### Core Functionality

- **QR Code Scanning**: Scan product QR codes using device camera to add products to your collection
- **Product Management**: Track owned products with purchase details, warranty information, and custom notes
- **Scan History**: View recently scanned products with horizontal scrolling interface
- **Product Search**: Real-time search across all products by name, brand, model, or category
- **Category Filtering**: Filter products by category (Tools, Kitchen, Garage, Furniture)

### AI Assistant

- **Context-Aware Questions**: 50+ pre-defined questions organized by product lifecycle stage
  - **Discovery Stage**: Pre-purchase questions about product features, pricing, and comparisons
  - **Ownership Stage**: Usage, maintenance, troubleshooting, and care instructions
  - **End-of-Life Stage**: Resale value, recycling, and disposal information
- **Domain-Specific Questions**: Specialized question sets for:
  - Electronics (battery optimization, software updates, repairs)
  - Clothing & Footwear (washing, sizing, ethical production)
  - Furniture & Tools (maintenance, parts, assembly)
  - Vehicles & Bicycles (tire pressure, maintenance schedule, recalls)
- **8 Universal Categories**: Product info, Quality & materials, Price & value, Usage & maintenance, Compatibility, Warranty & support, Sustainability, Resale & reuse
- **Multiple AI Providers**: Support for ChatGPT, Gemini, Perplexity, and DeepSeek

### User Experience

- **Mobile-First Design**: Optimized for mobile devices with touch-friendly interface
- **Bottom Navigation**: Easy access to Home, Search, Scan, Feed, and Menu
- **Loading Skeletons**: Smooth loading states with animated placeholders
- **Empty States**: Helpful guidance when no data is available
- **PWA Support**: Installable on mobile devices for native-like experience
- **Multi-Language Support**: 14 languages (English, Estonian, Finnish, Swedish, Norwegian, Danish, German, French, Spanish, Italian, Portuguese, Polish, Russian, Chinese)

### Settings & Customization

- **User Account Management**: View profile, statistics, and account settings
- **Language Selection**: Choose from 14 supported languages
- **Country Selection**: Set your country for localized content
- **AI Provider Configuration**: Configure API keys for different AI providers
- **Database Cleanup**: Remove duplicate products and scan history

## Tech Stack

### Frontend
- **React 19**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Wouter**: Lightweight routing
- **shadcn/ui**: High-quality UI components
- **tRPC**: End-to-end typesafe APIs
- **TanStack Query**: Data fetching and caching
- **html5-qrcode**: QR code scanning
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### Backend
- **Node.js 22**: JavaScript runtime
- **Express 4**: Web framework
- **tRPC 11**: Type-safe API layer
- **Drizzle ORM**: TypeScript ORM
- **MySQL/TiDB**: Database
- **Manus OAuth**: Authentication
- **Superjson**: JSON serialization with Date support

### Development Tools
- **Vite**: Fast build tool
- **Vitest**: Unit testing framework
- **TSX**: TypeScript execution
- **ESLint**: Code linting
- **pnpm**: Package manager

## Project Structure

```
thap-mobile/
├── client/                 # Frontend application
│   ├── public/            # Static assets
│   │   ├── manifest.json  # PWA manifest
│   │   └── sw.js          # Service worker
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── AppBar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   ├── ProductCardSkeleton.tsx
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Scan.tsx
│   │   │   ├── Search.tsx
│   │   │   ├── Feed.tsx
│   │   │   ├── MenuPage.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── ProductEdit.tsx
│   │   │   ├── AIChat.tsx
│   │   │   ├── AISettings.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── LanguageSelection.tsx
│   │   │   ├── CountrySelection.tsx
│   │   │   ├── UserAccount.tsx
│   │   │   └── ScanHistory.tsx
│   │   ├── lib/           # Utilities
│   │   │   └── trpc.ts    # tRPC client
│   │   ├── App.tsx        # Routes and layout
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   └── index.html         # HTML template
├── server/                # Backend application
│   ├── _core/            # Framework code
│   ├── db.ts             # Database helpers
│   ├── routers.ts        # tRPC routers
│   └── *.test.ts         # Unit tests
├── drizzle/              # Database schema
│   └── schema.ts         # Table definitions
├── shared/               # Shared code
│   ├── const.ts          # Constants
│   └── aiQuestions.ts    # AI question framework
└── storage/              # S3 helpers

```

## Database Schema

### Tables

**users**
- User authentication and profile information
- Fields: id, openId, name, email, loginMethod, role, languageCode, countryCode, createdAt, updatedAt, lastSignedIn

**products**
- Product catalog with specifications
- Fields: id, name, brand, model, category, imageUrl, barcode, metadata (JSON), createdAt, updatedAt

**productInstances**
- User-owned products with custom data
- Fields: id, userId, productId, purchaseDate, purchasePrice, purchaseLocation, warrantyExpiry, notes, tags (JSON), createdAt, updatedAt

**scanHistory**
- Track scanned products
- Fields: id, userId, productId, scannedAt

**aiConversations**
- AI chat history
- Fields: id, userId, productId, messages (JSON), createdAt, updatedAt

**aiProviderSettings**
- AI provider configurations
- Fields: id, userId, provider, apiKey, isActive, createdAt, updatedAt

## API Endpoints (tRPC)

### Authentication
- `auth.me`: Get current user
- `auth.logout`: Sign out

### Products
- `products.myProducts`: List owned products
- `products.getById`: Get product details
- `products.updateProductInstance`: Update product instance

### Scan History
- `scanHistory.list`: List scan history
- `scanHistory.add`: Add scan entry

### AI
- `ai.chat`: Send message to AI
- `ai.saveProvider`: Save AI provider settings
- `ai.getProvider`: Get AI provider settings

### User Settings
- `userSettings.get`: Get user preferences
- `userSettings.update`: Update preferences

### Demo
- `demo.seedData`: Load demo products
- `demo.cleanupDuplicates`: Remove duplicates

### System
- `system.notifyOwner`: Send notification to owner

## Setup Instructions

### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL/TiDB database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd thap-mobile
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (see `.env.example` and `LOCAL_SETUP.md`):
- `DATABASE_URL`, `JWT_SECRET` (required)
- `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_OAUTH_CLIENT_ID` (for login — must match the WebDev-style OAuth flow in `server/_core/sdk.ts`)
- `THAP_SERVICES_BASE_URL`, `THAP_SERVICES_API_KEY` (optional — AI, storage proxy, server integrations)
- `VITE_MAPS_PROXY_BASE_URL`, `VITE_MAPS_PROXY_API_KEY` (optional — Google Maps in the browser)

4. Push database schema:
```bash
pnpm db:push
```

5. Start development server:
```bash
pnpm dev
```

6. Run tests:
```bash
pnpm test
```

## Usage Guide

### First Time Setup

1. **Sign In**: Click "Get Started" and sign in with your account
2. **Load Demo Products**: Click "Load Demo Products" button on home page to add sample products
3. **Configure AI**: Go to Menu → Settings → AI Assistant to add your AI provider API key

### Scanning Products

1. Tap the central scan button in bottom navigation
2. Allow camera permissions when prompted
3. Point camera at product QR code
4. Product details will appear automatically after successful scan

### Managing Products

1. **View Products**: Browse your products on the home page
2. **Filter by Category**: Use category chips to filter products
3. **Edit Product**: Open product detail and tap "Edit" button
4. **Add Notes**: Add custom notes, tags, purchase details, and warranty information
5. **Delete Product**: Use the cleanup function in Settings

### Using AI Assistant

1. **From Product Detail**: Tap "Ask AI" button
2. **Select Question**: Choose from contextual pre-defined questions
3. **Custom Question**: Type your own question
4. **View Response**: AI will provide detailed answers with markdown formatting

### Changing Language

1. Go to Menu → Settings
2. Tap "Language"
3. Select your preferred language from 14 options
4. App interface will update immediately

## Design System

### Colors
- **Primary**: #2196F3 (Blue)
- **Accent**: #4CAF50 (Green)
- **Background**: #FFFFFF (White)
- **Text**: #000000 (Black)
- **Muted**: #6B7280 (Gray)

### Typography
- **Font Family**: Roboto
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px

### Spacing
- **Base Unit**: 4px
- **Scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px

### Components
- **Border Radius**: 8px (cards), 24px (buttons), 12px (inputs)
- **Shadows**: Subtle elevation for cards and modals
- **Touch Targets**: Minimum 44px × 44px

## Testing

The app includes comprehensive unit tests covering:
- Authentication flow
- Product management
- AI provider configuration
- Product editing
- AI question framework

Run tests with:
```bash
pnpm test
```

## Deployment

The app is designed to be deployed on the Manus platform:

1. Create checkpoints during development
2. Click "Publish" button in Manus UI
3. App will be deployed with custom domain support
4. SSL certificates are automatically managed

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Write tests for new features
- Use semantic commit messages

### Adding New Features

1. Update `todo.md` with feature tasks
2. Create database schema changes in `drizzle/schema.ts`
3. Add database helpers in `server/db.ts`
4. Create tRPC procedures in `server/routers.ts`
5. Build UI components in `client/src/pages/`
6. Write tests in `server/*.test.ts`
7. Update this README

## Known Limitations

- QR scanner requires HTTPS or localhost
- Camera access requires user permission
- External product API integration pending
- Document attachments not yet implemented
- i18n framework not fully integrated (UI prepared for 14 languages)

## Future Enhancements

1. **External API Integration**: Connect to `tingsapi.test.mindworks.ee` for real product data
2. **Document Attachments**: Upload receipts, warranties, and manuals
3. **Full i18n**: Translate all UI text and AI questions to 14 languages
4. **Product Recommendations**: AI-powered product suggestions
5. **Social Features**: Share products and reviews with community
6. **Analytics Dashboard**: Track product usage and lifecycle insights
7. **Barcode Scanning**: Support for traditional barcodes in addition to QR codes
8. **Offline Mode**: Enhanced PWA capabilities for offline usage

## License

[Add license information]

## Support

For issues, questions, or feedback:
- Submit issues at [repository issues page]
- Contact: [support email]
- Documentation: [documentation URL]

## Acknowledgments

- Built with Manus platform
- Design inspired by modern mobile product management apps
- AI question framework based on master's thesis research on context-aware AI communication

---

**Version**: 56c3c809  
**Last Updated**: January 2026  
**Status**: Demo Ready
