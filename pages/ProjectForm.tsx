
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button, Input, Select, Card, Avatar } from '../components/ui';
import { Currency, ProjectType, ProjectStatus, ProjectContractType, PaymentStatus } from '../types';
import { ArrowLeft, AlertCircle, CheckCircle2, Zap, Calendar, Clock, Briefcase, DollarSign, Plus, User, ChevronRight, Check, Sparkles } from 'lucide-react';
import { parseLocalDateToISO, parseNumber, toInputDate } from '../utils/format';

const ProjectForm: React.FC = () => {
    const navigate = useNavigate();
    const { addProject, clients, addClient, getOrCreateClientByName } = useData();
    const [error, setError] = useState<string>('');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [newClientName, setNewClientName] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return clients.filter(c => !c.isArchived);
        const query = clientSearch.toLowerCase();
        return clients.filter(c => !c.isArchived && c.name.toLowerCase().includes(query));
    }, [clients, clientSearch]);

    const [formData, setFormData] = useState({
        clientName: '',
        type: ProjectType.FIXED,
        contractType: ProjectContractType.ONE_OFF,
        category: '',
        rate: '',
        currency: Currency.BRL,
        platformFee: '',
        dueDate: '',
        startDate: toInputDate(new Date().toISOString()),
        contractMonths: '6',
        isOngoing: true,
        estimatedHours: '',
        firstPaymentDate: '',
        firstPaymentAmount: ''
    });

    const handleSelectClient = (clientId: string, clientName: string) => {
        setSelectedClientId(clientId);
        setFormData({ ...formData, clientName });
        setStep(2);
    };

    const handleCreateNewClient = () => {
        if (!newClientName.trim()) return;
        const newClient = {
            id: Date.now().toString(),
            name: newClientName.trim(),
            createdAt: Date.now()
        };
        addClient(newClient);
        setSelectedClientId(newClient.id);
        setFormData({ ...formData, clientName: newClient.name });
        setNewClientName('');
        setStep(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.clientName.trim()) {
            setError('Nome do Cliente é obrigatório');
            return;
        }

        const rateVal = parseNumber(formData.rate);
        if (rateVal < 0) {
            setError('Valor inválido');
            return;
        }

        const feeVal = formData.platformFee ? parseNumber(formData.platformFee) : 0;
        if (feeVal < 0 || feeVal > 100) {
            setError('A taxa deve ser entre 0-100%');
            return;
        }

        let contractEndDate: string | undefined = undefined;
        if (formData.contractType === ProjectContractType.RECURRING_FIXED) {
            const start = new Date(`${formData.startDate}T12:00:00`);
            const months = parseInt(formData.contractMonths) || 6;
            start.setMonth(start.getMonth() + months);
            contractEndDate = start.toISOString();
        } else if (formData.contractType === ProjectContractType.ONE_OFF) {
            contractEndDate = formData.dueDate ? parseLocalDateToISO(formData.dueDate) : undefined;
        }

        const initialStatus = formData.contractType === ProjectContractType.ONE_OFF ? ProjectStatus.ACTIVE : ProjectStatus.ONGOING;

        // Resolve or create Client entity
        const client = selectedClientId 
            ? clients.find(c => c.id === selectedClientId) || getOrCreateClientByName(formData.clientName)
            : getOrCreateClientByName(formData.clientName);

        const payments = [];
        if (formData.firstPaymentDate) {
            const paymentAmount = formData.firstPaymentAmount ? parseNumber(formData.firstPaymentAmount) : rateVal;
            payments.push({
                id: Date.now().toString(),
                amount: paymentAmount,
                date: parseLocalDateToISO(formData.firstPaymentDate),
                status: PaymentStatus.SCHEDULED,
                note: 'Primeiro pagamento'
            });
        }

        addProject({
            id: Date.now().toString(),
            createdAt: Date.now(),
            status: initialStatus,
            logs: [],
            clientName: client.name,
            clientId: client.id,
            type: formData.type,
            contractType: formData.contractType,
            category: formData.category || 'Geral',
            rate: rateVal,
            currency: formData.currency,
            platformFee: feeVal,
            startDate: parseLocalDateToISO(formData.startDate),
            dueDate: formData.dueDate ? parseLocalDateToISO(formData.dueDate) : undefined,
            contractEndDate: contractEndDate,
            estimatedHours: formData.estimatedHours ? parseNumber(formData.estimatedHours) : undefined,
            payments: payments,
            events: [
                { id: Date.now().toString(), date: new Date().toISOString(), title: 'Projeto Criado', type: 'SYSTEM' }
            ],
            checklist: [],
            linkedExpenseIds: []
        });
        navigate('/projects');
    };

    // Visual Card for Contract Type Selection
    const ContractCard = ({ type, icon: Icon, title, desc }: any) => {
        const isSelected = formData.contractType === type;
        return (
            <div
                onClick={() => setFormData({ ...formData, contractType: type })}
                className={`cursor-pointer relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col gap-3
                ${isSelected
                        ? 'bg-primary-900/20 border-primary-400 shadow-lg shadow-primary-900/20 scale-[1.02]'
                        : 'bg-dark-800 border-dark-700 hover:border-dark-500 hover:bg-dark-750'}
            `}
            >
                {isSelected && <div className="absolute top-3 right-3 text-primary-400"><CheckCircle2 size={20} fill="currentColor" className="text-dark-900" /></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary-400 text-dark-900' : 'bg-dark-900 text-slate-400'}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{desc}</p>
                </div>
            </div>
        )
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="dark" onClick={() => navigate(-1)} className="w-12 h-12 rounded-full p-0 flex items-center justify-center shadow-lg">
                    <ArrowLeft size={22} />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Novo Projeto</h1>
                    <p className="text-slate-400 font-medium">Inicie um novo contrato ou trabalho.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/10 text-red-400 p-4 rounded-2xl mb-8 text-sm flex items-center gap-3 font-bold border border-red-900/30 animate-pulse">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* STEP 1: CLIENT & CONTRACT */}
                <section className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Briefcase size={16} /> Contrato</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ContractCard
                            type={ProjectContractType.ONE_OFF}
                            icon={Zap}
                            title="Projeto Pontual"
                            desc="Trabalho único com início e fim. Ideal para logos, sites ou entregas específicas."
                        />
                        <ContractCard
                            type={ProjectContractType.RETAINER}
                            icon={Clock}
                            title="Retainer Mensal"
                            desc="Trabalho recorrente todo mês. Sem data final fixa."
                        />
                        <ContractCard
                            type={ProjectContractType.RECURRING_FIXED}
                            icon={Calendar}
                            title="Prazo Fixo"
                            desc="Contrato que dura um número específico de meses (ex: consultoria de 6 meses)."
                        />
                    </div>

                    <Card className="p-6">
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Cliente</label>
                                {clients.length > 0 ? (
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Buscar ou criar cliente..."
                                            value={formData.clientName}
                                            onChange={e => {
                                                setFormData({ ...formData, clientName: e.target.value });
                                                setSelectedClientId(null);
                                            }}
                                            autoFocus
                                            label=""
                                        />
                                        {formData.clientName.trim() && !filteredClients.some(c => c.name.toLowerCase() === formData.clientName.toLowerCase()) && (
                                            <div className="p-3 bg-brand/10 border border-brand/30 rounded-xl flex items-center gap-3">
                                                <Plus size={16} className="text-brand" />
                                                <span className="text-sm text-brand">Novo cliente: <strong>{formData.clientName}</strong></span>
                                            </div>
                                        )}
                                        {formData.clientName.trim() && filteredClients.some(c => c.name.toLowerCase() === formData.clientName.toLowerCase()) && selectedClientId && (
                                            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                                                <Check size={16} className="text-green-400" />
                                                <span className="text-sm text-green-400">Cliente selecionado: <strong>{formData.clientName}</strong></span>
                                            </div>
                                        )}
                                        {filteredClients.length > 0 && formData.clientName.trim() && (
                                            <div className="flex flex-wrap gap-2">
                                                {filteredClients.slice(0, 5).map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedClientId(c.id);
                                                            setFormData({ ...formData, clientName: c.name });
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedClientId === c.id ? 'bg-brand text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                                                    >
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="Nome do cliente"
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                        autoFocus
                                        label=""
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Input
                                    label="Categoria do Serviço"
                                    placeholder="Ex: Branding, Dev, Consultoria"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                                {formData.contractType !== ProjectContractType.RETAINER ? (
                                    <Select
                                        label="Estrutura de Cobrança"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as ProjectType })}
                                    >
                                        <option value={ProjectType.FIXED}>Preço Fixo (Por Projeto)</option>
                                        <option value={ProjectType.HOURLY}>Por Hora</option>
                                        <option value={ProjectType.DAILY}>Diária</option>
                                    </Select>
                                ) : (
                                    <div className="bg-dark-900 p-4 rounded-2xl border border-dark-800 flex items-center gap-3 text-slate-400">
                                        <Clock size={20} />
                                        <span className="text-sm font-medium">Retainers são cobrados mensalmente.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </section>

                {/* STEP 2: FINANCIALS */}
                <section className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><DollarSign size={16} /> Financeiro</h3>

                    <Card className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="relative">
                                <label className="text-xs font-bold text-primary-400 uppercase tracking-wider ml-1 mb-2 block">
                                    {formData.contractType === ProjectContractType.ONE_OFF ? "Orçamento Total / Valor" : "Valor Mensal"}
                                </label>
                                <div className="relative">
                                    <Input
                                        label=""
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                        value={formData.rate}
                                        onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                        className="w-full pl-12 pr-4 py-5 rounded-2xl bg-dark-900 text-3xl font-black text-white focus:ring-2 focus:ring-primary-400 outline-none border-none"
                                    />
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">$</span>
                                </div>
                            </div>

                            <Select
                                label="Moeda"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                                className="h-[88px] text-lg"
                            >
                                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Input
                                label="Data de Início"
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />

                            {/* Dynamic Date Inputs based on contract */}
                            {formData.contractType === ProjectContractType.ONE_OFF && (
                                <Input
                                    label="Prazo (Opcional)"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            )}
                            {formData.contractType === ProjectContractType.RECURRING_FIXED && (
                                <Input
                                    label="Duração (Meses)"
                                    type="number"
                                    value={formData.contractMonths}
                                    onChange={e => setFormData({ ...formData, contractMonths: e.target.value })}
                                />
                            )}

                            <Input
                                label="Estimativa Horas (Opcional)"
                                type="number"
                                placeholder="ex: 40"
                                value={formData.estimatedHours}
                                onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })}
                            />
                        </div>

                        <div className="mt-5 pt-5 border-t border-dark-800">
                            <Input
                                label="Taxa da Plataforma / Imposto (%)"
                                type="number"
                                step="0.1"
                                max="100"
                                placeholder="0"
                                value={formData.platformFee}
                                onChange={e => setFormData({ ...formData, platformFee: e.target.value })}
                            />
                        </div>
                    </Card>
                </section>

                {/* STEP 3: FIRST PAYMENT (Optional) */}
                <section className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                        <Sparkles size={16} /> Primeiro Pagamento (Opcional)
                    </h3>
                    <Card className="p-6">
                        <p className="text-sm text-ink-gray mb-4">Agende um pagamento para facilitar o acompanhamento.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="Data do Primeiro Pagamento"
                                type="date"
                                value={formData.firstPaymentDate}
                                onChange={e => setFormData({ ...formData, firstPaymentDate: e.target.value })}
                            />
                            <Input
                                label="Valor (deixe vazio para valor total)"
                                type="number"
                                step="0.01"
                                placeholder={formData.rate || '0.00'}
                                value={formData.firstPaymentAmount}
                                onChange={e => setFormData({ ...formData, firstPaymentAmount: e.target.value })}
                            />
                        </div>
                    </Card>
                </section>

                <div className="pt-4 pb-10">
                    <Button type="submit" variant="primary" className="w-full justify-center text-lg font-bold h-16 rounded-2xl shadow-xl shadow-primary-900/20 hover:scale-[1.01] transition-transform">
                        {formData.contractType === ProjectContractType.ONE_OFF ? 'Iniciar Projeto' : 'Iniciar Contrato'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProjectForm;
