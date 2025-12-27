
/**
 * CPF Validation
 */
export const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^\d]+/g, '');
    if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
};

/**
 * PIX Key Validation
 * Supports: Email, Phone, CPF, CNPJ, and Random Keys (UUID)
 */
export const validatePIX = (key: string): boolean => {
    if (!key) return false;

    // Email
    if (key.includes('@')) {
        return !!key.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }

    // CPF / CNPJ (Clean)
    const digitsOnly = key.replace(/[^\d]+/g, '');
    if (digitsOnly.length === 11 || digitsOnly.length === 14) {
        return true; // Simple check for PIX (could be more rigorous)
    }

    // Phone (Simple check for + and numbers)
    if (key.startsWith('+') || !!key.match(/^\d{10,13}$/)) {
        return true;
    }

    // Random Key (UUID)
    if (key.length >= 32) {
        return true;
    }

    return key.length > 0;
};

/**
 * Validates the structure of a backup JSON object
 */
export const validateBackupSchema = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;

    // Basic structure check
    const requiredKeys = ['projects', 'expenses', 'settings', 'userProfile'];
    for (const key of requiredKeys) {
        if (!(key in data)) return false;
    }

    // Validate that arrays are actually arrays
    if (!Array.isArray(data.projects) || !Array.isArray(data.expenses)) return false;

    // Validate userProfile basic fields
    if (typeof data.userProfile !== 'object' || !data.userProfile.name) return false;

    return true;
};

/**
 * Removes unexpected fields from data objects to prevent pollution
 */
export const scrubData = <T extends object>(data: T, allowedKeys: string[]): Partial<T> => {
    const scrubbed: any = {};
    allowedKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            scrubbed[key] = (data as any)[key];
        }
    });
    return scrubbed;
};
