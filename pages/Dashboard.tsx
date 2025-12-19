
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card, CurrencyDisplay, Button, Avatar, DateRangeSelect, EmptyState, Input, Select, PageHeader } from '../components/ui';
import { ProjectStatus, PaymentStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ArrowUpRight, ArrowDownLeft, Activity, Briefcase, Target, Clock, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { 
    useFinancialSnapshot, 
    useHealthScore, 
    useReceivables, 
    useExpenseReminders, 
    useRecentActivity, 
    useActiveProjectFinancials
} from '../hooks/useFinancialEngine';
import { parseLocalDateToISO, parseNumber, toInputDate } from '../utils/format';

const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getFutureRelativeTime = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Atrasado';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays < 7) return `Em ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const Dashboard: React.FC = () => {
    const { projects, settings, userProfile, dateRange, setDateRange, addPayment, updatePayment, toggleExpensePayment } = useData();
    const navigate = useNavigate();

    const [showQuickPay, setShowQuickPay] = useState(false);
    const [quickPayProjectId, setQuickPayProjectId] = useState('');
    const [quickPayAmount, setQuickPayAmount] = useState('');
    const [quickPayDate, setQuickPayDate] = useState(toInputDate(new Date().toISOString()));

    const currentSnapshot = useFinancialSnapshot();
    const healthScore = useHealthScore();
    const receivables = useReceivables();
    const expenseReminders = useExpenseReminders(7);
    const recentActivity = useRecentActivity(7);
    const activeProjectFinancials = useActiveProjectFinancials();

    const timeGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    }, []);

    const activeProjects = useMemo(() => 
        activeProjectFinancials.slice(0, 5),
        [activeProjectFinancials]
    );

    const overdueReceivables = useMemo(() => 
        receivables.filter(r => r.isOverdue),
        [receivables]
    );

    const nextReceivable = useMemo(() => 
        receivables.find(r => !r.isOverdue),
        [receivables]
    );

    const nextExpense = useMemo(() => 
        expenseReminders.find(e => !e.isPaid),
        [expenseReminders]
    );

    const alertInfo = useMemo(() => {
        if (overdueReceivables.length > 0) {
            const totalOverdue = overdueReceivables.reduce((acc, r) => acc + r.amountConverted, 0);
            return {
                type: 'critical' as const,
                icon: AlertCircle,
                message: `${overdueReceivables.length} pagamento${overdueReceivables.length > 1 ? 's' : ''} atrasado${overdueReceivables.length > 1 ? 's' : ''}`,
                subtext: `Total: `,
                amount: totalOverdue,
                action: () => navigate('/projects'),
                actionLabel: 'Ver projetos'
            };
        }
        
        const todayExpenses = expenseReminders.filter(e => !e.isPaid && e.daysUntilDue === 0);
        if (todayExpenses.length > 0) {
            const total = todayExpenses.reduce((acc, e) => acc + e.amountConverted, 0);
            return {
                type: 'warning' as const,
                icon: AlertTriangle,
                message: `${todayExpenses.length} conta${todayExpenses.length > 1 ? 's' : ''} vence${todayExpenses.length > 1 ? 'm' : ''} hoje`,
                subtext: `Total: `,
                amount: total,
                action: () => navigate('/expenses'),
                actionLabel: 'Ver despesas'
            };
        }

        if (healthScore.status === 'critical') {
            return {
                type: 'warning' as const,
                icon: AlertTriangle,
                message: 'Saúde financeira baixa',
                subtext: `Score: ${healthScore.score}%`,
                action: () => navigate('/reports'),
                actionLabel: 'Ver relatório'
            };
        }

        return null;
    }, [overdueReceivables, expenseReminders, healthScore, navigate]);

    const handleQuickPaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickPayProjectId || !quickPayAmount) return;
        addPayment(quickPayProjectId, {
            id: Date.now().toString(),
            date: parseLocalDateToISO(quickPayDate),
            amount: parseNumber(quickPayAmount),
            note: 'Entrada Rápida via Dashboard',
            status: PaymentStatus.PAID
        });
        setShowQuickPay(false); setQuickPayProjectId(''); setQuickPayAmount('');
    };

    const handleMarkReceivablePaid = (projectId: string, paymentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const project = projects.find(p => p.id === projectId);
        const payment = project?.payments?.find(p => p.id === paymentId);
        if (payment) {
            updatePayment(projectId, { ...payment, status: PaymentStatus.PAID });
        }
    };

    const handleMarkExpensePaid = (expenseId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleExpensePayment(expenseId, new Date());
    };

    const activeProjectsList = useMemo(() => 
        projects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING),
        [projects]
    );

    useEffect(() => {
        if (showQuickPay && activeProjectsList.length === 1 && !quickPayProjectId) {
            setQuickPayProjectId(activeProjectsList[0].id);
        }
    }, [showQuickPay, activeProjectsList, quickPayProjectId]);

    const goalPercent = Math.min(100, Math.round(currentSnapshot.goalProgress));

    const getProjectStatus = (projectFinancials: typeof activeProjectFinancials[0]) => {
        const project = projects.find(p => p.id === projectFinancials.projectId);
        if (!project) return { status: 'normal', label: '' };
        
        if (projectFinancials.isOverdue) {
            return { status: 'overdue', label: 'Atrasado', color: 'text-semantic-red' };
        }
        
        const lastPaymentDate = project.payments
            ?.filter(p => p.status === PaymentStatus.PAID)
            .map(p => new Date(p.date))
            .sort((a, b) => b.getTime() - a.getTime())[0];
        
        if (lastPaymentDate) {
            const daysSincePayment = Math.floor((Date.now() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSincePayment > 30) {
                return { status: 'stale', label: `${daysSincePayment}d parado`, color: 'text-semantic-yellow' };
            }
        }
        
        return { status: 'active', label: 'Fluindo', color: 'text-brand' };
    };

    const limitedActivity = useMemo(() => {
        return recentActivity.map(group => ({
            ...group,
            items: group.items.slice(0, 3)
        })).filter(group => group.items.length > 0).slice(0, 2);
    }, [recentActivity]);

    const totalActivityItems = limitedActivity.reduce((acc, g) => acc + g.items.length, 0);

    return (
        <div className="animate-in fade-in duration-700 pb-24 pt-6 md:pt-10 max-w-[1400px] mx-auto space-y-5 md:space-y-6 px-4 md:px-6">

            <PageHeader
                title={
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={userProfile.name}
                            src={userProfile.avatar}
                            className="w-10 h-10 text-base ring-2 ring-white/10"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-white">{timeGreeting}, {userProfile.name.split(' ')[0]}</h1>
                        </div>
                    </div>
                }
                subtitle=""
                action={
                    <div className="flex items-center gap-2">
                        <DateRangeSelect value={dateRange} onChange={setDateRange} />
                        <Button variant="primary" onClick={() => navigate('/add')} className="h-9 text-xs px-4">
                            <Plus size={14} strokeWidth={3} />
                        </Button>
                    </div>
                }
            />

            {alertInfo && (
                <div 
                    className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                        alertInfo.type === 'critical' 
                            ? 'bg-semantic-red/10 border border-semantic-red/30 hover:bg-semantic-red/20' 
                            : 'bg-semantic-yellow/10 border border-semantic-yellow/30 hover:bg-semantic-yellow/20'
                    }`}
                    onClick={alertInfo.action}
                >
                    <alertInfo.icon 
                        size={20} 
                        className={alertInfo.type === 'critical' ? 'text-semantic-red' : 'text-semantic-yellow'} 
                    />
                    <div className="flex-1">
                        <p className={`font-bold text-sm ${alertInfo.type === 'critical' ? 'text-semantic-red' : 'text-semantic-yellow'}`}>
                            {alertInfo.message}
                        </p>
                        <p className="text-xs text-ink-gray">
                            {alertInfo.subtext}
                            {alertInfo.amount && <CurrencyDisplay amount={alertInfo.amount} currency={settings.mainCurrency} />}
                        </p>
                    </div>
                    <span className={`text-xs font-bold ${alertInfo.type === 'critical' ? 'text-semantic-red' : 'text-semantic-yellow'}`}>
                        {alertInfo.actionLabel} <ArrowRight size={12} className="inline" />
                    </span>
                </div>
            )}

            <div className="flex lg:hidden gap-2">
                <button 
                    onClick={() => setShowQuickPay(true)} 
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand/10 text-brand font-bold text-sm active:scale-95 transition-all"
                >
                    <ArrowDownLeft size={16} /> Receber
                </button>
                <button 
                    onClick={() => navigate('/expenses')} 
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-white font-bold text-sm active:scale-95 transition-all"
                >
                    <ArrowUpRight size={16} /> Pagar
                </button>
            </div>

            <Card className="relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-black border-white/10 p-0">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="p-6 md:p-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={14} className="text-brand" />
                                <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Meta Mensal</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
                                <CurrencyDisplay amount={currentSnapshot.income.total} currency={settings.mainCurrency} />
                            </h2>
                            <p className="text-sm text-ink-gray mb-4">
                                de <CurrencyDisplay amount={settings.monthlyGoal} currency={settings.mainCurrency} />
                            </p>
                            <div className="flex items-center gap-3 max-w-sm">
                                <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand shadow-[0_0_10px_#C6FF3F]" 
                                        style={{ width: `${goalPercent}%`, transition: 'width 0.8s ease-out' }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-white w-12 text-right">{goalPercent}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-ink-dim uppercase mb-1">Despesas</p>
                                <p className="text-lg font-bold text-white">
                                    <CurrencyDisplay amount={currentSnapshot.expenses.total} currency={settings.mainCurrency} />
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-ink-dim uppercase mb-1">Lucro</p>
                                <p className={`text-lg font-bold ${currentSnapshot.net >= 0 ? 'text-brand' : 'text-semantic-red'}`}>
                                    <CurrencyDisplay amount={currentSnapshot.net} currency={settings.mainCurrency} />
                                </p>
                            </div>
                            {(settings.taxReservePercent || 0) > 0 && (
                                <div className="hidden md:block">
                                    <p className="text-[10px] font-bold text-ink-dim uppercase mb-1">
                                        Reserva ({settings.taxReservePercent}%)
                                    </p>
                                    <p className="text-lg font-bold text-semantic-yellow">
                                        <CurrencyDisplay amount={currentSnapshot.taxReserve} currency={settings.mainCurrency} />
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(nextReceivable || nextExpense) && (
                        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-ink-dim uppercase mb-2 flex items-center gap-1">
                                    <TrendingUp size={10} className="text-semantic-green" /> Próximo Recebimento
                                </p>
                                {nextReceivable ? (
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer group"
                                        onClick={() => navigate(`/project/${nextReceivable.projectId}`)}
                                    >
                                        <p className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                                            <CurrencyDisplay amount={nextReceivable.amount} currency={nextReceivable.currency} />
                                        </p>
                                        <span className="text-xs text-ink-gray">{getFutureRelativeTime(nextReceivable.date)}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-ink-gray">Nenhum agendado</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-ink-dim uppercase mb-2 flex items-center gap-1">
                                    <Calendar size={10} className="text-semantic-yellow" /> Próxima Conta
                                </p>
                                {nextExpense ? (
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer group"
                                        onClick={() => navigate(`/expenses/${nextExpense.expenseId}`)}
                                    >
                                        <p className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                                            <CurrencyDisplay amount={nextExpense.amount} currency={nextExpense.currency} />
                                        </p>
                                        <span className="text-xs text-ink-gray">{getFutureRelativeTime(nextExpense.dueDate)}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-ink-gray">Nenhuma pendente</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Activity size={16} className="text-brand" /> Atividade Recente
                        </h3>
                        {totalActivityItems >= 5 && (
                            <Button variant="ghost" onClick={() => navigate('/reports')} className="text-xs h-6 px-2">
                                Ver mais
                            </Button>
                        )}
                    </div>

                    <div className="bg-base-card border border-white/5 rounded-2xl overflow-hidden">
                        {limitedActivity.length > 0 ? (
                            <div>
                                {limitedActivity.map((group) => (
                                    <div key={group.label}>
                                        <div className="px-4 py-2 bg-white/[0.02]">
                                            <span className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">{group.label}</span>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {group.items.map((item) => (
                                                <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'income' ? 'bg-brand/10 text-brand' : 'bg-semantic-red/10 text-semantic-red'}`}>
                                                        {item.type === 'income' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                                        <p className="text-xs text-ink-gray">{getRelativeTime(item.date)}</p>
                                                    </div>
                                                    <span className={`text-sm font-bold ${item.type === 'income' ? 'text-brand' : 'text-white'}`}>
                                                        {item.type === 'expense' && '-'}
                                                        <CurrencyDisplay amount={item.amount} currency={item.currency} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-ink-gray">Nenhuma atividade nos últimos 7 dias</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Briefcase size={16} className="text-semantic-blue" /> Projetos
                        </h3>
                        <Button variant="ghost" onClick={() => navigate('/projects')} className="text-xs h-6 px-2">
                            Ver todos
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {activeProjects.length > 0 ? (
                            activeProjects.map(projectFinancials => {
                                const project = projects.find(p => p.id === projectFinancials.projectId);
                                if (!project) return null;
                                const progressPercent = projectFinancials.net > 0 
                                    ? Math.round((projectFinancials.paid / projectFinancials.net) * 100) 
                                    : 0;
                                const projectStatus = getProjectStatus(projectFinancials);
                                
                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/project/${project.id}`)}
                                        className={`flex items-center gap-3 p-3 rounded-xl bg-base-card border cursor-pointer transition-all group ${
                                            projectStatus.status === 'overdue' 
                                                ? 'border-semantic-red/30 hover:border-semantic-red/50' 
                                                : 'border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <Avatar name={project.clientName} className="w-8 h-8 rounded-lg text-xs" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-white text-sm truncate group-hover:text-brand transition-colors">
                                                    {project.clientName}
                                                </h4>
                                                {projectStatus.status !== 'active' && (
                                                    <span className={`text-[10px] font-bold ${projectStatus.color}`}>
                                                        {projectStatus.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${projectStatus.status === 'overdue' ? 'bg-semantic-red' : 'bg-brand'}`}
                                                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-ink-gray">{progressPercent}%</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-white">
                                            <CurrencyDisplay amount={projectFinancials.remaining} currency={project.currency} />
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center bg-base-card border border-white/5 rounded-xl">
                                <p className="text-sm text-ink-gray mb-3">Nenhum projeto ativo</p>
                                <Button variant="primary" size="sm" onClick={() => navigate('/add')}>
                                    <Plus size={14} /> Criar projeto
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showQuickPay && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Registrar Recebimento</h3>
                            <button 
                                onClick={() => setShowQuickPay(false)} 
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                            >
                                <X size={16} className="text-ink-gray" />
                            </button>
                        </div>
                        <form onSubmit={handleQuickPaySubmit} className="space-y-4">
                            <Select
                                label="Projeto"
                                value={quickPayProjectId}
                                onChange={(e) => setQuickPayProjectId(e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {activeProjectsList.map(p => (
                                    <option key={p.id} value={p.id}>{p.clientName}</option>
                                ))}
                            </Select>
                            <Input
                                label="Valor Recebido"
                                type="number"
                                step="0.01"
                                value={quickPayAmount}
                                onChange={(e) => setQuickPayAmount(e.target.value)}
                                placeholder="0,00"
                                required
                            />
                            <Input
                                label="Data"
                                type="date"
                                value={quickPayDate}
                                onChange={(e) => setQuickPayDate(e.target.value)}
                            />
                            <Button type="submit" variant="primary" className="w-full">
                                <CheckCircle2 size={16} /> Confirmar Recebimento
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
