
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card, CurrencyDisplay, Button, Avatar, DateRangeSelect, EmptyState, TrendIndicator, Input, Select, Badge, PageHeader } from '../components/ui';
import { ProjectStatus, PaymentStatus, Currency, Payment } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, X, ArrowUpRight, ArrowDownLeft, Bell, Activity, RefreshCcw, Briefcase, Users, ArrowRight, Target, Zap, Clock, CheckCircle2, AlertTriangle, TrendingUp, Heart, Calendar } from 'lucide-react';
import { 
    useFinancialSnapshot, 
    useHealthScore, 
    useReceivables, 
    useExpenseReminders, 
    useRecentActivity, 
    useRecurringIncome,
    useActiveProjectFinancials
} from '../hooks/useFinancialEngine';
import { getDateRange } from '../engine/dateUtils';

const Dashboard: React.FC = () => {
    const { projects, settings, userProfile, dateRange, setDateRange, addPayment, updatePayment, toggleExpensePayment } = useData();
    const navigate = useNavigate();

    const [showQuickPay, setShowQuickPay] = useState(false);
    const [quickPayProjectId, setQuickPayProjectId] = useState('');
    const [quickPayAmount, setQuickPayAmount] = useState('');
    const [quickPayDate, setQuickPayDate] = useState(new Date().toISOString().split('T')[0]);

    const currentSnapshot = useFinancialSnapshot();
    const healthScore = useHealthScore();
    const receivables = useReceivables();
    const expenseReminders = useExpenseReminders(7);
    const recentActivity = useRecentActivity(15);
    const recurringIncome = useRecurringIncome();
    const activeProjectFinancials = useActiveProjectFinancials();

    const previousSnapshot = useMemo(() => {
        const prevRange = dateRange === 'THIS_MONTH' ? 'LAST_MONTH' : 
                         dateRange === 'LAST_MONTH' ? 'THIS_MONTH' : null;
        if (!prevRange) return null;
        return null;
    }, [dateRange]);

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

    const goalPercent = Math.round(currentSnapshot.goalProgress);

    const QuickActionButton = ({ icon: Icon, label, onClick, colorClass = "bg-white/5 hover:bg-white/10 text-white" }: any) => (
        <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-95 ${colorClass} w-full border border-white/5`}>
            <Icon size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="animate-in fade-in duration-700 pb-24 pt-8 md:pt-12 max-w-[1600px] mx-auto space-y-6 md:space-y-8 px-4 md:px-6">

            <PageHeader
                title={
                    <div className="flex items-center gap-4">
                        <Avatar
                            name={userProfile.name}
                            src={userProfile.avatar}
                            className="w-12 h-12 text-lg ring-2 ring-white/10 shadow-lg"
                        />
                        <div>
                            <h1 className="text-2xl font-black text-white">{timeGreeting}, {userProfile.name.split(' ')[0]}</h1>
                        </div>
                    </div>
                }
                subtitle=""
                action={
                    <div className="flex items-center gap-3">
                        <DateRangeSelect value={dateRange} onChange={setDateRange} />
                        <Button variant="primary" onClick={() => navigate('/add')} className="h-10 text-xs px-5 shadow-neon">
                            <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">Projeto</span>
                        </Button>
                    </div>
                }
            />

            <div className="flex lg:hidden gap-2 -mt-2">
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
                <button 
                    onClick={() => navigate('/add')} 
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-white font-bold text-sm active:scale-95 transition-all"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-black border-white/10 p-0 flex flex-col md:flex-row">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="p-8 flex-1 flex flex-col justify-center relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-brand" />
                            <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Meta Mensal</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            <CurrencyDisplay amount={currentSnapshot.income.total} currency={settings.mainCurrency} />
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

                    <div className="bg-black/40 border-t md:border-t-0 md:border-l border-white/5 p-6 md:w-64 flex flex-col justify-center gap-6 backdrop-blur-sm">
                        <div>
                            <p className="text-xs md:text-[10px] font-bold text-ink-dim uppercase mb-1">Despesas</p>
                            <p className="text-xl font-bold text-white"><CurrencyDisplay amount={currentSnapshot.expenses.total} currency={settings.mainCurrency} /></p>
                        </div>
                        <div>
                            <p className="text-xs md:text-[10px] font-bold text-ink-dim uppercase mb-1">Lucro Líquido</p>
                            <p className={`text-xl font-bold ${currentSnapshot.net >= 0 ? 'text-brand' : 'text-semantic-red'}`}>
                                <CurrencyDisplay amount={currentSnapshot.net} currency={settings.mainCurrency} />
                            </p>
                        </div>
                        <div>
                            <p className="text-xs md:text-[10px] font-bold text-ink-dim uppercase mb-1 flex items-center gap-1"><RefreshCcw size={10} /> Receita Recorrente</p>
                            <p className="text-lg font-bold text-semantic-purple"><CurrencyDisplay amount={recurringIncome} currency={settings.mainCurrency} /></p>
                        </div>
                        {(settings.taxReservePercent || 0) > 0 && (
                            <div>
                                <p className="text-xs md:text-[10px] font-bold text-ink-dim uppercase mb-1 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Reserva Imposto ({settings.taxReservePercent}%)
                                </p>
                                <p className="text-lg font-bold text-semantic-yellow">
                                    <CurrencyDisplay amount={currentSnapshot.taxReserve} currency={settings.mainCurrency} />
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <QuickActionButton icon={Briefcase} label="Novo Projeto" onClick={() => navigate('/add')} colorClass="bg-brand/10 hover:bg-brand/20 text-brand border-brand/20" />
                    <QuickActionButton icon={Wallet} label="Lançar Despesa" onClick={() => navigate('/expenses')} />
                    <QuickActionButton icon={Users} label="Clientes" onClick={() => navigate('/projects')} />
                    <QuickActionButton icon={Activity} label="Relatórios" onClick={() => navigate('/reports')} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-white/10 bg-gradient-to-br from-base-card to-black">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Heart size={18} className={healthScore.status === 'excellent' ? 'text-brand' : healthScore.status === 'warning' ? 'text-semantic-yellow' : 'text-semantic-red'} />
                            Saúde Financeira
                        </h3>
                        <span className={`text-2xl font-black ${healthScore.status === 'excellent' ? 'text-brand' : healthScore.status === 'warning' ? 'text-semantic-yellow' : 'text-semantic-red'}`}>
                            {healthScore.score}%
                        </span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                        <div 
                            className={`h-full transition-all duration-1000 ${healthScore.status === 'excellent' ? 'bg-brand' : healthScore.status === 'warning' ? 'bg-semantic-yellow' : 'bg-semantic-red'}`}
                            style={{ width: `${healthScore.score}%` }}
                        />
                    </div>
                    <p className="text-xs text-ink-gray">
                        {healthScore.status === 'excellent' 
                            ? 'Excelente! Suas finanças estão em ótimo estado.'
                            : healthScore.status === 'warning' 
                            ? 'Atenção: Há margem para melhorar seus resultados.'
                            : 'Alerta: Revise suas despesas e pagamentos pendentes.'}
                    </p>
                </Card>

                <Card className="border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-semantic-green" />
                            A Receber
                        </h3>
                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-ink-dim">{receivables.length}</span>
                    </div>
                    {receivables.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {receivables.slice(0, 4).map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => navigate(`/project/${item.projectId}`)}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${item.isOverdue ? 'bg-semantic-red/10 hover:bg-semantic-red/20' : 'bg-white/5 hover:bg-white/10'}`}
                                >
                                    <button
                                        onClick={(e) => handleMarkReceivablePaid(item.projectId, item.paymentId, e)}
                                        className="w-7 h-7 shrink-0 rounded-full bg-white/10 hover:bg-brand/20 flex items-center justify-center transition-colors group"
                                        title="Marcar como recebido"
                                    >
                                        <CheckCircle2 size={14} className="text-ink-gray group-hover:text-brand" />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{item.clientName}</p>
                                        <p className={`text-xs ${item.isOverdue ? 'text-semantic-red font-bold' : 'text-ink-gray'}`}>
                                            {item.isOverdue ? 'ATRASADO' : item.date.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="font-bold text-sm text-white"><CurrencyDisplay amount={item.amount} currency={item.currency} /></span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-ink-gray text-center py-4">Nenhum pagamento agendado.</p>
                    )}
                </Card>

                <Card className="border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Calendar size={18} className="text-semantic-yellow" />
                            Vencimentos
                        </h3>
                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-ink-dim">Próx. 7 dias</span>
                    </div>
                    {expenseReminders.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {expenseReminders.map((exp) => (
                                <div 
                                    key={exp.expenseId}
                                    onClick={() => navigate(`/expenses/${exp.expenseId}`)}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${exp.isPaid ? 'bg-brand/10 hover:bg-brand/20' : 'bg-white/5 hover:bg-white/10'}`}
                                >
                                    {!exp.isPaid ? (
                                        <button
                                            onClick={(e) => handleMarkExpensePaid(exp.expenseId, e)}
                                            className="w-7 h-7 shrink-0 rounded-full bg-white/10 hover:bg-brand/20 flex items-center justify-center transition-colors group"
                                            title="Marcar como pago"
                                        >
                                            <Clock size={14} className="text-semantic-yellow group-hover:text-brand" />
                                        </button>
                                    ) : (
                                        <div className="w-7 h-7 shrink-0 rounded-full bg-brand/20 flex items-center justify-center">
                                            <CheckCircle2 size={14} className="text-brand" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{exp.title}</p>
                                        <p className="text-xs text-ink-gray">Dia {exp.dueDate.getDate()}</p>
                                    </div>
                                    <span className={`font-bold text-sm ${exp.isPaid ? 'text-ink-dim line-through' : 'text-white'}`}>
                                        <CurrencyDisplay amount={exp.amount} currency={exp.currency} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-ink-gray text-center py-4">Nenhuma conta nos próximos dias.</p>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Activity size={18} className="text-brand" /> Atividade Recente
                        </h3>
                        <span className="text-xs md:text-[10px] font-bold bg-white/5 text-ink-gray px-2 py-1 rounded">Feed Unificado</span>
                    </div>

                    <div className="bg-base-card border border-white/5 rounded-3xl p-1">
                        {recentActivity.length > 0 ? (
                            <div className="space-y-1">
                                {recentActivity.map((group) => (
                                    <div key={group.label}>
                                        <div className="px-4 py-2 sticky top-0 bg-base-card/95 backdrop-blur-sm">
                                            <span className="text-[11px] font-bold text-ink-dim uppercase tracking-widest">{group.label}</span>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {group.items.map((item) => (
                                                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors rounded-2xl group">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'income' ? 'bg-brand/10 text-brand' : 'bg-semantic-red/10 text-semantic-red'}`}>
                                                        {item.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                                                            <span className="text-xs text-ink-dim whitespace-nowrap">{item.date.toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs text-ink-gray truncate">{item.subtitle}</p>
                                                    </div>
                                                    <div className={`text-sm font-bold ${item.type === 'income' ? 'text-brand' : 'text-white'}`}>
                                                        {item.type === 'expense' && '-'} <CurrencyDisplay amount={item.amount} currency={item.currency} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState 
                                title="Tudo Calmo por Aqui" 
                                description="Nenhuma atividade recente registrada." 
                                tip="Adicione um projeto ou registre uma despesa para começar a ver seu fluxo financeiro."
                            />
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Briefcase size={18} className="text-semantic-blue" /> Em Andamento
                        </h3>
                        <Button variant="ghost" onClick={() => navigate('/projects')} className="text-xs h-6 px-2">Ver Todos</Button>
                    </div>

                    <div className="space-y-3">
                        {activeProjects.length > 0 ? (
                            activeProjects.map(projectFinancials => {
                                const project = projects.find(p => p.id === projectFinancials.projectId);
                                if (!project) return null;
                                const progressPercent = projectFinancials.net > 0 ? (projectFinancials.paid / projectFinancials.net) * 100 : 0;
                                
                                return (
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
                                                    <div className="h-full bg-white/50 group-hover:bg-brand transition-colors" style={{ width: `${progressPercent}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-white text-xs"><CurrencyDisplay amount={projectFinancials.net} currency={projectFinancials.currency} /></p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.02]">
                                <Briefcase size={24} className="text-ink-dim mx-auto mb-3" />
                                <p className="text-sm font-medium text-white mb-1">Nenhum projeto ativo</p>
                                <p className="text-xs text-ink-gray mb-4">Comece adicionando seu primeiro projeto freelancer.</p>
                                <Button variant="primary" onClick={() => navigate('/add')} className="text-xs">
                                    <Plus size={14} /> Criar Projeto
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

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
