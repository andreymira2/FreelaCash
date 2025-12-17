import React from 'react';
import { ChevronRight } from 'lucide-react';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, className = '', ...props }) => (
    <div className="flex flex-col gap-2 mb-4 group">
        <label className="text-xs font-semibold text-ink-gray ml-1 group-focus-within:text-brand transition-colors">{label}</label>
        <div className="relative">
            <select className={`w-full px-4 py-3 md:py-4 rounded-xl min-h-[44px] border border-base-border bg-base-card text-white font-medium focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all appearance-none cursor-pointer ${className}`} {...props}>
                {children}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-gray rotate-90 pointer-events-none" size={18} />
        </div>
    </div>
);
