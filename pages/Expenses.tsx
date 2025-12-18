
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, Button, Input, Select, CurrencyDisplay, Toggle, DateRangeSelect, EmptyState, PageHeader } from '../components/ui';
import { Currency, EXPENSE_CATEGORIES, SERVICE_PRESETS, CATEGORY_ICONS, ServicePreset, Expense } from '../types';
import { safeFloat, parseLocalDate } from '../utils/format';
import { Plus, Trash2, Wallet, X, HelpCircle, CheckCircle2, Clock, AlertTriangle, Zap, Receipt, Store, Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecurringExpenseProgress, useRecurringExpenseTotal, useCurrencyConverter } from '../hooks/useFinancialEngine';

const IconMapper: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 16, className = '' }) => {
    // @ts-ignore
    const IconComponent = Icons[name] || Icons.HelpCircle;
    return <IconComponent size={size} className={className} />;
};

interface ExpenseFormState {
    id?: string;
    title: string; amount: string; currency: Currency; category: string; date: string; tags: string[]; isWorkRelated: boolean; isRecurring: boolean; recurringFrequency: 'MONTHLY' | 'YEARLY';
    status: 'PAID' | 'PENDING';
    dueDay?: string;
    isTrial: boolean;
    trialEndDate: string;
}

const Expenses: React.FC = () => {
    const { expenses, addExpense, deleteExpense, toggleExpensePayment, bulkMarkExpenseAsPaid, settings, convertCurrency, dateRange, setDateRange, getDateRangeFilter } = useData();
    
    const recurringProgress = useRecurringExpenseProgress();
    const monthlyBurnRate = useRecurringExpenseTotal();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const defaultForm: ExpenseFormState = {
        title: '', amount: '', currency: settings.mainCurrency, category: EXPENSE_CATEGORIES[1], date: new Date().toISOString().split('T')[0], tags: [], isWorkRelated: true, isRecurring: false, recurringFrequency: 'MONTHLY', status: 'PAID', dueDay: '',
        isTrial: false, trialEndDate: ''
    };
    const [formData, setFormData] = useState<ExpenseFormState>(defaultForm);

    const handleQuickPick = (preset: ServicePreset) => {
        setFormData({ ...formData, title: preset.name, category: preset.defaultCategory, tags: preset.defaultTags, isRecurring: preset.isRecurring, amount: '' });
        setFormError('');
    };

    const handleCardClick = (expense: Expense) => {
        navigate(`/expenses/${expense.id}`);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir esta despesa permanentemente?')) {
            deleteExpense(id);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.title.trim()) { setFormError('O título é obrigatório.'); return; }
        const amountVal = parseFloat(formData.amount);
        if (isNaN(amountVal) || amountVal <= 0) { setFormError('Informe um valor válido.'); return; }

        let dueDayVal: number | undefined = undefined;
        if (formData.isRecurring) {
            if (formData.dueDay && formData.dueDay.trim() !== '') {
                const day = parseInt(formData.dueDay, 10);
                if (isNaN(day) || day < 1 || day > 31) { setFormError('Dia do vencimento inválido.'); return; }
                dueDayVal = day;
            } else {
                const dateParts = formData.date.split('-');
                if (dateParts.length === 3) dueDayVal = parseInt(dateParts[2], 10);
                else dueDayVal = new Date().getDate();
            }
        }

        if (formData.isTrial && !formData.trialEndDate) { setFormError('Informe a data de fim do trial.'); return; }

        const payload = {
            title: formData.title, amount: amountVal, currency: formData.currency, category: formData.category, date: parseLocalDate(formData.date).toISOString(), tags: formData.tags,
            isWorkRelated: formData.isWorkRelated, isRecurring: formData.isRecurring, recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
            status: formData.status, dueDay: dueDayVal, isTrial: formData.isTrial, trialEndDate: formData.isTrial ? parseLocalDate(formData.trialEndDate).toISOString() : undefined
        };

        addExpense({ id: Date.now().toString(), ...payload });
        setFormData(defaultForm); setShowForm(false);
    };

    const { recurringExpenses, variableExpenses } = useMemo(() => {
        let filtered = expenses;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = expenses.filter(e => e.title.toLowerCase().includes(lower) || e.category?.toLowerCase().includes(lower));
        }

        const recurring = filtered.filter(e => e.isRecurring);
        const variable = filtered.filter(e => !e.isRecurring);

        return { recurringExpenses: recurring, variableExpenses: variable };
    }, [expenses, searchTerm]);

    const variableFiltered = useMemo(() => {
        const range = getDateRangeFilter();
        return variableExpenses.filter(e => { const d = new Date(e.date); return d >= range.start && d <= range.end; }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [variableExpenses, getDateRangeFilter]);

    const variableTotal = variableFiltered.reduce((acc, curr) => safeFloat(acc + convertCurrency(curr.amount, curr.currency, settings.mainCurrency)), 0);

    // Category Distribution
    const categoryStats = useMemo(() => {
        const stats: Record<string, number> = {};

        // Calculate Variable
        variableFiltered.forEach(e => {
            const val = convertCurrency(e.amount, e.currency, settings.mainCurrency);
            stats[e.category || 'Outros'] = safeFloat((stats[e.category || 'Outros'] || 0) + val);
        });

        // Calculate Recurring (Allocated for this month)
        recurringExpenses.forEach(e => {
            const isTrialActive = e.isTrial && e.trialEndDate && new Date(e.trialEndDate) > new Date();
            if (!isTrialActive) {
                let val = convertCurrency(e.amount, e.currency, settings.mainCurrency);
                if (e.recurringFrequency === 'YEARLY') val = val / 12;
                stats[e.category || 'Outros'] = safeFloat((stats[e.category || 'Outros'] || 0) + val);
            }
        });

        const total = Object.values(stats).reduce((a, b) => safeFloat(a + b), 0);
        return Object.entries(stats)
            .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);
    }, [variableFiltered, recurringExpenses, settings.mainCurrency, convertCurrency]);

    const sortedRecurring = useMemo(() => {
        return [...recurringExpenses].sort((a, b) => {
            if (a.isTrial && !b.isTrial) return -1;
            if (!a.isTrial && b.isTrial) return 1;
            const dayA = a.dueDay || new Date(a.date).getDate();
            const dayB = b.dueDay || new Date(b.date).getDate();
            return dayA - dayB;
        });
    }, [recurringExpenses]);

    // Helper to determine payment status relative to the FILTER
    const getRecurringStatus = (exp: Expense) => {
        const range = getDateRangeFilter();
        let targetDate = new Date();
        if (dateRange === 'THIS_MONTH' || dateRange === 'LAST_MONTH') {
            targetDate = range.start;
        }

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

        const entry = (exp.paymentHistory || []).find(h => h.monthStr === monthStr);
        return entry?.status === 'PAID' ? 'PAID' : 'PENDING';
    };

    const getTrialDaysLeft = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Calculate paid vs pending stats for recurring expenses
    const recurringStats = useMemo(() => {
        const total = recurringExpenses.length;
        const paid = recurringExpenses.filter(e => getRecurringStatus(e) === 'PAID').length;
        const pending = total - paid;
        const percent = total > 0 ? (paid / total) * 100 : 0;
        return { total, paid, pending, percent };
    }, [recurringExpenses, getRecurringStatus]);

    return (
        <div className="space-y-4 md:space-y-6 pb-24 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader
                title="Painel de Custos"
                subtitle="Controle de fornecedores e fluxo de caixa."
                action={
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
                            <input
                                type="text"
                                placeholder="Filtrar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-base-card border border-white/5 rounded-full text-xs font-bold text-white focus:border-brand outline-none w-32 md:w-48 transition-all"
                            />
                        </div>
                        <DateRangeSelect value={dateRange} onChange={setDateRange} />
                        <Button variant="primary" onClick={() => { setFormData(defaultForm); setFormError(''); setShowForm(!showForm); }} className="h-10 px-4 text-xs shadow-neon">
                            <Plus size={16} /> <span className="hidden sm:inline">Nova Despesa</span>
                        </Button>
                    </div>
                }
            />

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex items-center gap-6 border-l-4 border-l-semantic-purple bg-gradient-to-r from-base-card to-base-card/50">
                    <div className="p-4 bg-semantic-purple/10 rounded-full text-semantic-purple"><Store size={28} /></div>
                    <div>
                        <p className="text-xs font-bold text-ink-gray uppercase tracking-wider mb-1">Custo Fixo Mensal</p>
                        <h2 className="text-3xl font-black text-white"><CurrencyDisplay amount={monthlyBurnRate} currency={settings.mainCurrency} /></h2>
                        <p className="text-xs md:text-[10px] text-ink-gray mt-1">Assinaturas & Contratos</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-6 border-l-4 border-l-brand bg-gradient-to-r from-base-card to-base-card/50">
                    <div className="p-4 bg-brand/10 rounded-full text-brand"><Receipt size={28} /></div>
                    <div>
                        <p className="text-xs font-bold text-ink-gray uppercase tracking-wider mb-1">Variável (Este Mês)</p>
                        <h2 className="text-3xl font-black text-white"><CurrencyDisplay amount={variableTotal} currency={settings.mainCurrency} /></h2>
                        <p className="text-xs md:text-[10px] text-ink-gray mt-1">Uber, iFood, Equipamentos...</p>
                    </div>
                </Card>
            </div>

            {/* 2. Category Distribution Bar */}
            {categoryStats.length > 0 && (
                <div className="w-full h-8 rounded-full overflow-hidden flex bg-base-card border border-white/5 relative">
                    {categoryStats.map((cat, idx) => (
                        <div
                            key={cat.name}
                            style={{ width: `${cat.percent}%`, backgroundColor: ['#C6FF3F', '#3b82f6', '#a855f7', '#f97316', '#ec4899'][idx % 5] }}
                            className="h-full relative group"
                        >
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs md:text-[10px] px-2 py-1 rounded whitespace-nowrap border border-white/10 z-10 font-bold">
                                {cat.name}: {cat.percent.toFixed(0)}%
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. Main Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Vendor Management (Recurring) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2"><Store size={16} /> Gestão de Fornecedores</h3>
                        <div className="flex items-center gap-2">
                            {recurringStats.pending > 0 && (
                                <button
                                    onClick={() => {
                                        const range = getDateRangeFilter();
                                        const monthStr = `${range.start.getFullYear()}-${(range.start.getMonth() + 1).toString().padStart(2, '0')}`;
                                        if (window.confirm(`Marcar todas as ${recurringStats.pending} despesas pendentes como pagas para ${range.start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}?`)) {
                                            recurringExpenses.forEach(exp => {
                                                bulkMarkExpenseAsPaid(exp.id, [monthStr]);
                                            });
                                        }
                                    }}
                                    className="text-xs font-bold bg-brand/10 text-brand hover:bg-brand/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} /> Pagar Todas ({recurringStats.pending})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Monthly Progress Bar */}
                    {recurringStats.total > 0 && (
                        <div className="bg-base-card rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-ink-gray">Progresso do mês</span>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="flex items-center gap-1 text-brand"><CheckCircle2 size={12} /> {recurringStats.paid}</span>
                                        <span className="text-ink-dim">|</span>
                                        <span className="flex items-center gap-1 text-semantic-yellow"><Clock size={12} /> {recurringStats.pending}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-white">{Math.round(recurringStats.percent)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-brand transition-all duration-500" 
                                    style={{ width: `${recurringStats.percent}%` }} 
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {sortedRecurring.length > 0 ? (
                            sortedRecurring.map(exp => {
                                const iconName = CATEGORY_ICONS[exp.category || 'Outros'] || 'HelpCircle';
                                const isPaid = getRecurringStatus(exp) === 'PAID';
                                const isTrialActive = exp.isTrial && exp.trialEndDate && new Date(exp.trialEndDate) > new Date();
                                const daysLeft = exp.trialEndDate ? getTrialDaysLeft(exp.trialEndDate) : 0;

                                return (
                                    <div
                                        key={exp.id}
                                        onClick={() => handleCardClick(exp)}
                                        className="bg-base-card border border-white/5 rounded-2xl p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        {/* GRID LAYOUT: [ICON/ID] [AMOUNT/DATE] [ACTIONS] */}
                                        <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">

                                            {/* Col 1: Identity */}
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isTrialActive ? (daysLeft <= 3 ? 'bg-semantic-red animate-pulse' : 'bg-semantic-yellow') + ' text-black' : 'bg-white/5 text-ink-gray group-hover:text-white transition-colors'}`}>
                                                    {isTrialActive ? <Zap size={20} fill="black" /> : <IconMapper name={iconName} size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white text-sm truncate">{exp.title}</h4>
                                                        {isTrialActive && (
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${daysLeft <= 3 ? 'bg-semantic-red text-white' : 'bg-semantic-yellow/20 text-semantic-yellow'}`}>
                                                                {daysLeft <= 0 ? 'Trial expirado!' : daysLeft === 1 ? 'Expira amanhã!' : `${daysLeft} dias restantes`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-ink-gray truncate">{exp.category}</p>
                                                </div>
                                            </div>

                                            {/* Col 2: Value */}
                                            <div className="text-right px-4 border-r border-white/5 border-l md:border-l-0">
                                                <p className={`font-black text-base ${isTrialActive ? 'text-semantic-yellow line-through opacity-60' : 'text-white'}`}>
                                                    <CurrencyDisplay amount={exp.amount} currency={exp.currency} />
                                                </p>
                                                <p className="text-xs md:text-[10px] text-ink-dim uppercase">Dia {exp.dueDay || '?'}</p>
                                            </div>

                                            {/* Col 3: Actions */}
                                            <div className="flex items-center gap-2">
                                                {!isTrialActive && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleExpensePayment(exp.id, getDateRangeFilter().start);
                                                        }}
                                                        className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${isPaid ? 'bg-brand/10 text-brand hover:bg-brand/20' : 'bg-semantic-yellow/10 text-semantic-yellow hover:bg-semantic-yellow/20'}`}
                                                    >
                                                        {isPaid ? (
                                                            <><CheckCircle2 size={14} /> <span className="hidden sm:inline">Pago</span></>
                                                        ) : (
                                                            <><Clock size={14} /> <span className="hidden sm:inline">Pagar</span></>
                                                        )}
                                                    </button>
                                                )}
                                                {isTrialActive && (
                                                    <div className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold bg-semantic-yellow/10 text-semantic-yellow">
                                                        <Zap size={14} /> Trial
                                                    </div>
                                                )}

                                                <button
                                                    onClick={(e) => handleDeleteClick(e, exp.id)}
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-dim hover:text-semantic-red hover:bg-semantic-red/10 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-8 text-center bg-base-card rounded-2xl border border-dashed border-white/10">
                                <EmptyState title="Sem Fornecedores" description="Adicione assinaturas para gerenciar." />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Recent Variable Feed */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2"><Receipt size={14} /> Gastos Variáveis</h3>
                    </div>

                    <div className="space-y-3">
                        {variableFiltered.length > 0 ? (
                            variableFiltered.slice(0, 10).map(exp => {
                                const isPaid = exp.status !== 'PENDING';
                                return (
                                    <div
                                        key={exp.id}
                                        onClick={() => handleCardClick(exp)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-base-card border border-white/5 hover:border-white/10 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-1.5 h-8 rounded-full ${!isPaid ? 'bg-semantic-red' : 'bg-white/10 group-hover:bg-brand'}`}></div>
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-white truncate">{exp.title}</p>
                                                <p className="text-xs md:text-[10px] text-ink-dim">{new Date(exp.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <p className="text-xs font-bold text-white whitespace-nowrap"><CurrencyDisplay amount={exp.amount} currency={exp.currency} /></p>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, exp.id)}
                                                className="p-1.5 text-ink-dim hover:text-semantic-red hover:bg-semantic-red/10 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-10 text-xs text-ink-dim bg-base-card rounded-xl border border-white/5 border-dashed">
                                Nenhum gasto variável este mês.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
                    <Card className="w-full max-w-lg border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white">Nova Despesa</h3>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
                        </div>
                        {formError && <div className="mb-6 p-3 bg-semantic-red/10 border border-semantic-red/30 rounded-xl flex items-center gap-2 text-semantic-red font-bold text-sm"><AlertTriangle size={16} /> {formError}</div>}

                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                            {SERVICE_PRESETS.slice(0, 6).map(preset => (
                                <button key={preset.id} type="button" onClick={() => handleQuickPick(preset)} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors whitespace-nowrap border border-white/5">
                                    <IconMapper name={preset.iconName} size={14} /> <span className="text-xs font-bold">{preset.name}</span>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Título" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} autoFocus />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Valor" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                                <Select label="Moeda" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}>{Object.values(Currency).map(c => <option className="bg-black" key={c} value={c}>{c}</option>)}</Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Categoria" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{EXPENSE_CATEGORIES.map(cat => <option className="bg-black" key={cat} value={cat}>{cat}</option>)}</Select>
                                <Input label="Data (Ref)" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <Toggle label="Recorrente" checked={formData.isRecurring} onChange={c => setFormData({ ...formData, isRecurring: c })} />
                                    {formData.isRecurring && (
                                        <select className="bg-black border border-white/20 text-white text-xs font-bold p-2 rounded-lg outline-none" value={formData.recurringFrequency} onChange={e => setFormData({ ...formData, recurringFrequency: e.target.value as any })}>
                                            <option value="MONTHLY">Mensal</option>
                                            <option value="YEARLY">Anual</option>
                                        </select>
                                    )}
                                </div>
                                {formData.isRecurring && (
                                    <div className="animate-in slide-in-from-top-2 space-y-4 pt-2 border-t border-white/10 mt-2">
                                        <Input label="Dia Vencimento" type="number" min="1" max="31" placeholder={`Padrão: ${formData.date.split('-')[2]}`} value={formData.dueDay} onChange={e => setFormData({ ...formData, dueDay: e.target.value })} className="bg-black" />
                                        <div className="flex items-center gap-3"><Toggle label="Teste Grátis (Trial)?" checked={formData.isTrial} onChange={c => setFormData({ ...formData, isTrial: c })} /></div>
                                        {formData.isTrial && (
                                            <div className="bg-semantic-yellow/10 p-3 rounded-xl border border-semantic-yellow/30">
                                                <Input label="Fim do Teste" type="date" value={formData.trialEndDate} onChange={e => setFormData({ ...formData, trialEndDate: e.target.value })} className="bg-black border-semantic-yellow/30" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!formData.isRecurring && (
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                        <option className="bg-black" value="PAID">Pago</option>
                                        <option className="bg-black" value="PENDING">Pendente</option>
                                    </Select>
                                </div>
                            )}
                            <Button type="submit" variant="primary" className="w-full h-12 mt-4">Salvar</Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Expenses;
