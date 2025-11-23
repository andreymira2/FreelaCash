import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; noPadding?: boolean }> = ({ children, className = '', onClick, noPadding = false }) => (
    <div
        onClick={onClick}
        className={`bg-base-card border border-base-border rounded-[24px] relative overflow-hidden transition-all duration-300 ${noPadding ? 'p-0' : 'p-6'} ${onClick ? 'cursor-pointer hover:border-white/10 hover:bg-base-hover hover:shadow-card hover:-translate-y-1' : 'shadow-card'} ${className}`}
    >
        {children}
    </div>
);
