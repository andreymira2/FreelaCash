import { Currency, CURRENCY_SYMBOLS } from '../types';

/**
 * Rounds a number to 2 decimal places to avoid floating point errors.
 * Example: 10.10 + 20.20 = 30.30 (not 30.300000000000004)
 */
export const safeFloat = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Parses a "YYYY-MM-DD" string as a local date object.
 * This prevents the "previous day" issue caused by UTC parsing.
 * Sets time to 12:00 PM to be safe from DST shifts.
 */
export const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

/**
 * Formats a currency amount consistently.
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    return `${symbol} ${formatted}`;
};
