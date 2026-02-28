import { Currency, Project, Expense, Payment, PaymentStatus, ProjectStatus, ProjectContractType, Client, Contract } from '../types';

export interface MonthKey {
  year: number;
  month: number;
  str: string;
}

export interface ProjectFinancials {
  projectId: string;
  clientName: string;
  currency: Currency;
  gross: number;
  adjustments: number;
  fees: number;
  net: number;
  paid: number;
  scheduled: number;
  remaining: number;
  expenseTotal: number;
  profit: number;
  isOverdue: boolean;
  overdueAmount: number;
  nextPayment?: { date: Date; amount: number };
  // Converted to main currency
  grossConverted: number;
  netConverted: number;
  paidConverted: number;
}

export interface ExpenseSnapshot {
  expenseId: string;
  title: string;
  amount: number;
  amountConverted: number;
  currency: Currency;
  category?: string;
  isRecurring: boolean;
  isPaidThisMonth: boolean;
  isTrial: boolean;
  trialDaysLeft?: number;
  trialExpired?: boolean;
  dueDay?: number;
}

export interface RecurringExpenseProgress {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  percentPaid: number;
  expenses: ExpenseSnapshot[];
}

export interface FinancialSnapshot {
  period: { start: Date; end: Date };
  income: {
    total: number;
    paid: number;
    scheduled: number;
    overdue: number;
  };
  expenses: {
    total: number;
    paid: number;
    pending: number;
  };
  net: number;
  profitMargin: number;
  goalProgress: number;
  taxReserve: number;
  recurringIncome: number;
  recurringExpenses: number;
}

export interface Receivable {
  projectId: string;
  paymentId: string;
  clientName: string;
  amount: number;
  amountConverted: number;
  currency: Currency;
  date: Date;
  isOverdue: boolean;
  daysOverdue: number;
  confidence: ConfidenceLevel;
}

export interface ExpenseReminder {
  expenseId: string;
  title: string;
  amount: number;
  amountConverted: number;
  currency: Currency;
  dueDate: Date;
  daysUntilDue: number;
  isPaid: boolean;
}

export interface HealthScore {
  score: number;
  factors: {
    goalProgress: number;
    profitMargin: number;
    overduePenalty: number;
  };
  status: 'excellent' | 'warning' | 'critical';
}

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'income' | 'expense' | 'project_start' | 'project_due' | 'trial_end';
  title: string;
  amount?: number;
  amountConverted?: number;
  currency?: Currency;
  status: 'paid' | 'pending' | 'overdue' | 'info';
  meta?: {
    projectId?: string;
    expenseId?: string;
    paymentId?: string;
  };
}

export interface ActivityItem {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  title: string;
  subtitle?: string;
  amount: number;
  currency: string;
  status?: string;
}

export interface GroupedActivity {
  label: string;
  items: ActivityItem[];
}

export interface FinancialEngineConfig {
  mainCurrency: Currency;
  exchangeRates: Record<Currency, number>;
  monthlyGoal: number;
  taxReservePercent: number;
}

export type ConfidenceLevel = 'confirmed' | 'estimated' | 'unknown';

export interface NextBestAction {
  title: string;
  reason: string;
  route: string;
  priority: number;
}

export interface DashboardSignals {
  hasRecurringExpenses: boolean;
  hasReceivables: boolean;
  hasMultiProjectClient: boolean;
  hasLinkedProjectCosts: boolean;
  forecastConfidenceLow: boolean;
}

export interface DashboardModel {
  snapshot: FinancialSnapshot;
  healthScore: HealthScore;
  recentActivity: GroupedActivity[];
  confidence: ConfidenceLevel;
  nextBestAction: NextBestAction | null;
  signals: DashboardSignals;
  forecast30Days?: any; // To hold future ExpenseReminder payload if needed
  receivables?: Receivable[];
  clientDependency?: ClientModel[];
  marginAnalysis?: ProjectMarginModel[];
}

export interface ProjectModel {
  financials: ProjectFinancials | null;
  timeline: TimelineEvent[];
}

export interface ClientModel {
  clientId: string;
  totalProjects: number;
  activeProjects: number;
  totalGrossConverted: number;
  totalPaidConverted: number;
  totalRemainingConverted: number;
  contracts?: ContractCardModel[];
}

export interface ProjectCardModel {
  id: string;
  title: string;
  clientName: string;
  status: ProjectStatus;
  category: string;
  isArchived: boolean;
  createdAt: number;
  tags: string[];
  moneySummary: {
    gross: number;
    paid: number;
    remaining: number;
    currency: Currency;
    isOverdue: boolean;
    nextPayment?: { date: Date; amount: number };
  };
}

export interface ProjectsListModel {
  projects: ProjectCardModel[];
  suggestGroupByClient: boolean;
}

export interface ClientCardModel {
  clientId: string;
  clientName: string;
  totalRevenueConverted: number; // Converted to base currency
  shareOfRevenue: number; // 0-100 percentage
  activeProjectsCount: number;
  totalProjectsCount: number;
  hasHighDependency: boolean;
}

export interface ClientMonthlyRevenue {
  month: string; // e.g. "2026-01"
  revenue: number;
}

export interface ContractCardModel {
  id: string;
  title: string;
  clientName: string;
  retainerAmount: number;
  currency: Currency;
  activeProjectsCount: number;
  isActive: boolean;
  startDate: Date;
}

export interface ContractModel {
  contract: Contract;
  financials: {
    totalGross: number;
    totalNet: number;
    totalPaid: number;
    totalRemaining: number;
  };
  projects: ProjectCardModel[];
}

export interface ClientDetailsModel {
  client: Client; // Base data
  metrics: {
    shareOfRevenue: number;
    hasHighDependency: boolean;
    totalRevenueConverted: number;
  };
  summary12Months: ClientMonthlyRevenue[];
  projects: ProjectCardModel[];
  receivables: Receivable[];
  contracts: ContractCardModel[];
}

export interface ProjectMarginModel {
  projectId: string;
  projectTitle: string;
  grossRevenue: number;
  directCosts: number;
  margin: number;
  marginPercent: number;
}

export interface DashboardModel {
  snapshot: FinancialSnapshot;
  healthScore: HealthScore;
  recentActivity: GroupedActivity[];
  confidence: ConfidenceLevel;
  nextBestAction: NextBestAction | null;
  signals: DashboardSignals;
  forecast30Days?: any;
  receivables?: Receivable[];
  clientDependency?: ClientModel[];
  marginAnalysis?: ProjectMarginModel[];
}

export interface MonthlyReportModel {
  monthKey: string;
  income: number;
  expenses: number;
  net: number;
  topClients: { name: string; value: number }[];
  categoryBreakdown: { name: string; value: number }[];
  receivablesSummary: {
    total: number;
    count: number;
  };
  transactions: {
    id: string;
    clientName: string;
    category: string;
    date: string;
    status: ProjectStatus;
    gross: number;
    net: number;
    currency: Currency;
  }[];
}

export interface YearToDateModel {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalNet: number;
  monthlyTrend: {
    name: string;
    income: number;
    expense: number;
  }[];
}
