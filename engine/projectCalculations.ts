import { Project, Expense, Payment, PaymentStatus, ProjectStatus, ProjectContractType, Currency } from '../types';
import { ProjectFinancials, FinancialEngineConfig, Receivable } from './types';
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
    nextPayment
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
        const payDate = new Date(pay.date);
        const isPaymentOverdue = isOverdue(payDate);
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
          daysOverdue
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
