
import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from './Button';

interface SensitiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    onCopy?: () => void;
}

export const SensitiveInput: React.FC<SensitiveInputProps> = ({
    label,
    value,
    className = '',
    onCopy,
    ...props
}) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const handleReveal = useCallback(() => {
        setIsRevealed(true);
        if (timer) clearTimeout(timer);

        const newTimer = setTimeout(() => {
            setIsRevealed(false);
        }, 5000); // Hide after 5 seconds

        setTimer(newTimer);
    }, [timer]);

    const handleToggleReveal = () => {
        if (isRevealed) {
            setIsRevealed(false);
            if (timer) clearTimeout(timer);
        } else {
            handleReveal();
        }
    };

    const handleCopy = async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value.toString());
            setCopied(true);
            onCopy?.();
            setTimeout(() => setCopied(false), 2000);

            // Haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    useEffect(() => {
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [timer]);

    return (
        <div className="flex flex-col gap-2 mb-4 group">
            <label className="text-xs font-semibold text-ink-gray ml-1 group-focus-within:text-brand transition-colors">
                {label}
            </label>
            <div className="relative">
                <input
                    className={`w-full px-4 md:px-5 py-3 md:py-4 rounded-xl min-h-[44px] border border-base-border bg-base-card text-base md:text-sm text-white font-medium focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-ink-dim/30 pr-24 ${className}`}
                    type={isRevealed ? 'text' : 'password'}
                    value={value}
                    {...props}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleToggleReveal}
                        className="p-2 text-ink-gray hover:text-white transition-colors touch-target-sm flex items-center justify-center"
                        title={isRevealed ? "Esconder" : "Revelar"}
                    >
                        {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`p-2 transition-colors touch-target-sm flex items-center justify-center ${copied ? 'text-brand' : 'text-ink-gray hover:text-white'}`}
                        title="Copiar"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
