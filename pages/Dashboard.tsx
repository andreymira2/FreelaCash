
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Card, CurrencyDisplay, Button, Avatar, DateRangeSelect, EmptyState, TrendIndicator, Input, Select, Badge, PageHeader } from '../components/ui';
import { ProjectStatus, PaymentStatus, Currency } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, X, ArrowUpRight, ArrowDownLeft, Bell, Activity, RefreshCcw, Briefcase, Users, ArrowRight, Target, Zap, Clock, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { projects, expenses, getProjectTotal, settings, convertCurrency, userProfile, dateRange, setDateRange, getDateRangeFilter, addPayment, getFutureRecurringIncome } = useData();
    const navigate = useNavigate();

    const [showQuickPay, setShowQuickPay] = useState(false);
    const [quickPayProjectId, setQuickPayProjectId] = useState('');
    const [quickPayAmount, setQuickPayAmount] = useState('');
    const [quickPayDate, setQuickPayDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Logic ---

    const timeGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    }, []);

    const getPreviousDateRange = (currentRange: any) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();
        switch (currentRange) {
            case 'THIS_MONTH':
                start.setMonth(now.getMonth() - 1);
                start.setDate(1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'LAST_MONTH':
                start.setMonth(now.getMonth() - 2);
                start.setDate(1);
                end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
                break;
            case 'THIS_YEAR':
                start.setFullYear(now.getFullYear() - 1, 0, 1);
                end.setFullYear(now.getFullYear() - 1, 11, 31);
                break;
            default: return null;
        }
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const dashboardData = useMemo(() => {
        const currentRange = getDateRangeFilter();
        const prevRangeDates = getPreviousDateRange(dateRange);

        // Helper: Metrics Calculation
        const calculateMetrics = (start: Date, end: Date) => {
            let income = 0; let expense = 0;
            const clientIncomeMap: Record<string, number> = {};

            // 1. Project Payments
            projects.forEach(p => {
                if (p.payments?.length) {
                    p.payments.forEach(pay => {
                        const d = new Date(pay.date);
                        if (d >= start && d <= end && (pay.status === PaymentStatus.PAID || !pay.status)) {
                            const amount = convertCurrency(pay.amount, p.currency, settings.mainCurrency);
                            income += amount;
                            clientIncomeMap[p.clientName] = (clientIncomeMap[p.clientName] || 0) + amount;
                        }
                    });
                } else if (p.status === ProjectStatus.PAID && p.paymentDate) {
                    // Legacy support
                    const d = new Date(p.paymentDate);
                    if (d >= start && d <= end) {
                        const amount = convertCurrency(getProjectTotal(p).net, p.currency, settings.mainCurrency);
                        income += amount;
                        clientIncomeMap[p.clientName] = (clientIncomeMap[p.clientName] || 0) + amount;
                    }
                }
            });

            // 2. Expenses
            expenses.forEach(e => {
                // Expenses logic needs to match DataContext robust check, simplified here for dashboard speed
                // If recurring, we should ideally check history, but for simple totals in this view:
                if (e.isRecurring) {
                    e.paymentHistory?.forEach(h => {
                        const [y, m] = h.monthStr.split('-').map(Number);
                        const d = new Date(y, m - 1, e.dueDay || 15);
                        if (d >= start && d <= end && h.status === 'PAID') {
                            expense += convertCurrency(e.amount, e.currency, settings.mainCurrency);
                        }
                    });
                } else {
                    const d = new Date(e.date);
                    if (d >= start && d <= end && e.status !== 'PENDING') {
                        expense += convertCurrency(e.amount, e.currency, settings.mainCurrency);
                    }
                }
            });

            return { income, expense, net: income - expense, clientMap: clientIncomeMap };
        };

        const current = calculateMetrics(currentRange.start, currentRange.end);
        const previous = prevRangeDates ? calculateMetrics(prevRangeDates.start, prevRangeDates.end) : { income: 0, expense: 0, net: 0, clientMap: {} };

        // Active Projects List
        const activeAssets = projects
            .filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING)
            .map(p => ({ ...p, calculatedTotal: getProjectTotal(p) }))
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5); // Limit to 5 for dashboard

        // Unified Feed (Recent Activity)
        const feedItems: Array<{ id: string, type: 'INCOME' | 'EXPENSE', date: Date, title: string, subtitle: string, amount: number, currency: Currency }> = [];

        // Feed: Payments
        projects.forEach(p => {
            p.payments?.forEach(pay => {
                if (pay.status === PaymentStatus.PAID || !pay.status) {
                    feedItems.push({
                        id: pay.id,
                        type: 'INCOME',
                        date: new Date(pay.date),
                        title: p.clientName,
                        subtitle: pay.note || 'Pagamento Recebido',
                        amount: pay.amount,
                        currency: p.currency
                    });
                }
            });
        });

        // Feed: Expenses
        expenses.forEach(e => {
            if (e.isRecurring) {
                e.paymentHistory?.forEach(h => {
                    if (h.status === 'PAID') {
                        const [y, m] = h.monthStr.split('-').map(Number);
                        feedItems.push({
                            id: `${e.id}-${h.monthStr}`,
                            type: 'EXPENSE',
                            date: new Date(y, m - 1, e.dueDay || 15),
                            title: e.title,
                            subtitle: e.category || 'Despesa Recorrente',
                            amount: e.amount,
                            currency: e.currency
                        });
                    }
                })
            } else {
                if (e.status !== 'PENDING') {
                    feedItems.push({
                        id: e.id,
                        type: 'EXPENSE',
                        date: new Date(e.date),
                        title: e.title,
                        subtitle: e.category || 'Despesa Pontual',
                        amount: e.amount,
                        currency: e.currency
                    });
                }
            }
        });

        // Sort feed by date desc and take top 10
        const recentFeed = feedItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

        return { current, previous, activeAssets, recentFeed };
    }, [projects, expenses, dateRange, settings.mainCurrency, getProjectTotal, convertCurrency, getDateRangeFilter]);

    const handleQuickPaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickPayProjectId || !quickPayAmount) return;
        addPayment(quickPayProjectId, {
            id: Date.now().toString(),
            date: new Date(quickPayDate).toISOString(),
            amount: parseFloat(quickPayAmount),
            note: 'Entrada Rápida via Dashboard',
            status: PaymentStatus.PAID
        });
        setShowQuickPay(false); setQuickPayProjectId(''); setQuickPayAmount('');
    };

    const recurringIncome = getFutureRecurringIncome();
    const activeProjectsList = projects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING);

    // Goal Progress Calculation
    const goalPercent = Math.min(100, Math.round((dashboardData.current.income / (settings.monthlyGoal || 1)) * 100));

    // --- Components ---

    const QuickActionButton = ({ icon: Icon, label, onClick, colorClass = "bg-white/5 hover:bg-white/10 text-white" }: any) => (
        <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-95 ${colorClass} w-full border border-white/5`}>
            <Icon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="animate-in fade-in duration-700 pb-24 max-w-[1600px] mx-auto space-y-8">

            {/* 1. Enhanced Header with Goal Ring */}
            {/* 1. Enhanced Header with Goal Ring */}
            <PageHeader
                title={userProfile.name.split(' ')[0]}
                subtitle={timeGreeting}
                action={
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="hidden md:flex gap-2 mr-4">
                            <Button variant="ghost" onClick={() => setShowQuickPay(true)} className="h-10 text-xs bg-white/5 text-ink-gray hover:text-white"><ArrowDownLeft size={16} /> Receber</Button>
                            <Button variant="ghost" onClick={() => navigate('/expenses')} className="h-10 text-xs bg-white/5 text-ink-gray hover:text-white"><ArrowUpRight size={16} /> Pagar</Button>
                        </div>
                        <DateRangeSelect value={dateRange} onChange={setDateRange} />
                        <Button variant="primary" onClick={() => navigate('/add')} className="h-10 text-xs px-5 shadow-neon">
                            <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">Projeto</span>
                        </Button>
                    </div>
                }
            />

            {/* 2. Main Command Center (Metrics) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Card: Goal Progress */}
                <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-black border-white/10 p-0 flex flex-col md:flex-row">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="p-8 flex-1 flex flex-col justify-center relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-brand" />
                            <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Meta Mensal</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            <CurrencyDisplay amount={dashboardData.current.income} currency={settings.mainCurrency} />
                        </h2>
                        <p className="text-sm text-ink-gray font-medium mb-6">
                            De <CurrencyDisplay amount={settings.monthlyGoal} currency={settings.mainCurrency} /> estipulados
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-2 w-full max-w-md bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-brand shadow-[0_0_15px_#C6FF3F]" style={{ width: `${goalPercent}%`, transition: 'width 1s ease-out' }}></div>
                            </div>
                            <span className="text-sm font-bold text-white">{goalPercent}%</span>
                        </div>
                    </div>

                    {/* Quick Stats Sidebar inside card */}
                    <div className="bg-black/40 border-t md:border-t-0 md:border-l border-white/5 p-6 md:w-64 flex flex-col justify-center gap-6 backdrop-blur-sm">
                        <div>
                            <p className="text-[10px] font-bold text-ink-dim uppercase mb-1">Despesas</p>
                            <p className="text-xl font-bold text-white"><CurrencyDisplay amount={dashboardData.current.expense} currency={settings.mainCurrency} /></p>
                            <TrendIndicator current={dashboardData.current.expense} previous={dashboardData.previous.expense} inverse />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-ink-dim uppercase mb-1">Lucro Líquido</p>
                            <p className={`text-xl font-bold ${dashboardData.current.net >= 0 ? 'text-brand' : 'text-semantic-red'}`}>
                                <CurrencyDisplay amount={dashboardData.current.net} currency={settings.mainCurrency} />
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-ink-dim uppercase mb-1 flex items-center gap-1"><RefreshCcw size={10} /> MRR Recorrente</p>
                            <p className="text-lg font-bold text-semantic-purple"><CurrencyDisplay amount={recurringIncome} currency={settings.mainCurrency} /></p>
                        </div>
                    </div>
                </Card>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <QuickActionButton icon={Briefcase} label="Novo Projeto" onClick={() => navigate('/add')} colorClass="bg-brand/10 hover:bg-brand/20 text-brand border-brand/20" />
                    <QuickActionButton icon={Wallet} label="Lançar Despesa" onClick={() => navigate('/expenses')} />
                    <QuickActionButton icon={Users} label="Clientes" onClick={() => navigate('/settings')} /> {/* Shortcut to CRM via settings for now or make CRM page */}
                    <QuickActionButton icon={Activity} label="Relatórios" onClick={() => navigate('/reports')} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* 3. Recent Activity Feed (Live Timeline) */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Activity size={18} className="text-brand" /> Atividade Recente
                        </h3>
                        <span className="text-[10px] font-bold bg-white/5 text-ink-gray px-2 py-1 rounded">Feed Unificado</span>
                    </div>

                    <div className="bg-base-card border border-white/5 rounded-3xl p-1">
                        {dashboardData.recentFeed.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {dashboardData.recentFeed.map((item) => (
                                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors rounded-2xl group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'INCOME' ? 'bg-brand/10 text-brand' : 'bg-semantic-red/10 text-semantic-red'}`}>
                                            {item.type === 'INCOME' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                                                <span className="text-[10px] text-ink-dim whitespace-nowrap">{item.date.toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-ink-gray truncate">{item.subtitle}</p>
                                        </div>
                                        <div className={`text-sm font-bold ${item.type === 'INCOME' ? 'text-brand' : 'text-white'}`}>
                                            {item.type === 'EXPENSE' && '-'} <CurrencyDisplay amount={item.amount} currency={item.currency} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Tudo calmo" description="Nenhuma atividade recente registrada." />
                        )}
                    </div>
                </div>

                {/* 4. Active Projects Queue */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Briefcase size={18} className="text-semantic-blue" /> Em Andamento
                        </h3>
                        <Button variant="ghost" onClick={() => navigate('/projects')} className="text-xs h-6 px-2">Ver Todos</Button>
                    </div>

                    <div className="space-y-3">
                        {dashboardData.activeAssets.length > 0 ? (
                            dashboardData.activeAssets.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/project/${project.id}`)}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-base-card border border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all group"
                                >
                                    <Avatar name={project.clientName} className="w-8 h-8 rounded-lg text-xs" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white text-xs truncate group-hover:text-brand transition-colors">{project.clientName}</h4>
                                            {project.status === ProjectStatus.ONGOING && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-semantic-purple shadow-[0_0_5px_currentColor]"></div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-white/50 group-hover:bg-brand transition-colors" style={{ width: `${(project.calculatedTotal.paid / project.calculatedTotal.net) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-white text-xs"><CurrencyDisplay amount={project.calculatedTotal.net} currency={project.currency} /></p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
                                <p className="text-xs text-ink-gray mb-3">Sem projetos ativos.</p>
                                <Button variant="outline" onClick={() => navigate('/add')} className="text-xs w-full">Criar Projeto</Button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Quick Pay Modal */}
            {showQuickPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
                    <Card className="w-full max-w-md border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                                    <ArrowDownLeft size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Entrada Rápida</h3>
                                    <p className="text-xs text-ink-gray">Registre um recebimento manual.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowQuickPay(false)} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
                        </div>
                        {activeProjectsList.length > 0 ? (
                            <form onSubmit={handleQuickPaySubmit} className="space-y-4">
                                <Select label="Origem (Projeto)" value={quickPayProjectId} onChange={e => setQuickPayProjectId(e.target.value)} autoFocus>
                                    <option value="" className="bg-black">Selecione...</option>
                                    {activeProjectsList.map(p => <option key={p.id} value={p.id} className="bg-black">{p.clientName}</option>)}
                                </Select>
                                <Input label="Valor Recebido" type="number" step="0.01" value={quickPayAmount} onChange={e => setQuickPayAmount(e.target.value)} required placeholder="0.00" />
                                <Input label="Data" type="date" value={quickPayDate} onChange={e => setQuickPayDate(e.target.value)} required />
                                <Button type="submit" variant="primary" className="w-full h-12 text-sm font-bold mt-2">Confirmar Recebimento</Button>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-ink-gray mb-4 text-sm">Você precisa de um projeto ativo para lançar uma entrada.</p>
                                <Button onClick={() => navigate('/add')} className="w-full">Criar Projeto</Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
