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
 * Parses a "YYYY-MM-DD" string and returns an ISO string.
 * Use this when you need to store the date as a string.
 */
export const parseLocalDateToISO = (dateStr: string): string => {
    return parseLocalDate(dateStr).toISOString();
};

/**
 * Converts an ISO date string to "YYYY-MM-DD" format for HTML date inputs.
 * Uses string extraction to preserve the original date without timezone shifts.
 * This is backwards-compatible with legacy dates saved at UTC midnight.
 */
export const toInputDate = (isoString: string | undefined): string => {
    if (!isoString) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return isoString.substring(0, 10);
};

/**
 * Parses a number string, accepting both comma and dot as decimal separators.
 * Returns 0 for invalid inputs.
 */
export const parseNumber = (value: string): number => {
    if (!value) return 0;
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
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
