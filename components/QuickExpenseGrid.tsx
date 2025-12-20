import React, { useState, useMemo } from 'react';
import { SERVICE_PRESETS, ServicePreset, EXPENSE_CATEGORIES } from '../types';
import { Search, Plus, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface QuickExpenseGridProps {
    onSelect: (preset: ServicePreset) => void;
    filterCategory?: string;
}

const CompanyLogo: React.FC<{ domain: string; name: string; size?: number }> = ({ domain, name, size = 40 }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        const initial = name.charAt(0).toUpperCase();
        return (
            <div 
                className="flex items-center justify-center bg-white/10 text-white font-bold rounded-xl"
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                {initial}
            </div>
        );
    }

    return (
        <img
            src={`https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`}
            alt={name}
            className="rounded-xl object-contain bg-white"
            style={{ width: size, height: size }}
            onError={() => setHasError(true)}
        />
    );
};

const IconMapper: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 16, className = '' }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent size={size} className={className} />;
};

const CATEGORY_TABS = [
    { id: 'all', label: 'Todos' },
    { id: 'Streaming / Lazer', label: 'Streaming' },
    { id: 'Software & Tools', label: 'Software' },
    { id: 'IA & Automação', label: 'IA' },
    { id: 'Assinaturas / Subs', label: 'Infra' },
    { id: 'Transporte', label: 'Transporte' },
    { id: 'Alimentação / Café', label: 'Food' },
];

const QuickExpenseGrid: React.FC<QuickExpenseGridProps> = ({ onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const filteredPresets = useMemo(() => {
        let result = SERVICE_PRESETS;

        if (activeTab !== 'all') {
            result = result.filter(p => p.defaultCategory === activeTab);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(lower) || 
                p.defaultCategory.toLowerCase().includes(lower) ||
                p.defaultTags.some(t => t.toLowerCase().includes(lower))
            );
        }

        return result;
    }, [searchTerm, activeTab]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
                <input
                    type="text"
                    placeholder="Buscar serviço..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-base-card border border-white/10 rounded-xl text-sm text-white focus:border-brand outline-none transition-all"
                    autoFocus
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORY_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                                ? 'bg-brand text-black' 
                                : 'bg-white/5 text-ink-gray hover:bg-white/10'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredPresets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => onSelect(preset)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-base-card border border-white/5 hover:border-brand hover:bg-brand/5 transition-all group"
                    >
                        <CompanyLogo domain={preset.domain} name={preset.name} size={48} />
                        <span className="text-xs font-medium text-ink-gray group-hover:text-white text-center line-clamp-2 leading-tight">
                            {preset.name}
                        </span>
                    </button>
                ))}

                {filteredPresets.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                        <HelpCircle size={32} className="mx-auto text-ink-dim mb-3" />
                        <p className="text-sm text-ink-gray">Nenhum serviço encontrado</p>
                        <p className="text-xs text-ink-dim mt-1">Tente outro termo ou adicione manualmente</p>
                    </div>
                )}
            </div>

            <div className="pt-3 border-t border-white/5">
                <button
                    onClick={() => onSelect({ 
                        id: 'custom', 
                        name: '', 
                        domain: '', 
                        defaultCategory: EXPENSE_CATEGORIES[0], 
                        defaultTags: [], 
                        isRecurring: true, 
                        iconName: 'Plus' 
                    })}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-ink-gray hover:text-white transition-all text-sm font-medium"
                >
                    <Plus size={18} />
                    Adicionar manualmente
                </button>
            </div>
        </div>
    );
};

export { QuickExpenseGrid, CompanyLogo };
