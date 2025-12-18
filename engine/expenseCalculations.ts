import { Expense, Currency } from '../types';
import { ExpenseSnapshot, RecurringExpenseProgress, ExpenseReminder, FinancialEngineConfig, MonthKey } from './types';
import { safeFloat, convertCurrency } from './currencyUtils';
import { getMonthKey, getCurrentMonth, getDaysDifference, addDays, monthKeyToDate, isDateInRange } from './dateUtils';

export function getExpenseSnapshot(
  expense: Expense,
  monthKey: MonthKey,
  config: FinancialEngineConfig
): ExpenseSnapshot {
  const today = new Date();
  const amountConverted = convertCurrency(expense.amount, expense.currency, config.mainCurrency, config.exchangeRates);
  
  let isPaidThisMonth = false;
  let isTrial = false;
  let trialDaysLeft: number | undefined;
  let trialExpired = false;

  if (expense.isRecurring) {
    isPaidThisMonth = expense.paymentHistory?.some(
      h => h.monthStr === monthKey.str && h.status === 'PAID'
    ) || false;

    if (expense.isTrial && expense.trialEndDate) {
      const trialEnd = new Date(expense.trialEndDate);
      if (trialEnd > today) {
        isTrial = true;
        trialDaysLeft = getDaysDifference(today, trialEnd);
      } else {
        trialExpired = true;
      }
    }
  } else {
    isPaidThisMonth = expense.status === 'PAID';
  }

  return {
    expenseId: expense.id,
    title: expense.title,
    amount: expense.amount,
    amountConverted,
    currency: expense.currency,
    category: expense.category,
    isRecurring: expense.isRecurring || false,
    isPaidThisMonth,
    isTrial,
    trialDaysLeft,
    trialExpired,
    dueDay: expense.dueDay
  };
}

export function getRecurringExpenseProgress(
  expenses: Expense[],
  monthKey: MonthKey,
  config: FinancialEngineConfig
): RecurringExpenseProgress {
  const today = new Date();
  const recurringExpenses = expenses.filter(e => e.isRecurring);
  const snapshots: ExpenseSnapshot[] = [];
  
  let paidCount = 0;
  let pendingCount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;

  recurringExpenses.forEach(e => {
    const snapshot = getExpenseSnapshot(e, monthKey, config);
    snapshots.push(snapshot);

    if (snapshot.isTrial) {
      return;
    }

    if (snapshot.isPaidThisMonth) {
      paidCount++;
      paidAmount = safeFloat(paidAmount + snapshot.amountConverted);
    } else {
      pendingCount++;
      pendingAmount = safeFloat(pendingAmount + snapshot.amountConverted);
    }
  });

  const totalCount = paidCount + pendingCount;
  const totalAmount = safeFloat(paidAmount + pendingAmount);
  const percentPaid = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return {
    totalCount,
    paidCount,
    pendingCount,
    totalAmount,
    paidAmount,
    pendingAmount,
    percentPaid,
    expenses: snapshots
  };
}

export function getExpenseReminders(
  expenses: Expense[],
  daysAhead: number,
  config: FinancialEngineConfig
): ExpenseReminder[] {
  const today = new Date();
  const futureDate = addDays(today, daysAhead);
  const currentMonth = getCurrentMonth();
  const reminders: ExpenseReminder[] = [];

  expenses.filter(e => e.isRecurring && e.dueDay).forEach(e => {
    const dueDate = new Date(today.getFullYear(), today.getMonth(), e.dueDay || 15);
    
    if (dueDate >= today && dueDate <= futureDate) {
      const isPaid = e.paymentHistory?.some(
        h => h.monthStr === currentMonth.str && h.status === 'PAID'
      ) || false;
      
      if (e.isTrial && e.trialEndDate && new Date(e.trialEndDate) > today) {
        return;
      }

      reminders.push({
        expenseId: e.id,
        title: e.title,
        amount: e.amount,
        amountConverted: convertCurrency(e.amount, e.currency, config.mainCurrency, config.exchangeRates),
        currency: e.currency,
        dueDate,
        daysUntilDue: getDaysDifference(today, dueDate),
        isPaid
      });
    }
  });

  return reminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function getExpensesPaidInPeriod(
  expenses: Expense[],
  start: Date,
  end: Date,
  config: FinancialEngineConfig
): { total: number; byCategory: Record<string, number> } {
  let total = 0;
  const byCategory: Record<string, number> = {};

  expenses.forEach(e => {
    const val = convertCurrency(e.amount, e.currency, config.mainCurrency, config.exchangeRates);

    if (e.isRecurring) {
      e.paymentHistory?.forEach(h => {
        if (h.status === 'PAID') {
          const [year, month] = h.monthStr.split('-').map(Number);
          const paymentDate = new Date(year, month - 1, e.dueDay || 15);
          
          if (isDateInRange(paymentDate, start, end)) {
            total = safeFloat(total + val);
            const cat = e.category || 'Outros';
            byCategory[cat] = safeFloat((byCategory[cat] || 0) + val);
          }
        }
      });
    } else {
      const d = new Date(e.date);
      if (isDateInRange(d, start, end) && e.status === 'PAID') {
        total = safeFloat(total + val);
        const cat = e.category || 'Outros';
        byCategory[cat] = safeFloat((byCategory[cat] || 0) + val);
      }
    }
  });

  return { total, byCategory };
}

export function getOpenExpensesInPeriod(
  expenses: Expense[],
  start: Date,
  end: Date,
  config: FinancialEngineConfig
): number {
  const today = new Date();
  let openExpense = 0;

  expenses.forEach(e => {
    const val = convertCurrency(e.amount, e.currency, config.mainCurrency, config.exchangeRates);

    if (e.isRecurring) {
      if (isDateInRange(today, start, end)) {
        const currentMonth = getCurrentMonth();
        const isPaidNow = e.paymentHistory?.some(h => h.monthStr === currentMonth.str && h.status === 'PAID') || false;
        const isTrialActive = e.isTrial && e.trialEndDate && new Date(e.trialEndDate) > today;

        if (!isPaidNow && !isTrialActive) {
          openExpense = safeFloat(openExpense + val);
        }
      }
    } else {
      const d = new Date(e.date);
      if (isDateInRange(d, start, end) && e.status !== 'PAID') {
        openExpense = safeFloat(openExpense + val);
      }
    }
  });

  return openExpense;
}

export function getRecurringExpenseTotal(
  expenses: Expense[],
  config: FinancialEngineConfig
): number {
  let total = 0;
  const today = new Date();

  expenses.filter(e => e.isRecurring).forEach(e => {
    const isTrialActive = e.isTrial && e.trialEndDate && new Date(e.trialEndDate) > today;
    if (!isTrialActive) {
      total = safeFloat(total + convertCurrency(e.amount, e.currency, config.mainCurrency, config.exchangeRates));
    }
  });

  return total;
}
