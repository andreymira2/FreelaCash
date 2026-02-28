import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    FileText,
    ChevronRight,
    Clock,
    CheckCircle2,
    TrendingUp
} from 'lucide-react';
import { useContractsList } from '../hooks/useFinancialEngine';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../engine/currencyUtils';
import { Currency } from '../types';

const Contracts: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useData();
    const { models, loading } = useContractsList();
    const [search, setSearch] = useState('');

    const filteredModels = models.filter(m =>
        m.contract.title.toLowerCase().includes(search.toLowerCase()) ||
        m.clientName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        Contratos
                        <span className="text-sm bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 font-bold">Beta</span>
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Gerencie retainers, projetos vinculados e agregados financeiros.</p>
                </div>

                <button
                    onClick={() => navigate('/contracts/new')}
                    className="bg-white text-black px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg shadow-white/5 active:scale-95 shrink-0"
                >
                    <Plus size={20} />
                    Novo Contrato
                </button>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-gray-400 mb-3">
                        <TrendingUp size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Total Sob Contrato</span>
                    </div>
                    <p className="text-3xl font-black font-mono">
                        {formatCurrency(models.reduce((acc, m) => acc + m.financials.totalGross, 0), settings.mainCurrency)}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-emerald-400 mb-3">
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Já Recebido</span>
                    </div>
                    <p className="text-3xl font-black font-mono text-emerald-400">
                        {formatCurrency(models.reduce((acc, m) => acc + m.financials.totalPaid, 0), settings.mainCurrency)}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-orange-400 mb-3">
                        <Clock size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Previsão Pendente</span>
                    </div>
                    <p className="text-3xl font-black font-mono text-orange-400">
                        {formatCurrency(models.reduce((acc, m) => acc + m.financials.totalRemaining, 0), settings.mainCurrency)}
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por contrato ou cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-medium"
                    />
                </div>
                <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                    <Filter size={20} />
                </button>
            </div>

            {/* Contracts Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredModels.map((model) => (
                    <div
                        key={model.contract.id}
                        onClick={() => navigate(`/contracts/${model.contract.id}`)}
                        className="group bg-white/5 border border-white/10 hover:border-white/20 p-6 rounded-3xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${model.contract.isActive ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-black' : 'bg-gray-500/10 text-gray-400'}`}>
                                <FileText size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{model.contract.title}</h3>
                                <div className="flex items-center gap-2 mt-1 text-gray-400 font-medium">
                                    <span className="text-white/80">{model.clientName}</span>
                                    <span className="text-white/20 text-xs">•</span>
                                    <span className="text-sm">{model.activeProjectsCount} projetos ativos</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Retenção Mensal</p>
                                <p className="text-2xl font-black font-mono">{formatCurrency(model.contract.retainerAmount, model.contract.currency as Currency)}</p>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Progresso Total</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${(model.financials.totalPaid / (model.financials.totalGross || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">
                                        {Math.round((model.financials.totalPaid / (model.financials.totalGross || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>

                            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" size={24} />
                        </div>
                    </div>
                ))}

                {filteredModels.length === 0 && !loading && (
                    <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum contrato encontrado</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">Você ainda não criou contratos ou o termo de busca não retornou resultados.</p>
                        <button
                            onClick={() => navigate('/contracts/new')}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold transition-all"
                        >
                            Criar Primeiro Contrato
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Contracts;
