# FreelaCash

## Overview

FreelaCash is a financial management platform designed for freelancers, creative professionals, and independent service providers. It provides comprehensive tools for tracking income, managing projects, monitoring expenses, and generating financial reports. The application operates entirely client-side with local storage, requiring no backend server or cloud infrastructure.

**Core Purpose:** Help freelancers maintain clear visibility into their financial health, simplify invoicing workflows, and track money flow without complexity.

**Primary Features:**
- Project management with support for fixed-price, hourly, and daily rate contracts
- Expense tracking with recurring payment support and bulk "Mark all as paid" action
- Financial dashboard with real-time metrics, health score, expense reminders, and receivables summary
- Multi-currency support (BRL, USD, EUR, GBP)
- Calendar view for payment schedules
- Client management
- Project duplication for recurring client work
- Data export/import capabilities

## Recent Changes (December 2024)

### Phase 1-2: Visual Polish & UX Labels
- Settings and Reports pages aligned to dark theme with design system colors (base-card, ink-gray, etc.)
- Standardized icon sizes across app (16/20/24px)
- Project status labels renamed to plain Portuguese (Em Andamento, Entregue, Finalizado, Recorrente)
- Improved empty states with contextual guidance and helpful tips

### Phase 3: Small Features
- **Duplicate Project**: Clone existing projects for recurring client work (clears payments/logs, resets status)
- **Mark All as Paid**: Bulk action for recurring expenses to mark all as paid for current month

### Phase 4: Dashboard Improvements
- **Saúde Financeira (Health Score)**: 0-100% indicator based on goal progress, profit margin, and overdue penalties
- **A Receber (Receivables)**: Shows pending scheduled payments with overdue highlighting
- **Vencimentos (Expense Reminders)**: Upcoming recurring expenses due in next 7 days

### Phase 5: UX Improvements
- **Calendar List View**: Toggle between grid and agenda/list view for better mobile experience
- **Tax Reserve Indicator**: Configure percentage in Settings (ex: MEI 5%, Simples 6-15%); Dashboard shows calculated reserve amount

### Phase 6: Dashboard UX Audit (December 2024)
- **Fixed quick action labels**: Increased from 10px to 12px for better readability
- **Fixed MRR label**: Changed "MRR Recorrente" to "Receita Recorrente" (clearer Portuguese)
- **Inline mark-paid for receivables**: Checkmark button in "A Receber" card to mark payments as received without navigation
- **Inline mark-paid for expenses**: Button in "Vencimentos" card to mark recurring expenses as paid
- **Auto-select single project**: Quick Pay modal auto-selects project if only one is active
- **Simplified header**: Cleaner layout with date range and add project button only
- **Activity feed time grouping**: Grouped into "Hoje", "Últimos 7 Dias", and "Anteriores" for better scannability
- **Mobile quick actions bar**: Compact action row (Receber/Pagar/+) visible only on mobile
- **Improved empty states**: Better visual hierarchy with icons, headings, and actionable CTAs

### Phase 7: Projects Section UX Improvements (December 2024)
- **Progress bar on mobile**: Payment progress now visible on all screen sizes (removed desktop-only restriction)
- **Overdue payment indicator**: Red pulsing dot and red border on projects with overdue scheduled payments
- **Inline Quick Pay**: "Confirmar R$X" button to mark scheduled payments as paid directly from project list
- **Status filter counts**: Each filter button shows count badge (e.g., "Em Andamento (3)")
- **WhatsApp billing on cards**: "Cobrar" button appears on project cards when PIX key configured and balance pending
- **Optimized calculations**: Proper expense passing and memoized status counts for better performance

### Phase 8: ProjectDetails Page Simplification (December 2024)
- **Tab consolidation**: Reduced from 4 tabs to 2 ("Resumo" for overview + payments, "Configurar" for project/client settings)
- **WhatsApp billing in header**: Green "Cobrar" button appears when there's pending balance
- **Collapsible timer**: Timer hidden by default, toggle button to expand
- **Duplicate in header**: Quick access to project duplication
- **Progress bar prominent**: Payment progress visible in header area
- **Parcelar button**: Quick installment scheduling for remaining balance
- **Receipt modal**: View payment details in modal format
- **Installment modal**: Create multiple scheduled payments with options for first payment status
- **Removed dead code**: Cleaned up unused showExpenseLinker state

