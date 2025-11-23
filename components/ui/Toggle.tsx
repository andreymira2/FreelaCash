import React from 'react';

export const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-3 group cursor-pointer">
        {label && <span className="text-xs font-bold text-ink-gray uppercase tracking-wider group-hover:text-white transition-colors">{label}</span>}
        <div className={`w-11 h-6 rounded-full transition-colors relative border ${checked ? 'bg-brand border-brand' : 'bg-base-border border-base-border'}`}>
            <div className={`w-4 h-4 rounded-full absolute top-0.5 bg-white shadow-sm transition-transform ${checked ? 'translate-x-5 bg-black' : 'translate-x-0.5'}`}></div>
        </div>
    </button>
);
