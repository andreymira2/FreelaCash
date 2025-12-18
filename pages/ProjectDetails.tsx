import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, Button, Badge, CurrencyDisplay, Input, Avatar, ProgressBar, Select } from '../components/ui';
import { ProjectStatus, ProjectContractType, Payment, PaymentStatus, Client, Currency, CURRENCY_SYMBOLS } from '../types';
import { ArrowLeft, Clock, Trash2, DollarSign, Edit2, User, Plus, CheckCircle2, Circle, FileText, Calendar, ShieldCheck, MessageCircle, Copy, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { projects, clients, expenses, userProfile, addWorkLog, updateProject, getProjectTotal, deleteProject, duplicateProject, addPayment, updatePayment, deletePayment, addProjectAdjustment, updateClient, addClient } = useData();
    const navigate = useNavigate();

    const project = projects.find(p => p.id === id);

    const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CONFIG'>('SUMMARY');
    const [showEditProject, setShowEditProject] = useState(false);
    const [showEditClient, setShowEditClient] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
    const [showTimer, setShowTimer] = useState(false);
    
    const [installmentCount, setInstallmentCount] = useState(2);
    const [installmentDate, setInstallmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [payFirstNow, setPayFirstNow] = useState(true);

    const [desc, setDesc] = useState('');
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentNote, setPaymentNote] = useState('');
    const [paymentInvoice, setPaymentInvoice] = useState('');
    const [isAdjustment, setIsAdjustment] = useState(false);
    const [adjustmentDesc, setAdjustmentDesc] = useState('');
    const [newTaskText, setNewTaskText] = useState('');

    const isRetainer = project?.contractType === ProjectContractType.RETAINER || project?.contractType === ProjectContractType.RECURRING_FIXED;

    const client = useMemo(() => {
        if (!project) return null;
        if (project.clientId) return clients.find(c => c.id === project.clientId);
        return { id: 'temp', name: project.clientName, createdAt: 0 } as Client;
    }, [project, clients]);

    const totals = useMemo(() => {
        if (!project) return { gross: 0, net: 0, paid: 0, profit: 0, remaining: 0, expenseTotal: 0, adjustments: 0 };
        return getProjectTotal(project, expenses);
    }, [project, expenses, getProjectTotal]);

    useEffect(() => {
        let interval: number | undefined;
        if (isTimerRunning) { interval = window.setInterval(() => setTimerSeconds(prev => prev + 1), 1000); }
        else { clearInterval(interval); }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    if (!project) return <div className="p-8 text-center text-ink-gray">Projeto não encontrado.</div>;

    const handleWhatsAppBilling = () => {
        if (!userProfile.pixKey) { alert("Configure sua Chave PIX nas Configurações primeiro!"); navigate('/settings'); return; }
        const symbol = CURRENCY_SYMBOLS[project.currency] || project.currency;
        const text = `Olá ${project.clientName}, tudo bem? 👋\n\nAqui é o ${userProfile.name}. Segue o resumo do projeto *${project.category}*:\n\nValor Total: ${symbol}${totals.gross.toFixed(2)}\nJá Pago: ${symbol}${totals.paid.toFixed(2)}\n*Valor Pendente: ${symbol}${totals.remaining.toFixed(2)}*\n\nPara regularizar, segue minha chave PIX:\n🔑 *${userProfile.pixKey}*\nNome: ${userProfile.name}\nCPF/CNPJ: ${userProfile.taxId || ''}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return;
        const dateStr = new Date(paymentDate).toISOString();

        if (editingPaymentId) {
            const existingPay = project.payments?.find(p => p.id === editingPaymentId);
            if (existingPay) updatePayment(project.id, { ...existingPay, date: dateStr, amount: amount, note: paymentNote, invoiceNumber: paymentInvoice });
        } else {
            if (isAdjustment) addProjectAdjustment(project.id, { id: Date.now().toString(), date: dateStr, amount: amount, description: adjustmentDesc || 'Ajuste' });
            addPayment(project.id, { id: Date.now().toString(), date: dateStr, amount: amount, note: isAdjustment ? `(Extra) ${paymentNote || adjustmentDesc}` : paymentNote, status: PaymentStatus.PAID, invoiceNumber: paymentInvoice });
            if (project.contractType === ProjectContractType.ONE_OFF && (totals.paid + amount) >= totals.net && project.status === ProjectStatus.COMPLETED) updateProject(project.id, { status: ProjectStatus.PAID, paymentDate: dateStr });
        }
        setShowPaymentModal(false);
        resetPaymentForm();
    };

    const resetPaymentForm = () => { setEditingPaymentId(null); setPaymentAmount(''); setPaymentNote(''); setPaymentInvoice(''); setPaymentDate(new Date().toISOString().split('T')[0]); setIsAdjustment(false); setAdjustmentDesc(''); };
    
    const openPaymentModal = (paymentToEdit?: Payment) => {
        if (paymentToEdit) { 
            setEditingPaymentId(paymentToEdit.id); 
            setPaymentAmount(paymentToEdit.amount.toString()); 
            setPaymentDate(new Date(paymentToEdit.date).toISOString().split('T')[0]); 
            setPaymentNote(paymentToEdit.note || ''); 
            setPaymentInvoice(paymentToEdit.invoiceNumber || ''); 
            setIsAdjustment(false); 
        } else { 
            resetPaymentForm(); 
            if (totals.remaining > 0) setPaymentAmount(totals.remaining.toFixed(2)); 
        }
        setShowPaymentModal(true);
    };

    const handleSaveClient = (updatedClient: Client) => {
        if (updatedClient.id === 'temp') { const newId = Date.now().toString(); addClient({ ...updatedClient, id: newId }); updateProject(project.id, { clientId: newId, clientName: updatedClient.name }); }
        else { updateClient(updatedClient.id, updatedClient); if (updatedClient.name !== project.clientName) updateProject(project.id, { clientName: updatedClient.name }); }
        setShowEditClient(false);
    };

    const handleDelete = () => { if (window.confirm("Deletar este projeto?")) { deleteProject(project.id); navigate('/projects', { replace: true }); } };

    const handleDuplicate = () => {
        const newId = duplicateProject(project.id);
        if (newId) navigate(`/project/${newId}`);
    };

    const handleGenerateInstallments = (e: React.FormEvent) => {
        e.preventDefault();
        if (installmentCount < 2 || totals.remaining <= 0) return;
        const amountPerPart = totals.remaining / installmentCount;
        for (let i = 0; i < installmentCount; i++) {
            const d = new Date(installmentDate); 
            d.setMonth(d.getMonth() + i);
            const isFirst = i === 0;
            addPayment(project.id, { 
                id: Date.now().toString() + i, 
                date: d.toISOString(), 
                amount: amountPerPart, 
                note: `Parcela ${i + 1}/${installmentCount}`, 
                status: (isFirst && payFirstNow) ? PaymentStatus.PAID : PaymentStatus.SCHEDULED 
            });
        }
        setShowInstallmentModal(false);
    };

    const paymentsList = [...(project.payments || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const progressPercent = isRetainer ? (new Date().getDate() / 30) * 100 : (totals.net > 0 ? (totals.paid / totals.net) * 100 : 0);

    return (
        <div className="space-y-4 md:space-y-6 pb-24 no-print max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-ink-gray hover:text-white transition-colors">
                    <ArrowLeft size={20} /> <span className="font-bold">Voltar</span>
                </button>
                <div className="flex items-center gap-2">
                    {totals.remaining > 0 && userProfile.pixKey && (
                        <button
                            onClick={handleWhatsAppBilling}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-semantic-green/20 text-semantic-green hover:bg-semantic-green/30 transition-all"
                        >
                            <MessageCircle size={16} />
                            <span className="hidden sm:inline">Cobrar</span>
                        </button>
                    )}
                    <button
                        onClick={handleDuplicate}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 text-ink-gray hover:text-white hover:bg-white/10 transition-all"
                        title="Duplicar"
                    >
                        <Copy size={16} />
                    </button>
                </div>
            </div>

            {/* Project Title & Stats */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar name={project.clientName} className="w-14 h-14 rounded-xl" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{project.clientName}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <Badge status={project.status} />
                            <span className="text-xs font-medium text-ink-gray">{project.category}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs font-bold text-ink-gray uppercase tracking-wider">{isRetainer ? 'MRR' : 'Total'}</p>
                        <p className="text-2xl font-extrabold text-white"><CurrencyDisplay amount={totals.net} currency={project.currency} /></p>
                    </div>
                    {!isRetainer && (
                        <div className="text-right">
                            <p className="text-xs font-bold text-ink-gray uppercase tracking-wider">Pendente</p>
                            <p className={`text-2xl font-extrabold ${totals.remaining > 0 ? 'text-semantic-yellow' : 'text-brand'}`}>
                                <CurrencyDisplay amount={totals.remaining} currency={project.currency} />
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-base-card rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-xs font-medium text-ink-dim mb-2">
                    <span>{isRetainer ? 'Ciclo do mês' : 'Progresso de pagamento'}</span>
                    <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                </div>
            </div>

            {/* Tabs - Now only 2 */}
            <div className="border-b border-white/10 flex gap-6">
                {([{ id: 'SUMMARY', label: 'Resumo' }, { id: 'CONFIG', label: 'Configurar' }] as const).map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id ? 'text-brand border-brand' : 'text-ink-gray border-transparent hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {activeTab === 'SUMMARY' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3">
                            <Button variant="primary" onClick={() => openPaymentModal()} className="h-10">
                                <Plus size={16} /> Pagamento
                            </Button>
                            {totals.remaining > 0 && (
                                <Button variant="outline" onClick={() => setShowInstallmentModal(true)} className="h-10 border-white/10">
                                    Parcelar
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => { resetPaymentForm(); setIsAdjustment(true); setShowPaymentModal(true); }} className="h-10 border-white/10">
                                Extra
                            </Button>
                            <button 
                                onClick={() => setShowTimer(!showTimer)}
                                className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-all ${showTimer ? 'bg-brand/20 text-brand' : 'bg-white/5 text-ink-gray hover:text-white'}`}
                            >
                                <Clock size={16} />
                                Timer
                                {showTimer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {/* Collapsible Timer */}
                        {showTimer && (
                            <Card className="animate-in slide-in-from-top-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white flex items-center gap-2"><Clock size={18} className="text-brand" /> Timer</h3>
                                    <div className="text-2xl font-mono font-bold text-white">
                                        {new Date(timerSeconds * 1000).toISOString().substr(11, 8)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant={isTimerRunning ? "danger" : "primary"} 
                                        className="h-10 px-6" 
                                        onClick={() => { 
                                            if (isTimerRunning) { 
                                                addWorkLog(project.id, { id: Date.now().toString(), date: new Date().toISOString(), hours: timerSeconds / 3600, description: desc || 'Sessão Rápida', billable: true }); 
                                                setTimerSeconds(0); 
                                                setDesc(''); 
                                            } 
                                            setIsTimerRunning(!isTimerRunning); 
                                        }}
                                    >
                                        {isTimerRunning ? 'Parar & Salvar' : 'Iniciar'}
                                    </Button>
                                    <input 
                                        placeholder="Descrição" 
                                        className="flex-1 bg-white/5 text-white rounded-xl px-4 text-sm outline-none focus:ring-1 focus:ring-brand" 
                                        value={desc} 
                                        onChange={e => setDesc(e.target.value)} 
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Payment History */}
                        <div>
                            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                <DollarSign size={18} className="text-brand" />
                                Histórico de Pagamentos
                            </h3>
                            <div className="space-y-3">
                                {paymentsList.length > 0 ? (
                                    paymentsList.map(pay => {
                                        const isPaid = pay.status === PaymentStatus.PAID || !pay.status;
                                        const isOverdue = !isPaid && new Date(pay.date) < new Date();
                                        return (
                                            <div key={pay.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors group gap-3 ${isPaid ? 'bg-white/5 border-white/5' : isOverdue ? 'bg-semantic-red/10 border-semantic-red/30' : 'bg-white/5 border-white/10'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-brand/10 text-brand' : 'bg-white/5 text-ink-gray'}`}>
                                                        {isPaid ? <ShieldCheck size={18} /> : <Clock size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${isPaid ? 'text-white' : isOverdue ? 'text-semantic-red' : 'text-ink-dim'}`}>
                                                            <CurrencyDisplay amount={pay.amount} currency={project.currency} />
                                                        </p>
                                                        <p className="text-xs text-ink-gray flex items-center gap-1 flex-wrap">
                                                            {new Date(pay.date).toLocaleDateString()} • {pay.note || 'Pagamento'} 
                                                            {isOverdue && <span className="text-semantic-red font-bold ml-1">ATRASADO</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    {!isPaid ? (
                                                        <Button 
                                                            variant="primary" 
                                                            className="h-8 text-xs px-3" 
                                                            onClick={() => updatePayment(project.id, { ...pay, status: PaymentStatus.PAID, date: new Date().toISOString() })}
                                                        >
                                                            Confirmar
                                                        </Button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => { setSelectedReceiptPayment(pay); setShowReceiptModal(true); }} 
                                                            className="px-3 py-1.5 rounded-lg bg-black border border-white/10 text-ink-gray hover:text-white hover:border-brand text-xs font-bold uppercase flex items-center gap-1"
                                                        >
                                                            <FileText size={12} /> Recibo
                                                        </button>
                                                    )}
                                                    <div className="flex gap-1">
                                                        <button onClick={() => openPaymentModal(pay)} className="p-2 text-ink-dim hover:text-white rounded-full" title="Editar"><Edit2 size={16} /></button>
                                                        <button onClick={() => { if (window.confirm("Excluir?")) deletePayment(project.id, pay.id) }} className="p-2 text-ink-dim hover:text-semantic-red rounded-full" title="Excluir"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-ink-dim text-sm border border-dashed border-white/10 rounded-xl">
                                        Nenhum pagamento registrado.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profit Summary */}
                        {!isRetainer && project.platformFee && project.platformFee > 0 && (
                            <Card>
                                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Lucro Líquido</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-ink-gray">
                                        <span>Bruto</span>
                                        <span><CurrencyDisplay amount={totals.gross} currency={project.currency} /></span>
                                    </div>
                                    <div className="flex justify-between text-ink-gray">
                                        <span>Taxas ({project.platformFee}%)</span>
                                        <span className="text-semantic-red">- <CurrencyDisplay amount={totals.gross * (project.platformFee / 100)} currency={project.currency} /></span>
                                    </div>
                                    <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-base">
                                        <span>Lucro Real</span>
                                        <span className="text-brand"><CurrencyDisplay amount={totals.profit} currency={project.currency} /></span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Client Info */}
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2"><User size={18} className="text-semantic-blue" /> Cliente</h3>
                                <Button variant="ghost" className="h-8 text-xs" onClick={() => setShowEditClient(true)}>Editar</Button>
                            </div>
                            <div className="flex items-center gap-4">
                                <Avatar name={project.clientName} className="w-12 h-12" />
                                <div>
                                    <p className="font-bold text-white">{project.clientName}</p>
                                    <p className="text-xs text-ink-gray">{client?.companyName || 'Pessoa Física'}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'CONFIG' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Checklist */}
                        <Card>
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-brand" /> Checklist
                            </h3>
                            <div className="flex gap-2 mb-4">
                                <input 
                                    className="flex-1 bg-white/5 text-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-brand/50 transition-colors" 
                                    placeholder="Nova tarefa..." 
                                    value={newTaskText} 
                                    onChange={e => setNewTaskText(e.target.value)} 
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newTaskText) {
                                            updateProject(project.id, { checklist: [...(project.checklist || []), { id: Date.now().toString(), text: newTaskText, completed: false }] });
                                            setNewTaskText('');
                                        }
                                    }} 
                                />
                                <Button variant="secondary" onClick={() => { 
                                    if (newTaskText) { 
                                        updateProject(project.id, { checklist: [...(project.checklist || []), { id: Date.now().toString(), text: newTaskText, completed: false }] }); 
                                        setNewTaskText(''); 
                                    } 
                                }}>
                                    <Plus size={16} />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {(project.checklist || []).map(t => (
                                    <div 
                                        key={t.id} 
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors" 
                                        onClick={() => updateProject(project.id, { checklist: project.checklist?.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x) })}
                                    >
                                        {t.completed ? <CheckCircle2 className="text-brand" size={20} /> : <Circle className="text-ink-gray hover:text-brand" size={20} />}
                                        <span className={`flex-1 ${t.completed ? "text-ink-dim line-through" : "text-white"}`}>{t.text}</span>
                                    </div>
                                ))}
                                {(!project.checklist || project.checklist.length === 0) && (
                                    <p className="text-center py-4 text-ink-dim text-sm">Nenhuma tarefa ainda.</p>
                                )}
                            </div>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Calendar size={20} className="text-semantic-blue" /> Timeline
                            </h3>
                            <div className="relative pl-4 border-l-2 border-white/10 space-y-6 ml-2">
                                <div className="relative pl-6">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-black border-2 border-semantic-blue"></div>
                                    <p className="text-xs text-ink-gray font-bold uppercase mb-1">{new Date(project.startDate).toLocaleDateString()}</p>
                                    <h4 className="text-white font-bold">Início</h4>
                                </div>
                                {project.dueDate && (
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-black border-2 border-ink-gray"></div>
                                        <p className="text-xs text-ink-gray font-bold uppercase mb-1">{new Date(project.dueDate).toLocaleDateString()}</p>
                                        <h4 className="text-white font-bold">Prazo</h4>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Edit Project */}
                        <Card>
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Settings size={20} className="text-ink-gray" /> Ajustes
                            </h3>
                            <Button variant="secondary" className="w-full justify-start" onClick={() => setShowEditProject(true)}>
                                <Edit2 size={16} className="mr-3" /> Editar Detalhes do Projeto
                            </Button>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-semantic-red/30 bg-semantic-red/5">
                            <h3 className="font-bold text-semantic-red mb-2">Zona de Perigo</h3>
                            <Button variant="danger" className="w-full" onClick={handleDelete}>
                                <Trash2 size={16} /> Deletar Projeto
                            </Button>
                        </Card>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">{editingPaymentId ? 'Editar Pagamento' : 'Novo Pagamento'}</h3>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <Input label="Valor" type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required autoFocus />
                            <Input label="Data" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                            <Input label="Descrição / Nota" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Ex: Entrada parcial" />
                            <Input label="Nº Nota Fiscal (Opcional)" value={paymentInvoice} onChange={e => setPaymentInvoice(e.target.value)} placeholder="0001" />
                            <Button type="submit" className="w-full h-12 mt-2">Salvar</Button>
                            <Button type="button" variant="ghost" className="w-full" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {showEditProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-lg border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6">Editar Projeto</h3>
                        <div className="space-y-4">
                            <Input label="Nome" value={project.clientName} onChange={e => updateProject(project.id, { clientName: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Valor" type="number" value={project.rate} onChange={e => updateProject(project.id, { rate: parseFloat(e.target.value) })} />
                                <Select label="Moeda" value={project.currency} onChange={e => updateProject(project.id, { currency: e.target.value as Currency })}>
                                    {Object.values(Currency).map(c => <option className="bg-black" key={c} value={c}>{c}</option>)}
                                </Select>
                            </div>
                            <Select label="Status" value={project.status} onChange={e => updateProject(project.id, { status: e.target.value as ProjectStatus })}>
                                {Object.values(ProjectStatus).map(s => <option className="bg-black" key={s} value={s}>{s}</option>)}
                            </Select>
                            <Button className="w-full mt-4" onClick={() => setShowEditProject(false)}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Installment Modal */}
            {showInstallmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">Parcelar Pagamento</h3>
                        <form onSubmit={handleGenerateInstallments} className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl mb-4">
                                <p className="text-sm text-ink-gray">Valor restante a parcelar:</p>
                                <p className="text-2xl font-bold text-white"><CurrencyDisplay amount={totals.remaining} currency={project.currency} /></p>
                            </div>
                            <Input 
                                label="Número de Parcelas" 
                                type="number" 
                                min="2" 
                                max="24" 
                                value={installmentCount} 
                                onChange={e => setInstallmentCount(parseInt(e.target.value) || 2)} 
                                required 
                            />
                            <Input 
                                label="Data da Primeira Parcela" 
                                type="date" 
                                value={installmentDate} 
                                onChange={e => setInstallmentDate(e.target.value)} 
                                required 
                            />
                            <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={payFirstNow} 
                                    onChange={e => setPayFirstNow(e.target.checked)} 
                                    className="w-5 h-5 rounded bg-white/10 border-white/20"
                                />
                                <span className="text-sm text-white">Marcar primeira parcela como paga</span>
                            </label>
                            <div className="p-4 bg-brand/10 rounded-xl">
                                <p className="text-sm text-brand">
                                    {installmentCount}x de <CurrencyDisplay amount={totals.remaining / installmentCount} currency={project.currency} />
                                </p>
                            </div>
                            <Button type="submit" className="w-full h-12 mt-2">Gerar Parcelas</Button>
                            <Button type="button" variant="ghost" className="w-full" onClick={() => setShowInstallmentModal(false)}>Cancelar</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && selectedReceiptPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">Recibo de Pagamento</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-ink-gray">Cliente</span>
                                    <span className="text-white font-medium">{project.clientName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink-gray">Projeto</span>
                                    <span className="text-white font-medium">{project.category}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink-gray">Data</span>
                                    <span className="text-white font-medium">{new Date(selectedReceiptPayment.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink-gray">Descrição</span>
                                    <span className="text-white font-medium">{selectedReceiptPayment.note || 'Pagamento'}</span>
                                </div>
                                {selectedReceiptPayment.invoiceNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-ink-gray">Nota Fiscal</span>
                                        <span className="text-white font-medium">{selectedReceiptPayment.invoiceNumber}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/10 pt-3 flex justify-between">
                                    <span className="text-ink-gray font-bold">Valor</span>
                                    <span className="text-brand text-xl font-bold"><CurrencyDisplay amount={selectedReceiptPayment.amount} currency={project.currency} /></span>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-ink-dim">
                                <span>Emitido por: {userProfile.name}</span>
                                {userProfile.pixKey && <span>PIX: {userProfile.pixKey}</span>}
                            </div>
                            <Button className="w-full" onClick={() => setShowReceiptModal(false)}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
