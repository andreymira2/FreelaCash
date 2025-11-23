import React from 'react';
import { Minus, TrendingUp, TrendingDown } from 'lucide-react';

export const TrendIndicator: React.FC<{ current: number; previous: number; inverse?: boolean }> = ({ current, previous, inverse = false }) => {
    if (previous === 0) return <span className="text-[10px] font-bold text-ink-dim uppercase bg-base-border px-2 py-1 rounded-full">--</span>;

    const percentChange = ((current - previous) / previous) * 100;
    const isPositive = percentChange > 0;
    const isNeutral = percentChange === 0;

    const isGood = inverse ? !isPositive : isPositive;

    let colorClass = isGood ? "text-brand" : "text-semantic-red";
    if (isNeutral) colorClass = "text-ink-gray";

    return (
        <div className={`inline-flex items-center gap-1`}>
            {isNeutral ? <Minus size={10} /> : isPositive ? <TrendingUp size={12} className={colorClass} /> : <TrendingDown size={12} className={colorClass} />}
            <span className={`text-xs font-bold ${colorClass}`}>{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
    );
};
