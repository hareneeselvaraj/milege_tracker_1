/**
 * Data Schema Migrations for UltraLog
 * Handles versioning and migration of data stored in Google Drive
 */

import { generateId } from './validators';

const CURRENT_VERSION = 3;

/**
 * Migration definitions - each migration transforms from version N to N+1
 */
const migrations = {
  // Version 1 -> 2: Add IDs to all entities, add schemaVersion
  1: (data) => {
    const migrated = { ...data };

    // Add IDs to fuel entries
    migrated.entries = (data.entries || []).map(e => ({
      ...e,
      id: e.id || generateId()
    }));

    // Add IDs to trips
    migrated.trips = (data.trips || []).map(t => ({
      ...t,
      id: t.id || generateId()
    }));

    // Add IDs to services
    migrated.services = (data.services || []).map(s => ({
      ...s,
      id: s.id || generateId()
    }));

    // Ensure vehicles have IDs
    migrated.vehicles = (data.vehicles || []).map(v => ({
      ...v,
      id: v.id || generateId()
    }));

    migrated.schemaVersion = 2;
    return migrated;
  },
  // Version 2 -> 3: Add financial entities and accounts
  2: (data) => {
    const migrated = { ...data };
    migrated.expenses = data.expenses || [];
    migrated.income = data.income || [];
    migrated.budgets = data.budgets || [];
    migrated.accounts = data.accounts || [
      { id: 'acc_cash', name: 'Cash', type: 'Cash', balance: 0 },
      { id: 'acc_bank', name: 'Bank Account', type: 'Bank', balance: 0 },
      { id: 'acc_upi', name: 'UPI Wallet', type: 'Wallet', balance: 0 }
    ];
    migrated.schemaVersion = 3;
    return migrated;
  }
};

/**
 * Run all necessary migrations on data
 * @param {object} data - The raw data loaded from Drive/localStorage
 * @returns {{ data: object, migrated: boolean, fromVersion: number }}
 */
export const migrateData = (data) => {
  let currentVersion = data.schemaVersion || 1;
  const fromVersion = currentVersion;
  let migrated = { ...data };
  let didMigrate = false;

  while (currentVersion < CURRENT_VERSION) {
    const migrationFn = migrations[currentVersion];
    if (migrationFn) {
      console.log(`[Migration] Running migration v${currentVersion} -> v${currentVersion + 1}`);
      migrated = migrationFn(migrated);
      didMigrate = true;
    }
    currentVersion++;
  }

  migrated.schemaVersion = CURRENT_VERSION;
  return { data: migrated, migrated: didMigrate, fromVersion };
};

export { CURRENT_VERSION };
