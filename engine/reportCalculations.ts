import { Project, Expense, Currency, PaymentStatus, ProjectStatus } from '../types';
import {
    FinancialEngineConfig,
    MonthlyReportModel,
    YearToDateModel,
    ProjectFinancials
} from './types';
import { safeFloat, convertCurrency } from './currencyUtils';
import { calculateProjectFinancials } from './projectCalculations';
import { getExpensesPaidInPeriod } from './expenseCalculations';

export function calculateMonthlyReport(
    projects: Project[],
    expenses: Expense[],
    monthKey: string, // e.g., "2026-02"
    config: FinancialEngineConfig
): MonthlyReportModel {
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    let incomeTotal = 0;
    const clientRevenue: Record<string, number> = {};
    const categoryRevenue: Record<string, number> = {};
    const transactions: MonthlyReportModel['transactions'] = [];

    // Project Income
    projects.forEach(p => {
        let projectInMonthIncome = 0;
        p.payments?.forEach(pay => {
            if (pay.date && pay.date.startsWith(monthKey) && (pay.status === PaymentStatus.PAID || !pay.status)) {
                const amountConverted = convertCurrency(pay.amount, p.currency, config.mainCurrency, config.exchangeRates);
                incomeTotal = safeFloat(incomeTotal + amountConverted);
                projectInMonthIncome = safeFloat(projectInMonthIncome + amountConverted);
                clientRevenue[p.clientName] = safeFloat((clientRevenue[p.clientName] || 0) + amountConverted);
                categoryRevenue[p.category || 'Outros'] = safeFloat((categoryRevenue[p.category || 'Outros'] || 0) + amountConverted);
            }
        });

        const projectMonthKey = new Date(p.createdAt).toISOString().slice(0, 7);
        if (projectMonthKey === monthKey || projectInMonthIncome > 0) {
            const fin = calculateProjectFinancials(p, expenses, config);
            transactions.push({
                id: p.id,
                clientName: p.clientName,
                category: p.category || 'Geral',
                date: new Date(p.createdAt).toISOString(),
                status: p.status,
                gross: fin.gross,
                net: fin.net,
                currency: p.currency
            });
        }
    });

    // Expenses
    const monthExpenses = getExpensesPaidInPeriod(expenses, start, end, config);

    // Top Clients
    const topClients = Object.entries(clientRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Category Breakdown
    const categoryBreakdown = Object.entries(categoryRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Receivables Summary (Scheduled for this month)
    let receivablesTotal = 0;
    let receivablesCount = 0;
    projects.forEach(p => {
        p.payments?.forEach(pay => {
            if (pay.date && pay.date.startsWith(monthKey) && pay.status === PaymentStatus.SCHEDULED) {
                receivablesTotal = safeFloat(receivablesTotal + convertCurrency(pay.amount, p.currency, config.mainCurrency, config.exchangeRates));
                receivablesCount++;
            }
        });
    });

    return {
        monthKey,
        income: incomeTotal,
        expenses: monthExpenses.total,
        net: safeFloat(incomeTotal - monthExpenses.total),
        topClients,
        categoryBreakdown,
        receivablesSummary: {
            total: receivablesTotal,
            count: receivablesCount
        },
        transactions: transactions.sort((a, b) => b.date.localeCompare(a.date))
    };
}

export function calculateYearToDateReport(
    projects: Project[],
    expenses: Expense[],
    year: number,
    config: FinancialEngineConfig
): YearToDateModel {
    let totalIncome = 0;
    let totalExpenses = 0;
    const monthlyTrend: YearToDateModel['monthlyTrend'] = [];

    for (let m = 1; m <= 12; m++) {
        const monthStr = `${year}-${m.toString().padStart(2, '0')}`;
        const report = calculateMonthlyReport(projects, expenses, monthStr, config);

        monthlyTrend.push({
            name: new Date(year, m - 1).toLocaleString('pt-BR', { month: 'short' }),
            income: report.income,
            expense: report.expenses
        });

        totalIncome = safeFloat(totalIncome + report.income);
        totalExpenses = safeFloat(totalExpenses + report.expenses);
    }

    return {
        year,
        totalIncome,
        totalExpenses,
        totalNet: safeFloat(totalIncome - totalExpenses),
        monthlyTrend
    };
}
