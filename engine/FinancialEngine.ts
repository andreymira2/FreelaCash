import { Project, Expense, Currency, PaymentStatus, ProjectStatus, Client, Contract } from '../types';
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
  MonthKey,
  DashboardModel,
  ProjectModel,
  ClientModel,
  ProjectCardModel,
  ProjectsListModel,
  ConfidenceLevel,
  TimelineEvent,
  NextBestAction,
  DashboardSignals,
  ClientCardModel,
  ClientDetailsModel,
  ProjectMarginModel,
  MonthlyReportModel,
  YearToDateModel,
  ContractModel,
  ContractCardModel
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
  getProjectIncomeInPeriod,
  getProjectsListModel,
  getClientsListModel,
  getClientDetailsModel,
  getRecentActivity
} from './projectCalculations';
import {
  getRecurringExpenseProgress,
  getExpenseReminders,
  getExpensesPaidInPeriod,
  getOpenExpensesInPeriod,
  getRecurringExpenseTotal,
  getProjectMarginModel,
  getExpensesListModel
} from './expenseCalculations';
import {
  calculateMonthlyReport,
  calculateYearToDateReport
} from './reportCalculations';
import { calculateContractModel, calculateContractCardModel } from './contractCalculations';

export class FinancialEngine {
  private config: FinancialEngineConfig;
  private projects: Project[];
  private expenses: Expense[];
  private clients: Client[];
  private contracts: Contract[]; // Added contracts

  private convert: ReturnType<typeof createCurrencyConverter>;

