import { beforeEach, describe, expect, it } from 'vitest';
import {
  createConfigEnvelope,
  createInitialConfigData,
  finishLegacyMigration,
  parseConfigData,
  parseConfigImport,
  readLegacyConfigData,
} from '../config';
import {
  LEGACY_ACCOUNTS_BACKUP_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY,
} from '../../security/vault';
import { encryptData } from '../../utils/encryption';

describe('configuration migration and import', () => {
  beforeEach(() => localStorage.clear());

  it('backs up and migrates legacy secrets before removing old keys', () => {
    const raw = JSON.stringify([
      {
        id: 'acct-1',
        name: 'Account 1',
        enabled: true,
        servicePrincipal: {
          appId: 'app-id',
          tenant: 'tenant-id',
          password: encryptData('sp-secret'),
        },
        regions: [
          {
            id: 'reg-1',
            name: 'eastus2',
            modelsText: '',
            apiKey: encryptData('api-secret'),
          },
        ],
      },
    ]);
    localStorage.setItem(LEGACY_ACCOUNTS_STORAGE_KEY, raw);

    const result = readLegacyConfigData(localStorage);
    expect(result.hadLegacyData).toBe(true);
    expect(localStorage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY)).toBe(raw);
    expect(result.data.accounts[0].servicePrincipal?.password).toBe('sp-secret');
    expect(result.data.accounts[0].regions[0].apiKey).toBe('api-secret');

    finishLegacyMigration(localStorage);
    expect(localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY)).toBe(raw);
  });

  it('preserves invalid raw data instead of replacing it with defaults', () => {
    localStorage.setItem(LEGACY_ACCOUNTS_STORAGE_KEY, '{broken');
    expect(() => readLegacyConfigData(localStorage)).toThrow(
      'Legacy accounts is not valid JSON'
    );
    expect(localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY)).toBe('{broken');
    expect(localStorage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY)).toBe('{broken');
  });

  it('imports V2 and legacy formats without partially mutating current data', () => {
    const current = createInitialConfigData();
    const replacement = {
      ...current,
      accounts: [{ ...current.accounts[0], name: 'Imported account' }],
    };
    const imported = parseConfigImport(
      createConfigEnvelope(replacement),
      current
    );
    expect(imported.accounts[0].name).toBe('Imported account');

    expect(() =>
      parseConfigImport({ accounts: [{ id: 'broken' }] }, current)
    ).toThrow('Invalid account structure');
    expect(current.accounts[0].name).not.toBe('Imported account');
  });

  it('defaults missing template region enabled flags for older configurations', () => {
    const current = createInitialConfigData();
    const parsed = parseConfigData({
      ...current,
      defaultRegionModelTemplate: {
        enabled: true,
        regions: [
          {
            id: 'legacy-template-region',
            name: 'eastus2',
            modelsText: 'gpt-4o',
          },
        ],
      },
    });

    expect(parsed.defaultRegionModelTemplate.regions[0].enabled).toBe(true);
  });
});