### Phase 9: Expenses Page UX Improvements (December 2024)
- **Monthly progress bar**: Shows paid vs pending recurring expenses with visual progress and percentage
- **Trial expiring indicator**: Badge changes color (yellow → red pulsing) as trial expires, with clear messages ("Expira amanhã!", "Trial expirado!")
- **Inline pay buttons**: Labeled buttons showing "Pago" (green) or "Pagar" (yellow) instead of just icons
- **"Pagar Todas" with count**: Bulk action button now shows number of pending expenses
- **Stats counters**: Progress bar header shows count of paid and pending items

### Phase 10: FinancialEngine Refactor (December 2024)
- **Centralized FinancialEngine module** (`engine/FinancialEngine.ts`): Single source of truth for all monetary calculations, currency conversions, project/expense computations, and timeline projections
- **Pure function architecture**: Engine uses pure functions with no side effects, receives config and data as parameters
- **Custom React hooks** (`hooks/useFinancialEngine.ts`): 12+ hooks expose engine functionality to components:
  - `useFinancialEngine()`: Full engine instance with all computed data
  - `useFinancialSnapshot()`: High-level summary (income, expenses, profit, MRR, etc.)
  - `useProjectFinancials(id)`: Single project calculations
  - `useAllProjectFinancials()`: All projects with pre-computed totals
  - `useReceivables()`, `useExpenseReminders()`, `useHealthScore()`: Dashboard metrics
  - `useRecurringExpenseProgress()`, `useRecurringExpenseTotal()`: Expense page data
  - `useCalendarEvents(month)`: Calendar timeline events
- **Migrated all pages** to use FinancialEngine hooks instead of duplicated calculation logic
- **Deprecated legacy `getProjectTotal`** in DataContext (kept for backward compatibility)
- **Type definitions** (`engine/types.ts`): Strong typing for all financial structures (ProjectTotals, ReceivablePayment, ExpenseReminder, HealthScore, TimelineEvent, etc.)

### Phase 11: Dashboard Simplification (December 2024)
- **Hierarchical structure**: 3 levels - Alert Banner (urgências), Card Principal (visão geral), Operacional (projetos/atividade)
- **Alert Banner contextual**: Aparece apenas quando há pagamentos atrasados, contas vencendo hoje, ou saúde financeira crítica
- **Card consolidado**: Meta mensal, despesas, lucro, próximo recebimento e próxima conta em um único bloco
- **Atividade limitada**: Últimos 7 dias apenas, máximo 5 itens por grupo
- **Projetos com status visual**: Indicadores coloridos (Fluindo/Parado/Atrasado) baseados em atividade e pagamentos
- **Tags temporais relativas**: "Hoje", "Ontem", "X dias atrás" ao invés de datas absolutas
- **Quick actions mobile-only**: Removido grid de 4 botões do desktop, mantido apenas barra compacta no mobile

### Phase 12: Date/Number Parsing Bug Fixes (December 2024)
- **Fixed timezone bug**: Dates entered in forms were showing 1 day earlier due to UTC midnight parsing in Brazil (UTC-3)
- **parseLocalDateToISO()**: New utility function that sets time to 12:00 when parsing date inputs, avoiding timezone shift issues
- **toInputDate()**: Uses string substring instead of Date object to preserve legacy ISO dates without timezone conversion
- **parseNumber()**: Accepts both comma and dot as decimal separators for Brazilian locale compatibility
- **Backwards compatible**: Legacy dates saved at UTC midnight continue to display correctly

### Phase 13: Client-Centric Refactoring (December 2024)
**Goal:** Make Client the primary entity for better recurring client management.

#### Phase 13.1: Client Entity Infrastructure
- **Client type expanded**: Added preferredBillingChannel, billingEmail, firstProjectDate, lastActivityDate, tags, isArchived fields
- **Auto-migration system**: Automatically creates Client entities from existing project clientNames and links them retroactively
- **DataContext methods**: Added addClient, updateClient, deleteClient functions

