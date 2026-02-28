import { Project, Contract, Currency, Expense } from '../types';
import { ContractModel, ContractCardModel, FinancialEngineConfig } from './types';
import { calculateProjectFinancials, getProjectsListModel } from './projectCalculations';
import { convertCurrency, safeFloat } from './currencyUtils';

export function calculateContractModel(
    contract: Contract,
    projects: Project[],
    expenses: Expense[],
    config: FinancialEngineConfig
): ContractModel {
    // Filter projects belonging to this contract
    const linkedProjects = projects.filter(p => p.contractId === contract.id);

    let totalGrossMain = 0;
    let totalNetMain = 0;
    let totalPaidMain = 0;

    // 1. Add retainer to totals (converted to main currency)
    const retainerMain = convertCurrency(contract.retainerAmount, contract.currency, config.mainCurrency, config.exchangeRates);
    totalGrossMain = safeFloat(totalGrossMain + retainerMain);
    totalNetMain = safeFloat(totalNetMain + retainerMain); // Retainer treated as 100% margin unless we add contract-level expenses later

    // 2. Add projects financials
    const { projects: projectCardModels } = getProjectsListModel(linkedProjects, config);

    linkedProjects.forEach(project => {
        const financials = calculateProjectFinancials(project, expenses, config);
        totalGrossMain = safeFloat(totalGrossMain + financials.grossConverted);
        totalNetMain = safeFloat(totalNetMain + financials.netConverted);
        totalPaidMain = safeFloat(totalPaidMain + financials.paidConverted);
    });

    // 3. Add Extra Items (converted to main currency)
    (contract.items || []).forEach(item => {
        const itemAmountMain = convertCurrency(item.amount, contract.currency, config.mainCurrency, config.exchangeRates);
        totalGrossMain = safeFloat(totalGrossMain + itemAmountMain);
        totalNetMain = safeFloat(totalNetMain + itemAmountMain);
    });

    return {
        contract,
        financials: {
            totalGross: totalGrossMain,
            totalNet: totalNetMain,
            totalPaid: totalPaidMain,
            totalRemaining: Math.max(0, safeFloat(totalGrossMain - totalPaidMain))
        },
        projects: projectCardModels
    };
}

export function calculateContractCardModel(
    contract: Contract,
    projects: Project[]
): ContractCardModel {
    const linkedProjects = projects.filter(p => p.contractId === contract.id);

    return {
        id: contract.id,
        title: contract.title,
        clientName: '', // To be filled by the engine
        retainerAmount: contract.retainerAmount,
        currency: contract.currency,
        activeProjectsCount: linkedProjects.filter(p => p.status === 'ACTIVE' || p.status === 'ONGOING').length,
        isActive: contract.isActive,
        startDate: new Date(contract.startDate)
    };
}
