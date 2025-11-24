
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, Button, Input, Select, CurrencyDisplay, Toggle } from '../components/ui';
import { Currency, EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../types';
import { ArrowLeft, Trash2, Edit2, Calendar, CheckCircle2, XCircle, Zap, DollarSign, ChevronDown, Check, AlertTriangle, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';

const IconMapper: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 16, className = '' }) => {
    // @ts-ignore
    const IconComponent = Icons[name] || Icons.HelpCircle;
    return <IconComponent size={size} className={className} />;
};

const ExpenseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { expenses, updateExpense, deleteExpense, toggleExpensePayment } = useData();

    const expense = expenses.find(e => e.id === id);
    const [isEditing, setIsEditing] = useState(false);
    const [expandedYear, setExpandedYear] = useState<number>(new Date().getFullYear());

    // Form State
    const [formData, setFormData] = useState({
        title: expense?.title || '', amount: expense?.amount || 0, currency: expense?.currency || Currency.BRL,
        category: expense?.category || 'Outros', date: expense?.date ? expense.date.split('T')[0] : '',
        isRecurring: expense?.isRecurring || false, recurringFrequency: expense?.recurringFrequency || 'MONTHLY',
        dueDay: expense?.dueDay || '', isTrial: expense?.isTrial || false, trialEndDate: expense?.trialEndDate ? expense.trialEndDate.split('T')[0] : '',
    });

    if (!expense) return <div className="p-8 text-center text-ink-gray">Despesa não encontrada.</div>;

    const iconName = CATEGORY_ICONS[expense.category || 'Outros'] || 'HelpCircle';

    // --- Logic ---

    // 1. Calculate Next Actionable Payment (The "Hero" Action)
    // FIXED: Logic to correctly transition years (e.g., if Dec 2024 is paid, suggest Jan 2025)
    const nextPaymentAction = useMemo(() => {
        if (!expense.isRecurring) return null;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1-12
        const dueDay = expense.dueDay || new Date(expense.date).getDate();

        // Check strictly the current month first
        const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        const isCurrentPaid = expense.paymentHistory?.some(h => h.monthStr === currentMonthStr && h.status === 'PAID');

        let targetDate: Date;
        let status: 'LATE' | 'DUE' | 'UPCOMING';

        if (!isCurrentPaid) {
            // Current month is pending. Is it late?
            targetDate = new Date(currentYear, currentMonth - 1, dueDay);
            // Check if previous months are missing? (Optional complexity, sticking to current focus)

            if (today.getDate() > dueDay) {
                status = 'LATE';
            } else {
                status = 'DUE';
            }
        } else {
            // Current is paid, target next month
            // JS Date handles month rollover (e.g. Month 12 becomes Jan next year) automatically
            targetDate = new Date(currentYear, currentMonth, dueDay);
            status = 'UPCOMING';
        }

        const label = targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        return {
            date: targetDate,
            label: label.charAt(0).toUpperCase() + label.slice(1),
            status,
            isPaid: false // By definition, the "next action" is unpaid
        };
    }, [expense]);

    // 2. Group History by Year for the Drawers
    const yearsData = useMemo(() => {
        if (!expense.isRecurring) return [];

        const currentYear = new Date().getFullYear();
        const startYear = new Date(expense.date).getFullYear();

        // Collect all years that have history OR comprise the range from start to now
        const years = new Set<number>();
        years.add(currentYear);
        years.add(startYear);
        years.add(currentYear + 1); // Allow seeing next year
        expense.paymentHistory?.forEach(h => years.add(parseInt(h.monthStr.split('-')[0])));

        const sortedYears = Array.from(years).sort((a, b) => b - a);

        return sortedYears.map(year => {
            const months = [];
            // Generate 12 months for this year
            for (let m = 11; m >= 0; m--) {
                const date = new Date(year, m, 1);
                const monthNum = m + 1;
                const monthStr = `${year}-${monthNum.toString().padStart(2, '0')}`;
                const isPaid = expense.paymentHistory?.some(h => h.monthStr === monthStr && h.status === 'PAID');

                const isFuture = date > new Date() && date.getMonth() !== new Date().getMonth();

                months.push({
                    date,
                    monthStr,
                    label: date.toLocaleDateString('pt-BR', { month: 'long' }),
                    isPaid,
                    isFuture
                });
            }

            const paidCount = months.filter(m => m.isPaid).length;

            return { year, months, paidCount, total: months.length };
        });
    }, [expense]);


    // Actions
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateExpense(expense.id, {
            ...formData, date: new Date(formData.date).toISOString(), amount: Number(formData.amount),
            trialEndDate: formData.isTrial ? new Date(formData.trialEndDate).toISOString() : undefined, dueDay: Number(formData.dueDay)
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm("Tem certeza que deseja apagar este registro e todo seu histórico de pagamentos?")) {
            deleteExpense(expense.id);
            navigate('/expenses', { replace: true });
        }
    };
    const handleToggle = (date: Date) => toggleExpensePayment(expense.id, date);

    return (
        <div className="max-w-3xl mx-auto pb-24 animate-in fade-in space-y-6 p-6 md:p-8">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/expenses')} className="flex items-center gap-2 text-ink-gray hover:text-white transition-colors group">
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10"><ArrowLeft size={18} /></div>
                    <span className="font-bold text-sm">Voltar</span>
                </button>
                <div className="flex gap-2">
                    {!isEditing && <Button variant="secondary" onClick={() => setIsEditing(true)} className="h-9 text-xs px-4"><Edit2 size={14} /> <span className="hidden sm:inline">Editar</span></Button>}
                    <Button variant="danger" onClick={handleDelete} className="h-9 w-9 p-0 flex items-center justify-center bg-semantic-red/10 text-semantic-red hover:bg-semantic-red/20"><Trash2 size={16} /></Button>
                </div>
            </div>

            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#111] border border-white/10 p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand/10 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-inner">
                            <IconMapper name={iconName} size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-2">{expense.title}</h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs md:text-[10px] font-bold text-ink-gray uppercase tracking-wider">
                                    {expense.category}
                                </span>
                                {expense.isRecurring && (
                                    <span className="px-2 py-0.5 rounded-md bg-brand/10 border border-brand/20 text-xs md:text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                                        <Zap size={10} fill="currentColor" /> Recorrente
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-xs md:text-[10px] font-bold text-ink-dim uppercase tracking-wider mb-1">Valor Mensal</p>
                        <div className="text-3xl font-black text-white tracking-tight"><CurrencyDisplay amount={expense.amount} currency={expense.currency} /></div>
                    </div>
                </div>
            </div>

            {isEditing ? (
                <Card>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4"><h3 className="font-bold text-white text-lg">Editar Detalhes</h3><button type="button" onClick={() => setIsEditing(false)} className="text-ink-gray hover:text-white"><XCircle size={24} /></button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Título" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /><div className="grid grid-cols-2 gap-4"><Input label="Valor" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /><Select label="Moeda" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}>{Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}</Select></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Select label="Categoria" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</Select><Input label="Data Início / Ref" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4"><div className="flex items-center gap-4"><Toggle label="Recorrente" checked={formData.isRecurring} onChange={c => setFormData({ ...formData, isRecurring: c })} />{formData.isRecurring && <Input label="Dia Vencimento" type="number" value={formData.dueDay} onChange={e => setFormData({ ...formData, dueDay: e.target.value })} className="mb-0 w-24" />}</div>{formData.isRecurring && (<div className="pt-4 border-t border-white/10"><Toggle label="É um Teste Grátis (Trial)?" checked={formData.isTrial} onChange={c => setFormData({ ...formData, isTrial: c })} />{formData.isTrial && <div className="mt-4"><Input label="Data Fim Trial" type="date" value={formData.trialEndDate} onChange={e => setFormData({ ...formData, trialEndDate: e.target.value })} /></div>}</div>)}</div>
                        <Button type="submit" variant="primary" className="w-full h-12">Salvar Alterações</Button>
                    </form>
                </Card>
            ) : expense.isRecurring ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">

                    {/* 1. HERO ACTION: Pay Next Bill */}
                    {nextPaymentAction && (
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-xs font-bold text-ink-gray uppercase tracking-wider flex items-center gap-2"><Zap size={14} className={nextPaymentAction.status === 'LATE' ? 'text-red-500' : 'text-brand'} /> Próxima Fatura</span>
                            </div>
                            <button
                                onClick={() => handleToggle(nextPaymentAction.date)}
                                className={`w-full group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 border
                            ${nextPaymentAction.status === 'LATE'
                                        ? 'bg-semantic-red/10 border-semantic-red/50 hover:bg-semantic-red/20'
                                        : 'bg-brand text-black border-brand hover:brightness-110 shadow-neon'}`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            {nextPaymentAction.status === 'LATE' && <span className="bg-semantic-red text-white text-xs md:text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Atrasado</span>}
                                            <span className={`text-sm font-bold uppercase tracking-wider ${nextPaymentAction.status === 'LATE' ? 'text-semantic-red' : 'text-black/60'}`}>{nextPaymentAction.status === 'UPCOMING' ? 'Em Breve' : 'Vence Hoje'}</span>
                                        </div>
                                        <h2 className={`text-2xl md:text-3xl font-black ${nextPaymentAction.status === 'LATE' ? 'text-white' : 'text-black'}`}>{nextPaymentAction.label}</h2>
                                    </div>
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95 ${nextPaymentAction.status === 'LATE' ? 'bg-semantic-red text-white' : 'bg-black text-brand'}`}>
                                        <Check size={24} strokeWidth={4} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* 2. HISTORY DRAWERS (Years) */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-xs font-bold text-ink-gray uppercase tracking-wider flex items-center gap-2"><Calendar size={14} /> Histórico de Pagamentos</span>
                        </div>

                        <div className="space-y-3">
                            {yearsData.map((yearGroup) => {
                                const isExpanded = expandedYear === yearGroup.year;
                                const percent = (yearGroup.paidCount / 12) * 100;

                                return (
                                    <div key={yearGroup.year} className={`bg-[#111] border transition-all duration-300 rounded-2xl overflow-hidden ${isExpanded ? 'border-white/10 ring-1 ring-white/5' : 'border-white/5 hover:border-white/10'}`}>

                                        {/* Drawer Header */}
                                        <button
                                            onClick={() => setExpandedYear(isExpanded ? 0 : yearGroup.year)}
                                            className="w-full flex items-center justify-between p-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`text-lg font-bold ${isExpanded ? 'text-white' : 'text-ink-gray'}`}>{yearGroup.year}</div>
                                                {/* Mini Progress Bar */}
                                                {!isExpanded && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand" style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                        <span className="text-xs md:text-[10px] text-ink-dim">{yearGroup.paidCount}/12</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white' : 'text-ink-dim'}`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </button>

                                        {/* Drawer Content */}
                                        {isExpanded && (
                                            <div className="border-t border-white/5 bg-black/20">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                                                    {yearGroup.months.map(month => (
                                                        <div
                                                            key={month.monthStr}
                                                            onClick={() => handleToggle(month.date)}
                                                            className={`
                                                            flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all group
                                                            ${month.isPaid
                                                                    ? 'bg-brand/5 border-brand/20'
                                                                    : 'bg-transparent border-transparent hover:bg-white/5'}
                                                        `}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${month.isPaid ? 'bg-brand border-brand' : 'border-white/20 group-hover:border-white/50'}`}>
                                                                    {month.isPaid && <Check size={12} className="text-black" strokeWidth={4} />}
                                                                </div>
                                                                <span className={`text-sm font-bold capitalize ${month.isPaid ? 'text-white' : month.isFuture ? 'text-ink-dim' : 'text-ink-gray'}`}>
                                                                    {month.label}
                                                                </span>
                                                            </div>

                                                            {month.isPaid ? (
                                                                <span className="text-xs md:text-[10px] font-bold text-brand uppercase tracking-wider">Pago</span>
                                                            ) : month.isFuture ? (
                                                                <span className="text-xs md:text-[10px] font-bold text-ink-dim uppercase tracking-wider">Futuro</span>
                                                            ) : (
                                                                <span className="text-xs md:text-[10px] font-bold text-ink-gray uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Marcar</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="px-4 pb-4 pt-2 flex justify-end">
                                                    <div className="text-xs text-ink-dim font-bold">Total Pago em {yearGroup.year}: <span className="text-white"><CurrencyDisplay amount={yearGroup.paidCount * expense.amount} currency={expense.currency} /></span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-ink-gray">
                        <DollarSign size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Pagamento Único</h3>
                    <p className="text-ink-gray mb-6 max-w-xs mx-auto">Esta é uma despesa pontual, não recorrente. O status atual é:</p>

                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 text-sm font-bold uppercase tracking-wider mb-8 ${expense.status === 'PAID' ? 'border-brand/50 text-brand bg-brand/10' : 'border-white/10 text-ink-gray'}`}>
                        {expense.status === 'PAID' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        {expense.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                    </div>

                    <Button variant={expense.status === 'PAID' ? 'secondary' : 'primary'} onClick={() => toggleExpensePayment(expense.id, new Date())}>
                        {expense.status === 'PAID' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                    </Button>
                </Card>
            )}
        </div>
    );
};

export default ExpenseDetails;
