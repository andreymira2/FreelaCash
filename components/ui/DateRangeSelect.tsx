import React from 'react';
import { DateRange } from '../../types';
import { Calendar, ChevronRight } from 'lucide-react';

export const DateRangeSelect: React.FC<{ value: DateRange; onChange: (val: DateRange) => void }> = ({ value, onChange }) => (
    <div className="relative group">
        <div className="flex items-center gap-2 bg-base-card px-4 py-2.5 rounded-xl border border-base-border text-ink-gray cursor-pointer hover:border-brand hover:text-white transition-all shadow-sm min-h-[40px]">
            <Calendar size={14} className="text-brand" />
            <select
                className="bg-transparent outline-none font-semibold text-sm appearance-none cursor-pointer pr-4 text-current w-full"
                value={value}
                onChange={(e) => onChange(e.target.value as DateRange)}
            >
                <option className="bg-base-card text-white" value="THIS_MONTH">Este Mês</option>
                <option className="bg-base-card text-white" value="LAST_MONTH">Mês Passado</option>
                <option className="bg-base-card text-white" value="THIS_YEAR">Este Ano</option>
                <option className="bg-base-card text-white" value="ALL_TIME">Todo Período</option>
            </select>
            <ChevronRight size={14} className="rotate-90 absolute right-3 pointer-events-none opacity-50" />
        </div>
    </div>
);
