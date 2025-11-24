import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CurrencyDisplay, Badge, Avatar, Button, EmptyState, Card, PageHeader } from '../components/ui';
import { ProjectStatus, ProjectContractType } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Repeat, TrendingUp, Circle, CheckCircle2 } from 'lucide-react';

const Projects: React.FC = () => {
    const { projects, getProjectTotal } = useData();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

    const filteredProjects = projects.filter(p => statusFilter === 'ALL' ? true : p.status === statusFilter);

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

            {/* Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {(['ALL', ProjectStatus.ACTIVE, ProjectStatus.ONGOING, ProjectStatus.COMPLETED, ProjectStatus.PAID] as const).map((status) => (
                    <Button
                        key={status}
                        variant="ghost"
                        onClick={() => setStatusFilter(status)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border h-auto
                ${statusFilter === status
                                ? 'bg-white text-black border-white shadow-glow'
                                : 'bg-base-card border-base-border text-ink-gray hover:text-white hover:border-white/30'}
                `}
                    >
                        {status === 'ALL' ? 'Todos' : status}
                    </Button>
                ))}
            </div>

            {projects.length === 0 ? (
                <EmptyState title="Portfólio Vazio" description="Adicione seu primeiro projeto." action={<Button onClick={() => navigate('/add')}>Criar</Button>} />
            ) : (
                <div className="space-y-3">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(p => {
                            const total = getProjectTotal(p);
                            const isRetainer = p.contractType === ProjectContractType.RETAINER || p.contractType === ProjectContractType.RECURRING_FIXED;
                            let progressPercent = 0;
                            if (isRetainer) {
                                const now = new Date();
                                progressPercent = (now.getDate() / 30) * 100;
                            } else if (total.net > 0) {
                                progressPercent = (total.paid / total.net) * 100;
                            }

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/project/${p.id}`)}
                                    className="group relative flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl bg-base-card border border-white/5 hover:border-brand/30 cursor-pointer transition-all hover:bg-base-hover"
                                >
                                    {/* Left: Identity */}
                                    <div className="flex items-center gap-4 md:w-1/3">
                                        <Avatar name={p.clientName} className="w-12 h-12 rounded-xl" />
                                        <div>
                                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                {p.clientName}
                                                {isRetainer && <Repeat size={14} className="text-brand" />}
                                            </h3>
                                            <p className="text-xs text-ink-gray font-bold uppercase tracking-wider">{p.category}</p>
                                        </div>
                                    </div>

                                    {/* Middle: Stats */}
                                    <div className="flex items-center gap-6 md:w-1/3">
                                        <Badge status={p.status} />
                                        <div className="flex-1 hidden md:block">
                                            <div className="flex justify-between text-xs md:text-[10px] uppercase font-bold text-ink-dim mb-1">
                                                <span>Progresso</span>
                                                <span>{Math.round(progressPercent)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand shadow-[0_0_10px_#C6FF3F]" style={{ width: `${progressPercent}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Value */}
                                    <div className="md:w-1/3 text-right">
                                        <p className="text-xs md:text-[10px] font-bold text-ink-dim uppercase mb-0.5">{isRetainer ? 'MRR' : 'Valor Total'}</p>
                                        <p className="text-2xl font-black text-white tracking-tight"><CurrencyDisplay amount={total.net} currency={p.currency} /></p>
                                    </div>

                                    {/* Hover Glow */}
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
