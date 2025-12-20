import { supabase } from './supabase';
import type { 
  Client, Project, Expense, WorkLog, Payment, 
  ProjectAdjustment, UserProfile, AppSettings, Currency 
} from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  monthlyGoal: 10000,
  mainCurrency: 'BRL' as Currency,
  exchangeRates: {
    BRL: 1,
    USD: 5.0,
    EUR: 5.5,
    GBP: 6.5
  } as Record<Currency, number>,
  taxReservePercent: 0
};

export const database = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      name: data.name,
      title: data.title,
      location: data.location,
      taxId: data.tax_id,
      pixKey: data.pix_key,
      avatar: data.avatar
    };
  },

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        name: profile.name,
        title: profile.title,
        location: profile.location,
        tax_id: profile.taxId,
        pix_key: profile.pixKey,
        avatar: profile.avatar,
        updated_at: new Date().toISOString()
      });
    
    return !error;
  },

  async getUserSettings(userId: string): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return DEFAULT_SETTINGS;
    
    return {
      monthlyGoal: data.monthly_goal || DEFAULT_SETTINGS.monthlyGoal,
      mainCurrency: (data.main_currency || 'BRL') as Currency,
      exchangeRates: data.exchange_rates || DEFAULT_SETTINGS.exchangeRates,
      taxReservePercent: data.tax_reserve_percent || 0
    };
  },

  async updateUserSettings(userId: string, settings: Partial<AppSettings>): Promise<boolean> {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        id: userId,
        monthly_goal: settings.monthlyGoal,
        main_currency: settings.mainCurrency,
        exchange_rates: settings.exchangeRates,
        tax_reserve_percent: settings.taxReservePercent,
        updated_at: new Date().toISOString()
      });
    
    return !error;
  },

  async getClients(userId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(c => ({
      id: c.id,
      name: c.name,
      companyName: c.company_name,
      email: c.email,
      phone: c.phone,
      taxId: c.tax_id,
      address: c.address,
      website: c.website,
      notes: c.notes,
      preferredBillingChannel: c.preferred_billing_channel,
      billingEmail: c.billing_email,
      firstProjectDate: c.first_project_date,
      lastActivityDate: c.last_activity_date,
      tags: c.tags || [],
      isArchived: c.is_archived,
      createdAt: new Date(c.created_at).getTime()
    }));
  },

  async addClient(userId: string, client: Client): Promise<string | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        id: client.id.startsWith('client-') ? undefined : client.id,
        user_id: userId,
        name: client.name,
        company_name: client.companyName,
        email: client.email,
        phone: client.phone,
        tax_id: client.taxId,
        address: client.address,
        website: client.website,
        notes: client.notes,
        preferred_billing_channel: client.preferredBillingChannel,
        billing_email: client.billingEmail,
        first_project_date: client.firstProjectDate,
        last_activity_date: client.lastActivityDate,
        tags: client.tags,
        is_archived: client.isArchived
      })
      .select('id')
      .single();
    
    return error ? null : data.id;
  },

  async updateClient(userId: string, clientId: string, updates: Partial<Client>): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .update({
        name: updates.name,
        company_name: updates.companyName,
        email: updates.email,
        phone: updates.phone,
        tax_id: updates.taxId,
        address: updates.address,
        website: updates.website,
        notes: updates.notes,
        preferred_billing_channel: updates.preferredBillingChannel,
        billing_email: updates.billingEmail,
        first_project_date: updates.firstProjectDate,
        last_activity_date: updates.lastActivityDate,
        tags: updates.tags,
        is_archived: updates.isArchived,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .eq('user_id', userId);
    
    return !error;
  },

  async deleteClient(userId: string, clientId: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', userId);
    
    return !error;
  },

  async getProjects(userId: string): Promise<Project[]> {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !projects) return [];

    const projectIds = projects.map(p => p.id);
    
    const [logsResult, paymentsResult, adjustmentsResult] = await Promise.all([
      supabase.from('work_logs').select('*').in('project_id', projectIds),
      supabase.from('payments').select('*').in('project_id', projectIds),
      supabase.from('project_adjustments').select('*').in('project_id', projectIds)
    ]);

    const logsMap = new Map<string, WorkLog[]>();
    const paymentsMap = new Map<string, Payment[]>();
    const adjustmentsMap = new Map<string, ProjectAdjustment[]>();

    (logsResult.data || []).forEach(log => {
      const logs = logsMap.get(log.project_id) || [];
      logs.push({
        id: log.id,
        date: log.date,
        hours: log.hours,
        description: log.description || '',
        billable: log.billable
      });
      logsMap.set(log.project_id, logs);
    });

    (paymentsResult.data || []).forEach(pay => {
      const payments = paymentsMap.get(pay.project_id) || [];
      payments.push({
        id: pay.id,
        date: pay.date,
        amount: pay.amount,
        note: pay.note,
        status: pay.status,
        invoiceNumber: pay.invoice_number
      });
      paymentsMap.set(pay.project_id, payments);
    });

    (adjustmentsResult.data || []).forEach(adj => {
      const adjustments = adjustmentsMap.get(adj.project_id) || [];
      adjustments.push({
        id: adj.id,
        date: adj.date,
        amount: adj.amount,
        description: adj.description || '',
        title: adj.title
      });
      adjustmentsMap.set(adj.project_id, adjustments);
    });

    return projects.map(p => ({
      id: p.id,
      clientId: p.client_id,
      clientName: p.client_name,
      type: p.type,
      contractType: p.contract_type,
      category: p.category || '',
      rate: p.rate,
      currency: p.currency as Currency,
      status: p.status,
      platformFee: p.platform_fee,
      invoiceUrl: p.invoice_url,
      tags: p.tags || [],
      startDate: p.start_date,
      dueDate: p.due_date,
      contractEndDate: p.contract_end_date,
      renewalDate: p.renewal_date,
      estimatedHours: p.estimated_hours,
      notes: p.notes,
      checklist: p.checklist || [],
      linkedExpenseIds: p.linked_expense_ids || [],
      logs: logsMap.get(p.id) || [],
      payments: paymentsMap.get(p.id) || [],
      adjustments: adjustmentsMap.get(p.id) || [],
      events: [],
      createdAt: new Date(p.created_at).getTime()
    }));
  },

  async addProject(userId: string, project: Project): Promise<string | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        client_id: project.clientId,
        client_name: project.clientName,
        type: project.type,
        contract_type: project.contractType,
        category: project.category,
        rate: project.rate,
        currency: project.currency,
        status: project.status,
        platform_fee: project.platformFee,
        invoice_url: project.invoiceUrl,
        tags: project.tags,
        start_date: project.startDate,
        due_date: project.dueDate,
        contract_end_date: project.contractEndDate,
        renewal_date: project.renewalDate,
        estimated_hours: project.estimatedHours,
        notes: project.notes,
        checklist: project.checklist,
        linked_expense_ids: project.linkedExpenseIds
      })
      .select('id')
      .single();
    
    return error ? null : data.id;
  },

  async updateProject(userId: string, projectId: string, updates: Partial<Project>): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update({
        client_id: updates.clientId,
        client_name: updates.clientName,
        type: updates.type,
        contract_type: updates.contractType,
        category: updates.category,
        rate: updates.rate,
        currency: updates.currency,
        status: updates.status,
        platform_fee: updates.platformFee,
        invoice_url: updates.invoiceUrl,
        tags: updates.tags,
        start_date: updates.startDate,
        due_date: updates.dueDate,
        contract_end_date: updates.contractEndDate,
        renewal_date: updates.renewalDate,
        estimated_hours: updates.estimatedHours,
        notes: updates.notes,
        checklist: updates.checklist,
        linked_expense_ids: updates.linkedExpenseIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId);
    
    return !error;
  },

  async deleteProject(userId: string, projectId: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);
    
    return !error;
  },

  async addWorkLog(userId: string, projectId: string, log: WorkLog): Promise<string | null> {
    const { data, error } = await supabase
      .from('work_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        date: log.date,
        hours: log.hours,
        description: log.description,
        billable: log.billable
      })
      .select('id')
      .single();
    
    return error ? null : data.id;
  },

  async deleteWorkLog(userId: string, logId: string): Promise<boolean> {
    const { error } = await supabase
      .from('work_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);
    
    return !error;
  },

  async addPayment(userId: string, projectId: string, payment: Payment): Promise<string | null> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        project_id: projectId,
        user_id: userId,
        date: payment.date,
        amount: payment.amount,
        note: payment.note,
        status: payment.status,
        invoice_number: payment.invoiceNumber
      })
      .select('id')
      .single();
    
    return error ? null : data.id;
  },

  async updatePayment(userId: string, paymentId: string, payment: Payment): Promise<boolean> {
    const { error } = await supabase
      .from('payments')
      .update({
        date: payment.date,
        amount: payment.amount,
        note: payment.note,
        status: payment.status,
        invoice_number: payment.invoiceNumber
      })
      .eq('id', paymentId)
      .eq('user_id', userId);
    
    return !error;
  },

  async deletePayment(userId: string, paymentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId);
    
    return !error;
  },

  async addProjectAdjustment(userId: string, projectId: string, adjustment: ProjectAdjustment): Promise<string | null> {
    const { data, error } = await supabase
      .from('project_adjustments')
      .insert({
        project_id: projectId,
        user_id: userId,
        date: adjustment.date,
        amount: adjustment.amount,
        description: adjustment.description,
        title: adjustment.title
      })
      .select('id')
      .single();
    
    return error ? null : data.id;
  },

  async getExpenses(userId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      currency: e.currency as Currency,
      date: e.date,
      category: e.category,
      tags: e.tags || [],
      isWorkRelated: e.is_work_related,
      isRecurring: e.is_recurring,
      recurringFrequency: e.recurring_frequency,
      notes: e.notes,
      status: e.status,
      paymentHistory: e.payment_history || [],
      dueDay: e.due_day,
      isTrial: e.is_trial,
      trialEndDate: e.trial_end_date,
      logoUrl: e.logo_url
    }));
  },

  async addExpense(userId: string, expense: Expense): Promise<string | null> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        title: expense.title,
        amount: expense.amount,
        currency: expense.currency,
        date: expense.date,
        category: expense.category,
        tags: expense.tags,
        is_work_related: expense.isWorkRelated,
        is_recurring: expense.isRecurring,
        recurring_frequency: expense.recurringFrequency,
        notes: expense.notes,
        status: expense.status,
        payment_history: expense.paymentHistory,
        due_day: expense.dueDay,
        is_trial: expense.isTrial,
        trial_end_date: expense.trialEndDate,
        logo_url: expense.logoUrl
      })
      .select('id')
      .single();
    
    return error ? null : data.id;
  },

  async updateExpense(userId: string, expenseId: string, updates: Partial<Expense>): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.isWorkRelated !== undefined) updateData.is_work_related = updates.isWorkRelated;
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
    if (updates.recurringFrequency !== undefined) updateData.recurring_frequency = updates.recurringFrequency;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.paymentHistory !== undefined) updateData.payment_history = updates.paymentHistory;
    if (updates.dueDay !== undefined) updateData.due_day = updates.dueDay;
    if (updates.isTrial !== undefined) updateData.is_trial = updates.isTrial;
    if (updates.trialEndDate !== undefined) updateData.trial_end_date = updates.trialEndDate;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;

    const { error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .eq('user_id', userId);
    
    return !error;
  },

  async deleteExpense(userId: string, expenseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);
    
    return !error;
  }
};
