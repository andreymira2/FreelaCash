import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { FinancialEngine, createFinancialEngine, FinancialEngineConfig } from '../engine';
import { getDateRange as getDateRangeUtil, getCurrentMonth, getMonthKey } from '../engine/dateUtils';

export function useFinancialEngine(): FinancialEngine {
  const { projects, expenses, settings } = useData();

  return useMemo(() => {
    const config: FinancialEngineConfig = {
      mainCurrency: settings.mainCurrency,
      exchangeRates: settings.exchangeRates,
      monthlyGoal: settings.monthlyGoal,
      taxReservePercent: settings.taxReservePercent || 0
    };
    return createFinancialEngine(projects, expenses, config);
  }, [projects, expenses, settings]);
}

export function useFinancialSnapshot(range?: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME') {
  const engine = useFinancialEngine();
  const { dateRange } = useData();
  const effectiveRange = range || dateRange;

  return useMemo(() => {
    const { start, end } = getDateRangeUtil(effectiveRange);
    return engine.getFinancialSnapshot(start, end);
  }, [engine, effectiveRange]);
}

export function useProjectFinancials(projectId: string) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getProjectFinancials(projectId);
  }, [engine, projectId]);
}

export function useAllProjectFinancials() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getAllProjectFinancials();
  }, [engine]);
}

export function useActiveProjectFinancials() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getActiveProjectFinancials();
  }, [engine]);
}

export function useReceivables() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getReceivables();
  }, [engine]);
}

export function useRecurringExpenseProgress(month?: Date) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getRecurringExpenseProgress(month);
  }, [engine, month]);
}

export function useExpenseReminders(daysAhead: number = 7) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getExpenseReminders(daysAhead);
  }, [engine, daysAhead]);
}

export function useHealthScore() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getHealthScore();
  }, [engine]);
}

export function useRecentActivity(limit: number = 15) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getRecentActivity(limit);
  }, [engine, limit]);
}

export function useCalendarEvents(monthDate: Date) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getCalendarEvents(monthDate);
  }, [engine, monthDate]);
}

export function useRecurringIncome() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getRecurringIncome();
  }, [engine]);
}

export function useRecurringExpenseTotal() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getRecurringExpenseTotal();
  }, [engine]);
}

export function useCurrencyConverter() {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return (amount: number, from: import('../types').Currency) => 
      engine.convertToMainCurrency(amount, from);
  }, [engine]);
}
