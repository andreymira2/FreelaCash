
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Card, Input, Button, Select, Avatar, CurrencyDisplay, PageHeader } from '../components/ui';
import { Currency, CURRENCY_SYMBOLS } from '../types';
import { Save, User, Download, Upload, Database, Globe, BadgeCheck, CreditCard, Briefcase, HardDrive, BookOpen, Layout, PieChart, Users, DollarSign, Activity, CheckCircle2, Zap, FileText, Smartphone, LayoutDashboard, FolderKanban, Wallet, Printer, Monitor, WifiOff, MousePointer2, Camera } from 'lucide-react';

const Settings: React.FC = () => {
    const { settings, userProfile, updateSettings, updateUserProfile, exportData, importData, loadDemoData, projects, clients, expenses, getFutureRecurringIncome } = useData();
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'APP' | 'DATA' | 'HELP'>('PROFILE');

    const [settingsForm, setSettingsForm] = useState(settings);
    const [profileForm, setProfileForm] = useState(userProfile);
    const [saved, setSaved] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

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
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-4 transition-all rounded-none ${activeTab === id ? 'border-brand text-white font-bold bg-transparent hover:bg-transparent' : 'border-transparent text-zinc-400 hover:text-zinc-200 bg-transparent hover:bg-transparent'}`}
        >
            <Icon size={18} /> <span className="hidden md:inline">{label}</span>
        </Button>
    );

    // Light Card specialized for Settings page high contrast
    const LightCard = ({ children, className = '' }: any) => (
        <div className={`bg-zinc-50 text-zinc-900 p-6 rounded-2xl shadow-lg border border-zinc-200 ${className}`}>
            {children}
        </div>
    );

    // Specialized Input for Light Card - key prop prevents focus loss on re-render
    const LightInput = ({ label, ...props }: any) => (
        <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
            <Input key={label} className="px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-bold focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all placeholder-zinc-500" label="" {...props} />
        </div>
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
        <div className="max-w-7xl mx-auto p-6 md:p-8 pb-24 animate-in fade-in">

            {/* Header */}
            <PageHeader
                title="Configurações"
                subtitle="Personalize sua experiência."
                className="no-print"
                action={
                    activeTab !== 'HELP' ? (
                        <Button onClick={handleSave} variant={saved ? 'primary' : 'secondary'} className={`shadow-lg ${saved ? '' : 'bg-white text-black hover:bg-zinc-200'}`}>
                            {saved ? <BadgeCheck size={18} className="text-black" /> : <Save size={18} className="text-black" />}
                            <span className="text-black">{saved ? 'Salvo!' : 'Salvar Alterações'}</span>
                        </Button>
                    ) : (
                        <Button onClick={() => window.print()} variant="outline" className="hidden md:flex">
                            <Printer size={18} /> <span className="ml-2">Imprimir</span>
                        </Button>
                    )
                }
            />

            {/* Navigation */}
            <div className="flex border-b border-zinc-800 mb-10 overflow-x-auto no-print">
                <TabButton id="PROFILE" icon={User} label="Perfil & ID" />
                <TabButton id="APP" icon={Globe} label="Preferências" />
                <TabButton id="DATA" icon={HardDrive} label="Dados & Backup" />
                <TabButton id="HELP" icon={BookOpen} label="Guia do Sistema" />
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* TAB: PROFILE */}
                {activeTab === 'PROFILE' && (
                    <>
                        <div className="md:col-span-2 space-y-6">
                            <LightCard>
                                <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2"><User size={20} className="text-zinc-400" /> Detalhes Públicos</h3>

                                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-zinc-200">
                                    <div
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-brand/20 transition-all relative group overflow-hidden"
                                    >
                                        <Avatar name={profileForm.name} src={profileForm.avatar} className="w-full h-full text-2xl" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900">Foto de Perfil</p>
                                        <p className="text-sm text-zinc-500 mb-2">Clique na imagem para alterar.</p>
                                        <Button variant="ghost" className="h-8 px-3 text-xs bg-zinc-100 text-zinc-600 hover:bg-zinc-200" onClick={() => avatarInputRef.current?.click()}>Carregar Nova</Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <LightInput label="Nome Completo" value={profileForm.name} onChange={(e: any) => setProfileForm({ ...profileForm, name: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <LightInput label="Cargo / Título" value={profileForm.title || ''} onChange={(e: any) => setProfileForm({ ...profileForm, title: e.target.value })} />
                                        <LightInput label="Localização" value={profileForm.location || ''} onChange={(e: any) => setProfileForm({ ...profileForm, location: e.target.value })} />
                                    </div>
                                </div>
                            </LightCard>
                            <LightCard>
                                <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2"><CreditCard size={20} className="text-zinc-400" /> Dados de Cobrança</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <LightInput label="CPF / CNPJ" placeholder="000.000.000-00" value={profileForm.taxId || ''} onChange={(e: any) => setProfileForm({ ...profileForm, taxId: e.target.value })} />
                                    <LightInput label="Chave PIX / Conta" placeholder="Chave" value={profileForm.pixKey || ''} onChange={(e: any) => setProfileForm({ ...profileForm, pixKey: e.target.value })} />
                                </div>
                            </LightCard>
                        </div>

                        {/* ID Card Preview */}
                        <div className="md:col-span-1">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Visualização do Cartão</p>
                            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <Avatar name={profileForm.name} src={profileForm.avatar} className="w-24 h-24 text-3xl mb-4 ring-4 ring-zinc-800 shadow-lg object-cover" />
                                    <h3 className="text-xl font-black text-white">{profileForm.name || 'Seu Nome'}</h3>
                                    <p className="text-sm text-brand font-bold uppercase tracking-wider mb-6">{profileForm.title || 'Freelancer'}</p>

                                    <div className="w-full bg-zinc-800/50 rounded-xl p-3 mb-2 border border-zinc-700/50">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Local</p>
                                        <p className="text-sm text-zinc-300">{profileForm.location || 'Remoto'}</p>
                                    </div>
                                    <div className="w-full bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">ID / Tax</p>
                                        <p className="text-sm text-zinc-300">{profileForm.taxId || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* TAB: PREFERENCES */}
                {activeTab === 'APP' && (
                    <div className="md:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <LightCard>
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">Moeda Principal</h3>
                                <p className="text-sm text-zinc-500 mb-6">Todos os relatórios serão convertidos para esta moeda.</p>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest ml-1">Moeda Padrão</label>
                                    <Select
                                        label=""
                                        value={settingsForm.mainCurrency}
                                        onChange={e => setSettingsForm({ ...settingsForm, mainCurrency: e.target.value as Currency })}
                                        className="px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-bold outline-none"
                                    >
                                        {Object.values(Currency).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>)}
                                    </Select>
                                </div>
                            </LightCard>
                            <LightCard>
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">Meta de Receita Mensal</h3>
                                <p className="text-sm text-zinc-500 mb-6">Alvo para o gráfico de progresso do Dashboard.</p>
                                <LightInput type="number" value={settingsForm.monthlyGoal} onChange={(e: any) => setSettingsForm({ ...settingsForm, monthlyGoal: parseFloat(e.target.value) })} label="Valor da Meta" />
                            </LightCard>
                        </div>

                        <LightCard>
                            <h3 className="text-lg font-bold text-zinc-900 mb-6">Taxas de Câmbio (Manual)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.values(Currency).map(c => (
                                    <div key={c} className="bg-zinc-100 p-4 rounded-xl border border-zinc-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-zinc-900">{c}</span>
                                            <span className="text-xs text-zinc-500">{CURRENCY_SYMBOLS[c]}</span>
                                        </div>
                                        <Input
                                            label=""
                                            type="number"
                                            step="0.01"
                                            disabled={c === Currency.BRL}
                                            value={settingsForm.exchangeRates[c]}
                                            onChange={e => setSettingsForm({ ...settingsForm, exchangeRates: { ...settingsForm.exchangeRates, [c]: parseFloat(e.target.value) } })}
                                            className="w-full bg-transparent text-zinc-900 font-mono font-bold outline-none focus:text-brand disabled:opacity-50 border-none p-0 focus:ring-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </LightCard>
                    </div>
                )}

                {/* TAB: DATA */}
                {activeTab === 'DATA' && (
                    <div className="md:col-span-2 md:col-start-1 space-y-6">
                        <LightCard className="bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <Download size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-blue-900 text-lg">Backup dos Dados</h3>
                                    <p className="text-sm text-blue-600/80">Salve seus projetos e despesas em um arquivo JSON.</p>
                                </div>
                                <Button onClick={handleExport} className="bg-blue-600 text-white hover:bg-blue-700 border-none">Exportar</Button>
                            </div>
                        </LightCard>

                        <LightCard>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500">
                                    <Upload size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-zinc-900 text-lg">Restaurar Dados</h3>
                                    <p className="text-sm text-zinc-500">Importe um arquivo de backup salvo anteriormente.</p>
                                </div>
                                <Button variant="outline" onClick={handleImportClick} className="border-zinc-300 text-zinc-700 hover:bg-zinc-100">Importar</Button>
                                <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                            </div>
                        </LightCard>

                        <div className="pt-8 border-t border-zinc-800">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Zona de Perigo</h3>
                            <Button variant="danger" onClick={() => { if (window.confirm("Sobrescrever tudo com dados de demonstração?")) loadDemoData() }} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                                <Database size={16} className="mr-2" /> Carregar Dados Demo (Reseta o App)
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB: SYSTEM GUIDE */}
                {activeTab === 'HELP' && (
                    <div className="md:col-span-3 space-y-6">
                        {/* PWA Card */}
                        <LightCard className="bg-gradient-to-r from-zinc-100 to-zinc-200 border-zinc-300 print:hidden">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-200 shrink-0">
                                    <img src="https://cdn-icons-png.flaticon.com/512/2910/2910791.png" className="w-10 h-10" alt="Logo" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-zinc-900 mb-1">Instalar no Computador</h3>
                                    <p className="text-zinc-600 text-sm mb-3">
                                        Instale o FreelaCash como um aplicativo nativo no seu sistema.
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500 justify-center md:justify-start">
                                        <span className="flex items-center gap-1"><Monitor size={14} /> Win / Mac / Linux</span>
                                        <span className="flex items-center gap-1"><WifiOff size={14} /> Offline</span>
                                    </div>
                                </div>
                            </div>
                        </LightCard>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                            <LightCard className="p-4 text-center">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Projetos</p>
                                <p className="text-2xl font-black text-zinc-900">{projects.length}</p>
                            </LightCard>
                            <LightCard className="p-4 text-center">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Clientes CRM</p>
                                <p className="text-2xl font-black text-zinc-900">{clients.length}</p>
                            </LightCard>
                            <LightCard className="p-4 text-center">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Despesas</p>
                                <p className="text-2xl font-black text-zinc-900">{expenses.length}</p>
                            </LightCard>
                            <LightCard className="p-4 text-center">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Recorrência</p>
                                <p className="text-2xl font-black text-brand-600 text-green-600"><CurrencyDisplay amount={getFutureRecurringIncome()} currency={settings.mainCurrency} /></p>
                            </LightCard>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {featuresList.map((feature, idx) => (
                                <LightCard key={idx} className="h-full">
                                    <div className="flex items-center gap-3 mb-4 border-b border-zinc-200 pb-3">
                                        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                                            <feature.icon size={20} />
                                        </div>
                                        <h3 className="font-bold text-zinc-900 text-lg">{feature.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {feature.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
                                                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                <span className="leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </LightCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
