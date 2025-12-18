import { Project, Expense, Currency, PaymentStatus, ProjectStatus } from '../types';
import { 
  FinancialEngineConfig, 
  FinancialSnapshot, 
  ProjectFinancials, 
  RecurringExpenseProgress,
  Receivable,
  ExpenseReminder,
  HealthScore,
  ActivityItem,
  GroupedActivity,
  TimelineEvent,
  MonthKey
} from './types';
import { safeFloat, convertCurrency, createCurrencyConverter } from './currencyUtils';
import { 
  getDateRange, 
  getCurrentMonth, 
  getMonthKey, 
  getDaysDifference, 
  isDateInRange,
  startOfDay,
  addDays
} from './dateUtils';
import { 
  calculateProjectFinancials, 
  getProjectReceivables, 
  getRecurringIncome,
  getProjectIncomeInPeriod
} from './projectCalculations';
import { 
  getRecurringExpenseProgress, 
  getExpenseReminders,
  getExpensesPaidInPeriod,
  getOpenExpensesInPeriod,
  getRecurringExpenseTotal
} from './expenseCalculations';

export class FinancialEngine {
  private config: FinancialEngineConfig;
  private projects: Project[];
  private expenses: Expense[];
  private convert: ReturnType<typeof createCurrencyConverter>;

  constructor(
    projects: Project[],
    expenses: Expense[],
    config: FinancialEngineConfig
  ) {
    this.projects = projects;
    this.expenses = expenses;
    this.config = config;
    this.convert = createCurrencyConverter(config);
  }

  getConfig(): FinancialEngineConfig {
    return this.config;
  }

  getProjectFinancials(projectId: string): ProjectFinancials | null {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return null;
    return calculateProjectFinancials(project, this.expenses, this.config);
  }

  getAllProjectFinancials(): ProjectFinancials[] {
    return this.projects.map(p => calculateProjectFinancials(p, this.expenses, this.config));
  }

