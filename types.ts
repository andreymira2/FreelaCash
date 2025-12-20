
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
  'Moradia',
  'Contas Fixas',
  'Alimentação',
  'Ferramentas',
  'Transporte',
  'Lazer',
  'Equipamentos',
  'Impostos & Taxas',
  'Outros'
] as const;

export const TAG_SUGGESTIONS: Record<string, string[]> = {
  'Moradia': ['Aluguel', 'Condomínio', 'IPTU', 'Seguro'],
  'Contas Fixas': ['Luz', 'Água', 'Gás', 'Internet', 'Celular', 'Telefone'],
  'Alimentação': ['Mercado', 'Delivery', 'iFood', 'Restaurante', 'Café'],
  'Ferramentas': ['Adobe', 'Figma', 'Hosting', 'Domínio', 'ChatGPT', 'Notion'],
  'Transporte': ['Uber', '99', 'Gasolina', 'Estacionamento', 'Transporte Público'],
  'Lazer': ['Netflix', 'Spotify', 'Disney+', 'Jogos', 'Cinema'],
  'Equipamentos': ['Notebook', 'Monitor', 'Teclado', 'Mouse', 'Headset'],
  'Impostos & Taxas': ['MEI', 'Simples', 'DAS', 'INSS']
};

// --- New: Service Presets for Expenses ---

export interface ServicePreset {
  id: string;
  name: string;
  domain: string;
  defaultCategory: string;
  defaultTags: string[];
  isRecurring: boolean;
  defaultAmount?: number;
  defaultCurrency?: Currency;
  iconName: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  // MORADIA
  { id: 'aluguel', name: 'Aluguel', domain: '', defaultCategory: 'Moradia', defaultTags: ['Moradia'], isRecurring: true, iconName: 'Home' },
  { id: 'condominio', name: 'Condomínio', domain: '', defaultCategory: 'Moradia', defaultTags: ['Moradia'], isRecurring: true, iconName: 'Building2' },
  { id: 'iptu', name: 'IPTU', domain: '', defaultCategory: 'Moradia', defaultTags: ['Imposto'], isRecurring: true, iconName: 'FileText' },
  
  // CONTAS FIXAS
  { id: 'luz', name: 'Conta de Luz', domain: '', defaultCategory: 'Contas Fixas', defaultTags: ['Energia'], isRecurring: true, iconName: 'Zap' },
  { id: 'agua', name: 'Conta de Água', domain: '', defaultCategory: 'Contas Fixas', defaultTags: ['Água'], isRecurring: true, iconName: 'Droplet' },
  { id: 'gas', name: 'Gás', domain: '', defaultCategory: 'Contas Fixas', defaultTags: ['Gás'], isRecurring: true, iconName: 'Flame' },
  { id: 'internet', name: 'Internet', domain: '', defaultCategory: 'Contas Fixas', defaultTags: ['Internet'], isRecurring: true, iconName: 'Wifi' },
  { id: 'celular', name: 'Celular', domain: '', defaultCategory: 'Contas Fixas', defaultTags: ['Telefone'], isRecurring: true, iconName: 'Smartphone' },
  
  // ALIMENTAÇÃO
  { id: 'mercado', name: 'Mercado', domain: '', defaultCategory: 'Alimentação', defaultTags: ['Compras'], isRecurring: false, iconName: 'ShoppingCart' },
  { id: 'ifood', name: 'iFood', domain: 'ifood.com.br', defaultCategory: 'Alimentação', defaultTags: ['Delivery'], isRecurring: false, iconName: 'UtensilsCrossed' },
  { id: 'rappi', name: 'Rappi', domain: 'rappi.com.br', defaultCategory: 'Alimentação', defaultTags: ['Delivery'], isRecurring: false, iconName: 'UtensilsCrossed' },
  { id: 'restaurante', name: 'Restaurante', domain: '', defaultCategory: 'Alimentação', defaultTags: ['Refeição'], isRecurring: false, iconName: 'UtensilsCrossed' },
  { id: 'cafe', name: 'Café', domain: '', defaultCategory: 'Alimentação', defaultTags: ['Café'], isRecurring: false, iconName: 'Coffee' },
  
