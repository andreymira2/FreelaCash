import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { FinancialEngine, createFinancialEngine, FinancialEngineConfig } from '../engine';
import { getDateRange as getDateRangeUtil, getCurrentMonth, getMonthKey } from '../engine/dateUtils';

export function useFinancialEngine(): FinancialEngine {
  const { settings, projects, expenses, clients, contracts } = useData();

  const engine = useMemo(() => {
    const config: FinancialEngineConfig = {
      mainCurrency: settings.mainCurrency,
      exchangeRates: settings.exchangeRates,
      monthlyGoal: settings.monthlyGoal,
      taxReservePercent: settings.taxReservePercent || 0
    };
    return createFinancialEngine(projects, expenses, clients, config, contracts);
  }, [
    projects,
    expenses,
    clients,
    settings.mainCurrency,
    settings.exchangeRates,
    settings.monthlyGoal,
    settings.taxReservePercent,
    contracts
  ]);

  return engine;
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

export function useProjectListModel(filters?: { status?: string, searchQuery?: string, showOnlyPending?: boolean }) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getProjectsListModel(filters);
  }, [engine, filters?.status, filters?.searchQuery, filters?.showOnlyPending]);
}

export function useExpensesListModel(filters?: { projectId?: string, clientId?: string, searchQuery?: string, status?: string }) {
  const engine = useFinancialEngine();
  return useMemo(() => engine.getExpensesListModel(filters), [engine, filters?.projectId, filters?.clientId, filters?.searchQuery, filters?.status]);
}

export function useClientsListModel(filters?: { searchQuery?: string }) {
  const engine = useFinancialEngine();
  return useMemo(() => engine.getClientsListModel(filters), [engine, filters?.searchQuery]);
}

export const useClientDetailsModel = (clientId?: string) => {
  const engine = useFinancialEngine();
  return useMemo(() => clientId ? engine.getClientDetailsModel(clientId) : null, [engine, clientId]);
};

export const useProjectMarginModel = (projectId?: string) => {
  const engine = useFinancialEngine();
  return useMemo(() => projectId ? engine.getProjectMarginModel(projectId) : null, [engine, projectId]);
};

export const useMarginAnalysis = () => {
  const engine = useFinancialEngine();
  return useMemo(() => engine.getMarginAnalysis(), [engine]);
};

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

export function useDashboardModel(range?: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME') {
  const engine = useFinancialEngine();
  const { dateRange } = useData();
  const effectiveRange = range || dateRange;

  return useMemo(() => {
    const { start, end } = getDateRangeUtil(effectiveRange);
    return engine.getDashboardModel(start, end);
  }, [engine, effectiveRange]);
}

export function useProjectModel(projectId: string) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getProjectModel(projectId);
  }, [engine, projectId]);
}

export function useClientModel(clientId: string) {
  const engine = useFinancialEngine();

  return useMemo(() => {
    return engine.getClientModel(clientId);
  }, [engine, clientId]);
}

export function useNextBestAction(range?: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME') {
  const engine = useFinancialEngine();
  const { dateRange } = useData();
  const effectiveRange = range || dateRange;

  return useMemo(() => {
    const { start, end } = getDateRangeUtil(effectiveRange);
    return engine.getNextBestAction(start, end);
  }, [engine, effectiveRange]);
}

export function useMonthlyReport(monthKey: string) {
  const engine = useFinancialEngine();
  return useMemo(() => engine.getMonthlyReportModel(monthKey), [engine, monthKey]);
}

export function useYearToDateReport(year: number) {
  const engine = useFinancialEngine();
  return useMemo(() => engine.getYearToDateModel(year), [engine, year]);
}

export function useContract(contractId?: string) {
  const engine = useFinancialEngine();
  return useMemo(() => contractId ? engine.getContractModel(contractId) : null, [engine, contractId]);
}

export function useContractsList() {
  const engine = useFinancialEngine();
  const { loading } = useData();
  return useMemo(() => ({
    models: engine.getContractsListModel(),
    loading
  }), [engine, loading]);
}
