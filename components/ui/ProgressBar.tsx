import React from 'react';

export const ProgressBar: React.FC<{ current: number; total: number; className?: string; colorClass?: string }> = ({ current, total, className = '', colorClass = 'bg-brand' }) => {
    const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
    return (
        <div className={`w-full bg-base-border rounded-full h-1.5 overflow-hidden ${className}`}>
            <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${colorClass}`}
                style={{ width: `${percent}%` }}
            ></div>
        </div>
    );
};