  // FERRAMENTAS (trabalho)
  { id: 'adobe', name: 'Adobe CC', domain: 'adobe.com', defaultCategory: 'Ferramentas', defaultTags: ['Design'], isRecurring: true, defaultAmount: 290, defaultCurrency: Currency.BRL, iconName: 'PenTool' },
  { id: 'figma', name: 'Figma', domain: 'figma.com', defaultCategory: 'Ferramentas', defaultTags: ['Design'], isRecurring: true, defaultAmount: 15, defaultCurrency: Currency.USD, iconName: 'Figma' },
  { id: 'canva', name: 'Canva Pro', domain: 'canva.com', defaultCategory: 'Ferramentas', defaultTags: ['Design'], isRecurring: true, defaultAmount: 54.99, defaultCurrency: Currency.BRL, iconName: 'Palette' },
  { id: 'notion', name: 'Notion', domain: 'notion.so', defaultCategory: 'Ferramentas', defaultTags: ['Produtividade'], isRecurring: true, defaultAmount: 10, defaultCurrency: Currency.USD, iconName: 'FileText' },
  { id: 'chatgpt', name: 'ChatGPT Plus', domain: 'openai.com', defaultCategory: 'Ferramentas', defaultTags: ['IA'], isRecurring: true, defaultAmount: 20, defaultCurrency: Currency.USD, iconName: 'Sparkles' },
  { id: 'claude', name: 'Claude Pro', domain: 'anthropic.com', defaultCategory: 'Ferramentas', defaultTags: ['IA'], isRecurring: true, defaultAmount: 20, defaultCurrency: Currency.USD, iconName: 'Brain' },
  { id: 'midjourney', name: 'Midjourney', domain: 'midjourney.com', defaultCategory: 'Ferramentas', defaultTags: ['IA'], isRecurring: true, defaultAmount: 10, defaultCurrency: Currency.USD, iconName: 'Image' },
  { id: 'google', name: 'Google Workspace', domain: 'google.com', defaultCategory: 'Ferramentas', defaultTags: ['Email'], isRecurring: true, defaultAmount: 28, defaultCurrency: Currency.BRL, iconName: 'Cloud' },
  { id: 'github', name: 'GitHub Pro', domain: 'github.com', defaultCategory: 'Ferramentas', defaultTags: ['Dev'], isRecurring: true, defaultAmount: 4, defaultCurrency: Currency.USD, iconName: 'Github' },
  { id: 'vercel', name: 'Vercel', domain: 'vercel.com', defaultCategory: 'Ferramentas', defaultTags: ['Hosting'], isRecurring: true, defaultAmount: 20, defaultCurrency: Currency.USD, iconName: 'Server' },
  { id: 'hostgator', name: 'HostGator', domain: 'hostgator.com.br', defaultCategory: 'Ferramentas', defaultTags: ['Hospedagem'], isRecurring: true, iconName: 'Server' },
  { id: 'godaddy', name: 'GoDaddy', domain: 'godaddy.com', defaultCategory: 'Ferramentas', defaultTags: ['Domínio'], isRecurring: true, iconName: 'Globe' },
  { id: 'zoom', name: 'Zoom', domain: 'zoom.us', defaultCategory: 'Ferramentas', defaultTags: ['Reuniões'], isRecurring: true, defaultAmount: 15.99, defaultCurrency: Currency.USD, iconName: 'Video' },
  { id: 'slack', name: 'Slack', domain: 'slack.com', defaultCategory: 'Ferramentas', defaultTags: ['Comunicação'], isRecurring: true, defaultAmount: 8.75, defaultCurrency: Currency.USD, iconName: 'MessageSquare' },
  
  // TRANSPORTE
  { id: 'uber', name: 'Uber', domain: 'uber.com', defaultCategory: 'Transporte', defaultTags: ['Corrida'], isRecurring: false, iconName: 'Car' },
  { id: '99', name: '99', domain: '99app.com', defaultCategory: 'Transporte', defaultTags: ['Corrida'], isRecurring: false, iconName: 'Car' },
  { id: 'gasolina', name: 'Gasolina', domain: '', defaultCategory: 'Transporte', defaultTags: ['Combustível'], isRecurring: false, iconName: 'Fuel' },
  { id: 'estacionamento', name: 'Estacionamento', domain: '', defaultCategory: 'Transporte', defaultTags: ['Estacionamento'], isRecurring: false, iconName: 'ParkingCircle' },
  
  // LAZER (streaming, jogos - menor prioridade)
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', defaultCategory: 'Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 55.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', defaultCategory: 'Lazer', defaultTags: ['Música'], isRecurring: true, defaultAmount: 21.90, defaultCurrency: Currency.BRL, iconName: 'Music' },
  { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', defaultCategory: 'Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 43.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'prime', name: 'Prime Video', domain: 'primevideo.com', defaultCategory: 'Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 19.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', defaultCategory: 'Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 24.90, defaultCurrency: Currency.BRL, iconName: 'Play' },
  { id: 'hbo', name: 'Max (HBO)', domain: 'max.com', defaultCategory: 'Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 34.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'gamepass', name: 'Xbox Game Pass', domain: 'xbox.com', defaultCategory: 'Lazer', defaultTags: ['Jogos'], isRecurring: true, defaultAmount: 44.90, defaultCurrency: Currency.BRL, iconName: 'Gamepad2' },
  { id: 'psplus', name: 'PlayStation Plus', domain: 'playstation.com', defaultCategory: 'Lazer', defaultTags: ['Jogos'], isRecurring: true, defaultAmount: 42.90, defaultCurrency: Currency.BRL, iconName: 'Gamepad2' },
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Moradia': 'Home',
  'Contas Fixas': 'Zap',
  'Alimentação': 'UtensilsCrossed',
  'Ferramentas': 'Wrench',
  'Transporte': 'Car',
  'Lazer': 'Gamepad2',
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
