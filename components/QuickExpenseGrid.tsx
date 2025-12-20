import React, { useState, useMemo } from 'react';
import { SERVICE_PRESETS, ServicePreset, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { Search, Plus, HelpCircle, Home, Zap, UtensilsCrossed, Wrench, Car, Gamepad2, PenLine } from 'lucide-react';
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
    { id: 'all', label: 'Todos', icon: Zap, color: 'brand' },
    { id: 'Moradia', label: 'Moradia', icon: Home, color: 'blue-500' },
    { id: 'Contas Fixas', label: 'Contas', icon: Zap, color: 'semantic-yellow' },
    { id: 'Alimentação', label: 'Alimentação', icon: UtensilsCrossed, color: 'orange-500' },
    { id: 'Ferramentas', label: 'Ferramentas', icon: Wrench, color: 'semantic-purple' },
    { id: 'Transporte', label: 'Transporte', icon: Car, color: 'semantic-red' },
    { id: 'Lazer', label: 'Lazer', icon: Gamepad2, color: 'green-500' },
];

const formatPrice = (amount?: number, currency?: Currency) => {
    if (!amount) return null;
    const symbol = currency ? CURRENCY_SYMBOLS[currency] : 'R$';
    const hasDecimals = amount % 1 !== 0;
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const QuickExpenseGrid: React.FC<QuickExpenseGridProps> = ({ onSelect, onQuickAdd }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [showPresets, setShowPresets] = useState(false);

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

    const getPresetIcon = (iconName: string) => {
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent size={24} /> : <Plus size={24} />;
    };

    return (
        <div className="space-y-6">
            <button
                onClick={handleCustomExpense}
                className="w-full flex items-center gap-5 p-6 rounded-3xl bg-gradient-to-r from-brand/20 to-brand/5 border-2 border-brand/40 hover:border-brand hover:from-brand/30 transition-all duration-300 group"
            >
                <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center group-hover:scale-110 transition-transform shadow-neon">
                    <PenLine size={28} className="text-black" />
                </div>
                <div className="text-left flex-1">
                    <h4 className="text-lg font-black text-white group-hover:text-brand transition-colors">
                        Adicionar Despesa
                    </h4>
                    <p className="text-sm text-ink-gray mt-1">
                        Aluguel, conta de luz, mercado, qualquer gasto
                    </p>
                </div>
                <Plus size={24} className="text-brand opacity-50 group-hover:opacity-100 group-hover:rotate-90 transition-all" />
            </button>

            <div className="relative">
                <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="w-full flex items-center justify-between py-3 text-sm text-ink-gray hover:text-white transition-colors"
                >
                    <span className="font-medium">Atalhos rápidos</span>
                    <span className={`transition-transform duration-200 ${showPresets ? 'rotate-180' : ''}`}>
                        <Icons.ChevronDown size={16} />
                    </span>
                </button>
            </div>

            {showPresets && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim group-focus-within:text-brand transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar aluguel, luz, Netflix..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-ink-dim focus:border-brand focus:bg-white/10 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                        {CATEGORY_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-brand text-black' 
                                            : 'bg-white/5 text-ink-gray hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[40vh] overflow-y-auto pr-1 pb-2">
                        {filteredPresets.map((preset) => {
                            const price = formatPrice(preset.defaultAmount, preset.defaultCurrency);
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => onSelect(preset)}
                                    className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand/30 hover:bg-brand/5 transition-all duration-200 group"
                                >
                                    {preset.domain ? (
                                        <CompanyLogo 
                                            domain={preset.domain} 
                                            name={preset.name} 
                                            size={44} 
                                            className="group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-ink-gray group-hover:text-brand transition-colors">
                                            {getPresetIcon(preset.iconName)}
                                        </div>
                                    )}
                                    
                                    <div className="text-center">
                                        <span className="text-xs font-medium text-white group-hover:text-brand transition-colors line-clamp-1">
                                            {preset.name}
                                        </span>
                                        {price && (
                                            <div className="text-[10px] text-ink-dim mt-0.5">
                                                {price}
                                            </div>
                                        )}
                                    </div>

                                    {preset.isRecurring && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-brand/80 rounded-full flex items-center justify-center">
                                            <span className="text-[8px] text-black font-black">∞</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                        {filteredPresets.length === 0 && (
                            <div className="col-span-full py-10 text-center">
                                <HelpCircle size={32} className="mx-auto text-ink-dim mb-2" />
                                <p className="text-sm text-ink-gray">Nenhum atalho encontrado</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export { QuickExpenseGrid, CompanyLogo };
