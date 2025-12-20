
export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}

export enum ProjectType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY'
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  ONGOING = 'ONGOING' // For retainers
}

export enum ProjectContractType {
  ONE_OFF = 'ONE_OFF',
  RETAINER = 'RETAINER',
  RECURRING_FIXED = 'RECURRING_FIXED'
}

export enum PaymentStatus {
  PAID = 'PAID',
  SCHEDULED = 'SCHEDULED',
  OVERDUE = 'OVERDUE'
}

export type DateRange = 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME';

export type ProjectCategory = string;

export interface Client {
  id: string;
  name: string;
  companyName?: string; // Razão Social
  email?: string;
  phone?: string;
  taxId?: string; // CPF/CNPJ
  address?: string;
  website?: string;
  notes?: string;
  createdAt: number;
  
  // Billing preferences
  preferredBillingChannel?: 'whatsapp' | 'email' | 'other';
  billingEmail?: string; // Separate from contact email
  
  // Relationship tracking
  firstProjectDate?: string; // ISO string - when first project started
  lastActivityDate?: string; // ISO string - last payment or project update
  
  // Tags for filtering/grouping
  tags?: string[];
  
  // Archived flag (soft delete for clients with history)
  isArchived?: boolean;
}

export interface WorkLog {
  id: string;
  date: string; // ISO string
  hours: number;
  description: string;
  billable: boolean;
}

export interface Payment {
  id: string;
  date: string; // ISO string
  amount: number;
  note?: string;
  status?: PaymentStatus; 
  invoiceNumber?: string; // New: Nota Fiscal number tracking
}

export interface ProjectAdjustment {
  id: string;
  date: string;
  amount: number;
  description: string;
  title?: string;
}

export interface ProjectEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'SYSTEM' | 'MANUAL' | 'MILESTONE';
}

export interface ProjectTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  clientId?: string; // New link to Client entity
  clientName: string; // Kept for display/fallback
  type: ProjectType;
  contractType?: ProjectContractType;
  category: ProjectCategory;
  rate: number; 
  currency: Currency;
  status: ProjectStatus;
  platformFee?: number; // Percentage 0-100
  invoiceUrl?: string;
  tags?: string[];
  
  // Date fields
  startDate: string; // ISO string
  dueDate?: string; // ISO string for one-off
  contractEndDate?: string; // For fixed recurring
  renewalDate?: string; // For retainers
  
  // Estimations
  estimatedHours?: number;

  // Financials
  paymentDate?: string; // Legacy
  payments?: Payment[]; 
  adjustments?: ProjectAdjustment[]; // New: Extra income/Scope creep
  
  // Enhanced modules
  logs: WorkLog[];
  events?: ProjectEvent[];
  checklist?: ProjectTask[];
  linkedExpenseIds?: string[];

  notes?: string;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  title?: string;
  location?: string;
  taxId?: string; // CPF or CNPJ
  pixKey?: string; // Chave PIX
  avatar?: string; // Base64 image string
}

// New: Monthly Payment Tracking for recurring expenses
export interface ExpensePaymentHistory {
    monthStr: string; // Format "YYYY-MM"
    status: 'PAID' | 'PENDING';
    paidDate?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  date: string; // ISO string
  category?: string; // e.g., Subscription, Tool, Travel
  tags?: string[];
  isWorkRelated?: boolean;
  isRecurring?: boolean;
  recurringFrequency?: 'MONTHLY' | 'YEARLY';
  notes?: string;
  
  status?: 'PAID' | 'PENDING'; // Legacy / For One-Off
  paymentHistory?: ExpensePaymentHistory[]; // New: For Recurring Monthly Tracking

  dueDay?: number; // 1-31 for recurring due date
  
  // New Trial Logic
  isTrial?: boolean;
  trialEndDate?: string; // ISO String date when trial ends
}

export interface AppSettings {
  monthlyGoal: number;
  mainCurrency: Currency;
  exchangeRates: Record<Currency, number>;
  taxReservePercent?: number;
}

export interface AppData {
  userProfile: UserProfile;
  clients: Client[]; // New collection
  projects: Project[];
  expenses: Expense[];
  settings: AppSettings;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.BRL]: 'R$',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£'
};