#### Phase 13.2: ProjectDetails Simplification
- **Timer removed**: No longer shown on project page
- **Unified payments**: "Extra" merged with "Payment" via "É ajuste" checkbox
- **Single-page layout**: Eliminated tabs, replaced with collapsible sections
- **Recurring display**: Replaced cycle progress bar with "Próximo vencimento: dia X"

#### Phase 13.3: Projects Page Enhancements
- **Summary cards**: A Receber, MRR, total projects, overdue count at top
- **Search & filter**: Search by client/project name, "Com pendência" toggle filter
- **Smart sorting**: Overdue projects appear first with visual highlighting
- **Next action text**: Each project card shows contextual next step recommendation

#### Phase 13.4: ClientDetails Page
- **Consolidated client view**: Stats (total earned, pending, MRR, active projects)
- **Relationship duration**: Shows time since first project
- **Unified payment history**: All payments across client's projects
- **Quick actions**: WhatsApp billing button, new project creation

#### Phase 13.5: Improved Project Form
- **Client selector**: Inline search with quick-select chips for existing clients
- **New client creation**: Visual indicator when creating new client
- **First payment scheduling**: Optional section to schedule initial payment during project creation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 19 with TypeScript as a Single Page Application (SPA)

**Routing:** React Router v7 with HashRouter for client-side navigation. Routes are protected by an `OnboardingGuard` component that redirects new users to profile setup.

**State Management:** React Context API via `DataContext` providing centralized data management for projects, clients, expenses, settings, and user profile. No external state management library (Redux, Zustand) is used.

**Financial Calculations:** Centralized `FinancialEngine` module (`engine/FinancialEngine.ts`) handles all monetary calculations as a single source of truth. UI components consume read-only computed data via memoized React hooks (`hooks/useFinancialEngine.ts`). Mutations still flow through DataContext.

**Styling:** Tailwind CSS with custom configuration including:
- Custom color palette (brand neon lime, semantic colors)
- Mobile-first responsive breakpoints
- Touch-friendly spacing utilities
- Dark theme with OLED-optimized backgrounds

**Build System:** Vite with React plugin for fast development and optimized production builds.

### Data Storage

**Approach:** Browser localStorage for all persistent data. No database or backend server.

**Rationale:** 
- Zero infrastructure requirements
- Privacy-focused (data never leaves user's device)
- Offline-capable
- Simple deployment as static files

**Trade-offs:**
- Storage limited to ~5-10MB per origin
- No cross-device sync without manual export/import
- Data loss if browser storage is cleared

### Component Architecture

**Layout Pattern:** Hierarchical layout with:
- `Layout.tsx` - Main shell with responsive sidebar (desktop) and bottom navigation (mobile)
- Page components under `/pages/` directory
- Reusable UI primitives under `/components/ui/`

**UI Component Library:** Custom component library with consistent styling:
- Button, Card, Input, Select, Toggle (form controls)
- Avatar, Badge, CurrencyDisplay (display components)
- PageHeader, EmptyState, ProgressBar (layout helpers)

### Type System

**TypeScript Enums for Domain Models:**
- `Currency` - Supported currencies
- `ProjectType` - Fixed, Hourly, Daily pricing models
- `ProjectStatus` - Active, Completed, Paid, Ongoing
- `ProjectContractType` - One-off, Retainer, Recurring Fixed
- `PaymentStatus` - Paid, Scheduled, Overdue

### PWA Support

The application includes a `manifest.json` for Progressive Web App capabilities, enabling installation on mobile devices and standalone app mode.

## External Dependencies

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | Core UI framework |
| `react-router-dom` | Client-side routing |
| `recharts` | Data visualization (charts) |
| `lucide-react` | Icon library |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `vite` | Build tool and dev server |
| `@vitejs/plugin-react` | React integration for Vite |
| `tailwindcss` | Utility-first CSS framework |
| `postcss` / `autoprefixer` | CSS processing |
| `typescript` | Type checking |

### External Services

**None currently integrated.** The application is fully self-contained. The Vite config references a `GEMINI_API_KEY` environment variable, suggesting potential future AI integration, but this is not currently implemented in the codebase.

### Fonts

Google Fonts: Plus Jakarta Sans (loaded via CDN in `index.html`)