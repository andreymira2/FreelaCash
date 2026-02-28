import { Project, Expense, Payment, PaymentStatus, ProjectStatus, ProjectContractType, Currency, Client } from '../types';
import {
  ProjectFinancials, FinancialEngineConfig, NextBestAction,
  DashboardSignals,
  ProjectCardModel,
  ClientCardModel,
  ClientDetailsModel,
  ClientMonthlyRevenue,
  Receivable,
  GroupedActivity,
  ActivityItem
} from './types';
import { safeFloat, convertCurrency } from './currencyUtils';
import { isOverdue, getDaysDifference } from './dateUtils';

export function calculateProjectFinancials(
  project: Project,
  expenses: Expense[],
  config: FinancialEngineConfig
): ProjectFinancials {
  const rate = isNaN(project.rate) ? 0 : project.rate;
  let baseRate = 0;

  if (project.type === 'FIXED') {
    baseRate = rate;
  } else {
    const totalUnits = project.logs
      .filter(l => l.billable !== false)
      .reduce((acc, log) => acc + (isNaN(log.hours) ? 0 : log.hours), 0);
    baseRate = totalUnits * rate;
  }

  const adjustmentsTotal = (project.adjustments || [])
    .reduce((acc, adj) => safeFloat(acc + adj.amount), 0);

  const gross = safeFloat(baseRate + adjustmentsTotal);
  const feePercent = project.platformFee && !isNaN(project.platformFee) ? project.platformFee : 0;
  const fees = safeFloat(gross * (feePercent / 100));
  const net = Math.max(0, safeFloat(gross - fees));

  let paid = 0;
  let scheduled = 0;
  let overdueAmount = 0;
  let hasOverdue = false;
  let nextPayment: { date: Date; amount: number } | undefined;
  const today = new Date();

  if (project.payments && project.payments.length > 0) {
    project.payments.forEach(p => {
      if (p.status === PaymentStatus.PAID || !p.status) {
        paid = safeFloat(paid + p.amount);
      } else if (p.status === PaymentStatus.SCHEDULED) {
        scheduled = safeFloat(scheduled + p.amount);
        const payDate = new Date(p.date);
        if (isOverdue(payDate)) {
          hasOverdue = true;
          overdueAmount = safeFloat(overdueAmount + p.amount);
        }
        if (!nextPayment || payDate < nextPayment.date) {
          nextPayment = { date: payDate, amount: p.amount };
        }
      }
    });
  } else if (project.status === ProjectStatus.PAID) {
    paid = net;
  }

  let expenseTotal = 0;
  if (project.linkedExpenseIds && project.linkedExpenseIds.length > 0) {
    project.linkedExpenseIds.forEach(expId => {
      const exp = expenses.find(e => e.id === expId);
      if (exp) {
        expenseTotal = safeFloat(expenseTotal + convertCurrency(
          exp.amount,
          exp.currency,
          project.currency,
          config.exchangeRates
        ));
      }
    });
  }

  const profit = Math.max(0, safeFloat(paid - expenseTotal));
  const remaining = Math.max(0, safeFloat(net - paid));

  const grossConverted = convertCurrency(gross, project.currency, config.mainCurrency, config.exchangeRates);
  const netConverted = convertCurrency(net, project.currency, config.mainCurrency, config.exchangeRates);
  const paidConverted = convertCurrency(paid, project.currency, config.mainCurrency, config.exchangeRates);

  return {
    projectId: project.id,
    clientName: project.clientName,
    currency: project.currency,
    gross,
    adjustments: adjustmentsTotal,
    fees,
    net,
    paid,
    scheduled,
    remaining,
    expenseTotal,
    profit,
    isOverdue: hasOverdue,
    overdueAmount,
    nextPayment,
    grossConverted,
    netConverted,
    paidConverted
  };
}

