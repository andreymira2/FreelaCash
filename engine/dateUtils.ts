import { MonthKey } from './types';

export function getMonthKey(date: Date): MonthKey {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    year,
    month,
    str: `${year}-${month.toString().padStart(2, '0')}`
  };
}

export function parseMonthKey(monthStr: string): MonthKey {
  const [year, month] = monthStr.split('-').map(Number);
  return { year, month, str: monthStr };
}

export function monthKeyToDate(key: MonthKey, day: number = 15): Date {
  return new Date(key.year, key.month - 1, Math.min(day, 28));
}

export function getCurrentMonth(): MonthKey {
  return getMonthKey(new Date());
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getDateRange(range: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME'): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (range) {
    case 'THIS_MONTH':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'LAST_MONTH':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      break;
    case 'THIS_YEAR':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    case 'ALL_TIME':
      start.setFullYear(2000, 0, 1);
      end.setFullYear(2100, 0, 1);
      break;
  }
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

export function isOverdue(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth();
}

export function formatMonthLabel(monthKey: MonthKey): string {
  const date = new Date(monthKey.year, monthKey.month - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}
