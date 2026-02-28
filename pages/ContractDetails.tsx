import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Trash2,
    Plus,
    X,
    FileText,
    DollarSign,
    Briefcase,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Layers
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useContract } from '../hooks/useFinancialEngine';
import { formatCurrency } from '../engine/currencyUtils';
import { Currency, Contract, ContractItem } from '../types';

const ContractDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new' || !id;

    const { clients, projects, addContract, updateContract, deleteContract, settings } = useData();
    const contractModel = useContract(isNew ? undefined : id);

    const [formData, setFormData] = useState<Partial<Contract>>({
        title: '',
        clientId: '',
        retainerAmount: 0,
        currency: settings.mainCurrency,
        startDate: new Date().toISOString().split('T')[0],
        isActive: true,
        items: [],
        projectIds: []
    });

    const [newItem, setNewItem] = useState<Partial<ContractItem>>({
        description: '',
        amount: 0,
        type: 'FIXED'
    });

    useEffect(() => {
        if (contractModel?.contract) {
            setFormData(contractModel.contract);
        }
    }, [contractModel]);

    const handleSave = async () => {
        if (!formData.title || !formData.clientId) {
            alert('Por favor, preencha o título e selecione um cliente.');
            return;
        }

        if (isNew) {
            const newContract: Contract = {
                id: crypto.randomUUID(),
                userId: '', // Will be filled by DataContext
                title: formData.title!,
                clientId: formData.clientId!,
                retainerAmount: formData.retainerAmount || 0,
                currency: (formData.currency as Currency) || settings.mainCurrency,
                startDate: formData.startDate!,
                isActive: formData.isActive ?? true,
                items: formData.items || [],
                projectIds: formData.projectIds || [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            addContract(newContract);
            navigate('/contracts');
        } else {
            updateContract(id!, formData);
            navigate('/contracts');
        }
    };

    const handleAddItem = () => {
        if (!newItem.description || newItem.amount === undefined) return;

        const item: ContractItem = {
            id: crypto.randomUUID(),
            description: newItem.description!,
            amount: newItem.amount!,
            type: newItem.type as 'FIXED' | 'HOURLY' | 'RETAINER' || 'FIXED'
        };

        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), item]
        }));
        setNewItem({ description: '', amount: 0, type: 'FIXED' });
    };

    const handleRemoveItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            items: (prev.items || []).filter(i => i.id !== itemId)
        }));
    };

    const handleDelete = () => {
        if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
            deleteContract(id!);
            navigate('/contracts');
        }
    };

    return (
        <div className="p-8 pb-20 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/contracts')}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-ink-gray"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all font-bold"
                            title="Excluir Contrato"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-brand text-black font-black rounded-xl flex items-center gap-2 hover:bg-brand-hover transition-all shadow-neon active:scale-95"
                    >
                        <Save size={20} />
                        {isNew ? 'Criar Contrato' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-base-card border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
                            <FileText className="text-blue-400" size={22} />
                            Informações Gerais
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-ink-dim uppercase tracking-widest mb-2">Título do Contrato</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Contrato de Retentoria Mensal - Design"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-ink-dim uppercase tracking-widest mb-2">Cliente</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-white/20 focus:bg-white/10 appearance-none font-bold"
                                    >
                                        <option value="">Selecionar Cliente</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-ink-dim uppercase tracking-widest mb-2">Início</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-white/20 focus:bg-white/10 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-base-card border border-white/5 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black flex items-center gap-2 text-white">
                                <Plus className="text-brand" size={22} />
                                Itens Extras / Suporte
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {formData.items?.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group">
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{item.description}</p>
                                        <p className="text-[10px] text-ink-dim uppercase font-bold">
                                            {item.type === 'FIXED' ? 'Fixo' : item.type === 'HOURLY' ? 'Por Hora' : 'Retenção'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-black text-white">{formatCurrency(item.amount, (formData.currency as Currency) || settings.mainCurrency)}</span>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-1.5 text-ink-dim hover:text-semantic-red hover:bg-semantic-red/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Novo item extra..."
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-brand text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Valor"
                                        value={newItem.amount || ''}
                                        onChange={(e) => setNewItem({ ...newItem, amount: parseFloat(e.target.value) })}
                                        className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-brand text-sm font-mono font-black"
                                    />
                                </div>
                                <button
                                    onClick={handleAddItem}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest"
                                >
                                    <Plus size={16} /> Adicionar
                                </button>
                            </div>
                        </div>
                    </section>

                    {!isNew && contractModel && (
                        <section className="bg-base-card border border-white/5 rounded-3xl p-6">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
                                <Layers className="text-orange-400" size={22} />
                                Projetos Vinculados ({contractModel.projects.length})
                            </h2>

                            <div className="space-y-3">
                                {contractModel.projects.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/project/${project.id}`)}
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-black transition-all">
                                                <Briefcase size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-white">{project.title}</p>
                                                <p className="text-[10px] text-ink-dim uppercase font-bold">{project.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-black text-white">{formatCurrency(project.moneySummary.gross, project.moneySummary.currency)}</p>
                                            <p className="text-[10px] text-ink-dim uppercase font-bold">Total Bruto</p>
                                        </div>
                                    </div>
                                ))}

                                {contractModel.projects.length === 0 && (
                                    <div className="py-12 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                                        <p className="text-ink-dim text-sm font-medium">Nenhum projeto vinculado a este contrato ainda.</p>
                                        <button
                                            onClick={() => navigate('/add', { state: { contractId: id, clientId: formData.clientId } })}
                                            className="text-brand text-xs font-black uppercase tracking-widest mt-4 hover:underline"
                                        >
                                            + Criar Primeiro Projeto
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Financials & Status */}
                <div className="space-y-6">
                    <section className="bg-base-card border border-white/5 rounded-3xl p-6">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-white">
                            <DollarSign className="text-brand" size={20} />
                            Financeiro
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-ink-dim uppercase tracking-widest mb-3">Retenção Mensal</label>
                                <div className="flex flex-col gap-3">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim font-bold">$</span>
                                        <input
                                            type="number"
                                            value={formData.retainerAmount}
                                            onChange={(e) => setFormData({ ...formData, retainerAmount: parseFloat(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-10 focus:outline-none focus:border-brand text-3xl font-mono font-black text-white transition-all"
                                        />
                                    </div>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="bg-white/5 border border-white/5 rounded-2xl py-3 px-4 focus:outline-none focus:border-white/20 font-black text-white"
                                    >
                                        {Object.values(Currency).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {!isNew && contractModel && (
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Total Bruto</span>
                                        <span className="font-mono font-black text-xl">{formatCurrency(contractModel.financials.totalGross, settings.mainCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Já Recebido</span>
                                        <span className="font-mono font-black text-brand">{formatCurrency(contractModel.financials.totalPaid, settings.mainCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">Pendente</span>
                                        <span className="font-mono font-black text-semantic-yellow">{formatCurrency(contractModel.financials.totalRemaining, settings.mainCurrency)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-base-card border border-white/5 rounded-3xl p-6">
                        <h2 className="text-lg font-black mb-6 text-white uppercase tracking-widest text-xs">Ações Rápidas</h2>
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-brand shadow-neon' : 'bg-gray-500'}`}></div>
                                <span className="font-black text-xs uppercase tracking-widest text-white">{formData.isActive ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`w-14 h-7 rounded-full transition-all relative ${formData.isActive ? 'bg-brand' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 rounded-full transition-all shadow-md ${formData.isActive ? 'right-1 bg-black' : 'left-1 bg-white/20'}`}></div>
                            </button>
                        </div>

                        <p className="text-[10px] text-ink-dim mt-6 leading-relaxed uppercase font-black tracking-widest text-center">
                            Contratos inativos param de gerar cobranças nos relatórios.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ContractDetails;
