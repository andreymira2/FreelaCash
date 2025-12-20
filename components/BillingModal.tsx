import React, { useState } from 'react';
import { X, MessageCircle, Mail, Copy, Check, Send } from 'lucide-react';
import { Button, Card } from './ui';
import { CURRENCY_SYMBOLS, Currency } from '../types';

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    projectCategory: string;
    currency: Currency;
    grossAmount: number;
    paidAmount: number;
    remainingAmount: number;
    pixKey?: string;
    userName: string;
    taxId?: string;
    clientEmail?: string;
}

const BillingModal: React.FC<BillingModalProps> = ({
    isOpen,
    onClose,
    clientName,
    projectCategory,
    currency,
    grossAmount,
    paidAmount,
    remainingAmount,
    pixKey,
    userName,
    taxId,
    clientEmail
}) => {
    const [copied, setCopied] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | 'copy'>('whatsapp');

    if (!isOpen) return null;

    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    const billingMessage = `Olá ${clientName}, tudo bem? 👋

Aqui é o ${userName}. Segue o resumo do projeto *${projectCategory}*:

Valor Total: ${symbol}${grossAmount.toFixed(2)}
Já Pago: ${symbol}${paidAmount.toFixed(2)}
*Valor Pendente: ${symbol}${remainingAmount.toFixed(2)}*

${pixKey ? `Para regularizar, segue minha chave PIX:
🔑 *${pixKey}*
Nome: ${userName}${taxId ? `\nCPF/CNPJ: ${taxId}` : ''}` : 'Entre em contato para combinar a forma de pagamento.'}`;

    const plainMessage = billingMessage.replace(/\*/g, '');

    const handleWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(billingMessage)}`, '_blank');
        onClose();
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Cobrança - ${projectCategory}`);
        const body = encodeURIComponent(plainMessage);
        const mailto = clientEmail 
            ? `mailto:${clientEmail}?subject=${subject}&body=${body}`
            : `mailto:?subject=${subject}&body=${body}`;
        window.open(mailto, '_blank');
        onClose();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(plainMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = plainMessage;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const channels = [
        { id: 'whatsapp' as const, icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-600 hover:bg-green-500', action: handleWhatsApp },
        { id: 'email' as const, icon: Mail, label: 'Email', color: 'bg-blue-600 hover:bg-blue-500', action: handleEmail },
        { id: 'copy' as const, icon: copied ? Check : Copy, label: copied ? 'Copiado!' : 'Copiar', color: 'bg-slate-600 hover:bg-slate-500', action: handleCopy }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Cobrar Cliente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="bg-dark-900 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Cliente</span>
                        <span className="text-white font-medium">{clientName}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Projeto</span>
                        <span className="text-white font-medium">{projectCategory}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dark-700">
                        <span className="text-sm font-bold text-brand">A Cobrar</span>
                        <span className="text-xl font-black text-brand">{symbol}{remainingAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm text-slate-400 font-medium">Escolha como enviar:</p>
                    <div className="grid grid-cols-3 gap-3">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={channel.action}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${channel.color} text-white`}
                            >
                                <channel.icon size={24} />
                                <span className="text-xs font-bold">{channel.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-dark-900 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium mb-2">Prévia da mensagem:</p>
                    <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                        {plainMessage}
                    </p>
                </div>

                {!pixKey && (
                    <p className="text-xs text-amber-400 mt-4 text-center">
                        Configure sua chave PIX nas Configurações para incluí-la na mensagem.
                    </p>
                )}
            </Card>
        </div>
    );
};

export default BillingModal;
