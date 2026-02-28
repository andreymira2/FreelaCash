import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, Avatar, CurrencyDisplay, Badge, Button, EmptyState, PageHeader } from '../components/ui';
import BillingModal from '../components/BillingModal';
import { ProjectCard } from '../components/ProjectCard';
import { useClientDetailsModel } from '../hooks/useFinancialEngine';
import { ArrowLeft, Plus, Send, DollarSign, Briefcase, TrendingUp, Calendar, Repeat, AlertTriangle, FileText } from 'lucide-react';
import { ProjectStatus, PaymentStatus } from '../types';

const ClientDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { settings, userProfile } = useData();
    const model = useClientDetailsModel(id);

    const [showBillingModal, setShowBillingModal] = useState(false);

    if (!model) {
        return (
            <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 pb-24">
                <EmptyState title="Cliente não encontrado" description="Este cliente não existe ou foi removido." action={<Button variant="primary" onClick={() => navigate('/projects')}>Voltar</Button>} />
            </div>
        );
    }

    const { client, metrics, projects, summary12Months, receivables, contracts } = model;

    const relationshipDuration = (() => {
        if (!client.firstProjectDate) return null;
        const start = new Date(client.firstProjectDate);
        const now = new Date();
        const months = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (months < 1) return 'Novo cliente';
        if (months === 1) return '1 mês de relacionamento';
        if (months < 12) return `${months} meses de relacionamento`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) return `${years} ano${years > 1 ? 's' : ''} de relacionamento`;
        return `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} meses`;
    })();

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 animate-in fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ink-gray hover:text-white transition-colors text-sm font-medium">
                <ArrowLeft size={16} /> Voltar
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Avatar name={client.name} className="w-20 h-20 text-3xl shrink-0" />
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-white truncate">{client.name}</h1>
                    {client.companyName && <p className="text-ink-gray font-medium">{client.companyName}</p>}
                    {relationshipDuration && <p className="text-xs text-ink-dim mt-1">{relationshipDuration}</p>}
                </div>
                <div className="flex gap-3">
                    {receivables.length > 0 && (
                        <Button variant="primary" onClick={() => setShowBillingModal(true)} className="h-12 px-6">
                            <Send size={20} /> Cobrar
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => navigate('/add')} className="h-12 px-6">
                        <Plus size={20} /> Novo Projeto
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-brand" />
                        <span className="text-xs text-ink-gray font-medium">Faturamento Total</span>
                    </div>
                    <p className="text-xl font-bold text-brand">
                        <CurrencyDisplay amount={metrics.totalRevenueConverted} currency={settings.mainCurrency} />
                    </p>
                </div>
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-semantic-yellow" />
                        <span className="text-xs text-ink-gray font-medium">A Receber</span>
                    </div>
                    <p className="text-xl font-bold text-semantic-yellow">
                        <CurrencyDisplay
                            amount={receivables.reduce((acc, r) => acc + r.amountConverted, 0)}
                            currency={settings.mainCurrency}
                        />
                    </p>
                </div>
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-brand" />
                        <span className="text-xs text-ink-gray font-medium">Share de Receita</span>
                    </div>
                    <p className="text-xl font-bold text-brand">
                        {metrics.shareOfRevenue.toFixed(1)}%
                    </p>
                </div>
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={16} className="text-ink-gray" />
                        <span className="text-xs text-ink-gray font-medium">Projetos</span>
                    </div>
                    <p className="text-xl font-bold text-white">{projects.length} <span className="text-ink-gray text-sm font-normal">({projects.filter(p => [ProjectStatus.ACTIVE, ProjectStatus.ONGOING].includes(p.status)).length} ativos)</span></p>
                </div>
            </div>

            {/* Progressive Disclosure: Dependency Alert */}
            {metrics.hasHighDependency && (
                <div className="bg-semantic-yellow/10 border border-semantic-yellow/20 rounded-2xl p-5 flex items-start gap-4">
                    <div className="bg-semantic-yellow/20 p-2 rounded-lg text-semantic-yellow">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-semantic-yellow">Alerta de Dependência</h3>
                        <p className="text-sm text-ink-gray mt-1">Este cliente representa {metrics.shareOfRevenue.toFixed(1)}% do seu faturamento histórico. Considere diversificar sua carteira para mitigar riscos.</p>
                    </div>
                </div>
            )}

            {/* Progressive Disclosure: 12-Month Chart */}
            {metrics.hasHighDependency && (
                <Card>
                    <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-brand" /> Histórico 12 Meses
                    </h2>
                    <div className="h-[200px] w-full mt-4 flex items-end gap-2 pb-6">
                        {summary12Months.map((m, i) => {
                            const max = Math.max(...summary12Months.map(x => x.revenue), 1);
                            const height = (m.revenue / max) * 100;
                            return (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div
                                        className="w-full bg-brand/20 rounded-t-md group-hover:bg-brand transition-all duration-300 relative"
                                        style={{ height: `${height}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            <CurrencyDisplay amount={m.revenue} currency={settings.mainCurrency} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-ink-dim font-bold transform -rotate-45 md:rotate-0 mt-2">
                                        {m.month.split('-')[1]}/{m.month.split('-')[0].slice(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Contracts Section (Progressive Disclosure) */}
            {contracts && contracts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <Repeat size={20} className="text-blue-400" /> Contratos com este Cliente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contracts.map(contract => (
                            <div
                                key={contract.id}
                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                className="bg-base-card border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-all">
                                        <FileText size={20} />
                                    </div>
                                    <Badge status={contract.isActive ? ProjectStatus.ACTIVE : ProjectStatus.PAID} label={contract.isActive ? 'Ativo' : 'Inativo'} />
                                </div>
                                <h3 className="font-bold text-white mb-1">{contract.title}</h3>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-ink-dim space-y-1">
                                        <p>{contract.activeProjectsCount} projetos vinculados</p>
                                        <p>Início: {new Date(contract.startDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-ink-dim uppercase font-bold tracking-widest">Retenção</p>
                                        <p className="font-black text-white">
                                            <CurrencyDisplay amount={contract.retainerAmount} currency={contract.currency} />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects List with modular cards */}
            <div className="space-y-4">
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                    <Briefcase size={20} className="text-brand" /> Projetos sob este Cliente
                </h2>
                {projects.length > 0 ? (
                    <div className="space-y-4">
                        {projects.map(p => (
                            <ProjectCard
                                key={p.id}
                                project={p}
                                onArchive={() => { }} // Hooked later if needed, but keeping simple for now
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-base-card border border-dashed border-white/10 rounded-2xl">
                        <Briefcase size={40} className="mx-auto text-ink-dim mb-4 opacity-20" />
                        <p className="text-ink-dim italic">Nenhum projeto encontrado para este cliente.</p>
                    </div>
                )}
            </div>

            {/* Receivables Specific to this Client */}
            {receivables.length > 0 && (
                <Card>
                    <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-semantic-yellow" /> Recebíveis em Aberto
                    </h2>
                    <div className="space-y-3">
                        {receivables.map(r => (
                            <div key={r.id} className="p-4 rounded-xl bg-semantic-yellow/5 border border-semantic-yellow/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-semantic-yellow/10 flex items-center justify-center text-semantic-yellow">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{r.date.toLocaleDateString()}</p>
                                        <p className="text-xs text-ink-gray">Vencimento para o projeto {r.projectId.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-semantic-yellow text-lg">
                                        <CurrencyDisplay amount={r.amount} currency={r.currency} />
                                    </p>
                                    <div className="flex items-center gap-1 justify-end">
                                        {r.isOverdue && <Badge status={PaymentStatus.OVERDUE} label="Atrasado" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Billing Modal */}
            <BillingModal
                isOpen={showBillingModal}
                onClose={() => setShowBillingModal(false)}
                clientName={client.name}
                projectCategory="Todos os projetos"
                currency={settings.mainCurrency}
                grossAmount={metrics.totalRevenueConverted + receivables.reduce((acc, r) => acc + r.amountConverted, 0)}
                paidAmount={metrics.totalRevenueConverted}
                remainingAmount={receivables.reduce((acc, r) => acc + r.amountConverted, 0)}
                pixKey={userProfile.pixKey}
                userName={userProfile.name}
                taxId={userProfile.taxId}
                clientEmail={client.billingEmail}
            />
        </div>
    );
};

export default ClientDetails;
