import React from 'react';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className = '', ...props }) => (
    <div className="flex flex-col gap-2 mb-4 group">
        <label className="text-xs font-semibold text-ink-gray ml-1 group-focus-within:text-brand transition-colors">{label}</label>
        <input className={`px-4 md:px-5 py-3 md:py-4 rounded-xl min-h-[44px] border border-base-border bg-base-card text-base md:text-sm text-white font-medium focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all placeholder-ink-dim ${className}`} {...props} />
    </div>
);
