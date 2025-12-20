import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData, Project, ProjectStatus, WorkLog, AppSettings, Currency, UserProfile, Expense, Payment, DateRange, ProjectContractType, ProjectType, Client, PaymentStatus, ProjectAdjustment, CalendarEvent } from '../types';
import { safeFloat } from '../utils/format';
import { useAuth } from './AuthContext';
import { database } from '../lib/database';

interface DataContextType {
  projects: Project[];
  clients: Client[];
  expenses: Expense[];
  settings: AppSettings;
  userProfile: UserProfile;
  dateRange: DateRange;
  loading: boolean;
  setDateRange: (range: DateRange) => void;

  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getOrCreateClientByName: (name: string) => Client;
  getClientById: (id: string) => Client | undefined;

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => string | null;

  addWorkLog: (projectId: string, log: WorkLog) => void;
  deleteWorkLog: (projectId: string, logId: string) => void;
  addPayment: (projectId: string, payment: Payment) => void;
  updatePayment: (projectId: string, payment: Payment) => void;
  deletePayment: (projectId: string, paymentId: string) => void;

  addProjectAdjustment: (projectId: string, adjustment: ProjectAdjustment) => void;

  getProjectTotal: (project: Project, allExpenses?: Expense[]) => { gross: number; adjustments: number; net: number; paid: number; expenseTotal: number; profit: number; remaining: number };
  getFutureRecurringIncome: () => number;
  getFinancialMetrics: (start: Date, end: Date) => { income: number; expense: number; net: number; openExpense: number };
  getCalendarEvents: (month: Date) => CalendarEvent[];

  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;

  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  toggleExpensePayment: (id: string, dateReference: Date) => void;
  bulkMarkExpenseAsPaid: (id: string, monthsStr: string[]) => void;
  deleteExpense: (id: string) => void;

  getDateRangeFilter: () => { start: Date; end: Date };
  importData: (jsonString: string) => boolean;
  exportData: () => string;
  loadDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  monthlyGoal: 10000,
  mainCurrency: Currency.BRL,
  exchangeRates: {
    [Currency.BRL]: 1,
    [Currency.USD]: 5.0,
    [Currency.EUR]: 5.5,
    [Currency.GBP]: 6.5
  },
  taxReservePercent: 0
};

