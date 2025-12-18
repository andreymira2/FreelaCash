import React from 'react';
import { Inbox, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    action?: React.ReactNode;
    tip?: string;
    icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, tip, icon }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-white/10 rounded-2xl bg-base-card/30">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-ink-dim mb-5">
            {icon || <Inbox size={28} strokeWidth={1.5} />}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-ink-gray max-w-sm mb-6 leading-relaxed text-sm">{description}</p>
        {tip && (
            <div className="flex items-start gap-2 bg-brand/5 border border-brand/10 rounded-xl px-4 py-3 mb-6 max-w-sm text-left">
                <Lightbulb size={16} className="text-brand shrink-0 mt-0.5" />
                <p className="text-xs text-ink-gray leading-relaxed">{tip}</p>
            </div>
        )}
        {action}
    </div>
);