  getActiveProjectFinancials(): ProjectFinancials[] {
    return this.projects
      .filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING)
      .map(p => calculateProjectFinancials(p, this.expenses, this.config));
  }

  getReceivables(): Receivable[] {
    return getProjectReceivables(this.projects, this.config);
  }

  getRecurringIncome(): number {
    return getRecurringIncome(this.projects, this.config);
  }

  getRecurringExpenseProgress(month?: Date): RecurringExpenseProgress {
    const monthKey = month ? getMonthKey(month) : getCurrentMonth();
    return getRecurringExpenseProgress(this.expenses, monthKey, this.config);
  }

  getExpenseReminders(daysAhead: number = 7): ExpenseReminder[] {
    return getExpenseReminders(this.expenses, daysAhead, this.config);
  }

  getRecurringExpenseTotal(): number {
    return getRecurringExpenseTotal(this.expenses, this.config);
  }

  getFinancialSnapshot(start: Date, end: Date): FinancialSnapshot {
    const income = getProjectIncomeInPeriod(this.projects, start, end, this.config);
    const expenses = getExpensesPaidInPeriod(this.expenses, start, end, this.config);
    const openExpenses = getOpenExpensesInPeriod(this.expenses, start, end, this.config);
    
    const receivables = this.getReceivables();
    const scheduledIncome = receivables
      .filter(r => isDateInRange(r.date, start, end))
      .reduce((acc, r) => safeFloat(acc + r.amountConverted), 0);
    const overdueIncome = receivables
      .filter(r => r.isOverdue)
      .reduce((acc, r) => safeFloat(acc + r.amountConverted), 0);

    const net = safeFloat(income.total - expenses.total);
    const profitMargin = income.total > 0 ? safeFloat((net / income.total) * 100) : 0;
    const goalProgress = Math.min(100, safeFloat((income.total / (this.config.monthlyGoal || 1)) * 100));
    const taxReserve = safeFloat(income.total * (this.config.taxReservePercent || 0) / 100);
    const recurringIncome = this.getRecurringIncome();
    const recurringExpenses = this.getRecurringExpenseTotal();

    return {
      period: { start, end },
      income: {
        total: income.total,
        paid: income.total,
        scheduled: scheduledIncome,
        overdue: overdueIncome
      },
      expenses: {
        total: expenses.total,
        paid: expenses.total,
        pending: openExpenses
      },
      net,
      profitMargin,
      goalProgress,
      taxReserve,
      recurringIncome,
      recurringExpenses
    };
  }

  getHealthScore(): HealthScore {
    const range = getDateRange('THIS_MONTH');
    const snapshot = this.getFinancialSnapshot(range.start, range.end);
    const receivables = this.getReceivables();
    const overdueCount = receivables.filter(r => r.isOverdue).length;

    const goalProgress = snapshot.goalProgress;
    const profitMargin = Math.max(0, Math.min(100, snapshot.profitMargin));
    const overduePenalty = Math.min(15, overdueCount * 5);

    const score = Math.round(
      (goalProgress * 0.5) + 
      (profitMargin * 0.35) - 
      overduePenalty
    );
    const clampedScore = Math.max(0, Math.min(100, score));

    let status: 'excellent' | 'warning' | 'critical';
    if (clampedScore >= 70) status = 'excellent';
    else if (clampedScore >= 40) status = 'warning';
    else status = 'critical';

    return {
      score: clampedScore,
      factors: {
        goalProgress,
        profitMargin,
        overduePenalty
      },
      status
    };
  }

  getRecentActivity(limit: number = 15): GroupedActivity[] {
    const activities: ActivityItem[] = [];

    this.projects.forEach(p => {
      p.payments?.forEach(pay => {
        if (pay.status === PaymentStatus.PAID || !pay.status) {
          activities.push({
            id: pay.id,
            date: new Date(pay.date),
            type: 'income',
            title: p.clientName,
            subtitle: pay.note || 'Pagamento Recebido',
            amount: pay.amount,
            currency: p.currency
          });
        }
      });
    });

    this.expenses.forEach(e => {
      if (e.isRecurring) {
        e.paymentHistory?.forEach(h => {
          if (h.status === 'PAID') {
            const [y, m] = h.monthStr.split('-').map(Number);
            activities.push({
              id: `${e.id}-${h.monthStr}`,
              date: new Date(y, m - 1, e.dueDay || 15),
              type: 'expense',
              title: e.title,
              subtitle: e.category || 'Despesa Recorrente',
              amount: e.amount,
              currency: e.currency
            });
          }
        });
      } else if (e.status === 'PAID') {
        activities.push({
          id: e.id,
          date: new Date(e.date),
          type: 'expense',
          title: e.title,
          subtitle: e.category || 'Despesa Pontual',
          amount: e.amount,
          currency: e.currency
        });
      }
    });

    const sorted = activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = addDays(todayStart, -7);

    const grouped: GroupedActivity[] = [];
    const todayItems = sorted.filter(item => item.date >= todayStart);
    const weekItems = sorted.filter(item => item.date < todayStart && item.date >= weekStart);
    const olderItems = sorted.filter(item => item.date < weekStart);

    if (todayItems.length > 0) grouped.push({ label: 'Hoje', items: todayItems });
    if (weekItems.length > 0) grouped.push({ label: 'Últimos 7 Dias', items: weekItems });
    if (olderItems.length > 0) grouped.push({ label: 'Anteriores', items: olderItems });

    return grouped;
  }

  getCalendarEvents(monthDate: Date): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const today = new Date();

    this.projects.forEach(p => {
      const start = new Date(p.startDate);
      if (start.getFullYear() === year && start.getMonth() === month) {
        events.push({
          id: `start-${p.id}`,
          date: start,
          type: 'project_start',
          title: `Início: ${p.clientName}`,
          status: 'info',
          meta: { projectId: p.id }
        });
      }

      if (p.dueDate) {
        const due = new Date(p.dueDate);
        if (due.getFullYear() === year && due.getMonth() === month) {
          events.push({
            id: `due-${p.id}`,
            date: due,
            type: 'project_due',
            title: `Prazo: ${p.clientName}`,
            status: due < today ? 'overdue' : 'pending',
            meta: { projectId: p.id }
          });
        }
      }

      p.payments?.forEach(pay => {
        const d = new Date(pay.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const isPaid = pay.status === PaymentStatus.PAID || !pay.status;
          events.push({
            id: `pay-${pay.id}`,
            date: d,
            type: 'income',
            title: `Receb.: ${p.clientName}`,
            amount: pay.amount,
            amountConverted: this.convert(pay.amount, p.currency),
            currency: p.currency,
            status: isPaid ? 'paid' : (d < today ? 'overdue' : 'pending'),
            meta: { projectId: p.id, paymentId: pay.id }
          });
        }
      });
    });

    this.expenses.forEach(e => {
      if (e.isTrial && e.trialEndDate) {
        const trialEnd = new Date(e.trialEndDate);
        if (trialEnd.getFullYear() === year && trialEnd.getMonth() === month) {
          events.push({
            id: `trial-${e.id}`,
            date: trialEnd,
            type: 'trial_end',
            title: `Fim Teste: ${e.title}`,
            status: trialEnd < today ? 'overdue' : 'pending',
            meta: { expenseId: e.id }
          });
        }
      }

      if (e.isRecurring) {
        const trialEnd = e.trialEndDate ? new Date(e.trialEndDate) : null;
        const monthEnd = new Date(year, month + 1, 0);

        if (trialEnd && trialEnd > monthEnd && e.isTrial) return;

        const day = e.dueDay || new Date(e.date).getDate();
        const eventDate = new Date(year, month, day);
        const isPaid = e.paymentHistory?.some(h => h.monthStr === monthStr && h.status === 'PAID') || false;

        events.push({
          id: `rec-${e.id}`,
          date: eventDate,
          type: 'expense',
          title: e.title,
          amount: e.amount,
          amountConverted: this.convert(e.amount, e.currency),
          currency: e.currency,
          status: isPaid ? 'paid' : (eventDate < today ? 'overdue' : 'pending'),
          meta: { expenseId: e.id }
        });
      } else {
        const d = new Date(e.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          events.push({
            id: `exp-${e.id}`,
            date: d,
            type: 'expense',
            title: e.title,
            amount: e.amount,
            amountConverted: this.convert(e.amount, e.currency),
            currency: e.currency,
            status: e.status === 'PAID' ? 'paid' : (d < today ? 'overdue' : 'pending'),
            meta: { expenseId: e.id }
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  convertToMainCurrency(amount: number, from: Currency): number {
    return this.convert(amount, from);
  }
}

export function createFinancialEngine(
  projects: Project[],
  expenses: Expense[],
  config: FinancialEngineConfig
): FinancialEngine {
  return new FinancialEngine(projects, expenses, config);
}
