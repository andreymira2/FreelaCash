import { migrateData, CURRENT_SCHEMA_VERSION } from './migrations';
import { AppData, Currency } from '../types';

function createMockData(schemaVersion?: number): AppData {
    return {
        projects: [],
        clients: [],
        expenses: [],
        settings: {
            monthlyGoal: 5000,
            mainCurrency: Currency.BRL,
            exchangeRates: { [Currency.BRL]: 1, [Currency.USD]: 5, [Currency.EUR]: 5.5, [Currency.GBP]: 6.5 },
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

export function runMigrationTests() {
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, testName: string) => {
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

    // Test 4: Unknown future schema version (e.g. user toggled test flight or downgraded app)
    {
        const futureVersion = 999;
        const data = createMockData(futureVersion);

        // Suppress warn for this specific test
        const originalWarn = console.warn;
        console.warn = () => { };

        const { migratedData, didMigrate } = migrateData(data);

        console.warn = originalWarn; // Restore

        assert(didMigrate === false, 'Migration technically skipped (didMigrate false) for future versions');
        assert(migratedData.settings.schemaVersion === futureVersion, 'Future schema version is preserved, not overwritten to 1');
    }

    console.log(`\nTests Complete: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) {
        throw new Error('Migration tests failed!');
    }
}

// Automatically run if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('migrations.test.ts')) {
    runMigrationTests();
}
