import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Button, Card, CurrencyDisplay, EmptyState } from '../components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet, ArrowUpRight, ArrowDownLeft, Flag, CheckCircle2, Clock, Grid3X3, List } from 'lucide-react';
import { Currency } from '../types';
import { useCalendarEvents } from '../hooks/useFinancialEngine';
import { TimelineEvent } from '../engine/types';

const EventPill: React.FC<{ event: TimelineEvent; mainCurrency: Currency; compact?: boolean }> = ({ event, mainCurrency, compact = true }) => {
    let bg = "bg-white/10";
    let text = "text-white";
    let Icon = CalendarIcon;

    switch (event.type) {
        case 'income':
            bg = event.status === 'paid' ? 'bg-brand/20' : 'bg-brand/5 border border-brand/20';
            text = "text-brand";
            Icon = ArrowDownLeft;
            break;
        case 'expense':
            bg = event.status === 'paid' ? 'bg-white/5 opacity-50' : 'bg-semantic-red/10 border border-semantic-red/20';
            text = event.status === 'paid' ? "text-ink-gray" : "text-semantic-red";
            Icon = ArrowUpRight;
            break;
        case 'project_start':
            bg = 'bg-semantic-blue/10';
            text = 'text-semantic-blue';
            Icon = Flag;
            break;
        case 'project_due':
            bg = 'bg-semantic-purple/10';
            text = 'text-semantic-purple';
            Icon = Clock;
            break;
        case 'trial_end':
            bg = 'bg-semantic-yellow/10 border border-semantic-yellow/40';
            text = 'text-semantic-yellow';
            Icon = Wallet;
            break;
    }

    if (compact) {
        return (
            <div className={`text-xs md:text-[10px] p-1.5 rounded mb-1 truncate flex items-center gap-1 ${bg} ${text}`} title={event.title}>
                <Icon size={10} className="shrink-0" />
                <span className="font-bold truncate">{event.title}</span>
                {event.amount != null && <span className="opacity-80 ml-auto">{event.currency !== mainCurrency ? event.currency : ''} {event.amount.toFixed(0)}</span>}
            </div>
        );
    }

    return (
        <div className={`p-3 rounded-xl flex items-center gap-3 ${bg}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${text}`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${text}`}>{event.title}</p>
                <p className="text-xs text-ink-gray">
                    {event.status === 'paid' ? 'Pago' : event.status === 'pending' ? 'Agendado' : event.status === 'overdue' ? 'Atrasado' : ''}
                </p>
            </div>
            {event.amount != null && (
                <div className={`text-right ${text}`}>
                    <p className="font-bold text-sm">{event.currency || mainCurrency} {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
            )}
        </div>
    );
};

const CalendarPage: React.FC = () => {
    const { settings } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const resetToToday = () => setCurrentDate(new Date());

    const events = useCalendarEvents(currentDate);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const eventsByDay = useMemo(() => {
        const map: Record<number, TimelineEvent[]> = {};
        events.forEach(e => {
            const day = e.date.getDate();
            if (!map[day]) map[day] = [];
            map[day].push(e);
        });
        return map;
    }, [events]);

    const sortedDaysWithEvents = useMemo(() => {
        return days
            .filter(day => eventsByDay[day]?.length > 0)
            .map(day => ({
                day,
                date: new Date(year, month, day),
                events: eventsByDay[day]
            }));
    }, [days, eventsByDay, year, month]);

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-7xl mx-auto p-6 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Calendário</h1>
                    <p className="text-ink-gray font-medium">Fluxo de caixa e prazos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-base-card p-1 rounded-full border border-white/5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-brand text-black' : 'text-ink-gray hover:bg-white/10'}`}
                            title="Visualização em grade"
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-brand text-black' : 'text-ink-gray hover:bg-white/10'}`}
                            title="Visualização em lista"
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-base-card p-1 rounded-full border border-white/5">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft size={20} /></button>
                        <div className="w-40 text-center font-bold text-white capitalize">{monthName}</div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </header>

            {viewMode === 'grid' ? (
                <>
                    <div className="bg-base-card border border-white/5 rounded-2xl overflow-hidden shadow-card">
                        <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                <div key={d} className="p-3 text-center text-xs font-bold text-ink-gray uppercase tracking-wider">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 auto-rows-[120px]">
                            {blanks.map(b => (
                                <div key={`blank-${b}`} className="bg-black/40 border-b border-r border-white/5"></div>
                            ))}

                            {days.map(day => {
                                const dayEvents = eventsByDay[day] || [];
                                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                                return (
                                    <div key={day} className={`border-b border-r border-white/5 p-2 transition-colors hover:bg-white/[0.02] ${isToday ? 'bg-brand/5' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand text-black shadow-neon' : 'text-ink-gray'}`}>
                                                {day}
                                            </span>
                                        </div>
                                        <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                                            {dayEvents.map(e => (
                                                <EventPill key={e.id} event={e} mainCurrency={settings.mainCurrency} compact={true} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-bold text-ink-gray justify-center md:justify-start">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand/20 border border-brand/20"></div> Recebimentos</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-semantic-red/10 border border-semantic-red/20"></div> Despesas</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-semantic-yellow/10 border border-semantic-yellow/40"></div> Fim de Teste</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-semantic-blue/10"></div> Início Projeto</div>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    {sortedDaysWithEvents.length === 0 ? (
                        <EmptyState
                            icon={CalendarIcon}
                            title="Nenhum evento este mês"
                            description="Adicione projetos e despesas para ver eventos no calendário."
                        />
                    ) : (
                        sortedDaysWithEvents.map(({ day, date, events: dayEvents }) => {
                            const isToday = new Date().toDateString() === date.toDateString();
                            const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                            
                            return (
                                <div key={day} className="bg-base-card border border-white/5 rounded-2xl p-4 shadow-card">
                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-brand text-black' : 'bg-white/5 text-white'}`}>
                                            <span className="text-[10px] font-bold uppercase">{weekday}</span>
                                            <span className="text-lg font-black leading-none">{day}</span>
                                        </div>
                                        <div>
                                            <p className={`font-bold ${isToday ? 'text-brand' : 'text-white'}`}>
                                                {isToday ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                            </p>
                                            <p className="text-xs text-ink-gray capitalize">
                                                {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                        <div className="ml-auto text-xs text-ink-gray bg-white/5 px-2 py-1 rounded-full">
                                            {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {dayEvents.map(e => (
                                            <EventPill key={e.id} event={e} mainCurrency={settings.mainCurrency} compact={false} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
