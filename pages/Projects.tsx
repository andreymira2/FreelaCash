import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { CurrencyDisplay, Badge, Avatar, Button, EmptyState, PageHeader, Card } from '../components/ui';
import BillingModal from '../components/BillingModal';
import { ProjectStatus, ProjectContractType, PaymentStatus, Project, Payment, CURRENCY_SYMBOLS, Currency } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Repeat, Check, Send, Search, AlertTriangle, DollarSign, TrendingUp, Copy } from 'lucide-react';
import { useAllProjectFinancials, useProjectListModel } from '../hooks/useFinancialEngine';
import { useDebounce } from '../hooks/useDebounce';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectCardModel } from '../engine/types';

const Projects: React.FC = () => {
    const { projects, updatePayment, userProfile, settings } = useData();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    const [billingProject, setBillingProject] = useState<{ project: Project; totals: { gross: number; paid: number; remaining: number } } | null>(null);
    const [groupByClient, setGroupByClient] = useState(false);

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

    // Extract the unified model from the engine
    const listModel = useProjectListModel({
        status: statusFilter,
        searchQuery: debouncedSearchQuery,
        showOnlyPending
    });

    React.useEffect(() => {
        if (listModel.suggestGroupByClient) {
            setGroupByClient(true);
        }
    }, [listModel.suggestGroupByClient]);

    const groupedProjects = useMemo(() => {
        if (!groupByClient) return null;
        const groups: Record<string, typeof listModel.projects> = {};
        listModel.projects.forEach(p => {
            if (!groups[p.clientName]) groups[p.clientName] = [];
            groups[p.clientName].push(p);
        });
        return groups;
    }, [listModel.projects, groupByClient]);

    const handleQuickPay = useCallback((projectId: string, payment: Payment) => {
        updatePayment(projectId, { ...payment, status: PaymentStatus.PAID, date: new Date().toISOString() });
    }, [updatePayment]);

    const handleOpenBilling = useCallback((p: ProjectCardModel) => {
        const fullProject = projects.find(pr => pr.id === p.id);
        if (!fullProject) return;
        setBillingProject({ project: fullProject, totals: p.moneySummary });
    }, [projects]);

    const handleArchive = useCallback((projectId: string) => {
        // Safe optimism: In a real flow, this invokes updateProject
        console.log("Archiving project:", projectId);
        // updateProject(projectId, { isArchived: true });
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

                <div className="flex items-center gap-2 px-4 border border-white/5 rounded-xl bg-base-card">
                    <label className="text-sm text-ink-gray font-medium cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="bg-base-background border-white/10 rounded accent-brand w-4 h-4 cursor-pointer"
                            checked={groupByClient}
                            onChange={(e) => setGroupByClient(e.target.checked)}
                        />
                        Agrupar por Cliente
                    </label>
                </div>
                <button
                    onClick={() => setShowOnlyPending(!showOnlyPending)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${showOnlyPending
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

            {listModel.projects.length === 0 ? (
                <EmptyState
                    title="Seu Portfólio está Vazio"
                    description="Comece registrando um projeto para acompanhar seus ganhos e clientes."
                    tip="Dica: Registre seu último freela para ver o poder do FreelaCash em ação!"
                    action={<Button variant="primary" onClick={() => navigate('/add')} className="px-6">Criar Primeiro Projeto</Button>}
                />
            ) : (
                <div className="space-y-6">
                    {groupByClient && groupedProjects ? (
                        Object.entries(groupedProjects as Record<string, ProjectCardModel[]>).map(([clientName, clientProjects]) => (
                            <div key={clientName} className="space-y-3">
                                <h3 className="text-lg font-bold text-white px-1 mt-4">{clientName} <span className="text-ink-dim text-sm font-normal ml-2">({clientProjects.length})</span></h3>
                                {clientProjects.map(p => (
                                    <ProjectCard
                                        key={p.id}
                                        project={p}
                                        onQuickPay={handleQuickPay}
                                        onBilling={handleOpenBilling}
                                        onArchive={handleArchive}
                                    />
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="space-y-3">
                            {listModel.projects.map(p => (
                                <ProjectCard
                                    key={p.id}
                                    project={p}
                                    onQuickPay={handleQuickPay}
                                    onBilling={handleOpenBilling}
                                    onArchive={handleArchive}
                                />
                            ))}
                        </div>
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
