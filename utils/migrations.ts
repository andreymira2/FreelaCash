import { AppData } from '../types';

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Ensures the AppData object is up-to-date with the latest schema.
 * 
 * Stage 0: Currently a no-op migration that just attaches the schemaVersion.
 * 
 * @param data The user's loaded app data from Supabase
 * @returns The migrated app data, preserving all original types
 */
export function migrateData(data: AppData): { migratedData: AppData; didMigrate: boolean } {
    let currentVersion = data.settings.schemaVersion || 0;
    let didMigrate = false;

    const migratedData: AppData = JSON.parse(JSON.stringify(data)); // Deep copy to avoid mutating state directly

    // Loop through schema upgrades sequentially until reaching current version
    while (currentVersion < CURRENT_SCHEMA_VERSION) {
        didMigrate = true;

        switch (currentVersion) {
            case 0:
                // Stage 0 -> 1 migration
                // No-op for now. Just bumping the version.
                currentVersion = 1;
                break;

            // Future migrations (e.g. 1 -> 2) will be added here
            default:
                console.warn(`Unknown schema version encountered during migration: ${currentVersion}. Forcing to ${CURRENT_SCHEMA_VERSION}.`);
                currentVersion = CURRENT_SCHEMA_VERSION;
                break;
        }
    }

    // Ensure setting the highest bumped version on the payload
    migratedData.settings.schemaVersion = currentVersion;

    return { migratedData, didMigrate };
}