const INITIAL_DATA: AppData = {
  projects: [],
  clients: [],
  expenses: [],
  settings: DEFAULT_SETTINGS,
  userProfile: {
    name: 'Freelancer',
    title: 'Creative Pro',
    location: '',
    taxId: '',
    pixKey: ''
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('THIS_MONTH');

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setData(INITIAL_DATA);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [profile, settings, clients, projects, expenses] = await Promise.all([
          database.getUserProfile(user.id),
          database.getUserSettings(user.id),
          database.getClients(user.id),
          database.getProjects(user.id),
          database.getExpenses(user.id)
        ]);

        setData({
          userProfile: profile || INITIAL_DATA.userProfile,
          settings: settings || DEFAULT_SETTINGS,
          clients: clients || [],
          projects: projects || [],
          expenses: expenses || []
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        setData(INITIAL_DATA);
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const getDateRangeFilter = useCallback(() => {
    const start = new Date();
    const end = new Date();

    switch (dateRange) {
      case 'THIS_MONTH':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'LAST_MONTH':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0);
        break;
      case 'THIS_YEAR':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        break;
      case 'ALL_TIME':
        start.setFullYear(2000, 0, 1);
        end.setFullYear(2100, 0, 1);
        break;
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [dateRange]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
    if (user) {
      await database.updateUserSettings(user.id, { ...data.settings, ...newSettings });
    }
  }, [user, data.settings]);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setData(prev => ({ ...prev, userProfile: { ...prev.userProfile, ...updates } }));
    if (user) {
      await database.updateUserProfile(user.id, { ...data.userProfile, ...updates });
    }
  }, [user, data.userProfile]);

  const addClient = useCallback(async (client: Client) => {
    setData(prev => ({ ...prev, clients: [client, ...prev.clients] }));
    if (user) {
      const newId = await database.addClient(user.id, client);
      if (newId && newId !== client.id) {
        setData(prev => ({
          ...prev,
          clients: prev.clients.map(c => c.id === client.id ? { ...c, id: newId } : c)
        }));
      }
    }
  }, [user]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
    if (user) {
      await database.updateClient(user.id, id, updates);
    }
  }, [user]);

  const deleteClient = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id)
    }));
    if (user) {
      await database.deleteClient(user.id, id);
    }
  }, [user]);

  const getClientById = useCallback((id: string): Client | undefined => {
    return data.clients.find(c => c.id === id);
  }, [data.clients]);

  const getOrCreateClientByName = useCallback((name: string): Client => {
    const trimmedName = name.trim();
    const normalizedName = trimmedName.toLowerCase();
    
    const existing = data.clients.find(c => c.name.toLowerCase() === normalizedName);
    if (existing) return existing;
    
    const newClient: Client = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      createdAt: Date.now()
    };
    
    addClient(newClient);
    return newClient;
  }, [data.clients, addClient]);

  const addProject = useCallback(async (project: Project) => {
    setData(prev => ({ ...prev, projects: [project, ...prev.projects] }));
    if (user) {
      const newId = await database.addProject(user.id, project);
      if (newId && newId !== project.id) {
        setData(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === project.id ? { ...p, id: newId } : p)
        }));
      }
    }
  }, [user]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    if (user) {
      await database.updateProject(user.id, id, updates);
    }
  }, [user]);

  const deleteProject = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
    if (user) {
      await database.deleteProject(user.id, id);
    }
  }, [user]);

  const duplicateProject = useCallback((id: string): string | null => {
    const newId = Date.now().toString();
    let foundOriginal = false;
    
    setData(prev => {
      const original = prev.projects.find(p => p.id === id);
      if (!original) return prev;
      foundOriginal = true;
      
      const duplicated: Project = {
        ...original,
        id: newId,
        createdAt: Date.now(),
        startDate: new Date().toISOString(),
        dueDate: undefined,
        payments: [],
        logs: [],
        adjustments: [],
        events: [],
        checklist: original.checklist?.map((t, idx) => ({ 
          ...t, 
          id: `${newId}-task-${idx}-${Math.random().toString(36).substr(2, 9)}`, 
          completed: false 
        })),
        status: ProjectStatus.ACTIVE,
      };

      if (user) {
        database.addProject(user.id, duplicated);
      }
      
      return { ...prev, projects: [duplicated, ...prev.projects] };
    });
    
    return foundOriginal ? newId : null;
  }, [user]);

  const addWorkLog = useCallback(async (projectId: string, log: WorkLog) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, logs: [...p.logs, log] } : p)
    }));
    if (user) {
      await database.addWorkLog(user.id, projectId, log);
    }
  }, [user]);

  const deleteWorkLog = useCallback(async (projectId: string, logId: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, logs: p.logs.filter(l => l.id !== logId) } : p)
    }));
    if (user) {
      await database.deleteWorkLog(user.id, logId);
    }
  }, [user]);

  const addPayment = useCallback(async (projectId: string, payment: Payment) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return { ...p, payments: [...(p.payments || []), payment] };
        }
        return p;
      })
    }));
    if (user) {
      await database.addPayment(user.id, projectId, payment);
    }
  }, [user]);

  const updatePayment = useCallback(async (projectId: string, payment: Payment) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            payments: (p.payments || []).map(pay => pay.id === payment.id ? payment : pay)
          };
        }
        return p;
      })
    }));
    if (user) {
      await database.updatePayment(user.id, payment.id, payment);
    }
  }, [user]);

  const deletePayment = useCallback(async (projectId: string, paymentId: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return { ...p, payments: (p.payments || []).filter(pay => pay.id !== paymentId) };
        }
        return p;
      })
    }));
    if (user) {
      await database.deletePayment(user.id, paymentId);
    }
  }, [user]);

  const addProjectAdjustment = useCallback(async (projectId: string, adjustment: ProjectAdjustment) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return { ...p, adjustments: [...(p.adjustments || []), adjustment] };
        }
        return p;
      })
    }));
    if (user) {
      await database.addProjectAdjustment(user.id, projectId, adjustment);
    }
  }, [user]);

  const addExpense = useCallback(async (expense: Expense) => {
    setData(prev => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    if (user) {
      const newId = await database.addExpense(user.id, expense);
      if (newId && newId !== expense.id) {
        setData(prev => ({
          ...prev,
          expenses: prev.expenses.map(e => e.id === expense.id ? { ...e, id: newId } : e)
        }));
      }
    }
  }, [user]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
    if (user) {
      await database.updateExpense(user.id, id, updates);
    }
  }, [user]);

  const toggleExpensePayment = useCallback(async (id: string, dateReference: Date) => {
    let updatedExpense: Expense | undefined;
    
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => {
        if (e.id !== id) return e;

        if (e.isRecurring) {
          const year = dateReference.getFullYear();
          const month = dateReference.getMonth() + 1;
          const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

          const history = e.paymentHistory || [];
          const existingIndex = history.findIndex(h => h.monthStr === monthStr);
          let newHistory = [...history];

          if (existingIndex >= 0 && history[existingIndex].status === 'PAID') {
            newHistory.splice(existingIndex, 1);
          } else {
            const newEntry = { monthStr, status: 'PAID' as const, paidDate: new Date().toISOString() };
            if (existingIndex >= 0) {
              newHistory[existingIndex] = newEntry;
            } else {
              newHistory.push(newEntry);
            }
          }
          updatedExpense = { ...e, paymentHistory: newHistory };
          return updatedExpense;
        } else {
          updatedExpense = { ...e, status: e.status === 'PAID' ? 'PENDING' : 'PAID' };
          return updatedExpense;
        }
      })
    }));

    if (user && updatedExpense) {
      await database.updateExpense(user.id, id, updatedExpense);
    }
  }, [user]);

  const bulkMarkExpenseAsPaid = useCallback(async (id: string, monthsStr: string[]) => {
    let updatedExpense: Expense | undefined;

    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => {
        if (e.id !== id) return e;
        if (!e.isRecurring) return e;

        const currentHistory = e.paymentHistory || [];
        const newEntries = monthsStr
          .filter(m => !currentHistory.some(h => h.monthStr === m && h.status === 'PAID'))
          .map(m => ({ monthStr: m, status: 'PAID' as const, paidDate: new Date().toISOString() }));

        const updatedHistory = [...currentHistory, ...newEntries];
        updatedExpense = { ...e, paymentHistory: updatedHistory };
        return updatedExpense;
      })
    }));

    if (user && updatedExpense) {
      await database.updateExpense(user.id, id, { paymentHistory: updatedExpense.paymentHistory });
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
    if (user) {
      await database.deleteExpense(user.id, id);
    }
  }, [user]);

  const convertCurrency = useCallback((amount: number, from: Currency, to: Currency) => {
    if (from === to) return amount;
    if (isNaN(amount)) return 0;

    const rateFrom = data.settings.exchangeRates[from] || 1;
    const rateTo = data.settings.exchangeRates[to] || 1;

    if (rateTo === 0) return 0;

    const inBase = amount * rateFrom;
    return safeFloat(inBase / rateTo);
  }, [data.settings.exchangeRates]);

  const getProjectTotal = useCallback((project: Project, allExpenses?: Expense[]) => {
    let baseRate = 0;
    const rate = isNaN(project.rate) ? 0 : project.rate;

    if (project.type === 'FIXED') {
      baseRate = rate;
    } else {
      const totalUnits = project.logs
        .filter(l => l.billable !== false)
        .reduce((acc, log) => acc + (isNaN(log.hours) ? 0 : log.hours), 0);
      baseRate = totalUnits * rate;
    }

    const adjustmentsTotal = (project.adjustments || []).reduce((acc, adj) => safeFloat(acc + adj.amount), 0);
    const gross = safeFloat(baseRate + adjustmentsTotal);

    const feePercent = project.platformFee && !isNaN(project.platformFee) ? project.platformFee : 0;
    const fee = safeFloat(gross * (feePercent / 100));
    const net = Math.max(0, safeFloat(gross - fee));

    let paid = 0;
    if (project.payments && project.payments.length > 0) {
      paid = project.payments
        .filter(p => p.status === PaymentStatus.PAID || !p.status)
        .reduce((acc, p) => safeFloat(acc + p.amount), 0);
    } else if (project.status === ProjectStatus.PAID) {
      paid = net;
    }

    let expenseTotal = 0;
    if (allExpenses && project.linkedExpenseIds && project.linkedExpenseIds.length > 0) {
      project.linkedExpenseIds.forEach(expId => {
        const exp = allExpenses.find(e => e.id === expId);
        if (exp) {
          expenseTotal = safeFloat(expenseTotal + convertCurrency(exp.amount, exp.currency, project.currency));
        }
      });
    }

    const profit = Math.max(0, safeFloat(paid - expenseTotal));
    const remaining = Math.max(0, safeFloat(net - paid));

    return { gross, adjustments: adjustmentsTotal, net, paid, expenseTotal, profit, remaining };
  }, [convertCurrency]);

  const getFutureRecurringIncome = useCallback(() => {
    let total = 0;
    const targetCurrency = data.settings.mainCurrency;

    data.projects.forEach(p => {
      const isActive = p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING;
      const isRecurring = p.contractType === ProjectContractType.RETAINER || p.contractType === ProjectContractType.RECURRING_FIXED;

      if (isActive && isRecurring) {
        const feePercent = p.platformFee || 0;
        const netRate = p.rate * (1 - feePercent / 100);
        total = safeFloat(total + convertCurrency(netRate, p.currency, targetCurrency));
      }
    });
    return total;
  }, [data.projects, data.settings.mainCurrency, convertCurrency]);

  const getFinancialMetrics = useCallback((start: Date, end: Date) => {
    let income = 0;
    let expense = 0;
    let openExpense = 0;
    const targetCurrency = data.settings.mainCurrency;

    data.projects.forEach(p => {
      if (p.payments?.length) {
        p.payments.forEach(pay => {
          const d = new Date(pay.date);
          if (d >= start && d <= end && (pay.status === PaymentStatus.PAID || !pay.status)) {
            income = safeFloat(income + convertCurrency(pay.amount, p.currency, targetCurrency));
          }
        });
      }
    });

    data.expenses.forEach(e => {
      const val = convertCurrency(e.amount, e.currency, targetCurrency);

      if (e.isRecurring) {
        const history = e.paymentHistory || [];

        history.forEach(h => {
          if (h.status === 'PAID') {
            const [year, month] = h.monthStr.split('-').map(Number);
            const paymentDate = new Date(year, month - 1, e.dueDay || 15);

            if (paymentDate >= start && paymentDate <= end) {
              expense = safeFloat(expense + val);
            }
          }
        });

        const today = new Date();
        if (today >= start && today <= end) {
          const currentMonthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
          const isPaidNow = history.some(h => h.monthStr === currentMonthStr && h.status === 'PAID');
          const isTrialActive = e.isTrial && e.trialEndDate && new Date(e.trialEndDate) > today;

          if (!isPaidNow && !isTrialActive) {
            openExpense = safeFloat(openExpense + val);
          }
        }

      } else {
        const d = new Date(e.date);
        if (d >= start && d <= end) {
          if (e.status === 'PAID') {
            expense = safeFloat(expense + val);
          } else {
            openExpense = safeFloat(openExpense + val);
          }
        }
      }
    });

    return { income, expense, net: safeFloat(income - expense), openExpense };
  }, [data.projects, data.expenses, data.settings.mainCurrency, convertCurrency]);

  const getCalendarEvents = useCallback((monthDate: Date) => {
    const events: CalendarEvent[] = [];
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const targetCurrency = data.settings.mainCurrency;

    data.projects.forEach(p => {
      const start = new Date(p.startDate);
      if (start.getFullYear() === year && start.getMonth() === month) {
        events.push({ id: `start-${p.id}`, date: start, title: `Início: ${p.clientName}`, type: 'PROJECT_START', meta: { projectId: p.id } });
      }
      if (p.dueDate) {
        const due = new Date(p.dueDate);
        if (due.getFullYear() === year && due.getMonth() === month) {
          events.push({ id: `due-${p.id}`, date: due, title: `Prazo: ${p.clientName}`, type: 'PROJECT_DUE', meta: { projectId: p.id } });
        }
      }
    });

    data.projects.forEach(p => {
      p.payments?.forEach(pay => {
        const d = new Date(pay.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          events.push({
            id: `pay-${pay.id}`,
            date: d,
            title: `Receb.: ${p.clientName}`,
            amount: convertCurrency(pay.amount, p.currency, targetCurrency),
            currency: targetCurrency,
            type: 'INCOME',
            status: pay.status === PaymentStatus.PAID ? 'PAID' : 'PENDING'
          });
        }
      });
    });

    const monthStr = monthDate.toISOString().slice(0, 7);

    data.expenses.forEach(e => {
      if (e.isTrial && e.trialEndDate) {
        const trialEnd = new Date(e.trialEndDate);
        if (trialEnd.getFullYear() === year && trialEnd.getMonth() === month) {
          events.push({
            id: `trial-${e.id}`,
            date: trialEnd,
            title: `Fim Teste: ${e.title}`,
            type: 'TRIAL_END',
            status: 'WARNING'
          });
        }
      }

      if (e.isRecurring) {
        const trialEnd = e.trialEndDate ? new Date(e.trialEndDate) : null;
        const monthEnd = new Date(year, month + 1, 0);

        if (trialEnd && trialEnd > monthEnd && e.isTrial) return;

        const day = e.dueDay || new Date(e.date).getDate();
        const eventDate = new Date(year, month, day);
        const isPaid = e.paymentHistory?.some(h => h.monthStr === monthStr && h.status === 'PAID');

        events.push({
          id: `rec-${e.id}`,
          date: eventDate,
          title: e.title,
          amount: convertCurrency(e.amount, e.currency, targetCurrency),
          currency: targetCurrency,
          type: 'EXPENSE',
          status: isPaid ? 'PAID' : 'PENDING'
        });

      } else {
        const d = new Date(e.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          events.push({
            id: `exp-${e.id}`,
            date: d,
            title: e.title,
            amount: convertCurrency(e.amount, e.currency, targetCurrency),
            currency: targetCurrency,
            type: 'EXPENSE',
            status: e.status
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());

  }, [data.projects, data.expenses, data.settings.mainCurrency, convertCurrency]);

  const importData = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.projects || !parsed.expenses || !parsed.settings) {
        throw new Error("Invalid File Structure");
      }
      setData(parsed);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(data);
  }, [data]);

  const loadDemoData = useCallback(() => {
    setData({ ...INITIAL_DATA, settings: DEFAULT_SETTINGS });
    window.location.reload();
  }, []);

  return (
    <DataContext.Provider value={{
      projects: data.projects,
      clients: data.clients,
      expenses: data.expenses,
      settings: data.settings,
      userProfile: data.userProfile,
      dateRange,
      loading,
      setDateRange,
      addClient, updateClient, deleteClient, getOrCreateClientByName, getClientById,
      addProject, updateProject, deleteProject, duplicateProject,
      addWorkLog, deleteWorkLog,
      addPayment, updatePayment, deletePayment,
      addProjectAdjustment,
      getProjectTotal,
      getFutureRecurringIncome,
      getFinancialMetrics,
      getCalendarEvents,
      updateSettings, updateUserProfile,
      convertCurrency,
      addExpense, updateExpense, deleteExpense, toggleExpensePayment, bulkMarkExpenseAsPaid,
      getDateRangeFilter,
      importData, exportData, loadDemoData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
