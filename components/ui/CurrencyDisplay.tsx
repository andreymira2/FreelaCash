import React from 'react';
import { Currency, CURRENCY_SYMBOLS } from '../../types';

export const CurrencyDisplay: React.FC<{ amount: number; currency: Currency; className?: string; showSymbol?: boolean }> = ({ amount, currency, className = '', showSymbol = true }) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    return (
        <span className={`font-mono tracking-tight ${className}`}>
            {showSymbol && <span className="opacity-60 mr-1 text-[0.8em]">{symbol}</span>}
            {formatted}
        </span>
    );
};
