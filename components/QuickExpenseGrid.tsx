import React, { useState, useMemo } from 'react';
import { SERVICE_PRESETS, ServicePreset, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { Plus, Home, Zap, UtensilsCrossed, Wrench, Car, Gamepad2, PenLine } from 'lucide-react';
import * as Icons from 'lucide-react';

interface QuickExpenseGridProps {
    onSelect: (preset: ServicePreset) => void;
    onQuickAdd?: (preset: ServicePreset) => void;
}

const CompanyLogo: React.FC<{ domain: string; name: string; size?: number; className?: string }> = ({ domain, name, size = 40, className = '' }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (hasError || !domain) {
        const initial = name.charAt(0).toUpperCase();
        return (
            <div 
                className={`flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5 text-brand font-black rounded-2xl border border-brand/20 ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                {initial}
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse" />
            )}
            <img
                src={`https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`}
                alt={name}
                className={`rounded-2xl object-contain bg-white shadow-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                style={{ width: size, height: size }}
                onLoad={() => setIsLoading(false)}
                onError={() => { setHasError(true); setIsLoading(false); }}
            />
        </div>
    );
};

const CATEGORY_TABS = [
    { id: 'Moradia', label: 'Moradia', icon: Home },
    { id: 'Contas Fixas', label: 'Contas', icon: Zap },
    { id: 'Alimentação', label: 'Alimentação', icon: UtensilsCrossed },
    { id: 'Ferramentas', label: 'Ferramentas', icon: Wrench },
    { id: 'Transporte', label: 'Transporte', icon: Car },
    { id: 'Lazer', label: 'Lazer', icon: Gamepad2 },
];

const formatPrice = (amount?: number, currency?: Currency) => {
    if (!amount) return null;
    const symbol = currency ? CURRENCY_SYMBOLS[currency] : 'R$';
    const hasDecimals = amount % 1 !== 0;
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const QuickExpenseGrid: React.FC<QuickExpenseGridProps> = ({ onSelect, onQuickAdd }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const categoryPresets = useMemo(() => {
        if (!activeCategory) return [];
        return SERVICE_PRESETS.filter(p => p.defaultCategory === activeCategory);
    }, [activeCategory]);

    const handleCustomExpense = () => {
        onSelect({ 
            id: 'custom', 
            name: '', 
            domain: '', 
            defaultCategory: EXPENSE_CATEGORIES[0], 
            defaultTags: [], 
            isRecurring: false, 
            iconName: 'Plus' 
        });
    };

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId);
    };

    const getPresetIcon = (iconName: string) => {
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent size={22} /> : <Plus size={22} />;
    };

    return (
        <div className="space-y-5">
            <button
                onClick={handleCustomExpense}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-brand/20 to-brand/5 border-2 border-brand/40 hover:border-brand hover:from-brand/30 transition-all duration-300 group"
            >
                <div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center group-hover:scale-110 transition-transform shadow-neon">
                    <PenLine size={24} className="text-black" />
                </div>
                <div className="text-left flex-1">
                    <h4 className="text-base font-black text-white group-hover:text-brand transition-colors">
                        Adicionar Despesa
                    </h4>
                    <p className="text-xs text-ink-gray mt-0.5">
                        Qualquer tipo de gasto
                    </p>
                </div>
                <Plus size={20} className="text-brand opacity-50 group-hover:opacity-100 group-hover:rotate-90 transition-all" />
            </button>

            <div>
                <p className="text-xs text-ink-dim mb-3 font-medium">Ou escolha uma categoria:</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {CATEGORY_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeCategory === tab.id;
                        const count = SERVICE_PRESETS.filter(p => p.defaultCategory === tab.id).length;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleCategoryClick(tab.id)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-brand text-black scale-105' 
                                        : 'bg-white/5 text-ink-gray hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Icon size={20} />
                                <span className="text-[11px] font-bold">{tab.label}</span>
                                <span className={`text-[9px] ${isActive ? 'text-black/60' : 'text-ink-dim'}`}>{count} itens</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeCategory && categoryPresets.length > 0 && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[35vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {categoryPresets.map((preset) => {
                            const price = formatPrice(preset.defaultAmount, preset.defaultCurrency);
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => onSelect(preset)}
                                    className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-brand/30 hover:bg-brand/5 transition-all duration-200 group"
                                >
                                    {preset.domain ? (
                                        <CompanyLogo 
                                            domain={preset.domain} 
                                            name={preset.name} 
                                            size={36} 
                                            className="group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-ink-gray group-hover:text-brand transition-colors">
                                            {getPresetIcon(preset.iconName)}
                                        </div>
                                    )}
                                    
                                    <span className="text-[10px] font-medium text-white group-hover:text-brand transition-colors line-clamp-1 text-center w-full">
                                        {preset.name}
                                    </span>
                                    {price && (
                                        <span className="text-[9px] text-ink-dim">
                                            {price}
                                        </span>
                                    )}

                                    {preset.isRecurring && (
                                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-brand/80 rounded-full flex items-center justify-center">
                                            <span className="text-[7px] text-black font-black">∞</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export { QuickExpenseGrid, CompanyLogo };