export function getProjectReceivables(
  projects: Project[],
  config: FinancialEngineConfig
): Receivable[] {
  const today = new Date();
  const receivables: Receivable[] = [];

  projects.forEach(p => {
    p.payments?.forEach(pay => {
      if (pay.status === PaymentStatus.SCHEDULED) {
        let isDateMissing = false;
        let payDate = new Date(pay.date);

        // Date missing degradation rule
        if (isNaN(payDate.getTime())) {
          isDateMissing = true;
          // Fallback to project end date or today for an estimated anchor
          payDate = p.dueDate ? new Date(p.dueDate) : today;
        } else if (!pay.date || String(pay.date).trim() === '') {
          isDateMissing = true;
        }

        const isPaymentOverdue = isDateMissing ? false : isOverdue(payDate);
        const daysOverdue = isPaymentOverdue ? getDaysDifference(payDate, today) : 0;

        receivables.push({
          projectId: p.id,
          paymentId: pay.id,
          clientName: p.clientName,
          amount: pay.amount,
          amountConverted: convertCurrency(pay.amount, p.currency, config.mainCurrency, config.exchangeRates),
          currency: p.currency,
          date: payDate,
          isOverdue: isPaymentOverdue,
          daysOverdue,
          confidence: isDateMissing ? 'estimated' : 'confirmed'
        });
      }
    });
  });

  return receivables.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getRecurringIncome(
  projects: Project[],
  config: FinancialEngineConfig
): number {
  let total = 0;

  projects.forEach(p => {
    const isActive = p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING;
    const isRecurring = p.contractType === ProjectContractType.RETAINER ||
      p.contractType === ProjectContractType.RECURRING_FIXED;

    if (isActive && isRecurring) {
      const feePercent = p.platformFee || 0;
      const netRate = p.rate * (1 - feePercent / 100);
      total = safeFloat(total + convertCurrency(netRate, p.currency, config.mainCurrency, config.exchangeRates));
    }
  });

  return total;
}

export function getProjectIncomeInPeriod(
  projects: Project[],
  start: Date,
  end: Date,
  config: FinancialEngineConfig
): { total: number; byClient: Record<string, number> } {
  let total = 0;
  const byClient: Record<string, number> = {};

  projects.forEach(p => {
    p.payments?.forEach(pay => {
      const d = new Date(pay.date);
      if (d >= start && d <= end && (pay.status === PaymentStatus.PAID || !pay.status)) {
        const amount = convertCurrency(pay.amount, p.currency, config.mainCurrency, config.exchangeRates);
        total = safeFloat(total + amount);
        byClient[p.clientName] = safeFloat((byClient[p.clientName] || 0) + amount);
      }
    });
  });

  return { total, byClient };
}

export function getProjectsListModel(
  projects: Project[],
  config: FinancialEngineConfig,
  filters?: { status?: string, searchQuery?: string, showOnlyPending?: boolean }
): { projects: ProjectCardModel[], suggestGroupByClient: boolean } {
  const models: ProjectCardModel[] = [];
  const clientCounts: Record<string, number> = {};

  // First pass: build models and count client concentrations
  for (const project of projects) {
    if (project.status === ProjectStatus.ACTIVE || project.status === ProjectStatus.ONGOING) {
      clientCounts[project.clientName] = (clientCounts[project.clientName] || 0) + 1;
    }

    const fin = calculateProjectFinancials(project, [], config);

    models.push({
      id: project.id,
      title: project.category || project.clientName || 'Projeto sem nome',
      clientName: project.clientName,
      status: project.status,
      category: project.category,
      isArchived: !!project.isArchived,
      createdAt: project.createdAt,
      tags: project.tags || [],
      moneySummary: {
        gross: fin.gross,
        paid: fin.paid,
        remaining: fin.remaining,
        currency: fin.currency,
        isOverdue: fin.isOverdue,
        nextPayment: fin.nextPayment
      }
    });
  }

  // Determine if grouping is recommended
  let multiProjectClients = 0;
  for (const clientName in clientCounts) {
    if (clientCounts[clientName] > 1) {
      multiProjectClients++;
    }
  }
  const suggestGroupByClient = multiProjectClients >= 2 || (Object.keys(clientCounts).length > 0 && multiProjectClients / Object.keys(clientCounts).length > 0.3);

  // Apply filters
  let result = models;
  if (filters) {
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (filters.showOnlyPending) {
      result = result.filter(p => p.moneySummary.remaining > 0 || p.moneySummary.isOverdue);
    }
  }

  // Sort: Overdue first, then newest
  result.sort((a, b) => {
    if (a.moneySummary.isOverdue && !b.moneySummary.isOverdue) return -1;
    if (!a.moneySummary.isOverdue && b.moneySummary.isOverdue) return 1;
    return b.createdAt - a.createdAt;
  });

  return { projects: result, suggestGroupByClient };
}

export function getClientsListModel(
  clients: Client[],
  projects: Project[],
  config: FinancialEngineConfig,
  filters?: { searchQuery?: string }
): ClientCardModel[] {
  // Aggregate revenue and counts per client
  const clientStats: Record<string, { totalRevenue: number; activeProjects: number; totalProjects: number }> = {};
  let totalAgencyRevenue = 0;

  clients.forEach(c => {
    clientStats[c.id] = { totalRevenue: 0, activeProjects: 0, totalProjects: 0 };
  });

  projects.forEach(p => {
    if (!p.clientId || !clientStats[p.clientId]) return;

    const stats = clientStats[p.clientId];
    stats.totalProjects++;

    if (p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING) {
      stats.activeProjects++;
    }

    const { paid } = calculateProjectFinancials(p, [], config);
    const paidConverted = convertCurrency(paid, p.currency, config.mainCurrency, config.exchangeRates);

    stats.totalRevenue += paidConverted;
    totalAgencyRevenue += paidConverted;
  });

  let models: ClientCardModel[] = clients.map(client => {
    const stats = clientStats[client.id];
    let shareOfRevenue = 0;
    if (totalAgencyRevenue > 0) {
      shareOfRevenue = (stats.totalRevenue / totalAgencyRevenue) * 100;
    }

    const hasHighDependency = shareOfRevenue > 30 || stats.activeProjects > 1;

    return {
      clientId: client.id,
      clientName: client.name,
      totalRevenueConverted: stats.totalRevenue,
      shareOfRevenue,
      activeProjectsCount: stats.activeProjects,
      totalProjectsCount: stats.totalProjects,
      hasHighDependency,
    };
  });

  // Apply filters and sort
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    models = models.filter(m => m.clientName.toLowerCase().includes(q));
  }

  // Default sort by relevance (revenue first, then active projects)
  models.sort((a, b) => {
    if (b.totalRevenueConverted !== a.totalRevenueConverted) {
      return b.totalRevenueConverted - a.totalRevenueConverted;
    }
    return b.activeProjectsCount - a.activeProjectsCount;
  });

  return models;
}

