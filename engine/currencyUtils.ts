import { Currency } from '../types';
import { FinancialEngineConfig } from './types';

export function safeFloat(value: number): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Record<Currency, number>
): number {
  if (from === to) return safeFloat(amount);
  if (isNaN(amount)) return 0;

  const rateFrom = rates[from] || 1;
  const rateTo = rates[to] || 1;

  if (rateTo === 0) return 0;

  const inBase = amount * rateFrom;
  return safeFloat(inBase / rateTo);
}

export function createCurrencyConverter(config: FinancialEngineConfig) {
  return (amount: number, from: Currency, to?: Currency) => {
    return convertCurrency(amount, from, to ?? config.mainCurrency, config.exchangeRates);
  };
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    [Currency.BRL]: 'R$',
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.GBP]: '£'
  };
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
  
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbols[currency]} ${formatted}`;
}
