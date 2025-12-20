import React, { useMemo } from 'react';
import { Payment, PaymentStatus, Currency } from '../types';
import { CurrencyDisplay } from './ui';

interface PaymentGridProps {
    payments: Payment[];
    currency: Currency;
    months?: number;
}

const PaymentGrid: React.FC<PaymentGridProps> = ({ payments, currency, months = 6 }) => {
    const gridData = useMemo(() => {
        const now = new Date();
        const data: { month: string; year: number; payments: Payment[]; total: number; hasPaid: boolean }[] = [];
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            const year = date.getFullYear();
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
            
            const monthPayments = payments.filter(p => {
                const payDate = new Date(p.date);
                return payDate >= monthStart && payDate <= monthEnd && (p.status === PaymentStatus.PAID || !p.status);
            });
            
            const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
            
            data.push({
                month: monthKey,
                year,
                payments: monthPayments,
                total,
                hasPaid: monthPayments.length > 0
            });
        }
        
        return data;
    }, [payments, months]);

    const maxTotal = Math.max(...gridData.map(d => d.total), 1);

    return (
        <div className="bg-base-card rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white">Histórico de Recebimentos</h4>
                <span className="text-xs text-ink-gray">Últimos {months} meses</span>
            </div>
            <div className="flex gap-2">
                {gridData.map((item, idx) => {
                    const intensity = item.total > 0 ? Math.max(0.2, item.total / maxTotal) : 0;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                            <div 
                                className={`w-full aspect-square rounded-lg transition-all ${
                                    item.hasPaid 
                                        ? 'bg-brand hover:scale-110 cursor-pointer' 
                                        : 'bg-white/5 hover:bg-white/10'
                                }`}
                                style={{ 
                                    opacity: item.hasPaid ? intensity : 1,
                                    backgroundColor: item.hasPaid ? undefined : undefined
                                }}
                            />
                            <span className="text-xs text-ink-gray font-medium capitalize">{item.month}</span>
                            
                            {item.hasPaid && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-dark-900 border border-white/10 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    <p className="text-xs font-bold text-white">
                                        <CurrencyDisplay amount={item.total} currency={currency} />
                                    </p>
                                    <p className="text-xs text-ink-gray">{item.payments.length} pagamento{item.payments.length > 1 ? 's' : ''}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-white/5" />
                    <span className="text-xs text-ink-gray">Sem pagamento</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-brand" />
                    <span className="text-xs text-ink-gray">Com pagamento</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentGrid;
