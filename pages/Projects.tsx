import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { CurrencyDisplay, Badge, Avatar, Button, EmptyState, PageHeader, Card } from '../components/ui';
import BillingModal from '../components/BillingModal';
import { ProjectStatus, ProjectContractType, PaymentStatus, Project, Payment, CURRENCY_SYMBOLS, Currency } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Repeat, Check, Send, Search, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { useAllProjectFinancials } from '../hooks/useFinancialEngine';

const Projects: React.FC = () => {
    const { projects, updatePayment, userProfile, settings } = useData();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    const [billingProject, setBillingProject] = useState<{ project: Project; totals: { gross: number; paid: number; remaining: number } } | null>(null);

    const projectFinancials = useAllProjectFinancials();
    const financialsMap = useMemo(() => {
        const map: Record<string, typeof projectFinancials[0]> = {};
        projectFinancials.forEach(pf => { map[pf.projectId] = pf; });
        return map;
    }, [projectFinancials]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: projects.length };
        projects.forEach(p => {
            counts[p.status] = (counts[p.status] || 0) + 1;
        });
        return counts;
    }, [projects]);

    const totals = useMemo(() => {
        let pending = 0;
        let mrr = 0;
        let overdueCount = 0;
        
        projectFinancials.forEach(pf => {
            const project = projects.find(p => p.id === pf.projectId);
            if (!project) return;
            
            pending += pf.remaining;
            
            const isRetainer = project.contractType === ProjectContractType.RETAINER || 
                               project.contractType === ProjectContractType.RECURRING_FIXED;
            if (isRetainer && (project.status === ProjectStatus.ACTIVE || project.status === ProjectStatus.ONGOING)) {
                mrr += pf.net;
            }
            
            if (pf.isOverdue) overdueCount++;
        });
        
        return { pending, mrr, overdueCount };
    }, [projectFinancials, projects]);

    const filteredProjects = useMemo(() => {
        let result = projects;
        
        if (statusFilter !== 'ALL') {
            result = result.filter(p => p.status === statusFilter);
        }
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.clientName.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }
        
        if (showOnlyPending) {
            result = result.filter(p => {
                const pf = financialsMap[p.id];
                return pf && (pf.remaining > 0 || pf.isOverdue);
            });
        }
        
        result = [...result].sort((a, b) => {
            const aFinancials = financialsMap[a.id];
            const bFinancials = financialsMap[b.id];
            if (aFinancials?.isOverdue && !bFinancials?.isOverdue) return -1;
            if (!aFinancials?.isOverdue && bFinancials?.isOverdue) return 1;
            return b.createdAt - a.createdAt;
        });
        
        return result;
    }, [projects, statusFilter, searchQuery, showOnlyPending, financialsMap]);

    const handleQuickPay = useCallback((e: React.MouseEvent, projectId: string, payment: Payment) => {
        e.stopPropagation();
        updatePayment(projectId, { ...payment, status: PaymentStatus.PAID, date: new Date().toISOString() });
    }, [updatePayment]);

    const handleOpenBilling = useCallback((e: React.MouseEvent, p: Project, totals: { gross: number; paid: number; remaining: number }) => {
        e.stopPropagation();
        if (totals.remaining <= 0) return;
        setBillingProject({ project: p, totals });
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-24 animate-in fade-in">
            <PageHeader
                title="Portfólio"
                subtitle="Gerencie seus contratos e ativos."
                action={
                    <Button variant="primary" onClick={() => navigate('/add')} className="h-12 px-6 rounded-full">
                        <Plus size={20} /> Novo Projeto
                    </Button>
                }
            />

            {/* Summary Card */}
            {projects.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-semantic-yellow" />
                            <span className="text-xs text-ink-gray font-medium">A Receber</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                            <CurrencyDisplay amount={totals.pending} currency={settings.mainCurrency} />
                        </p>
                    </div>
                    <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-brand" />
                            <span className="text-xs text-ink-gray font-medium">MRR</span>
                        </div>
                        <p className="text-xl font-bold text-brand">
                            <CurrencyDisplay amount={totals.mrr} currency={settings.mainCurrency} />
                        </p>
                    </div>
                    <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Repeat size={16} className="text-ink-gray" />
                            <span className="text-xs text-ink-gray font-medium">Projetos</span>
                        </div>
                        <p className="text-xl font-bold text-white">{projects.length}</p>
                    </div>
                    {totals.overdueCount > 0 && (
                        <div className="bg-semantic-red/10 rounded-2xl p-4 border border-semantic-red/30">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} className="text-semantic-red" />
                                <span className="text-xs text-semantic-red font-medium">Atrasados</span>
                            </div>
                            <p className="text-xl font-bold text-semantic-red">{totals.overdueCount}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-gray" />
                    <input
                        type="text"
                        placeholder="Buscar cliente ou projeto..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-base-card border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-ink-gray outline-none focus:border-brand/50 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowOnlyPending(!showOnlyPending)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${
                        showOnlyPending 
                            ? 'bg-semantic-yellow/10 border-semantic-yellow/30 text-semantic-yellow' 
                            : 'bg-base-card border-white/5 text-ink-gray hover:text-white'
                    }`}
                >
                    <AlertTriangle size={14} className="inline-block mr-2" />
                    Com Pendência
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {(['ALL', ProjectStatus.ACTIVE, ProjectStatus.ONGOING, ProjectStatus.COMPLETED, ProjectStatus.PAID] as const).map((status) => {
                    const getLabel = (s: typeof status) => {
                        switch (s) {
                            case 'ALL': return 'Todos';
                            case ProjectStatus.ACTIVE: return 'Em Andamento';
                            case ProjectStatus.ONGOING: return 'Recorrente';
                            case ProjectStatus.COMPLETED: return 'Entregue';
                            case ProjectStatus.PAID: return 'Finalizado';
                            default: return s;
                        }
                    };
                    const count = statusCounts[status] || 0;
                    return (
                        <Button
                            key={status}
                            variant="ghost"
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border min-h-[40px] flex items-center gap-2
                    ${statusFilter === status
                                    ? 'bg-white text-black border-white'
                                    : 'bg-base-card border-base-border text-ink-gray hover:text-white hover:border-white/30'}
                    `}
                        >
                            {getLabel(status)}
                            {count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === status ? 'bg-black/20' : 'bg-white/10'}`}>
                                    {count}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>

            {projects.length === 0 ? (
                <EmptyState 
                    title="Seu Portfólio está Vazio" 
                    description="Comece registrando um projeto para acompanhar seus ganhos e clientes." 
                    tip="Dica: Registre seu último freela para ver o poder do FreelaCash em ação!"
                    action={<Button variant="primary" onClick={() => navigate('/add')} className="px-6">Criar Primeiro Projeto</Button>} 
                />
            ) : (
                <div className="space-y-3">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(p => {
                            const total = financialsMap[p.id];
                            if (!total) return null;
                            
                            const isRetainer = p.contractType === ProjectContractType.RETAINER || p.contractType === ProjectContractType.RECURRING_FIXED;
                            const hasOverdue = total.isOverdue;
                            const nextScheduledPayment = (p.payments || [])
                                .filter(pay => pay.status === PaymentStatus.SCHEDULED)
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                            
                            const getNextAction = () => {
                                if (hasOverdue) return { text: 'Cobrar pagamento atrasado', color: 'text-semantic-red' };
                                if (total.remaining > 0 && nextScheduledPayment) {
                                    const days = Math.ceil((new Date(nextScheduledPayment.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    if (days <= 0) return { text: 'Confirmar pagamento de hoje', color: 'text-semantic-yellow' };
                                    if (days <= 3) return { text: `Pagamento em ${days} dia${days > 1 ? 's' : ''}`, color: 'text-semantic-yellow' };
                                    return { text: `Próximo: ${new Date(nextScheduledPayment.date).toLocaleDateString()}`, color: 'text-ink-gray' };
                                }
                                if (total.remaining > 0) return { text: 'Agendar ou cobrar', color: 'text-semantic-yellow' };
                                if (p.status === ProjectStatus.ACTIVE) return { text: 'Projeto em andamento', color: 'text-brand' };
                                if (p.status === ProjectStatus.COMPLETED && total.remaining > 0) return { text: 'Aguardando pagamento final', color: 'text-semantic-yellow' };
                                return null;
                            };
                            const nextAction = getNextAction();
                            
                            let progressPercent = 0;
                            if (isRetainer) {
                                progressPercent = (new Date().getDate() / 30) * 100;
                            } else if (total.net > 0) {
                                progressPercent = (total.paid / total.net) * 100;
                            }

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/project/${p.id}`)}
                                    className={`group relative flex flex-col gap-4 p-5 rounded-2xl bg-base-card border cursor-pointer transition-all hover:bg-base-hover ${hasOverdue ? 'border-semantic-red/50 hover:border-semantic-red' : 'border-white/5 hover:border-brand/30'}`}
                                >
                                    {hasOverdue && (
                                        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-semantic-red animate-pulse" title="Pagamento atrasado" />
                                    )}

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <Avatar name={p.clientName} className="w-12 h-12 rounded-xl shrink-0" />
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-white text-lg flex items-center gap-2 truncate">
                                                    {p.clientName}
                                                    {isRetainer && <Repeat size={14} className="text-brand shrink-0" />}
                                                </h3>
                                                <p className="text-xs text-ink-dim font-medium truncate">{p.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-medium text-ink-dim mb-0.5">{isRetainer ? 'MRR' : 'Total'}</p>
                                            <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                                <CurrencyDisplay amount={total.net} currency={p.currency} />
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Badge status={p.status} />
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs font-medium text-ink-dim mb-1">
                                                <span>{isRetainer ? 'Ciclo' : 'Pago'}</span>
                                                <span>{Math.round(progressPercent)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${hasOverdue ? 'bg-semantic-red' : 'bg-brand'}`} 
                                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {nextAction && (
                                        <p className={`text-xs font-medium ${nextAction.color}`}>
                                            → {nextAction.text}
                                        </p>
                                    )}

                                    {p.status !== ProjectStatus.PAID && (nextScheduledPayment || total.remaining > 0) && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            {nextScheduledPayment && (
                                                <button
                                                    onClick={(e) => handleQuickPay(e, p.id, nextScheduledPayment)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${hasOverdue ? 'bg-semantic-red/20 text-semantic-red hover:bg-semantic-red/30' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
                                                >
                                                    <Check size={14} />
                                                    Confirmar <CurrencyDisplay amount={nextScheduledPayment.amount} currency={p.currency} />
                                                </button>
                                            )}
                                            {total.remaining > 0 && (
                                                <button
                                                    onClick={(e) => handleOpenBilling(e, p, total)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-brand/10 text-brand hover:bg-brand/20 transition-all"
                                                >
                                                    <Send size={14} />
                                                    Cobrar <CurrencyDisplay amount={total.remaining} currency={p.currency} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 text-ink-dim">Nenhum projeto encontrado.</div>
                    )}
                </div>
            )}

            {/* Billing Modal */}
            {billingProject && (
                <BillingModal
                    isOpen={!!billingProject}
                    onClose={() => setBillingProject(null)}
                    clientName={billingProject.project.clientName}
                    projectCategory={billingProject.project.category}
                    currency={billingProject.project.currency}
                    grossAmount={billingProject.totals.gross}
                    paidAmount={billingProject.totals.paid}
                    remainingAmount={billingProject.totals.remaining}
                    pixKey={userProfile.pixKey}
                    userName={userProfile.name}
                    taxId={userProfile.taxId}
                />
            )}
        </div>
    );
};

export default Projects;
