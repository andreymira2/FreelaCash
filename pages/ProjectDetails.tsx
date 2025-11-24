
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, Button, Badge, CurrencyDisplay, Input, Avatar, ProgressBar, Toggle, Select } from '../components/ui';
import { ProjectStatus, ProjectContractType, Payment, PaymentStatus, Client, Currency, CURRENCY_SYMBOLS } from '../types';
import { ArrowLeft, Clock, Trash2, DollarSign, X, Briefcase, Edit2, User, Phone, Mail, Plus, Link2, CalendarClock, CheckCircle2, Circle, FileText, Calendar, ShieldCheck, MessageCircle, FileCheck, Globe, Printer } from 'lucide-react';

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { projects, clients, expenses, userProfile, addWorkLog, updateProject, getProjectTotal, deleteProject, addPayment, updatePayment, deletePayment, addProjectAdjustment, updateClient, addClient } = useData();
    const navigate = useNavigate();

    const project = projects.find(p => p.id === id);

    // --- Local State ---
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FINANCIALS' | 'PLAN' | 'MANAGE'>('DASHBOARD');

    const [showEditProject, setShowEditProject] = useState(false);
    const [showEditClient, setShowEditClient] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showExpenseLinker, setShowExpenseLinker] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

    const [hours, setHours] = useState('');
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

    const [installmentCount, setInstallmentCount] = useState(2);
    const [installmentDate, setInstallmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [payFirstNow, setPayFirstNow] = useState(true);
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
        const symbol = CURRENCY_SYMBOLS[project.currency];
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

    const handleGenerateInstallments = (e: React.FormEvent) => {
        e.preventDefault();
        if (installmentCount < 2 || totals.remaining <= 0) return;
        const amountPerPart = totals.remaining / installmentCount;
        for (let i = 0; i < installmentCount; i++) {
            const d = new Date(installmentDate); d.setMonth(d.getMonth() + i);
            const isFirst = i === 0;
            addPayment(project.id, { id: Date.now().toString() + i, date: d.toISOString(), amount: amountPerPart, note: `Parcela ${i + 1}/${installmentCount}`, status: (isFirst && payFirstNow) ? PaymentStatus.PAID : PaymentStatus.SCHEDULED });
        }
        setShowInstallmentModal(false);
    };

    const resetPaymentForm = () => { setEditingPaymentId(null); setPaymentAmount(''); setPaymentNote(''); setPaymentInvoice(''); setPaymentDate(new Date().toISOString().split('T')[0]); setIsAdjustment(false); setAdjustmentDesc(''); };
    const openPaymentModal = (paymentToEdit?: Payment) => {
        if (paymentToEdit) { setEditingPaymentId(paymentToEdit.id); setPaymentAmount(paymentToEdit.amount.toString()); setPaymentDate(new Date(paymentToEdit.date).toISOString().split('T')[0]); setPaymentNote(paymentToEdit.note || ''); setPaymentInvoice(paymentToEdit.invoiceNumber || ''); setIsAdjustment(false); }
        else { resetPaymentForm(); if (totals.remaining > 0) setPaymentAmount(totals.remaining.toFixed(2)); }
        setShowPaymentModal(true);
    };

    const handleSaveClient = (updatedClient: Client) => {
        if (updatedClient.id === 'temp') { const newId = Date.now().toString(); addClient({ ...updatedClient, id: newId }); updateProject(project.id, { clientId: newId, clientName: updatedClient.name }); }
        else { updateClient(updatedClient.id, updatedClient); if (updatedClient.name !== project.clientName) updateProject(project.id, { clientName: updatedClient.name }); }
        setShowEditClient(false);
    };

    const handleDelete = () => { if (window.confirm("Deletar este projeto?")) { deleteProject(project.id); navigate('/projects', { replace: true }); } };

    const PaymentHistoryList = () => {
        const list = [...(project.payments || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return (
            <div className="space-y-3">
                {list.length > 0 ? (
                    list.map(pay => {
                        const isPaid = pay.status === PaymentStatus.PAID || !pay.status;
                        const isOverdue = !isPaid && new Date(pay.date) < new Date();
                        return (
                            <div key={pay.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors group gap-4 ${isPaid ? 'bg-white/5 border-white/5' : isOverdue ? 'bg-semantic-red/10 border-semantic-red/30' : 'bg-white/5 border-white/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-brand/10 text-brand' : 'bg-white/5 text-ink-gray'}`}>
                                        {isPaid ? <ShieldCheck size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div>
                                        <p className={`font-bold ${isPaid ? 'text-white' : isOverdue ? 'text-semantic-red' : 'text-ink-dim'}`}><CurrencyDisplay amount={pay.amount} currency={project.currency} /></p>
                                        <p className="text-xs text-ink-gray flex items-center gap-1 flex-wrap">{new Date(pay.date).toLocaleDateString()} • {pay.note || 'Pagamento'} {isOverdue && <span className="text-semantic-red font-bold ml-1">ATRASADO</span>}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    {!isPaid ? (
                                        <Button variant="primary" className="h-8 text-xs px-3" onClick={() => updatePayment(project.id, { ...pay, status: PaymentStatus.PAID, date: new Date().toISOString() })}>Confirmar</Button>
                                    ) : (
                                        <button onClick={() => { setSelectedReceiptPayment(pay); setShowReceiptModal(true); }} className="px-3 py-1.5 rounded-lg bg-black border border-white/10 text-ink-gray hover:text-white hover:border-brand text-xs md:text-[10px] font-bold uppercase flex items-center gap-1"><FileText size={12} /> Recibo</button>
                                    )}
                                    <div className="flex gap-1">
                                        <button onClick={() => openPaymentModal(pay)} className="p-2 text-ink-dim hover:text-white rounded-full" title="Editar"><Edit2 size={16} /></button>
                                        <button onClick={() => { if (window.confirm("Excluir?")) deletePayment(project.id, pay.id) }} className="p-2 text-ink-dim hover:text-semantic-red rounded-full" title="Excluir"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : <div className="text-center py-8 text-ink-dim text-sm border border-dashed border-white/10 rounded-xl">Nenhum pagamento.</div>}
            </div>
        );
    };

    const DashboardTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 flex flex-col justify-between">
                        <p className="text-xs md:text-[10px] font-bold text-ink-gray uppercase tracking-wider">Status</p>
                        <div className="mt-2"><Badge status={project.status} /></div>
                    </Card>
                    <Card className="p-4 flex flex-col justify-between">
                        <p className="text-xs md:text-[10px] font-bold text-ink-gray uppercase tracking-wider">{isRetainer ? 'Valor Mensal' : 'Uso do Orçamento'}</p>
                        {isRetainer ? <p className="text-xl font-bold text-white mt-1"><CurrencyDisplay amount={project.rate} currency={project.currency} /></p> :
                            <div className="mt-2"><div className="flex justify-between text-xs text-ink-gray mb-1"><span><CurrencyDisplay amount={totals.paid} currency={project.currency} showSymbol={false} /> pago</span><span>{Math.round((totals.paid / totals.net) * 100)}%</span></div><ProgressBar current={totals.paid} total={totals.net} className="h-2" /></div>
                        }
                    </Card>
                </div>
                <Card className="relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><Clock size={18} className="text-brand" /> Timer</h3>
                        <div className="text-2xl font-mono font-bold text-white">{isTimerRunning ? new Date(timerSeconds * 1000).toISOString().substr(11, 8) : '00:00:00'}</div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={isTimerRunning ? "danger" : "primary"} className="h-10 px-6" onClick={() => { if (isTimerRunning) { addWorkLog(project.id, { id: Date.now().toString(), date: new Date().toISOString(), hours: timerSeconds / 3600, description: desc || 'Sessão Rápida', billable: true }); setTimerSeconds(0); setDesc(''); } setIsTimerRunning(!isTimerRunning); }}>{isTimerRunning ? 'Parar & Salvar' : 'Iniciar'}</Button>
                        <input placeholder="Descrição" className="flex-1 bg-white/5 text-white rounded-xl px-4 text-sm outline-none focus:ring-1 focus:ring-brand" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><User size={18} className="text-semantic-blue" /> Cliente</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar name={project.clientName} className="w-12 h-12" />
                        <div><p className="font-bold text-white">{project.clientName}</p><p className="text-xs text-ink-gray">{client?.companyName || 'PF'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2"><Button variant="secondary" className="h-9 text-xs" onClick={() => setShowEditClient(true)}>Perfil</Button>{client?.website && <a href={client.website} target="_blank" className="h-9 flex items-center justify-center gap-2 text-xs bg-white/5 rounded-full hover:bg-white/10 text-white border border-white/10"><Globe size={12} /> Site</a>}</div>
                </Card>
                <Card>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={18} className="text-brand" /> Ações</h3>
                    <div className="space-y-2"><Button variant="ghost" className="w-full justify-between text-ink-gray hover:text-white bg-white/5" onClick={() => setActiveTab('FINANCIALS')}><span>Financeiro</span> <DollarSign size={14} /></Button><Button variant="ghost" className="w-full justify-between text-ink-gray hover:text-white bg-white/5" onClick={handleWhatsAppBilling}><span>Cobrar no Zap</span> <MessageCircle size={14} className="text-semantic-green" /></Button></div>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 md:space-y-6 pb-24 no-print max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between"><button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-ink-gray hover:text-white transition-colors"><ArrowLeft size={20} /> <span className="font-bold">Voltar</span></button></div>
            <div className="flex justify-between items-end"><div><h1 className="text-4xl font-extrabold text-white mb-2">{project.clientName}</h1><div className="flex gap-3"><Badge status={project.status} /><span className="text-xs font-bold text-ink-gray bg-white/5 px-2 py-1 rounded uppercase tracking-wider border border-white/10">{project.contractType === ProjectContractType.RETAINER ? 'Retainer' : project.type}</span></div></div><div className="hidden md:block text-right"><p className="text-xs font-bold text-ink-gray uppercase tracking-wider mb-1">Valor Total</p><p className="text-2xl font-extrabold text-white"><CurrencyDisplay amount={totals.gross} currency={project.currency} /></p></div></div>

            <div className="border-b border-white/10 flex gap-6 overflow-x-auto no-scrollbar">
                {([{ id: 'DASHBOARD', label: 'VISÃO GERAL' }, { id: 'FINANCIALS', label: 'FINANCEIRO' }, { id: 'PLAN', label: 'PLANEJAMENTO' }, { id: 'MANAGE', label: 'GERENCIAR' }] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id ? 'text-brand border-brand' : 'text-ink-gray border-transparent hover:text-white'}`}>{tab.label}</button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'DASHBOARD' && <DashboardTab />}
                {activeTab === 'FINANCIALS' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <Card className="flex flex-col justify-between"><span className="text-xs font-bold text-ink-gray uppercase tracking-wider">Total Bruto</span><div className="mt-2 text-2xl font-extrabold text-white"><CurrencyDisplay amount={totals.gross} currency={project.currency} /></div></Card>
                            <Card className="flex flex-col justify-between"><span className="text-xs font-bold text-ink-gray uppercase tracking-wider">Recebido</span><div className="mt-2 text-2xl font-extrabold text-brand"><CurrencyDisplay amount={totals.paid} currency={project.currency} /></div></Card>
                            <Card className="flex flex-col justify-between"><span className="text-xs font-bold text-ink-gray uppercase tracking-wider">Pendente</span><div className="mt-2 text-2xl font-extrabold text-ink-dim"><CurrencyDisplay amount={totals.remaining} currency={project.currency} /></div></Card>
                        </div>
                        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
                            <Button variant="primary" onClick={() => openPaymentModal()} className="whitespace-nowrap"><Plus size={18} /> Pagamento</Button>
                            <Button variant="outline" onClick={() => { resetPaymentForm(); setIsAdjustment(true); setShowPaymentModal(true); }} className="whitespace-nowrap border-white/10 text-white">Extra</Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-white text-lg">Histórico</h3><Badge status={project.status} /></div>
                                <PaymentHistoryList />
                            </div>
                            <div className="space-y-6">
                                <Card>
                                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Lucro Líquido</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-ink-gray"><span>Bruto</span><span><CurrencyDisplay amount={totals.gross} currency={project.currency} /></span></div>
                                        <div className="flex justify-between text-ink-gray"><span>Taxas ({project.platformFee}%)</span><span className="text-semantic-red">- <CurrencyDisplay amount={totals.gross * ((project.platformFee || 0) / 100)} currency={project.currency} /></span></div>
                                        <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-base"><span>Lucro Real</span><span className="text-brand"><CurrencyDisplay amount={totals.profit} currency={project.currency} /></span></div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'PLAN' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
                        <Card className="h-fit">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><CheckCircle2 size={20} className="text-brand" /> Checklist</h3>
                            <div className="flex gap-2 mb-6"><input className="flex-1 bg-white/5 text-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-brand/50 transition-colors" placeholder="Nova tarefa..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && newTaskText && updateProject(project.id, { checklist: [...(project.checklist || []), { id: Date.now().toString(), text: newTaskText, completed: false }] }) && setNewTaskText('')} /><Button variant="secondary" onClick={() => { if (newTaskText) { updateProject(project.id, { checklist: [...(project.checklist || []), { id: Date.now().toString(), text: newTaskText, completed: false }] }); setNewTaskText(''); } }}><Plus size={16} /></Button></div>
                            <div className="space-y-2">{(project.checklist || []).map(t => (<div key={t.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl cursor-pointer" onClick={() => updateProject(project.id, { checklist: project.checklist?.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x) })}>{t.completed ? <CheckCircle2 className="text-brand" size={20} /> : <Circle className="text-ink-gray hover:text-brand" size={20} />}<span className={`flex-1 ${t.completed ? "text-ink-dim line-through" : "text-white"}`}>{t.text}</span></div>))}</div>
                        </Card>
                        <Card className="h-fit"><h3 className="font-bold text-white mb-6 flex items-center gap-2"><Calendar size={20} className="text-semantic-blue" /> Timeline</h3><div className="relative pl-4 border-l-2 border-white/10 space-y-8 ml-2"><div className="relative pl-6"><div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-black border-2 border-semantic-blue"></div><p className="text-xs text-ink-gray font-bold uppercase mb-1">{new Date(project.startDate).toLocaleDateString()}</p><h4 className="text-white font-bold">Início</h4></div>{(project.dueDate) && (<div className="relative pl-6"><div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-black border-2 border-ink-gray"></div><p className="text-xs text-ink-gray font-bold uppercase mb-1">{new Date(project.dueDate).toLocaleDateString()}</p><h4 className="text-white font-bold">Prazo</h4></div>)}</div></Card>
                    </div>
                )}
                {activeTab === 'MANAGE' && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
                        <Card><h3 className="font-bold text-white mb-4">Ajustes</h3><div className="space-y-4"><Button variant="secondary" className="w-full justify-start" onClick={() => setShowEditProject(true)}><Edit2 size={16} className="mr-3" /> Editar Detalhes</Button></div></Card>
                        <Card className="border-semantic-red/30 bg-semantic-red/5"><h3 className="font-bold text-semantic-red mb-2">Zona de Perigo</h3><Button variant="danger" className="w-full" onClick={handleDelete}><Trash2 size={16} /> Deletar Projeto</Button></Card>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">Novo Pagamento</h3>
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

            {showEditProject && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"><div className="bg-base-card rounded-3xl p-6 w-full max-w-lg border border-white/10"><h3 className="text-xl font-bold text-white mb-6">Editar Projeto</h3><div className="space-y-4"><Input label="Nome" value={project.clientName} onChange={e => updateProject(project.id, { clientName: e.target.value })} /><div className="grid grid-cols-2 gap-4"><Input label="Valor" type="number" value={project.rate} onChange={e => updateProject(project.id, { rate: parseFloat(e.target.value) })} /><Select label="Moeda" value={project.currency} onChange={e => updateProject(project.id, { currency: e.target.value as Currency })}>{Object.values(Currency).map(c => <option className="bg-black" key={c} value={c}>{c}</option>)}</Select></div><Select label="Status" value={project.status} onChange={e => updateProject(project.id, { status: e.target.value as ProjectStatus })}>{Object.values(ProjectStatus).map(s => <option className="bg-black" key={s} value={s}>{s}</option>)}</Select><Button className="w-full mt-4" onClick={() => setShowEditProject(false)}>Salvar</Button></div></div></div>}
        </div>
    );
};

export default ProjectDetails;
