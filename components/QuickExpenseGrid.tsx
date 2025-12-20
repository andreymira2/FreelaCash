import React, { useState, useMemo } from 'react';
import { SERVICE_PRESETS, ServicePreset, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { Search, Plus, HelpCircle, Tv, Music, Laptop, Sparkles, Server, Car, Coffee, Zap } from 'lucide-react';

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
    { id: 'Streaming / Lazer', label: 'Streaming', icon: Tv, color: 'semantic-purple' },
    { id: 'Software & Tools', label: 'Software', icon: Laptop, color: 'blue-500' },
    { id: 'IA & Automação', label: 'IA', icon: Sparkles, color: 'semantic-yellow' },
    { id: 'Assinaturas / Subs', label: 'Infra', icon: Server, color: 'semantic-red' },
    { id: 'Transporte', label: 'Transporte', icon: Car, color: 'orange-500' },
    { id: 'Alimentação / Café', label: 'Food', icon: Coffee, color: 'amber-500' },
];

const formatPrice = (amount?: number, currency?: Currency) => {
    if (!amount) return null;
    const symbol = currency ? CURRENCY_SYMBOLS[currency] : 'R$';
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const QuickExpenseGrid: React.FC<QuickExpenseGridProps> = ({ onSelect, onQuickAdd }) => {
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
        <div className="space-y-5">
            <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim group-focus-within:text-brand transition-colors" />
                <input
                    type="text"
                    placeholder="Buscar Netflix, Spotify, Adobe..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-base text-white placeholder:text-ink-dim focus:border-brand focus:bg-white/10 outline-none transition-all"
                    autoFocus
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
                {CATEGORY_TABS.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                                isActive 
                                    ? 'bg-brand text-black shadow-neon scale-105' 
                                    : 'bg-white/5 text-ink-gray hover:bg-white/10 hover:text-white hover:scale-102'
                            }`}
                            style={{ 
                                animationDelay: `${idx * 50}ms`,
                            }}
                        >
                            <Icon size={16} className={isActive ? 'text-black' : ''} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pr-1 pb-2">
                {filteredPresets.map((preset, idx) => {
                    const price = formatPrice(preset.defaultAmount, preset.defaultCurrency);
                    return (
                        <button
                            key={preset.id}
                            onClick={() => onSelect(preset)}
                            className="relative flex flex-col items-center gap-3 p-5 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-brand/50 hover:from-brand/10 hover:to-brand/5 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl"
                            style={{ 
                                animationDelay: `${idx * 30}ms`,
                            }}
                        >
                            <div className="relative">
                                <CompanyLogo 
                                    domain={preset.domain} 
                                    name={preset.name} 
                                    size={64} 
                                    className="group-hover:scale-110 transition-transform duration-300"
                                />
                                {preset.isRecurring && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                        <span className="text-[10px] text-black font-black">∞</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-center space-y-1">
                                <span className="text-sm font-bold text-white group-hover:text-brand transition-colors line-clamp-1">
                                    {preset.name}
                                </span>
                                {price && (
                                    <div className="text-xs font-medium text-ink-gray group-hover:text-white/80 transition-colors">
                                        {price}<span className="text-ink-dim">/mês</span>
                                    </div>
                                )}
                            </div>

                            {onQuickAdd && price && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onQuickAdd(preset); }}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-brand/0 group-hover:bg-brand flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                    <Plus size={16} className="text-brand group-hover:text-black" />
                                </button>
                            )}
                        </button>
                    );
                })}

                {filteredPresets.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <HelpCircle size={40} className="text-ink-dim" />
                        </div>
                        <p className="text-base font-medium text-ink-gray">Nenhum serviço encontrado</p>
                        <p className="text-sm text-ink-dim mt-2">Tente outro termo ou adicione manualmente</p>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/5">
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
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 hover:bg-brand/10 border border-dashed border-white/10 hover:border-brand/30 text-ink-gray hover:text-brand transition-all duration-200 text-base font-medium group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-brand/20 flex items-center justify-center transition-colors">
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    Adicionar despesa personalizada
                </button>
            </div>
        </div>
    );
};

export { QuickExpenseGrid, CompanyLogo };
