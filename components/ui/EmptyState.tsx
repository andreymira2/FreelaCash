import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({ title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-base-border rounded-[2.5rem] bg-base-card/30">
        <div className="w-20 h-20 bg-base-border rounded-full flex items-center justify-center text-ink-dim mb-6 shadow-inner">
            <Inbox size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-ink-gray max-w-xs mb-8 leading-relaxed text-sm">{description}</p>
        {action}
    </div>
);
