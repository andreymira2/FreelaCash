
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
  domain: string;
  defaultCategory: string;
  defaultTags: string[];
  isRecurring: boolean;
  defaultAmount?: number;
  defaultCurrency?: Currency;
  iconName: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', defaultCategory: 'Streaming / Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 55.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', defaultCategory: 'Streaming / Lazer', defaultTags: ['Música'], isRecurring: true, defaultAmount: 21.90, defaultCurrency: Currency.BRL, iconName: 'Music' },
  { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', defaultCategory: 'Streaming / Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 43.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'prime', name: 'Prime Video', domain: 'primevideo.com', defaultCategory: 'Streaming / Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 19.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', defaultCategory: 'Streaming / Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 24.90, defaultCurrency: Currency.BRL, iconName: 'Play' },
  { id: 'hbo', name: 'Max (HBO)', domain: 'max.com', defaultCategory: 'Streaming / Lazer', defaultTags: ['Streaming'], isRecurring: true, defaultAmount: 34.90, defaultCurrency: Currency.BRL, iconName: 'Tv' },
  { id: 'adobe', name: 'Adobe CC', domain: 'adobe.com', defaultCategory: 'Software & Tools', defaultTags: ['Design', 'Criativo'], isRecurring: true, defaultAmount: 290, defaultCurrency: Currency.BRL, iconName: 'PenTool' },
  { id: 'figma', name: 'Figma', domain: 'figma.com', defaultCategory: 'Software & Tools', defaultTags: ['Design', 'UI/UX'], isRecurring: true, defaultAmount: 15, defaultCurrency: Currency.USD, iconName: 'Figma' },
  { id: 'canva', name: 'Canva Pro', domain: 'canva.com', defaultCategory: 'Software & Tools', defaultTags: ['Design'], isRecurring: true, defaultAmount: 54.99, defaultCurrency: Currency.BRL, iconName: 'Palette' },
  { id: 'notion', name: 'Notion', domain: 'notion.so', defaultCategory: 'Software & Tools', defaultTags: ['Produtividade'], isRecurring: true, defaultAmount: 10, defaultCurrency: Currency.USD, iconName: 'FileText' },
  { id: 'chatgpt', name: 'ChatGPT Plus', domain: 'openai.com', defaultCategory: 'IA & Automação', defaultTags: ['IA', 'Produtividade'], isRecurring: true, defaultAmount: 20, defaultCurrency: Currency.USD, iconName: 'Sparkles' },
  { id: 'claude', name: 'Claude Pro', domain: 'anthropic.com', defaultCategory: 'IA & Automação', defaultTags: ['IA'], isRecurring: true, defaultAmount: 20, defaultCurrency: Currency.USD, iconName: 'Brain' },
  { id: 'midjourney', name: 'Midjourney', domain: 'midjourney.com', defaultCategory: 'IA & Automação', defaultTags: ['IA', 'Arte'], isRecurring: true, defaultAmount: 10, defaultCurrency: Currency.USD, iconName: 'Image' },
  { id: 'google', name: 'Google Workspace', domain: 'google.com', defaultCategory: 'Software & Tools', defaultTags: ['Email', 'Drive'], isRecurring: true, defaultAmount: 28, defaultCurrency: Currency.BRL, iconName: 'Cloud' },
  { id: 'microsoft', name: 'Microsoft 365', domain: 'microsoft.com', defaultCategory: 'Software & Tools', defaultTags: ['Office'], isRecurring: true, defaultAmount: 45, defaultCurrency: Currency.BRL, iconName: 'Grid' },
  { id: 'dropbox', name: 'Dropbox', domain: 'dropbox.com', defaultCategory: 'Software & Tools', defaultTags: ['Cloud', 'Storage'], isRecurring: true, defaultAmount: 11.99, defaultCurrency: Currency.USD, iconName: 'Cloud' },
  { id: 'slack', name: 'Slack', domain: 'slack.com', defaultCategory: 'Software & Tools', defaultTags: ['Comunicação'], isRecurring: true, defaultAmount: 8.75, defaultCurrency: Currency.USD, iconName: 'MessageSquare' },
  { id: 'zoom', name: 'Zoom', domain: 'zoom.us', defaultCategory: 'Software & Tools', defaultTags: ['Reuniões'], isRecurring: true, defaultAmount: 15.99, defaultCurrency: Currency.USD, iconName: 'Video' },
  { id: 'github', name: 'GitHub Pro', domain: 'github.com', defaultCategory: 'Software & Tools', defaultTags: ['Dev'], isRecurring: true, defaultAmount: 4, defaultCurrency: Currency.USD, iconName: 'Github' },
  { id: 'vercel', name: 'Vercel', domain: 'vercel.com', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Servidor', 'Infra'], isRecurring: true, defaultAmount: 20, defaultCurrency: Currency.USD, iconName: 'Server' },
  { id: 'aws', name: 'AWS', domain: 'aws.amazon.com', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Servidor', 'Infra'], isRecurring: true, iconName: 'Server' },
  { id: 'heroku', name: 'Heroku', domain: 'heroku.com', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Servidor', 'Infra'], isRecurring: true, iconName: 'Server' },
  { id: 'digitalocean', name: 'DigitalOcean', domain: 'digitalocean.com', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Servidor', 'Infra'], isRecurring: true, iconName: 'Server' },
  { id: 'uber', name: 'Uber', domain: 'uber.com', defaultCategory: 'Transporte', defaultTags: ['Corrida'], isRecurring: false, iconName: 'Car' },
  { id: '99', name: '99', domain: '99app.com', defaultCategory: 'Transporte', defaultTags: ['Corrida'], isRecurring: false, iconName: 'Car' },
  { id: 'ifood', name: 'iFood', domain: 'ifood.com.br', defaultCategory: 'Alimentação / Café', defaultTags: ['Delivery'], isRecurring: false, iconName: 'UtensilsCrossed' },
  { id: 'rappi', name: 'Rappi', domain: 'rappi.com.br', defaultCategory: 'Alimentação / Café', defaultTags: ['Delivery'], isRecurring: false, iconName: 'UtensilsCrossed' },
  { id: 'starbucks', name: 'Starbucks', domain: 'starbucks.com', defaultCategory: 'Alimentação / Café', defaultTags: ['Café'], isRecurring: false, iconName: 'Coffee' },
  { id: 'nordvpn', name: 'NordVPN', domain: 'nordvpn.com', defaultCategory: 'Software & Tools', defaultTags: ['VPN', 'Segurança'], isRecurring: true, defaultAmount: 12.99, defaultCurrency: Currency.USD, iconName: 'Shield' },
  { id: '1password', name: '1Password', domain: '1password.com', defaultCategory: 'Software & Tools', defaultTags: ['Segurança'], isRecurring: true, defaultAmount: 2.99, defaultCurrency: Currency.USD, iconName: 'Key' },
  { id: 'hostgator', name: 'HostGator', domain: 'hostgator.com.br', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Hospedagem'], isRecurring: true, iconName: 'Server' },
  { id: 'godaddy', name: 'GoDaddy', domain: 'godaddy.com', defaultCategory: 'Assinaturas / Subs', defaultTags: ['Domínio'], isRecurring: true, iconName: 'Globe' },
  { id: 'linear', name: 'Linear', domain: 'linear.app', defaultCategory: 'Software & Tools', defaultTags: ['Produtividade', 'Dev'], isRecurring: true, defaultAmount: 8, defaultCurrency: Currency.USD, iconName: 'Layers' },
  { id: 'miro', name: 'Miro', domain: 'miro.com', defaultCategory: 'Software & Tools', defaultTags: ['Colaboração'], isRecurring: true, defaultAmount: 8, defaultCurrency: Currency.USD, iconName: 'PenTool' },
  { id: 'trello', name: 'Trello', domain: 'trello.com', defaultCategory: 'Software & Tools', defaultTags: ['Produtividade'], isRecurring: true, defaultAmount: 5, defaultCurrency: Currency.USD, iconName: 'Columns' },
  { id: 'asana', name: 'Asana', domain: 'asana.com', defaultCategory: 'Software & Tools', defaultTags: ['Produtividade'], isRecurring: true, defaultAmount: 10.99, defaultCurrency: Currency.USD, iconName: 'CheckSquare' },
  { id: 'loom', name: 'Loom', domain: 'loom.com', defaultCategory: 'Software & Tools', defaultTags: ['Comunicação'], isRecurring: true, defaultAmount: 12.50, defaultCurrency: Currency.USD, iconName: 'Video' },
  { id: 'grammarly', name: 'Grammarly', domain: 'grammarly.com', defaultCategory: 'Software & Tools', defaultTags: ['Escrita'], isRecurring: true, defaultAmount: 12, defaultCurrency: Currency.USD, iconName: 'Check' },
  { id: 'envato', name: 'Envato Elements', domain: 'elements.envato.com', defaultCategory: 'Software & Tools', defaultTags: ['Design', 'Assets'], isRecurring: true, defaultAmount: 16.50, defaultCurrency: Currency.USD, iconName: 'Layers' },
  { id: 'shutterstock', name: 'Shutterstock', domain: 'shutterstock.com', defaultCategory: 'Software & Tools', defaultTags: ['Fotos', 'Assets'], isRecurring: true, defaultAmount: 29, defaultCurrency: Currency.USD, iconName: 'Image' },
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
