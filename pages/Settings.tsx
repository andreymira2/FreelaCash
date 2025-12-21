
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, Input, Button, Select, Avatar, CurrencyDisplay, PageHeader } from '../components/ui';
import { Currency, CURRENCY_SYMBOLS } from '../types';
import { Save, User, Download, Upload, Database, Globe, BadgeCheck, CreditCard, HardDrive, BookOpen, DollarSign, CheckCircle2, LayoutDashboard, FolderKanban, Wallet, Printer, Monitor, WifiOff, Camera, LogOut } from 'lucide-react';

const DarkCard = ({ children, className = '' }: any) => (
    <div className={`bg-base-card text-white p-6 rounded-2xl border border-white/5 ${className}`}>
        {children}
    </div>
);

const DarkInput = React.memo(({ label, value, onChange, ...props }: any) => (
    <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-xs font-bold text-ink-dim uppercase tracking-widest ml-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all placeholder-ink-dim"
            {...props}
        />
    </div>
));

const Settings: React.FC = () => {
    const { settings, userProfile, updateSettings, updateUserProfile, exportData, importData, loadDemoData, projects, clients, expenses, getFutureRecurringIncome } = useData();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'APP' | 'DATA' | 'HELP'>('PROFILE');

    const [settingsForm, setSettingsForm] = useState(settings);
    const [profileForm, setProfileForm] = useState(userProfile);
    const [saved, setSaved] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleProfileFieldChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileForm(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(settingsForm);
        updateUserProfile(profileForm);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExport = () => {
        const dataStr = exportData();
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `freelacash_backup_${new Date().toISOString().split('T')[0]}.json`);
        linkElement.click();
    };

    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result && importData(event.target.result as string)) {
                alert("Dados importados com sucesso! Atualizando...");
                window.location.reload();
            } else alert("Formato de arquivo inválido.");
        };
        reader.readAsText(file);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert("A imagem deve ter no máximo 2MB."); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setProfileForm({ ...profileForm, avatar: result });
        };
        reader.readAsDataURL(file);
    };

    const TabButton = ({ id, icon: Icon, label }: any) => (
        <Button
            variant="ghost"
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-4 transition-all rounded-none ${activeTab === id ? 'border-brand text-white font-bold bg-transparent hover:bg-transparent' : 'border-transparent text-ink-gray hover:text-white bg-transparent hover:bg-transparent'}`}
        >
            <Icon size={20} /> <span className="hidden md:inline">{label}</span>
        </Button>
    );

    const featuresList = [
        {
            title: "Dashboard & Insights",
            icon: LayoutDashboard,
            items: [
                "Visão Financeira em Tempo Real",
                "Acompanhamento de Meta Mensal",
                "Tendência Financeira de 6 Meses",
                "Itens de Atenção Inteligentes",
                "Feed de Atividade Recente"
            ]
        },
        {
            title: "Gestão de Projetos",
            icon: FolderKanban,
            items: [
                "Suporte a Projetos Pontuais e Retainers",
                "Rastreamento Visual de Progresso",
                "Indicadores de Risco",
                "Checklists de Tarefas & Timeline",
                "Gerador de Cobrança WhatsApp"
            ]
        },
        {
            title: "Controle Financeiro",
            icon: DollarSign,
            items: [
                "Suporte Multi-moeda (BRL, USD, EUR)",
                "Planejamento de Parcelamento",
                "Ajustes de Projeto (Escopo Extra)",
                "Geração de Recibos Profissionais",
                "Cálculo de Lucro Real"
            ]
        },
        {
            title: "Rastreamento de Despesas",
            icon: Wallet,
            items: [
                "Gestão de Assinaturas Recorrentes",
                "Registro de Despesas Variáveis",
                "Presets Rápidos de Serviços",
                "Cálculo de Custo Fixo Mensal",
                "Edição e Status de Pagamento"
            ]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24 animate-in fade-in">

            <PageHeader
                title="Configurações"
                subtitle="Personalize sua experiência."
                className="no-print"
                action={
                    activeTab !== 'HELP' ? (
                        <Button onClick={handleSave} variant={saved ? 'primary' : 'secondary'} className="shadow-lg">
                            {saved ? <BadgeCheck size={20} /> : <Save size={20} />}
                            <span>{saved ? 'Salvo!' : 'Salvar Alterações'}</span>
                        </Button>
                    ) : (
                        <Button onClick={() => window.print()} variant="outline" className="hidden md:flex">
                            <Printer size={20} /> <span className="ml-2">Imprimir</span>
                        </Button>
                    )
                }
            />

            <div className="flex border-b border-white/10 mb-10 overflow-x-auto no-print">
                <TabButton id="PROFILE" icon={User} label="Perfil & ID" />
                <TabButton id="APP" icon={Globe} label="Preferências" />
                <TabButton id="DATA" icon={HardDrive} label="Dados & Backup" />
                <TabButton id="HELP" icon={BookOpen} label="Guia do Sistema" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {activeTab === 'PROFILE' && (
                    <>
                        <div className="md:col-span-2 space-y-6">
                            <DarkCard>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><User size={20} className="text-ink-gray" /> Detalhes Públicos</h3>

                                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/10">
                                    <div
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-brand/20 transition-all relative group overflow-hidden"
                                    >
                                        <Avatar name={profileForm.name} src={profileForm.avatar} className="w-full h-full text-2xl" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Foto de Perfil</p>
                                        <p className="text-sm text-ink-gray mb-2">Clique na imagem para alterar.</p>
                                        <Button variant="ghost" className="h-8 px-3 text-xs bg-white/5 text-ink-gray hover:bg-white/10 hover:text-white" onClick={() => avatarInputRef.current?.click()}>Carregar Nova</Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <DarkInput label="Nome Completo" value={profileForm.name} onChange={handleProfileFieldChange('name')} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <DarkInput label="Cargo / Título" value={profileForm.title || ''} onChange={handleProfileFieldChange('title')} />
                                        <DarkInput label="Localização" value={profileForm.location || ''} onChange={handleProfileFieldChange('location')} />
                                    </div>
                                </div>
                            </DarkCard>
                            <DarkCard>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><CreditCard size={20} className="text-ink-gray" /> Dados de Cobrança</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DarkInput label="CPF / CNPJ" placeholder="000.000.000-00" value={profileForm.taxId || ''} onChange={handleProfileFieldChange('taxId')} />
                                    <DarkInput label="Chave PIX / Conta" placeholder="Chave" value={profileForm.pixKey || ''} onChange={handleProfileFieldChange('pixKey')} />
                                </div>
                            </DarkCard>
                        </div>

                        <div className="md:col-span-1">
                            <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-4">Visualização do Cartão</p>
                            <div className="bg-gradient-to-br from-base-card to-black rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-[60px] pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <Avatar name={profileForm.name} src={profileForm.avatar} className="w-24 h-24 text-3xl mb-4 ring-4 ring-white/10 shadow-lg object-cover" />
                                    <h3 className="text-xl font-black text-white">{profileForm.name || 'Seu Nome'}</h3>
                                    <p className="text-sm text-brand font-bold uppercase tracking-wider mb-6">{profileForm.title || 'Freelancer'}</p>

                                    <div className="w-full bg-white/5 rounded-xl p-3 mb-2 border border-white/5">
                                        <p className="text-xs text-ink-dim uppercase font-bold">Local</p>
                                        <p className="text-sm text-ink-gray">{profileForm.location || 'Remoto'}</p>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-xs text-ink-dim uppercase font-bold">ID / Tax</p>
                                        <p className="text-sm text-ink-gray">{profileForm.taxId || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'APP' && (
                    <div className="md:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DarkCard>
                                <h3 className="text-lg font-bold text-white mb-2">Moeda Principal</h3>
                                <p className="text-sm text-ink-gray mb-6">Todos os relatórios serão convertidos para esta moeda.</p>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-ink-dim uppercase tracking-widest ml-1">Moeda Padrão</label>
                                    <Select
                                        label=""
                                        value={settingsForm.mainCurrency}
                                        onChange={e => setSettingsForm({ ...settingsForm, mainCurrency: e.target.value as Currency })}
                                        className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold outline-none"
                                    >
                                        {Object.values(Currency).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>)}
                                    </Select>
                                </div>
                            </DarkCard>
                            <DarkCard>
                                <h3 className="text-lg font-bold text-white mb-2">Meta de Receita Mensal</h3>
                                <p className="text-sm text-ink-gray mb-6">Alvo para o gráfico de progresso do Dashboard.</p>
                                <DarkInput type="number" value={settingsForm.monthlyGoal} onChange={(e: any) => setSettingsForm({ ...settingsForm, monthlyGoal: parseFloat(e.target.value) })} label="Valor da Meta" />
                            </DarkCard>
                            <DarkCard>
                                <h3 className="text-lg font-bold text-white mb-2">Reserva para Impostos</h3>
                                <p className="text-sm text-ink-gray mb-6">Percentual da receita a separar para impostos (ex: MEI = 5%, Simples = 6-15%).</p>
                                <DarkInput 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    step="0.5"
                                    value={settingsForm.taxReservePercent || 0} 
                                    onChange={(e: any) => setSettingsForm({ ...settingsForm, taxReservePercent: parseFloat(e.target.value) || 0 })} 
                                    label="Percentual (%)" 
                                    placeholder="0"
                                />
                            </DarkCard>
                        </div>

                        <DarkCard>
                            <h3 className="text-lg font-bold text-white mb-6">Taxas de Câmbio (Manual)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.values(Currency).map(c => (
                                    <div key={c} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-white">{c}</span>
                                            <span className="text-xs text-ink-dim">{CURRENCY_SYMBOLS[c]}</span>
                                        </div>
                                        <Input
                                            label=""
                                            type="number"
                                            step="0.01"
                                            disabled={c === Currency.BRL}
                                            value={settingsForm.exchangeRates[c]}
                                            onChange={e => setSettingsForm({ ...settingsForm, exchangeRates: { ...settingsForm.exchangeRates, [c]: parseFloat(e.target.value) } })}
                                            className="w-full bg-transparent text-white font-mono font-bold outline-none focus:text-brand disabled:opacity-50 border-none p-0 focus:ring-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </DarkCard>
                    </div>
                )}

                {activeTab === 'DATA' && (
                    <div className="md:col-span-2 md:col-start-1 space-y-6">
                        <DarkCard className="bg-semantic-blue/10 border-semantic-blue/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-semantic-blue/20 rounded-full flex items-center justify-center text-semantic-blue">
                                    <Download size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg">Backup dos Dados</h3>
                                    <p className="text-sm text-ink-gray">Salve seus projetos e despesas em um arquivo JSON.</p>
                                </div>
                                <Button onClick={handleExport} className="bg-semantic-blue text-white hover:bg-semantic-blue/80 border-none">Exportar</Button>
                            </div>
                        </DarkCard>

                        <DarkCard>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-ink-gray">
                                    <Upload size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg">Restaurar Dados</h3>
                                    <p className="text-sm text-ink-gray">Importe um arquivo de backup salvo anteriormente.</p>
                                </div>
                                <Button variant="outline" onClick={handleImportClick} className="border-white/10 text-white hover:bg-white/5">Importar</Button>
                                <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                            </div>
                        </DarkCard>

                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <h3 className="text-sm font-bold text-ink-dim uppercase tracking-wider mb-4">Zona de Perigo</h3>
                            <Button variant="danger" onClick={() => { if (window.confirm("Sobrescrever tudo com dados de demonstração?")) loadDemoData() }} className="w-full bg-semantic-red/10 text-semantic-red hover:bg-semantic-red/20 border border-semantic-red/20">
                                <Database size={16} className="mr-2" /> Carregar Dados Demo (Reseta o App)
                            </Button>
                        </div>

                        <div className="pt-8 border-t border-white/10">
                            <h3 className="text-sm font-bold text-ink-dim uppercase tracking-wider mb-4">Conta</h3>
                            <Button 
                                variant="outline" 
                                onClick={async () => { 
                                    await signOut(); 
                                    navigate('/welcome'); 
                                }} 
                                className="w-full border-white/10 text-white hover:bg-white/5"
                            >
                                <LogOut size={16} className="mr-2" /> Sair da Conta
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'HELP' && (
                    <div className="md:col-span-3 space-y-6">
                        <DarkCard className="bg-gradient-to-r from-base-card to-black border-white/10 print:hidden">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center shadow-sm border border-brand/20 shrink-0">
                                    <img src="https://cdn-icons-png.flaticon.com/512/2910/2910791.png" className="w-10 h-10" alt="Logo" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-white mb-1">Instalar no Computador</h3>
                                    <p className="text-ink-gray text-sm mb-3">
                                        Instale o FreelaCash como um aplicativo nativo no seu sistema.
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-ink-dim justify-center md:justify-start">
                                        <span className="flex items-center gap-1"><Monitor size={16} /> Win / Mac / Linux</span>
                                        <span className="flex items-center gap-1"><WifiOff size={16} /> Offline</span>
                                    </div>
                                </div>
                            </div>
                        </DarkCard>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                            <DarkCard className="p-4 text-center">
                                <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-1">Total Projetos</p>
                                <p className="text-2xl font-black text-white">{projects.length}</p>
                            </DarkCard>
                            <DarkCard className="p-4 text-center">
                                <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-1">Clientes CRM</p>
                                <p className="text-2xl font-black text-white">{clients.length}</p>
                            </DarkCard>
                            <DarkCard className="p-4 text-center">
                                <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-1">Despesas</p>
                                <p className="text-2xl font-black text-white">{expenses.length}</p>
                            </DarkCard>
                            <DarkCard className="p-4 text-center">
                                <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-1">Recorrência</p>
                                <p className="text-2xl font-black text-brand"><CurrencyDisplay amount={getFutureRecurringIncome()} currency={settings.mainCurrency} /></p>
                            </DarkCard>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {featuresList.map((feature, idx) => (
                                <DarkCard key={idx} className="h-full">
                                    <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-ink-gray">
                                            <feature.icon size={20} />
                                        </div>
                                        <h3 className="font-bold text-white text-lg">{feature.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {feature.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-ink-gray">
                                                <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" />
                                                <span className="leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </DarkCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
