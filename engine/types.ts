import { Currency, Project, Expense, Payment, PaymentStatus, ProjectStatus, ProjectContractType } from '../types';

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
  subtitle: string;
  amount: number;
  currency: Currency;
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
