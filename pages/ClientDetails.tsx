import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PageHeader, Card, Avatar, CurrencyDisplay, Badge, Button, EmptyState } from '../components/ui';
import { useAllProjectFinancials } from '../hooks/useFinancialEngine';
import { ArrowLeft, Plus, MessageCircle, DollarSign, Briefcase, TrendingUp, Calendar, Repeat } from 'lucide-react';
import { ProjectStatus, ProjectContractType, PaymentStatus, CURRENCY_SYMBOLS } from '../types';

const ClientDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { clients, projects, settings, userProfile } = useData();
    
    const client = clients.find(c => c.id === id);
    const clientProjects = useMemo(() => projects.filter(p => p.clientId === id), [projects, id]);
    const projectFinancials = useAllProjectFinancials();
    
    const financialsMap = useMemo(() => {
        const map: Record<string, typeof projectFinancials[0]> = {};
        projectFinancials.forEach(pf => { map[pf.projectId] = pf; });
        return map;
    }, [projectFinancials]);

    const stats = useMemo(() => {
        let totalEarned = 0;
        let totalPending = 0;
        let mrr = 0;
        let projectCount = clientProjects.length;
        let activeCount = 0;

        clientProjects.forEach(p => {
            const pf = financialsMap[p.id];
            if (!pf) return;
            
            totalEarned += pf.paid;
            totalPending += pf.remaining;
            
            const isRetainer = p.contractType === ProjectContractType.RETAINER || 
                               p.contractType === ProjectContractType.RECURRING_FIXED;
            if (isRetainer && (p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING)) {
                mrr += pf.net;
                activeCount++;
            } else if (p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.ONGOING) {
                activeCount++;
            }
        });

        return { totalEarned, totalPending, mrr, projectCount, activeCount };
    }, [clientProjects, financialsMap]);

    const relationshipDuration = useMemo(() => {
        if (!client?.firstProjectDate) return null;
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
    }, [client]);

    const handleWhatsAppBilling = () => {
        if (!client || !userProfile.pixKey || stats.totalPending <= 0) return;
        const symbol = CURRENCY_SYMBOLS[settings.mainCurrency] || 'R$';
        const message = `Olá ${client.name}! Passando para lembrar sobre o pagamento pendente de ${symbol}${stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nChave PIX: ${userProfile.pixKey}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!client) {
        return (
            <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 pb-24">
                <EmptyState title="Cliente não encontrado" description="Este cliente não existe ou foi removido." action={<Button variant="primary" onClick={() => navigate('/projects')}>Voltar</Button>} />
            </div>
        );
    }

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
                    {stats.totalPending > 0 && userProfile.pixKey && (
                        <Button variant="primary" onClick={handleWhatsAppBilling} className="h-12 px-6 bg-[#25D366] hover:bg-[#128C7E]">
                            <MessageCircle size={20} /> Cobrar
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
                        <span className="text-xs text-ink-gray font-medium">Total Recebido</span>
                    </div>
                    <p className="text-xl font-bold text-brand">
                        <CurrencyDisplay amount={stats.totalEarned} currency={settings.mainCurrency} />
                    </p>
                </div>
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-semantic-yellow" />
                        <span className="text-xs text-ink-gray font-medium">A Receber</span>
                    </div>
                    <p className="text-xl font-bold text-semantic-yellow">
                        <CurrencyDisplay amount={stats.totalPending} currency={settings.mainCurrency} />
                    </p>
                </div>
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Repeat size={16} className="text-brand" />
                        <span className="text-xs text-ink-gray font-medium">MRR</span>
                    </div>
                    <p className="text-xl font-bold text-brand">
                        <CurrencyDisplay amount={stats.mrr} currency={settings.mainCurrency} />
                    </p>
                </div>
                <div className="bg-base-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={16} className="text-ink-gray" />
                        <span className="text-xs text-ink-gray font-medium">Projetos</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.projectCount} <span className="text-ink-gray text-sm font-normal">({stats.activeCount} ativos)</span></p>
                </div>
            </div>

            {/* Projects List */}
            <Card>
                <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-brand" /> Projetos
                </h2>
                {clientProjects.length > 0 ? (
                    <div className="space-y-3">
                        {clientProjects.map(p => {
                            const pf = financialsMap[p.id];
                            const isRetainer = p.contractType === ProjectContractType.RETAINER || p.contractType === ProjectContractType.RECURRING_FIXED;
                            return (
                                <div key={p.id} onClick={() => navigate(`/project/${p.id}`)} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brand/30 cursor-pointer transition-all">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                            {isRetainer ? <Repeat size={18} className="text-brand" /> : <Briefcase size={18} className="text-ink-gray" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{p.category}</p>
                                            <div className="flex items-center gap-2 text-xs text-ink-gray">
                                                <Badge status={p.status} />
                                                {p.startDate && <span>Início: {new Date(p.startDate).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-white">
                                            <CurrencyDisplay amount={pf?.net || 0} currency={p.currency} />
                                        </p>
                                        {pf && pf.remaining > 0 && (
                                            <p className="text-xs text-semantic-yellow">
                                                Pendente: <CurrencyDisplay amount={pf.remaining} currency={p.currency} />
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-ink-dim text-sm border border-dashed border-white/10 rounded-xl">
                        Nenhum projeto com este cliente ainda.
                    </div>
                )}
            </Card>

            {/* Payment History */}
            <Card>
                <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-brand" /> Histórico de Pagamentos
                </h2>
                {(() => {
                    const allPayments = clientProjects.flatMap(p => 
                        (p.payments || []).map(pay => ({ ...pay, projectId: p.id, projectName: p.category, currency: p.currency }))
                    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    if (allPayments.length === 0) {
                        return (
                            <div className="text-center py-8 text-ink-dim text-sm border border-dashed border-white/10 rounded-xl">
                                Nenhum pagamento registrado.
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-2">
                            {allPayments.slice(0, 10).map(pay => {
                                const isPaid = pay.status === PaymentStatus.PAID || !pay.status;
                                return (
                                    <div key={pay.id} className={`flex items-center justify-between p-3 rounded-lg ${isPaid ? 'bg-white/5' : 'bg-semantic-yellow/10'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPaid ? 'bg-brand/10 text-brand' : 'bg-semantic-yellow/10 text-semantic-yellow'}`}>
                                                <DollarSign size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    <CurrencyDisplay amount={pay.amount} currency={pay.currency} />
                                                </p>
                                                <p className="text-xs text-ink-gray">{pay.projectName} • {new Date(pay.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${isPaid ? 'bg-brand/10 text-brand' : 'bg-semantic-yellow/10 text-semantic-yellow'}`}>
                                            {isPaid ? 'Recebido' : 'Agendado'}
                                        </span>
                                    </div>
                                );
                            })}
                            {allPayments.length > 10 && (
                                <p className="text-center text-xs text-ink-gray pt-2">Mostrando últimos 10 de {allPayments.length} pagamentos</p>
                            )}
                        </div>
                    );
                })()}
            </Card>
        </div>
    );
};

export default ClientDetails;
