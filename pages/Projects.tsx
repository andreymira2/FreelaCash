import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { CurrencyDisplay, Badge, Avatar, Button, EmptyState, PageHeader } from '../components/ui';
import { ProjectStatus, ProjectContractType, PaymentStatus, Project, Payment, CURRENCY_SYMBOLS } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Repeat, Check, MessageCircle } from 'lucide-react';
import { useAllProjectFinancials } from '../hooks/useFinancialEngine';

const Projects: React.FC = () => {
    const { projects, updatePayment, userProfile } = useData();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

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

    const filteredProjects = useMemo(() => 
        projects.filter(p => statusFilter === 'ALL' ? true : p.status === statusFilter)
    , [projects, statusFilter]);

    const handleQuickPay = useCallback((e: React.MouseEvent, projectId: string, payment: Payment) => {
        e.stopPropagation();
        updatePayment(projectId, { ...payment, status: PaymentStatus.PAID, date: new Date().toISOString() });
    }, [updatePayment]);

    const handleWhatsApp = useCallback((e: React.MouseEvent, p: Project, remaining: number, gross: number, paid: number) => {
        e.stopPropagation();
        if (!userProfile.pixKey || remaining <= 0) return;
        const symbol = CURRENCY_SYMBOLS[p.currency] || p.currency;
        const text = `Olá ${p.clientName}, tudo bem? 👋\n\nSegue o resumo do projeto *${p.category}*:\n\nValor Total: ${symbol}${gross.toFixed(2)}\nJá Pago: ${symbol}${paid.toFixed(2)}\n*Valor Pendente: ${symbol}${remaining.toFixed(2)}*\n\nPara regularizar, segue minha chave PIX:\n🔑 *${userProfile.pixKey}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }, [userProfile.pixKey]);

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

                                    {(nextScheduledPayment || (total.remaining > 0 && userProfile.pixKey)) && p.status !== ProjectStatus.PAID && (
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
                                            {total.remaining > 0 && userProfile.pixKey && (
                                                <button
                                                    onClick={(e) => handleWhatsApp(e, p, total.remaining, total.gross, total.paid)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-semantic-green/10 text-semantic-green hover:bg-semantic-green/20 transition-all"
                                                >
                                                    <MessageCircle size={14} />
                                                    Cobrar
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
        </div>
    );
};

export default Projects;
