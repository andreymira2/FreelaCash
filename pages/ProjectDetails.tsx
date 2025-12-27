import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, Button, Badge, CurrencyDisplay, Input, Avatar, ProgressBar, Select, SensitiveInput } from '../components/ui';
import BillingModal from '../components/BillingModal';
import { ProjectStatus, ProjectContractType, Payment, PaymentStatus, Client, Currency, CURRENCY_SYMBOLS } from '../types';
import { ArrowLeft, Clock, Trash2, DollarSign, Edit2, User, Plus, CheckCircle2, Circle, FileText, Calendar, ShieldCheck, Settings, Send, Copy } from 'lucide-react';
import { useProjectFinancials } from '../hooks/useFinancialEngine';
import { parseLocalDateToISO, parseNumber, toInputDate } from '../utils/format';

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { projects, clients, userProfile, updateProject, deleteProject, duplicateProject, addPayment, updatePayment, deletePayment, addProjectAdjustment, updateClient, addClient } = useData();
    const navigate = useNavigate();

    const project = projects.find(p => p.id === id);
    const projectFinancials = useProjectFinancials(id || '');

    const [showEditProject, setShowEditProject] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false);
    const [showEditClient, setShowEditClient] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
    const [showBillingModal, setShowBillingModal] = useState(false);

    const [installmentCount, setInstallmentCount] = useState(2);
    const [installmentDate, setInstallmentDate] = useState(toInputDate(new Date().toISOString()));
    const [payFirstNow, setPayFirstNow] = useState(true);

    const [clientForm, setClientForm] = useState<Partial<Client>>({});

    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(toInputDate(new Date().toISOString()));
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
        if (!projectFinancials) return { gross: 0, net: 0, paid: 0, profit: 0, remaining: 0, expenseTotal: 0, adjustments: 0, fees: 0 };
        return {
            gross: projectFinancials.gross,
            net: projectFinancials.net,
            paid: projectFinancials.paid,
            profit: projectFinancials.profit,
            remaining: projectFinancials.remaining,
            expenseTotal: projectFinancials.expenseTotal,
            adjustments: projectFinancials.adjustments,
            fees: projectFinancials.fees
        };
    }, [projectFinancials]);

    if (!project) return <div className="p-8 text-center text-ink-gray">Projeto não encontrado.</div>;


    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseNumber(paymentAmount);
        if (amount <= 0) return;
        const dateStr = parseLocalDateToISO(paymentDate);

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

    const resetPaymentForm = () => { setEditingPaymentId(null); setPaymentAmount(''); setPaymentNote(''); setPaymentInvoice(''); setPaymentDate(toInputDate(new Date().toISOString())); setIsAdjustment(false); setAdjustmentDesc(''); };

    const openPaymentModal = (paymentToEdit?: Payment) => {
        if (paymentToEdit) {
            setEditingPaymentId(paymentToEdit.id);
            setPaymentAmount(paymentToEdit.amount.toString());
            setPaymentDate(toInputDate(paymentToEdit.date));
            setPaymentNote(paymentToEdit.note || '');
            setPaymentInvoice(paymentToEdit.invoiceNumber || '');
            setIsAdjustment(false);
        } else {
            resetPaymentForm();
            if (totals.remaining > 0) setPaymentAmount(totals.remaining.toFixed(2));
        }
        setShowPaymentModal(true);
    };

    const openEditClientModal = () => {
        if (client) {
            setClientForm({
                ...client,
                name: client.name || '',
                companyName: client.companyName || '',
                taxId: client.taxId || '',
                billingEmail: client.billingEmail || '',
                email: client.email || '',
                phone: client.phone || ''
            });
            setShowEditClient(true);
        }
    };

    const handleConfirmPayment = (pay: Payment) => {
        updatePayment(project.id, { ...pay, status: PaymentStatus.PAID, date: new Date().toISOString() });
    };

    const handleSaveClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientForm.name) return;

        const updatedClient = {
            ...client!,
            ...clientForm
        } as Client;

        if (updatedClient.id === 'temp') {
            const newId = Date.now().toString();
            addClient({ ...updatedClient, id: newId });
            updateProject(project.id, { clientId: newId, clientName: updatedClient.name });
        } else {
            updateClient(updatedClient.id, updatedClient);
            if (updatedClient.name !== project.clientName) updateProject(project.id, { clientName: updatedClient.name });
        }
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
            const d = new Date(`${installmentDate}T12:00:00`);
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

            {/* Progress Bar - Only for non-retainer projects */}
            {!isRetainer ? (
                <div className="bg-base-card rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between text-xs font-medium text-ink-dim mb-2">
                        <span>Progresso de pagamento</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                    </div>
                </div>
            ) : (
                <div className="bg-base-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                            <Calendar size={18} className="text-brand" />
                        </div>
                        <div>
                            <p className="text-xs text-ink-gray font-medium">Próximo vencimento</p>
                            <p className="text-white font-bold">
                                Dia {project.renewalDate ? new Date(project.renewalDate).getDate() : new Date().getDate()}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-ink-gray">MRR</p>
                        <p className="text-brand font-bold">
                            <CurrencyDisplay amount={totals.net} currency={project.currency} />
                        </p>
                    </div>
                </div>
            )}

            {/* Billing Banner */}
            {totals.remaining > 0 && (
                <button
                    onClick={() => setShowBillingModal(true)}
                    className="w-full bg-gradient-to-r from-brand to-brand/80 hover:from-brand/90 hover:to-brand/70 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all shadow-lg shadow-brand/20 hover:shadow-brand/30 active:scale-[0.99]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                            <Send size={24} className="text-black" />
                        </div>
                        <div className="text-left">
                            <p className="text-black font-bold text-base">Cobrar Cliente</p>
                            <p className="text-black/70 text-sm">WhatsApp, Email ou Copiar</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-black/60 text-xs font-medium">Valor pendente</p>
                        <p className="text-black font-extrabold text-lg">
                            <CurrencyDisplay amount={totals.remaining} currency={project.currency} />
                        </p>
                    </div>
                </button>
            )}

            {/* Main Content - Single Page */}
            <div className="space-y-6">
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
                </div>

                {/* Payment History */}
                <div>
                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-brand" />
                        Pagamentos
                    </h3>
                    <div className="space-y-3">
                        {paymentsList.length > 0 ? paymentsList.map(pay => {
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
                                            <Button variant="primary" className="h-8 text-xs px-3" onClick={() => handleConfirmPayment(pay)}>
                                                Confirmar
                                            </Button>
                                        ) : (
                                            <button onClick={() => { setSelectedReceiptPayment(pay); setShowReceiptModal(true); }} className="px-3 py-1.5 rounded-lg bg-black border border-white/10 text-ink-gray hover:text-white hover:border-brand text-xs font-bold uppercase flex items-center gap-1">
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
                        }) : (
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
                                <span className="text-semantic-red">- <CurrencyDisplay amount={totals.fees} currency={project.currency} /></span>
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
                        <Button variant="ghost" className="h-8 text-xs" onClick={openEditClientModal}>Editar</Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Avatar name={project.clientName} className="w-12 h-12" />
                        <div>
                            <p className="font-bold text-white">{project.clientName}</p>
                            <p className="text-xs text-ink-gray">{client?.companyName || 'Pessoa Física'}</p>
                        </div>
                    </div>
                </Card>

                {/* Collapsible Checklist */}
                <Card>
                    <button onClick={() => setShowChecklist(!showChecklist)} className="w-full flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-brand" /> Checklist
                            {project.checklist && project.checklist.length > 0 && (
                                <span className="text-xs text-ink-gray">({project.checklist.filter(t => t.completed).length}/{project.checklist.length})</span>
                            )}
                        </h3>
                        <span className="text-ink-gray text-sm">{showChecklist ? '−' : '+'}</span>
                    </button>
                    {showChecklist && (
                        <div className="mt-4 animate-in slide-in-from-top-2">
                            <div className="flex gap-2 mb-4">
                                <input className="flex-1 bg-white/5 text-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-brand/50 transition-colors" placeholder="Nova tarefa..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTaskText) { updateProject(project.id, { checklist: [...(project.checklist || []), { id: Date.now().toString(), text: newTaskText, completed: false }] }); setNewTaskText(''); } }} />
                                <Button variant="secondary" onClick={() => { if (newTaskText) { updateProject(project.id, { checklist: [...(project.checklist || []), { id: Date.now().toString(), text: newTaskText, completed: false }] }); setNewTaskText(''); } }}>
                                    <Plus size={16} />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {(project.checklist || []).map(t => (
                                    <div key={t.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors" onClick={() => updateProject(project.id, { checklist: project.checklist?.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x) })}>
                                        {t.completed ? <CheckCircle2 className="text-brand" size={20} /> : <Circle className="text-ink-gray hover:text-brand" size={20} />}
                                        <span className={`flex-1 ${t.completed ? "text-ink-dim line-through" : "text-white"}`}>{t.text}</span>
                                    </div>
                                ))}
                                {(!project.checklist || project.checklist.length === 0) && <p className="text-center py-4 text-ink-dim text-sm">Nenhuma tarefa ainda.</p>}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Inline Timeline Summary */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-ink-gray">
                        <Calendar size={14} />
                        <span>Início: {new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    {project.dueDate && (
                        <div className="flex items-center gap-2 text-ink-gray">
                            <Calendar size={14} />
                            <span>Prazo: {new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" className="h-10" onClick={() => setShowEditProject(true)}>
                        <Edit2 size={16} /> Editar Projeto
                    </Button>
                    <Button variant="danger" className="h-10" onClick={handleDelete}>
                        <Trash2 size={16} /> Deletar
                    </Button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                            <DollarSign size={24} className="text-brand" />
                            {editingPaymentId ? 'Editar Pagamento' : 'Novo Pagamento'}
                        </h3>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <Input label="Valor" type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required autoFocus placeholder="0.00" />
                            <Input label="Data" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                            <Input label="Descrição / Nota" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Ex: Entrada parcial" />
                            <Input label="Nº Nota Fiscal (Opcional)" value={paymentInvoice} onChange={e => setPaymentInvoice(e.target.value)} placeholder="0001" />

                            {!editingPaymentId && (
                                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
                                    <input
                                        type="checkbox"
                                        checked={isAdjustment}
                                        onChange={e => setIsAdjustment(e.target.checked)}
                                        className="w-5 h-5 rounded bg-white/10 border-white/20 accent-brand"
                                    />
                                    <div>
                                        <span className="text-sm text-white font-medium">É um ajuste (extra)</span>
                                        <p className="text-xs text-ink-gray">Aumenta o orçamento total do projeto</p>
                                    </div>
                                </label>
                            )}

                            {isAdjustment && (
                                <Input
                                    label="Motivo do Ajuste"
                                    value={adjustmentDesc}
                                    onChange={e => setAdjustmentDesc(e.target.value)}
                                    placeholder="Ex: Alterações de escopo, urgência..."
                                />
                            )}

                            <div className="pt-4 space-y-2">
                                <Button type="submit" className="w-full h-12 font-bold">Salvar</Button>
                                <Button type="button" variant="ghost" className="w-full h-12" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Client Modal */}
            {showEditClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-lg border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                            <User size={24} className="text-brand" />
                            Informações do Cliente
                        </h3>
                        <form onSubmit={handleSaveClient} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nome do Contato *"
                                    value={clientForm.name || ''}
                                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Nome da Empresa (Opcional)"
                                    value={clientForm.companyName || ''}
                                    onChange={e => setClientForm({ ...clientForm, companyName: e.target.value })}
                                />
                            </div>

                            <SensitiveInput
                                label="CPF / CNPJ (Privado)"
                                value={clientForm.taxId || ''}
                                onChange={e => setClientForm({ ...clientForm, taxId: e.target.value })}
                                placeholder="000.000.000-00"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="E-mail"
                                    type="email"
                                    value={clientForm.email || ''}
                                    onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                />
                                <Input
                                    label="Telefone"
                                    value={clientForm.phone || ''}
                                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <Input
                                label="E-mail de Cobrança (Opcional)"
                                type="email"
                                value={clientForm.billingEmail || ''}
                                onChange={e => setClientForm({ ...clientForm, billingEmail: e.target.value })}
                                placeholder="financeiro@exemplo.com"
                            />

                            <div className="pt-4 space-y-2">
                                <Button type="submit" className="w-full h-12 font-bold">Salvar Alterações</Button>
                                <Button type="button" variant="ghost" className="w-full h-12" onClick={() => setShowEditClient(false)}>Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {showEditProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-lg border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                            <Settings size={24} className="text-brand" />
                            Editar Projeto
                        </h3>
                        <div className="space-y-4">
                            <Input label="Categoria / Nome" value={project.clientName} onChange={e => updateProject(project.id, { clientName: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Valor" type="number" value={project.rate} onChange={e => updateProject(project.id, { rate: parseFloat(e.target.value) || 0 })} />
                                <Select label="Moeda" value={project.currency} onChange={e => updateProject(project.id, { currency: e.target.value as Currency })}>
                                    {Object.values(Currency).map(c => <option className="bg-black" key={c} value={c}>{c}</option>)}
                                </Select>
                            </div>
                            <Select label="Status" value={project.status} onChange={e => updateProject(project.id, { status: e.target.value as ProjectStatus })}>
                                {Object.values(ProjectStatus).map(s => <option className="bg-black" key={s} value={s}>{s}</option>)}
                            </Select>
                            <div className="pt-4 space-y-2">
                                <Button className="w-full h-12 font-bold" onClick={() => setShowEditProject(false)}>Salvar Projeto</Button>
                                <Button variant="ghost" className="w-full h-12" onClick={() => setShowEditProject(false)}>Fechar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Installment Modal */}
            {showInstallmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6">Parcelar Pagamento</h3>
                        <form onSubmit={handleGenerateInstallments} className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl mb-4 border border-white/5">
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
                            <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer border border-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={payFirstNow}
                                    onChange={e => setPayFirstNow(e.target.checked)}
                                    className="w-5 h-5 rounded bg-white/10 border-white/20 accent-brand"
                                />
                                <span className="text-sm text-white font-medium">Marcar primeira parcela como paga</span>
                            </label>
                            <div className="p-4 bg-brand/10 rounded-xl border border-brand/20">
                                <p className="text-sm text-brand font-bold">
                                    {installmentCount}x de <CurrencyDisplay amount={totals.remaining / installmentCount} currency={project.currency} />
                                </p>
                            </div>
                            <div className="pt-4 space-y-2">
                                <Button type="submit" className="w-full h-12 font-bold">Gerar Parcelas</Button>
                                <Button type="button" variant="ghost" className="w-full h-12" onClick={() => setShowInstallmentModal(false)}>Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && selectedReceiptPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-base-card rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6">Recibo de Pagamento</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl space-y-3 border border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-ink-gray uppercase font-bold tracking-wider">Cliente</span>
                                    <span className="text-white font-bold">{project.clientName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-ink-gray uppercase font-bold tracking-wider">Projeto</span>
                                    <span className="text-white font-medium">{project.category}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-ink-gray uppercase font-bold tracking-wider">Data</span>
                                    <span className="text-white font-medium">{new Date(selectedReceiptPayment.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-ink-gray uppercase font-bold tracking-wider">Descrição</span>
                                    <span className="text-white font-medium">{selectedReceiptPayment.note || 'Pagamento'}</span>
                                </div>
                                {selectedReceiptPayment.invoiceNumber && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-ink-gray uppercase font-bold tracking-wider">Nota Fiscal</span>
                                        <span className="text-white font-medium">{selectedReceiptPayment.invoiceNumber}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                                    <span className="text-sm text-ink-gray font-bold uppercase">Valor Pago</span>
                                    <span className="text-brand text-2xl font-black font-mono"><CurrencyDisplay amount={selectedReceiptPayment.amount} currency={project.currency} /></span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-[10px] text-ink-dim uppercase font-bold tracking-tighter">
                                <span>Emitido por: {userProfile.name}</span>
                                {userProfile.pixKey && <span>PIX: {userProfile.pixKey}</span>}
                            </div>
                            <Button className="w-full h-12 font-bold" onClick={() => setShowReceiptModal(false)}>Fechar Recibo</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Modal */}
            <BillingModal
                isOpen={showBillingModal}
                onClose={() => setShowBillingModal(false)}
                clientName={project.clientName}
                projectCategory={project.category}
                currency={project.currency}
                grossAmount={totals.gross}
                paidAmount={totals.paid}
                remainingAmount={totals.remaining}
                pixKey={userProfile.pixKey}
                userName={userProfile.name}
                taxId={userProfile.taxId}
                clientEmail={client?.billingEmail}
            />
        </div >
    );
};

export default ProjectDetails;
