import { AppData, Currency } from './src/types/index.js';
import { migrateData, CURRENT_SCHEMA_VERSION } from './src/utils/migrations.js';

// ... (simplified runner with no external dependencies) ...
function createMockData(schemaVersion) {
    return {
        projects: [],
        clients: [],
        expenses: [],
        settings: {
            monthlyGoal: 5000,
            mainCurrency: 'BRL',
            exchangeRates: { BRL: 1, USD: 5, EUR: 5.5, GBP: 6.5 },
            taxReservePercent: 0,
            ...(schemaVersion !== undefined && { schemaVersion })
        },
        userProfile: {
            name: 'Test',
            title: '',
            location: '',
            taxId: '',
            pixKey: ''
        }
    };
}

let passed = 0;
let failed = 0;

const assert = (condition, testName) => {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${testName}`);
        failed++;
    }
};

console.log('--- Running Migration Tests ---');

// Test 1: Undefined schema version (New user or pre-Stage 0 data)
{
    const data = createMockData();
    const { migratedData, didMigrate } = migrateData(data);
    assert(didMigrate === true, 'Migration triggered for undefined schemaVersion');
    assert(migratedData.settings.schemaVersion === CURRENT_SCHEMA_VERSION, `Migrated version is ${CURRENT_SCHEMA_VERSION}`);
}

// Test 2: Schema version 0 (Early Stage 0 data)
{
    const data = createMockData(0);
    const { migratedData, didMigrate } = migrateData(data);
    assert(didMigrate === true, 'Migration triggered for schemaVersion 0');
    assert(migratedData.settings.schemaVersion === CURRENT_SCHEMA_VERSION, `Migrated version is ${CURRENT_SCHEMA_VERSION}`);
}

// Test 3: Current schema version (Up to date user)
{
    const data = createMockData(CURRENT_SCHEMA_VERSION);
    const { migratedData, didMigrate } = migrateData(data);
    assert(didMigrate === false, 'Migration skipped for current schemaVersion');
    assert(migratedData.settings.schemaVersion === CURRENT_SCHEMA_VERSION, 'Version remained unchanged');
}

console.log(`\nTests Complete: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