export function getClientDetailsModel(
  clientId: string,
  clients: Client[],
  projects: Project[],
  config: FinancialEngineConfig
): ClientDetailsModel | null {
  const client = clients.find(c => c.id === clientId);
  if (!client) return null;

  const clientProjects = projects.filter(p => p.clientId === clientId);

  // Calculate agency baseline to determine shareOfRevenue
  let totalAgencyRevenue = 0;
  let clientRevenue = 0;

  projects.forEach(p => {
    const { paid } = calculateProjectFinancials(p, [], config);
    const paidConverted = convertCurrency(paid, p.currency, config.mainCurrency, config.exchangeRates);
    totalAgencyRevenue += paidConverted;

    if (p.clientId === clientId) {
      clientRevenue += paidConverted;
    }
  });

  let shareOfRevenue = 0;
  if (totalAgencyRevenue > 0) {
    shareOfRevenue = (clientRevenue / totalAgencyRevenue) * 100;
  }

  const activeProjectsCount = clientProjects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING).length;
  const hasHighDependency = shareOfRevenue > 30 || activeProjectsCount > 1;

  // Generate the ProjectCardModels for the subset
  const { projects: projectModels } = getProjectsListModel(clientProjects, config);

  // Grab local receivables specifically for this project subset
  const receivables = getProjectReceivables(clientProjects, config);

  // Generate 12 months rolling summary
  const summary12Months: ClientMonthlyRevenue[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    let monthRevenue = 0;
    clientProjects.forEach(p => {
      p.payments?.forEach(pay => {
        if (pay.status === PaymentStatus.PAID && pay.date.startsWith(monthKey)) {
          monthRevenue += convertCurrency(pay.amount, p.currency, config.mainCurrency, config.exchangeRates);
        }
      });
    });

    summary12Months.push({ month: monthKey, revenue: monthRevenue });
  }

  return {
    client,
    metrics: {
      shareOfRevenue,
      hasHighDependency,
      totalRevenueConverted: clientRevenue
    },
    summary12Months,
    projects: projectModels,
    receivables
  };
}

export function getRecentActivity(
  projects: Project[],
  expenses: Expense[],
  limit: number = 10
): GroupedActivity[] {
  const activities: ActivityItem[] = [];

  projects.forEach(p => {
    p.payments.forEach(pay => {
      activities.push({
        id: pay.id,
        title: `Pagamento: ${p.clientName}`,
        amount: pay.amount,
        currency: p.currency,
        date: pay.date,
        type: 'income',
        status: pay.status
      });
    });
  });

  expenses.forEach(e => {
    activities.push({
      id: e.id,
      title: e.title,
      subtitle: e.category,
      amount: e.amount,
      currency: e.currency,
      date: e.date,
      type: 'expense',
      status: e.status
    });
  });

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent = activities.slice(0, limit);

  const grouped: GroupedActivity[] = [];
  recent.forEach(item => {
    const dateStr = item.date.split('T')[0];
    let group = grouped.find(g => g.date === dateStr);
    if (!group) {
      group = { date: dateStr, items: [] };
      grouped.push(group);
    }
    group.items.push(item);
  });

  return grouped;
}