export const EXPENSE_CATEGORIES = [
  'Assinaturas / Subs',
  'Software & Tools',
  'IA & Automação',
  'Streaming / Lazer',
  'Escritório / Home Office',
  'Transporte',
  'Alimentação / Café',
  'Equipamentos',
  'Impostos & Taxas',
  'Outros'
] as const;

export const TAG_SUGGESTIONS: Record<string, string[]> = {
  'Streaming / Lazer': ['Netflix', 'Spotify', 'Disney+', 'Prime Video', 'YouTube Premium'],
  'Software & Tools': ['Adobe CC', 'Figma', 'Notion', 'Google Workspace', 'Microsoft 365', 'Canva', 'Zoom', 'Trello'],
  'IA & Automação': ['ChatGPT', 'Midjourney', 'Gemini', 'Claude', 'Runway', 'ElevenLabs'],
  'Transporte': ['Uber', '99', 'Gasolina', 'Estacionamento', 'Transporte Público'],
  'Alimentação / Café': ['Delivery', 'iFood', 'Starbucks', 'Almoço', 'Jantar'],
  'Assinaturas / Subs': ['Domínio', 'Hospedagem', 'VPN', 'Cloud'],
  'Escritório / Home Office': ['Internet', 'Limpeza', 'Decoração'],
  'Impostos & Taxas': ['MEI', 'Simples', 'DAS']
};

// --- New: Service Presets for Expenses ---

export interface ServicePreset {
  id: string;
  name: string;
  defaultCategory: string;
  defaultTags: string[];
  isRecurring: boolean;
  iconName: string; // Generic name to map to Lucide icons in UI
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { id: 'adobe', name: 'Adobe CC', defaultCategory: 'Software & Tools', defaultTags: ['Design', 'Criativo'], isRecurring: true, iconName: 'PenTool' },
  { id: 'figma', name: 'Figma', defaultCategory: 'Software & Tools', defaultTags: ['Design', 'UI/UX'], isRecurring: true, iconName: 'Figma' }, 
  { id: 'chatgpt', name: 'ChatGPT', defaultCategory: 'IA & Automação', defaultTags: ['IA', 'Produtividade'], isRecurring: true, iconName: 'Sparkles' },
  { id: 'midjourney', name: 'Midjourney', defaultCategory: 'IA & Automação', defaultTags: ['IA', 'Arte'], isRecurring: true, iconName: 'Image' },
  { id: 'notion', name: 'Notion', defaultCategory: 'Software & Tools', defaultTags: ['Produtividade', 'Docs'], isRecurring: true, iconName: 'FileText' },
  { id: 'google', name: 'Google Workspace', defaultCategory: 'Software & Tools', defaultTags: ['Email', 'Drive'], isRecurring: true, iconName: 'Cloud' },
  { id: 'aws', name: 'AWS / Hosting', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Servidor', 'Infra'], isRecurring: true, iconName: 'Server' },
  { id: 'spotify', name: 'Spotify', defaultCategory: 'Streaming / Lazer', defaultTags: ['Música'], isRecurring: true, iconName: 'Music' },
  { id: 'netflix', name: 'Netflix', defaultCategory: 'Streaming / Lazer', defaultTags: ['Filmes'], isRecurring: true, iconName: 'Tv' },
  { id: 'uber', name: 'Uber / 99', defaultCategory: 'Transporte', defaultTags: ['Corrida'], isRecurring: false, iconName: 'Car' },
  { id: 'ifood', name: 'iFood / Delivery', defaultCategory: 'Alimentação / Café', defaultTags: ['Comida'], isRecurring: false, iconName: 'Coffee' },
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Assinaturas / Subs': 'CreditCard',
  'Software & Tools': 'Laptop',
  'IA & Automação': 'Bot',
  'Streaming / Lazer': 'PlayCircle',
  'Escritório / Home Office': 'Home',
  'Transporte': 'Car',
  'Alimentação / Café': 'Coffee',
  'Equipamentos': 'Monitor',
  'Impostos & Taxas': 'FileText',
  'Outros': 'HelpCircle'
};

// --- New: Calendar Events ---
export interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    amount?: number;
    currency?: Currency;
    type: 'INCOME' | 'EXPENSE' | 'PROJECT_START' | 'PROJECT_DUE' | 'TRIAL_END';
    status?: 'PAID' | 'PENDING' | 'WARNING';
    meta?: any; // To store project/expense ID
}
