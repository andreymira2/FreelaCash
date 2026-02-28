import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectCardModel } from '../engine/types';
import { CurrencyDisplay, Badge, Avatar } from './ui';
import { Repeat, Copy, Check, Send, Archive } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PaymentStatus, ProjectStatus } from '../types';

interface ProjectCardProps {
    project: ProjectCardModel;
    onQuickPay: (projectId: string, payment: any) => void;
    onBilling: (project: ProjectCardModel) => void;
    onArchive: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onQuickPay, onBilling, onArchive }) => {
    const navigate = useNavigate();
    const { moneySummary } = project;
    const hasOverdue = moneySummary.isOverdue;
    const isRetainer = project.category?.toLowerCase().includes('mensal') || false; // Quick heuristic for UI icon if contractType isn't in model

    const getNextAction = () => {
        if (hasOverdue) return { text: 'Cobrar pagamento atrasado', color: 'text-semantic-red' };
        if (moneySummary.remaining > 0 && moneySummary.nextPayment) {
            const days = Math.ceil((new Date(moneySummary.nextPayment.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (days <= 0) return { text: 'Confirmar pagamento de hoje', color: 'text-semantic-yellow' };
            if (days <= 3) return { text: `Pagamento em ${days} dia${days > 1 ? 's' : ''}`, color: 'text-semantic-yellow' };
            return { text: `Próximo: ${new Date(moneySummary.nextPayment.date).toLocaleDateString()}`, color: 'text-ink-gray' };
        }
        if (moneySummary.remaining > 0) return { text: 'Agendar ou cobrar', color: 'text-semantic-yellow' };
        if (project.status === ProjectStatus.ACTIVE) return { text: 'Projeto em andamento', color: 'text-brand' };
        if (project.status === ProjectStatus.COMPLETED && moneySummary.remaining > 0) return { text: 'Aguardando pagamento final', color: 'text-semantic-yellow' };
        return null;
    };
    const nextAction = getNextAction();

    let progressPercent = 0;
    if (moneySummary.gross > 0) {
        progressPercent = (moneySummary.paid / moneySummary.gross) * 100;
    }

    return (
        <div
            onClick={() => navigate(`/project/${project.id}`)}
            className={`group relative flex flex-col gap-4 p-5 rounded-2xl bg-base-card border cursor-pointer transition-all hover:bg-base-hover ${hasOverdue ? 'border-semantic-red/50 hover:border-semantic-red' : 'border-white/5 hover:border-brand/30'}`}
        >
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate('/add', { state: { duplicateFromId: project.id } }); }}
                    className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-ink-gray hover:text-white hover:bg-white/10 transition-colors"
                    title="Duplicar Projeto"
                >
                    <Copy size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onArchive(project.id); }}
                    className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-ink-gray hover:text-semantic-red hover:bg-white/10 transition-colors"
                    title="Arquivar/Ocultar"
                >
                    <Archive size={14} />
                </button>
                {hasOverdue && (
                    <div className="w-3 h-3 rounded-full bg-semantic-red animate-pulse" title="Pagamento atrasado" />
                )}
            </div>

            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar name={project.clientName} className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="min-w-0">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2 truncate">
                            {project.clientName}
                            {isRetainer && <Repeat size={14} className="text-brand shrink-0" />}
                        </h3>
                        <p className="text-xs text-ink-dim font-medium truncate">{project.title}</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-ink-dim mb-0.5">{isRetainer ? 'MRR' : 'Total'}</p>
                    <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        <CurrencyDisplay amount={moneySummary.gross} currency={moneySummary.currency} />
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Badge status={project.status} />
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

            {(moneySummary.nextPayment || moneySummary.remaining > 0) && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    {moneySummary.nextPayment && moneySummary.nextPayment.date && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?panel=payment`); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${hasOverdue ? 'bg-semantic-red/20 text-semantic-red hover:bg-semantic-red/30' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
                        >
                            <Check size={14} />
                            Registrar Pgto
                        </button>
                    )}
                    {moneySummary.remaining > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onBilling(project); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-brand/10 text-brand hover:bg-brand/20 transition-all"
                        >
                            <Send size={14} />
                            Cobrar <CurrencyDisplay amount={moneySummary.remaining} currency={moneySummary.currency} />
                        </button>
                    )}
                </div>
            )}

            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
        </div>
    );
};
