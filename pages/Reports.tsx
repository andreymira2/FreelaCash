
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Button, Card, CurrencyDisplay, Avatar, PageHeader } from '../components/ui';
import { safeFloat } from '../utils/format';
import {
    Printer,
    FileText,
    TrendingUp,
    PieChart as PieChartIcon,
    BarChart3,
    Award,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    ArrowUpRight,
    Download
} from 'lucide-react';
import { ProjectStatus, Currency } from '../types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { useMonthlyReport, useYearToDateReport } from '../hooks/useFinancialEngine';

const getStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
        case ProjectStatus.ACTIVE: return 'Em Andamento';
        case ProjectStatus.COMPLETED: return 'Entregue';
        case ProjectStatus.PAID: return 'Finalizado';
        case ProjectStatus.ONGOING: return 'Recorrente';
        default: return status;
    }
};

const Reports: React.FC = () => {
    const { settings } = useData();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const currentYear = parseInt(selectedMonth.split('-')[0]);
    const monthlyReport = useMonthlyReport(selectedMonth);
    const ytdReport = useYearToDateReport(currentYear);

    const handlePrevMonth = () => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const prev = new Date(y, m - 2, 1);
        setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const next = new Date(y, m, 1);
        setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
    };

    const handlePrint = () => window.print();

    const COLORS = ['#C6FF3F', '#3b82f6', '#a855f7', '#f97316', '#ec4899'];

    const formattedMonth = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return new Date(y, m - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 no-print">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Relatórios & Insights</h1>
                    <div className="flex items-center gap-3 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/10 shadow-xl backdrop-blur-md">
                        <button onClick={handlePrevMonth} className="text-ink-gray hover:text-white transition-colors p-1">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-bold text-white uppercase tracking-widest px-2">{formattedMonth}</span>
                        <button onClick={handleNextMonth} className="text-ink-gray hover:text-white transition-colors p-1">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handlePrint} variant="secondary" className="rounded-full shadow-lg shadow-brand/20 hover:scale-105 transition-transform">
                        <Printer size={20} /> <span className="hidden sm:inline ml-2">Exportar PDF</span>
                    </Button>
                </div>
            </div>

            {/* Main Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-brand/20 to-black border-brand/20 p-6 relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand/10 rounded-full blur-3xl group-hover:bg-brand/20 transition-all duration-700"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand mb-1">Receita Mensal</p>
                    <h3 className="text-3xl font-black text-white mb-4">
                        <CurrencyDisplay amount={monthlyReport.income} currency={settings.mainCurrency} />
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-ink-dim font-medium">
                        <TrendingUp size={14} className="text-brand" />
                        <span>Baseado em pagamentos confirmados</span>
                    </div>
                </Card>

                <Card className="bg-base-card border-white/10 p-6 relative overflow-hidden group">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Despesas</p>
                    <h3 className="text-3xl font-black text-white mb-4">
                        <CurrencyDisplay amount={monthlyReport.expenses} currency={settings.mainCurrency} />
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-ink-dim font-medium">
                        <TrendingDown size={14} className="text-red-400" />
                        <span>Saídas totais do período</span>
                    </div>
                </Card>

                <Card className="bg-base-card border-white/10 p-6 relative overflow-hidden group">
                    <p className="text-xs font-bold uppercase tracking-widest text-semantic-blue mb-1">Resultado Líquido</p>
                    <h3 className="text-3xl font-black text-white mb-4">
                        <CurrencyDisplay amount={monthlyReport.net} currency={settings.mainCurrency} />
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-ink-dim font-medium">
                        <ArrowUpRight size={14} className="text-semantic-blue" />
                        <span>Sobra real em caixa</span>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 print:break-inside-avoid">
                <Card className="lg:col-span-2 bg-base-card border-white/5 p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                <BarChart3 size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Performance Anual</h3>
                                <p className="text-xs text-ink-dim">Receita vs Despesas em {currentYear}</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ytdReport.monthlyTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                />
                                <Bar dataKey="income" name="Receita" fill="#C6FF3F" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="bg-base-card border-white/5 p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-semantic-purple/10 flex items-center justify-center text-semantic-purple">
                            <PieChartIcon size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Share por Categoria</h3>
                            <p className="text-xs text-ink-dim">Distribuição de ganhos</p>
                        </div>
                    </div>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={monthlyReport.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8}>
                                    {monthlyReport.categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Top Clients */}
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 mt-12 no-print">
                <Award className="text-semantic-yellow" size={24} /> Melhores Clientes do Mês
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 no-print">
                {monthlyReport.topClients.map((client, index) => (
                    <Card key={client.name} className="bg-white/[0.02] border-white/5 p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${index === 0 ? 'bg-semantic-yellow' : index === 1 ? 'bg-ink-gray' : 'bg-brand'}`}></div>
                        <Avatar name={client.name} className="w-14 h-14 ring-2 ring-white/5 group-hover:ring-brand/30 transition-all duration-500" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-ink-dim uppercase tracking-widest mb-1">Rank #{index + 1}</p>
                            <h4 className="font-bold text-white text-lg truncate">{client.name}</h4>
                            <p className="text-brand font-black text-md">
                                <CurrencyDisplay amount={client.value} currency={settings.mainCurrency} />
                            </p>
                        </div>
                    </Card>
                ))}
                {monthlyReport.topClients.length === 0 && (
                    <div className="col-span-3 py-10 text-center text-ink-dim font-medium italic">Nenhum recebimento registrado neste mês.</div>
                )}
            </div>

            {/* Detailed Transactions Table */}
            <Card className="bg-base-card border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">Histórico do Período</h3>
                    <div className="text-xs font-bold text-ink-dim uppercase tracking-widest">
                        {monthlyReport.transactions.length} Transações
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-ink-dim bg-white/[0.01]">
                                <th className="px-6 py-5 font-black">Cliente / Categoria</th>
                                <th className="px-6 py-5 font-black">Data</th>
                                <th className="px-6 py-5 font-black">Status</th>
                                <th className="px-6 py-5 font-black text-right">Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyReport.transactions.map(p => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-white group-hover:text-brand transition-colors duration-300">{p.clientName}</p>
                                        <p className="text-xs text-ink-gray font-medium uppercase tracking-tight">{p.category}</p>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-ink-gray font-bold">
                                        {new Date(p.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5
                                            ${p.status === ProjectStatus.PAID ? 'bg-brand/10 text-brand border-brand/20' :
                                                p.status === ProjectStatus.ACTIVE ? 'bg-semantic-blue/10 text-semantic-blue border-semantic-blue/20' :
                                                    p.status === ProjectStatus.ONGOING ? 'bg-semantic-purple/10 text-semantic-purple border-semantic-purple/20' :
                                                        'bg-white/5 text-ink-gray'}`}>
                                            {getStatusLabel(p.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-lg text-white">
                                        <CurrencyDisplay amount={p.net} currency={p.currency} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Print Only Section: Monthly Summary */}
            <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[9999]">
                <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Resumo Financeiro</h1>
                        <p className="text-lg font-bold text-gray-600 uppercase tracking-widest">{formattedMonth}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-xl italic">FreelaCash</p>
                        <p className="text-xs font-bold uppercase">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-12 mb-16">
                    <div className="border border-black p-6">
                        <p className="text-xs font-black uppercase mb-2">Total Recebido</p>
                        <p className="text-2xl font-black italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: settings.mainCurrency }).format(monthlyReport.income)}
                        </p>
                    </div>
                    <div className="border border-black p-6">
                        <p className="text-xs font-black uppercase mb-2">Total Despesas</p>
                        <p className="text-2xl font-black italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: settings.mainCurrency }).format(monthlyReport.expenses)}
                        </p>
                    </div>
                    <div className="border border-black p-6 bg-gray-100">
                        <p className="text-xs font-black uppercase mb-2">Lucro Líquido</p>
                        <p className="text-2xl font-black italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: settings.mainCurrency }).format(monthlyReport.net)}
                        </p>
                    </div>
                </div>

                <div className="mb-12">
                    <h3 className="text-sm font-black uppercase border-b border-black pb-2 mb-6">Top Clientes</h3>
                    {monthlyReport.topClients.map((c, i) => (
                        <div key={i} className="flex justify-between py-3 border-b border-gray-100">
                            <span className="font-bold">{c.name}</span>
                            <span className="font-black italic">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: settings.mainCurrency }).format(c.value)}
                            </span>
                        </div>
                    ))}
                </div>

                <div>
                    <h3 className="text-sm font-black uppercase border-b border-black pb-2 mb-6">Recebíveis Pendentes</h3>
                    <div className="flex justify-between py-3 border-b border-black">
                        <span className="font-bold">{monthlyReport.receivablesSummary.count} pagamentos previstos</span>
                        <span className="font-black italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: settings.mainCurrency }).format(monthlyReport.receivablesSummary.total)}
                        </span>
                    </div>
                </div>

                <footer className="absolute bottom-12 left-12 right-12 text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] border-t border-gray-100 pt-8">
                    Relatório gerado automaticamente por FreelaCash Engine • {new Date().toLocaleTimeString()}
                </footer>
            </div>
        </div>
    );
};

export default Reports;
