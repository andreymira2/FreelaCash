
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Button, Card, CurrencyDisplay, EmptyState } from '../components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet, ArrowUpRight, ArrowDownLeft, Flag, CheckCircle2, Clock } from 'lucide-react';
import { CalendarEvent, Currency } from '../types';

// Render Event Pill
const EventPill: React.FC<{ event: CalendarEvent; mainCurrency: Currency }> = ({ event, mainCurrency }) => {
    let bg = "bg-white/10";
    let text = "text-white";
    let Icon = CalendarIcon;

    switch (event.type) {
        case 'INCOME':
            bg = event.status === 'PAID' ? 'bg-brand/20' : 'bg-brand/5 border border-brand/20';
            text = "text-brand";
            Icon = ArrowDownLeft;
            break;
        case 'EXPENSE':
            bg = event.status === 'PAID' ? 'bg-white/5 opacity-50' : 'bg-semantic-red/10 border border-semantic-red/20';
            text = event.status === 'PAID' ? "text-ink-gray" : "text-semantic-red";
            Icon = ArrowUpRight;
            break;
        case 'PROJECT_START':
            bg = 'bg-semantic-blue/10';
            text = 'text-semantic-blue';
            Icon = Flag;
            break;
        case 'PROJECT_DUE':
            bg = 'bg-semantic-purple/10';
            text = 'text-semantic-purple';
            Icon = Clock;
            break;
        case 'TRIAL_END':
            bg = 'bg-semantic-yellow/10 border border-semantic-yellow/40';
            text = 'text-semantic-yellow';
            Icon = Wallet;
            break;
    }

    return (
        <div className={`text-xs md:text-[10px] p-1.5 rounded mb-1 truncate flex items-center gap-1 ${bg} ${text}`} title={event.title}>
            <Icon size={10} className="shrink-0" />
            <span className="font-bold truncate">{event.title}</span>
            {event.amount && <span className="opacity-80 ml-auto">{mainCurrency === event.currency ? '' : event.currency} {event.amount.toFixed(0)}</span>}
        </div>
    )
};

const CalendarPage: React.FC = () => {
    const { getCalendarEvents, settings } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const resetToToday = () => setCurrentDate(new Date());

    const events = useMemo(() => getCalendarEvents(currentDate), [getCalendarEvents, currentDate]);

    // Calendar Grid Logic
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    // Group events by day
    const eventsByDay = useMemo(() => {
        const map: Record<number, CalendarEvent[]> = {};
        events.forEach(e => {
            const day = e.date.getDate();
            if (!map[day]) map[day] = [];
            map[day].push(e);
        });
        return map;
    }, [events]);

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-7xl mx-auto p-6 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Calendário</h1>
                    <p className="text-ink-gray font-medium">Fluxo de caixa e prazos.</p>
                </div>
                <div className="flex items-center gap-2 bg-base-card p-1 rounded-full border border-white/5">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft size={20} /></button>
                    <div className="w-40 text-center font-bold text-white capitalize">{monthName}</div>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronRight size={20} /></button>
                </div>
            </header>

            {/* Calendar Grid */}
            <div className="bg-base-card border border-white/5 rounded-2xl overflow-hidden shadow-card">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="p-3 text-center text-xs font-bold text-ink-gray uppercase tracking-wider">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-[120px]">
                    {/* Blanks */}
                    {blanks.map(b => (
                        <div key={`blank-${b}`} className="bg-black/40 border-b border-r border-white/5"></div>
                    ))}

                    {/* Days */}
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
                                        <EventPill key={e.id} event={e} mainCurrency={settings.mainCurrency} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-bold text-ink-gray justify-center md:justify-start">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand/20 border border-brand/20"></div> Recebimentos</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-semantic-red/10 border border-semantic-red/20"></div> Despesas</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-semantic-yellow/10 border border-semantic-yellow/40"></div> Fim de Teste</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-semantic-blue/10"></div> Início Projeto</div>
            </div>
        </div>
    );
};

export default CalendarPage;
