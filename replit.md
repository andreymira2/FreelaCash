# FreelaCash

## Overview

FreelaCash is a multi-user SaaS financial management platform for freelancers, creative professionals, and independent service providers. It offers tools for income tracking, project management, expense monitoring, and financial reporting. The application uses Supabase for authentication and data storage, with planned deployment on Vercel.

**Core Purpose:** To provide freelancers with clear financial visibility, streamline invoicing, and simplify money flow tracking.

**Key Capabilities:**
- User authentication (email/password, Google, GitHub)
- Project management supporting fixed, hourly, and daily rates
- Expense tracking with recurring payment and bulk actions
- Financial dashboard with health score, expense reminders, and receivables summary
- Multi-currency support (BRL, USD, EUR, GBP)
- Client management and project duplication
- Data import/export functionality
- Cloud-based data storage with row-level security

## User Preferences

Preferred communication style: Simple, everyday language (Portuguese - BR).

## System Architecture

### Frontend Architecture

**Framework:** React 19 with TypeScript, implemented as a Single Page Application (SPA).
**Routing:** React Router v7 with BrowserRouter; includes `PrivateRoute` for authenticated routes and `OnboardingGuard` for profile setup.
**State Management:** React Context API via `AuthContext` for authentication and `DataContext` for centralized data (projects, clients, expenses, settings).
**Financial Calculations:** A centralized `FinancialEngine` module (`engine/FinancialEngine.ts`) acts as the single source of truth for all monetary computations, exposed via memoized React hooks.
**Styling:** Tailwind CSS, custom configured for a dark, OLED-optimized theme (#C6FF3F accent) with mobile-first responsiveness.
**Build System:** Vite for development and optimized production builds.

### Backend & Data Storage

**Database:** Supabase (PostgreSQL) with row-level security (RLS).
**Authentication:** Supabase Auth supporting email/password and OAuth (Google, GitHub).
**API:** Supabase client library for direct database access from frontend.

**Database Tables:**
- `user_profiles` - User profile information
- `user_settings` - User preferences and settings
- `clients` - Client management
- `projects` - Project tracking
- `work_logs` - Time tracking for hourly/daily projects
- `payments` - Payment tracking
- `project_adjustments` - Scope changes and additional charges
- `expenses` - Expense management with recurring support

### Deployment Target

**Frontend:** Vercel (static hosting)
**Backend:** Supabase (managed PostgreSQL + Auth)
**Cost:** Free tier for both services

### Component Architecture

**Layout Pattern:** Hierarchical structure with a main `Layout.tsx` (responsive sidebar/bottom navigation) and dedicated page and reusable UI components.
**UI Component Library:** Custom-built components for consistency (e.g., Button, Card, Input, Avatar, PageHeader).

**Public Pages:**
- `/welcome` - Landing page
- `/login` - User login
- `/signup` - User registration

**Protected Pages:**
- `/` - Dashboard
- `/projects` - Project list
- `/expenses` - Expense tracking
- `/reports` - Financial reports
- `/settings` - User settings

### Type System

**TypeScript Enums:** Utilizes enums for domain models such as `Currency`, `ProjectType`, `ProjectStatus`, `ProjectContractType`, and `PaymentStatus`.

### PWA Support

Includes a `manifest.json` to enable Progressive Web App features for mobile installation and standalone use.

## External Dependencies

### Runtime Dependencies

- `react` / `react-dom`: Core UI framework
- `react-router-dom`: Client-side routing
- `@supabase/supabase-js`: Supabase client for auth and database
- `recharts`: Data visualization
- `lucide-react`: Icon library

### Development Dependencies

- `vite`: Build tool and dev server
- `@vitejs/plugin-react`: React integration for Vite
- `tailwindcss`: Utility-first CSS framework
- `postcss` / `autoprefixer`: CSS processing
- `typescript`: Type checking

### External Services

- **Supabase**: PostgreSQL database + Authentication
- **Logo.dev**: Company logo CDN for expense service icons (public token, 500k requests/month free tier)

### Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public key

### Fonts

Google Fonts: Plus Jakarta Sans (loaded via CDN).

## Recent Changes

- **2025-12-20**: Migration from localStorage to Supabase
  - Added Supabase authentication (AuthContext)
  - Migrated DataContext to use Supabase database
  - Created public landing page and auth pages
  - Implemented row-level security for multi-user support
  - Changed routing from HashRouter to BrowserRouter
