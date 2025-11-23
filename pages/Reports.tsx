
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Button, Card, CurrencyDisplay, Avatar, PageHeader } from '../components/ui';
import { safeFloat } from '../utils/format';
import { Printer, FileText, Download, TrendingUp, PieChart as PieChartIcon, BarChart3, Award } from 'lucide-react';
import { ProjectStatus, Currency } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const Reports: React.FC = () => {
    const { projects, expenses, getProjectTotal, settings, convertCurrency } = useData();

    // --- Calculations ---

    const totalNetIncome = useMemo(() => {
        return projects.reduce((acc, p) => {
            const { net } = getProjectTotal(p);
            // Consider paid amount if status is PAID, otherwise net potential? 
            // For reports, let's stick to "Paid Income" vs "Potential" usually, but here we aggregate Net of all projects for overview
            return safeFloat(acc + convertCurrency(net, p.currency, settings.mainCurrency));
        }, 0);
    }, [projects, getProjectTotal, convertCurrency, settings.mainCurrency]);

    // Monthly Data for Bar Chart
    const monthlyData = useMemo(() => {
        const data: Record<string, { name: string; income: number; expense: number }> = {};

        // Init last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            data[key] = { name: key, income: 0, expense: 0 };
        }

        // Fill Income
        projects.forEach(p => {
            p.payments?.forEach(pay => {
                if (pay.status === 'PAID' || !pay.status) {
                    const d = new Date(pay.date);
                    const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
                    if (data[key]) {
                        data[key].income = safeFloat(data[key].income + convertCurrency(pay.amount, p.currency, settings.mainCurrency));
                    }
                }
            });
        });

        // Fill Expenses
        expenses.forEach(e => {
            const d = new Date(e.date);
            const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            if (data[key]) {
                data[key].expense = safeFloat(data[key].expense + convertCurrency(e.amount, e.currency, settings.mainCurrency));
            }
        });

        return Object.values(data);
    }, [projects, expenses, convertCurrency, settings.mainCurrency]);

    // Category Data for Pie Chart
    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        projects.forEach(p => {
            const cat = p.category || 'Sem Categoria';
            const { net } = getProjectTotal(p);
            const val = convertCurrency(net, p.currency, settings.mainCurrency);
            data[cat] = safeFloat((data[cat] || 0) + val);
        });
        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 categories
    }, [projects, getProjectTotal, convertCurrency, settings.mainCurrency]);

    // Top Clients Leaderboard
    const topClients = useMemo(() => {
        const clients: Record<string, number> = {};
        projects.forEach(p => {
            const { paid } = getProjectTotal(p);
            const val = convertCurrency(paid, p.currency, settings.mainCurrency);
            clients[p.clientName] = safeFloat((clients[p.clientName] || 0) + val);
        });
        return Object.entries(clients)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }, [projects, getProjectTotal, convertCurrency, settings.mainCurrency]);

    // --- Actions ---

    const handlePrint = () => window.print();

    const downloadCSV = () => {
        const headers = ["Data", "Cliente", "Categoria", "Status", "Valor Liq.", "Valor Convertido"];
        const rows = projects.map(p => {
            const { net } = getProjectTotal(p);
            const netConverted = convertCurrency(net, p.currency, settings.mainCurrency).toFixed(2);
            return [
                new Date(p.createdAt).toISOString().split('T')[0],
                `"${p.clientName}"`,
                p.category,
                p.status,
                `${p.currency} ${net.toFixed(2)}`,
                `${settings.mainCurrency} ${netConverted}`
            ].join(",");
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "freelacash_relatorio.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const COLORS = ['#a3e635', '#3b82f6', '#a855f7', '#f97316', '#ec4899'];

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 pb-24 animate-in fade-in duration-500">

            {/* Header */}
            <PageHeader
                title="Relatórios & Insights"
                subtitle="Analise sua performance financeira."
                className="no-print"
                action={
                    <div className="flex gap-3">
                        <Button onClick={downloadCSV} variant="outline" className="rounded-full border-dark-600">
                            <FileText size={18} /> CSV
                        </Button>
                        <Button onClick={handlePrint} variant="secondary" className="rounded-full">
                            <Printer size={18} /> Imprimir
                        </Button>
                    </div>
                }
            />

            {/* Big Stats Header */}
            <Card className="bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700 mb-8 print:hidden relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary-900/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10 p-4">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Ganhos Totais (Líquido)</p>
                    <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight">
                        <CurrencyDisplay amount={totalNetIncome} currency={settings.mainCurrency} />
                    </h2>
                    <div className="flex items-center gap-2 mt-4 text-primary-400 font-bold text-sm bg-primary-900/10 w-fit px-3 py-1 rounded-full">
                        <TrendingUp size={16} /> <span>Sua trajetória financeira está ótima.</span>
                    </div>
                </div>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 print:break-inside-avoid">

                {/* Bar Chart: Monthly */}
                <div className="lg:col-span-2 bg-dark-800 rounded-3xl p-6 border border-dark-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-slate-300">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Receita vs Despesas</h3>
                            <p className="text-xs text-slate-500">Últimos 6 meses</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="income" name="Receita" fill="#a3e635" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Categories */}
                <div className="bg-dark-800 rounded-3xl p-6 border border-dark-700 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-slate-300">
                            <PieChartIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Fontes de Receita</h3>
                            <p className="text-xs text-slate-500">Por Categoria</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Clients Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 print:hidden">
                {topClients.map((client, index) => (
                    <div key={client.name} className="bg-dark-800 p-5 rounded-2xl border border-dark-700 flex items-center gap-4 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : 'bg-orange-700'}`}></div>
                        <div className="relative">
                            <Avatar name={client.name} className="w-12 h-12" />
                            {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-dark-900 p-1 rounded-full"><Award size={12} /></div>}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">#{index + 1} Top Cliente</p>
                            <h4 className="font-bold text-white text-lg truncate max-w-[150px]">{client.name}</h4>
                            <p className="text-primary-400 font-bold text-sm"><CurrencyDisplay amount={client.value} currency={settings.mainCurrency} /></p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Table */}
            <div className="bg-white text-black print:text-black dark:bg-dark-800 dark:text-white rounded-3xl overflow-hidden border border-slate-200 dark:border-dark-700">
                <div className="p-6 border-b border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50">
                    <h3 className="font-bold text-lg">Transações Detalhadas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-dark-700 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-5 font-bold">Projeto / Cliente</th>
                                <th className="p-5 font-bold">Data Criação</th>
                                <th className="p-5 font-bold">Status</th>
                                <th className="p-5 font-bold text-right">Valor Bruto</th>
                                <th className="p-5 font-bold text-right">Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.sort((a, b) => b.createdAt - a.createdAt).map(p => {
                                const { gross, net } = getProjectTotal(p);
                                return (
                                    <tr key={p.id} className="border-b border-slate-100 dark:border-dark-700/50 hover:bg-slate-50 dark:hover:bg-dark-700/30 transition-colors">
                                        <td className="p-5">
                                            <p className="font-bold">{p.clientName}</p>
                                            <p className="text-xs text-slate-400 font-medium">{p.category}</p>
                                        </td>
                                        <td className="p-5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-5">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider
                                        ${p.status === ProjectStatus.PAID ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' :
                                                    p.status === ProjectStatus.ACTIVE ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-slate-200 text-slate-600 dark:bg-dark-700 dark:text-slate-400'}`}>
                                                {p.status === ProjectStatus.ONGOING ? 'RETAINER' : p.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-mono text-sm text-slate-400">
                                            <CurrencyDisplay amount={gross} currency={p.currency} />
                                        </td>
                                        <td className="p-5 text-right font-mono font-bold text-lg">
                                            <CurrencyDisplay amount={net} currency={p.currency} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-8 text-center text-sm text-slate-500">
                <p>Gerado por FreelaCash • {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default Reports;
