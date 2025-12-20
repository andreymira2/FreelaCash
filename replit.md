# FreelaCash

## Overview

FreelaCash is a client-side financial management platform for freelancers, creative professionals, and independent service providers. It offers tools for income tracking, project management, expense monitoring, and financial reporting. The application operates without a backend, relying solely on local storage for data persistence.

**Core Purpose:** To provide freelancers with clear financial visibility, streamline invoicing, and simplify money flow tracking.

**Key Capabilities:**
- Project management supporting fixed, hourly, and daily rates.
- Expense tracking with recurring payment and bulk actions.
- Financial dashboard with health score, expense reminders, and receivables summary.
- Multi-currency support (BRL, USD, EUR, GBP).
- Client management and project duplication.
- Data import/export functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 19 with TypeScript, implemented as a Single Page Application (SPA).
**Routing:** React Router v7 with HashRouter; includes an `OnboardingGuard` for new user profile setup.
**State Management:** React Context API via `DataContext` for centralized data (projects, clients, expenses, settings).
**Financial Calculations:** A centralized `FinancialEngine` module (`engine/FinancialEngine.ts`) acts as the single source of truth for all monetary computations, exposed via memoized React hooks.
**Styling:** Tailwind CSS, custom configured for a dark, OLED-optimized theme with mobile-first responsiveness.
**Build System:** Vite for development and optimized production builds.

### Data Storage

**Approach:** All persistent data is stored in the browser's `localStorage`.
**Rationale:** Eliminates infrastructure, ensures data privacy (client-side only), and enables offline capability.
**Trade-offs:** Limited storage capacity, no automatic cross-device sync, and risk of data loss if local storage is cleared.

### Component Architecture

**Layout Pattern:** Hierarchical structure with a main `Layout.tsx` (responsive sidebar/bottom navigation) and dedicated page and reusable UI components.
**UI Component Library:** Custom-built components for consistency (e.g., Button, Card, Input, Avatar, PageHeader).

### Type System

**TypeScript Enums:** Utilizes enums for domain models such as `Currency`, `ProjectType`, `ProjectStatus`, `ProjectContractType`, and `PaymentStatus`.

### PWA Support

Includes a `manifest.json` to enable Progressive Web App features for mobile installation and standalone use.

## External Dependencies

### Runtime Dependencies

- `react` / `react-dom`: Core UI framework.
- `react-router-dom`: Client-side routing.
- `recharts`: Data visualization.
- `lucide-react`: Icon library.

### Development Dependencies

- `vite`: Build tool and dev server.
- `@vitejs/plugin-react`: React integration for Vite.
- `tailwindcss`: Utility-first CSS framework.
- `postcss` / `autoprefixer`: CSS processing.
- `typescript`: Type checking.

### External Services

- **Logo.dev**: Company logo CDN for expense service icons (public token, 500k requests/month free tier).

### Fonts

Google Fonts: Plus Jakarta Sans (loaded via CDN).