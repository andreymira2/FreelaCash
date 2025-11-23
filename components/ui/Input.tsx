import React from 'react';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className = '', ...props }) => (
    <div className="flex flex-col gap-2 mb-4 group">
        <label className="text-[10px] font-extrabold text-ink-gray uppercase tracking-widest ml-1 group-focus-within:text-brand transition-colors">{label}</label>
        <input className={`px-5 py-4 rounded-2xl border border-base-border bg-black/50 text-white font-bold focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all placeholder-ink-dim ${className}`} {...props} />
    </div>
);
