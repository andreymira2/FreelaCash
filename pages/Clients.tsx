import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientsListModel } from '../hooks/useFinancialEngine';
import { PageHeader, Card, Avatar, CurrencyDisplay, Badge, Button, Input } from '../components/ui';
import { Users, Search, TrendingUp, Briefcase, ChevronRight, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';

const Clients: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { settings } = useData();
    const navigate = useNavigate();
    const clients = useClientsListModel({ searchQuery });

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24 animate-in fade-in duration-500">
            <PageHeader
                title="Meus Clientes"
                subtitle="Gerencie seus relacionamentos e acompanhe a receita por cliente."
                action={
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" size={18} />
                        <Input
                            placeholder="Buscar cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-full bg-white/5 border-white/10"
                        />
                    </div>
                }
            />

            {clients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {clients.map((client) => (
                        <div
                            key={client.clientId}
                            onClick={() => navigate(`/client/${client.clientId}`)}
                            className="group relative bg-base-card rounded-2xl border border-white/5 p-6 hover:bg-base-hover hover:border-brand/30 transition-all cursor-pointer overflow-hidden"
                        >
                            {/* Hover Ambient Light */}
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex items-start justify-between mb-6">
                                <Avatar name={client.clientName} className="w-14 h-14 rounded-2xl text-xl shrink-0" />
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-ink-dim font-black mb-1">Share de Receita</p>
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className={`text-lg font-black ${client.hasHighDependency ? 'text-semantic-yellow' : 'text-white'}`}>
                                            {client.shareOfRevenue.toFixed(1)}%
                                        </span>
                                        {client.hasHighDependency && (
                                            <AlertTriangle size={14} className="text-semantic-yellow animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-xl font-bold text-white group-hover:text-brand transition-colors truncate">
                                    {client.clientName}
                                </h3>
                                <div className="flex items-center gap-2 text-ink-dim text-xs font-medium">
                                    <Briefcase size={14} />
                                    <span>{client.activeProjectsCount} projetos ativos</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-ink-dim font-black mb-1">Faturamento Total</p>
                                    <p className="text-xl font-black text-white">
                                        <CurrencyDisplay amount={client.totalRevenue} currency={settings.mainCurrency} />
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-ink-gray group-hover:bg-brand group-hover:text-black transition-all">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-base-card/30 border border-dashed border-white/10 rounded-3xl mt-8">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Users size={40} className="text-ink-dim opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-ink-dim max-w-xs text-center">Tente ajustar sua busca ou adicione um novo projeto para começar.</p>
                </div>
            )}
        </div>
    );
};

export default Clients;
