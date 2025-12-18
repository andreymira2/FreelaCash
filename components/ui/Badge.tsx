import React from 'react';
import { ProjectStatus } from '../../types';

export const Badge: React.FC<{ status: ProjectStatus; className?: string }> = ({ status, className = '' }) => {
    let styles = "";
    let label = "";
    let dotColor = "";

    switch (status) {
        case ProjectStatus.ACTIVE:
            styles = "bg-semantic-blue/10 text-semantic-blue border-semantic-blue/20";
            dotColor = "bg-semantic-blue";
            label = "Em Andamento";
            break;
        case ProjectStatus.COMPLETED:
            styles = "bg-semantic-yellow/10 text-semantic-yellow border-semantic-yellow/20";
            dotColor = "bg-semantic-yellow";
            label = "Entregue";
            break;
        case ProjectStatus.PAID:
            styles = "bg-brand/10 text-brand border-brand/20";
            dotColor = "bg-brand";
            label = "Finalizado";
            break;
        case ProjectStatus.ONGOING:
            styles = "bg-semantic-purple/10 text-semantic-purple border-semantic-purple/20";
            dotColor = "bg-semantic-purple";
            label = "Recorrente";
            break;
        default:
            return null;
    }

    return (
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border ${styles} ${className}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-[0_0_8px_currentColor]`}></div>
            {label}
        </span>
    );
};