  constructor(
    projects: Project[],
    expenses: Expense[],
    clients: Client[],
    config: FinancialEngineConfig,
    contracts: Contract[] = []
  ) {
    this.projects = projects;
    this.expenses = expenses;
    this.clients = clients;
    this.config = config;
    this.contracts = contracts;
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

  getProjectsListModel(filters?: { status?: string, searchQuery?: string, showOnlyPending?: boolean }): ProjectsListModel {
    return getProjectsListModel(this.projects, this.config, filters);
  }

  getClientsListModel(filters?: { searchQuery?: string }): ClientCardModel[] {
    return getClientsListModel(this.clients, this.projects, this.config, filters);
  }

  getClientDetailsModel(clientId: string): ClientDetailsModel | null {
    return getClientDetailsModel(clientId, this.clients, this.projects, this.config);
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

  getExpensesListModel(filters?: { projectId?: string, clientId?: string, searchQuery?: string, status?: string }): Expense[] {
    return getExpensesListModel(this.expenses, this.config, filters);
  }

  getProjectMarginModel(projectId: string): ProjectMarginModel | null {
    const margin = getProjectMarginModel(
      this.projects, // Changed from this.data.projects to this.projects
      this.expenses, // Changed from this.data.expenses to this.expenses
      projectId,
      this.config
    );

    if (!margin) return null;

    // Populate revenue from the actual project financials
    const financials = this.getProjectFinancials(projectId);
    if (financials) {
      margin.grossRevenue = financials.grossConverted;
      margin.margin = safeFloat(margin.grossRevenue - margin.directCosts);
      margin.marginPercent = margin.grossRevenue > 0 ? (margin.margin / margin.grossRevenue) * 100 : 0;
    }

    return margin;
  }

  getMarginAnalysis(): ProjectMarginModel[] {
    const projectsWithCosts = this.projects // Changed from this.data.projects to this.projects
      .filter(p => !p.isArchived)
      .map(p => this.getProjectMarginModel(p.id))
      .filter((m): m is ProjectMarginModel => m !== null && m.directCosts > 0);

    return projectsWithCosts.sort((a, b) => b.directCosts - a.directCosts);
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

  getNextBestAction(rangeStart: Date, rangeEnd: Date): NextBestAction | null {
    // Priority 1: Overdue Receivables
    const receivables = this.getReceivables();
    const overdue = receivables.find(r => r.isOverdue);
    if (overdue) {
      return {
        title: `Cobrar ${overdue.clientName}`,
        reason: 'Existem recebimentos em atraso.',
        route: `/projects/${overdue.projectId}`,
        priority: 1
      };
    }

    // Priority 2: Missing Expense Data (Negligent User check)
    if (this.expenses.length === 0) {
      return {
        title: 'Registrar Despesas',
        reason: 'O sistema não possui dados de despesas para projeções.',
        route: '/expenses',
        priority: 2
      };
    }

    // Priority 3: No Active Projects
    const activeProjects = this.projects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING);
    if (activeProjects.length === 0) {
      return {
        title: 'Criar Novo Projeto',
        reason: 'Nenhum projeto ativo para acompanhar de perto.',
        route: '/projects/new',
        priority: 3
      };
    }

    // Default: Nothing urgent
    return null;
  }

  getDashboardSignals(): DashboardSignals {
    const hasRecurringExpenses = this.expenses.some(e => e.isRecurring);
    const hasReceivables = this.getReceivables().length > 0;

    // Check if any client has more than 1 project
    const clientProjectCounts: Record<string, number> = {};
    this.projects.forEach(p => {
      clientProjectCounts[p.clientName] = (clientProjectCounts[p.clientName] || 0) + 1;
    });
    const hasMultiProjectClient = Object.values(clientProjectCounts).some(count => count > 1);

    const hasLinkedProjectCosts = this.projects.some(p => p.linkedExpenseIds && p.linkedExpenseIds.length > 0);
    const forecastConfidenceLow = !hasRecurringExpenses; // Expanding on the degradation rule

    return {
      hasRecurringExpenses,
      hasReceivables,
      hasMultiProjectClient,
      hasLinkedProjectCosts,
      forecastConfidenceLow
    };
  }

  getDashboardModel(rangeStart: Date, rangeEnd: Date): DashboardModel {
    const nextBestAction = this.getNextBestAction(rangeStart, rangeEnd);
    const signals = this.getDashboardSignals();

    // Degradation Rule: If recurring expenses are empty, forecast confidence is estimated
    let confidence: ConfidenceLevel = signals.forecastConfidenceLow ? 'estimated' : 'confirmed';

    const model: DashboardModel = {
      snapshot: this.getFinancialSnapshot(rangeStart, rangeEnd),
      healthScore: this.getHealthScore(),
      recentActivity: this.getRecentActivity(15),
      confidence,
      nextBestAction,
      signals
    };

    // Conditional module attachments based on Stage 4 Progressive Engine requests
    if (signals.hasRecurringExpenses) {
      // Stub for the 30-day forecast, attaching upcoming reminders
      model.forecast30Days = this.getExpenseReminders(30);
    }

    if (signals.hasReceivables) {
      // Attach the existing list of specific receivables
      model.receivables = this.getReceivables();
    }

    if (signals.hasMultiProjectClient) {
      // Find the specific clients causing this flag 
      // (For this stage we just need one to prove the module works)
      const topClientEntry = Object.entries(
        this.projects.reduce((acc, p) => {
          acc[p.clientName] = (acc[p.clientName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).find(([_, count]) => count > 1);

      if (topClientEntry) {
        model.clientDependency = [this.getClientModel(topClientEntry[0])];
      }
    }

    if (signals.hasLinkedProjectCosts) {
      model.marginAnalysis = this.getMarginAnalysis();
    }

    return model;
  }

  getProjectModel(projectId: string): ProjectModel {
    const financials = this.getProjectFinancials(projectId);

    // Get all events, filter only for this project
    const allEvents = this.getCalendarEvents(new Date());
    // ^ getCalendarEvents requires a month date. We can grab a wide array if needed, 
    // but the prompt just needs a stub for the timeline. For precision, let's grab the project's own array.
    const project = this.projects.find(p => p.id === projectId);
    const timeline: TimelineEvent[] = [];

    if (project) {
      // Stubbing the timeline just from the project payments for the model
      project.payments?.forEach(pay => {
        timeline.push({
          id: pay.id,
          date: new Date(pay.date),
          type: 'income',
          title: 'Payment',
          amount: pay.amount,
          amountConverted: this.convert(pay.amount, project.currency),
          currency: project.currency,
          status: pay.status === PaymentStatus.PAID ? 'paid' : 'pending'
        });
      });
    }

    return {
      financials,
      timeline: timeline.sort((a, b) => b.date.getTime() - a.date.getTime())
    };
  }

  getClientModel(clientId: string): ClientModel {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) throw new Error(`Client with ID ${clientId} not found.`);

    const clientProjects = this.projects.filter(p => p.clientId === clientId);
    const activeProjects = clientProjects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING);

    let totalGross = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    clientProjects.forEach(p => {
      const fin = this.getProjectFinancials(p.id);
      if (fin) {
        totalGross += fin.grossConverted;
        totalPaid += fin.paidConverted;
        totalRemaining += this.convert(fin.remaining, p.currency);
      }
    });

    const clientContracts = this.contracts
      .filter(c => c.clientId === clientId)
      .map(c => ({
        ...calculateContractCardModel(c, this.projects),
        clientName: client.name
      }));

    return {
      clientId,
      totalProjects: clientProjects.length,
      activeProjects: activeProjects.length,
      totalGrossConverted: totalGross,
      totalPaidConverted: totalPaid,
      totalRemainingConverted: totalRemaining,
      contracts: clientContracts // Added contracts to ClientModel
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

  getMonthlyReportModel(monthKey: string): MonthlyReportModel {
    return calculateMonthlyReport(this.projects, this.expenses, monthKey, this.config);
  }

  getYearToDateModel(year: number): YearToDateModel {
    return calculateYearToDateReport(this.projects, this.expenses, year, this.config);
  }

  getContractModel(contractId: string): ContractModel | null {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) return null;

    return calculateContractModel(
      contract,
      this.projects,
      this.expenses,
      this.config
    );
  }

  getContractsListModel(): ContractCardModel[] {
    return this.contracts.map(contract => {
      const model = calculateContractCardModel(contract, this.projects);
      const client = this.clients.find(c => c.id === contract.clientId);
      return {
        ...model,
        clientName: client?.name || 'Cliente Desconhecido'
      };
    });
  }

  convertToMainCurrency(amount: number, from: Currency): number {
    return this.convert(amount, from);
  }
}

export function createFinancialEngine(
  projects: Project[],
  expenses: Expense[],
  clients: Client[],
  config: FinancialEngineConfig,
  contracts: Contract[] = []
): FinancialEngine {
  return new FinancialEngine(projects, expenses, clients, config, contracts);
}
