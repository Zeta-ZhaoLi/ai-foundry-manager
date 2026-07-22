import { beforeEach, describe, expect, it } from 'vitest';
import {
  createConfigEnvelope,
  createInitialConfigData,
  loadAccounts,
  parseConfigData,
  parseConfigImport,
  serializeAccounts,
  ACCOUNTS_STORAGE_KEY,
  LEGACY_ACCOUNTS_BACKUP_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY,
} from '../config';
import { encryptData } from '../../utils/encryption';

describe('configuration migration and import', () => {
  beforeEach(() => localStorage.clear());

  it('loads the legacy key and migrates it to the current storage key', () => {
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

    const accounts = loadAccounts(localStorage);
    expect(accounts[0].servicePrincipal?.password).toBe('sp-secret');
    expect(accounts[0].regions[0].apiKey).toBe('api-secret');
    expect(localStorage.getItem(ACCOUNTS_STORAGE_KEY)).not.toBeNull();
  });

  it('preserves invalid raw data instead of replacing it with defaults', () => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, '{broken');
    expect(() => loadAccounts(localStorage)).toThrow(
      'Stored accounts is not valid JSON'
    );
    expect(localStorage.getItem(ACCOUNTS_STORAGE_KEY)).toBe('{broken');
  });

  it('recovers accounts from the backup left by vault migration', () => {
    const initial = createInitialConfigData().accounts;
    localStorage.setItem(
      LEGACY_ACCOUNTS_BACKUP_KEY,
      serializeAccounts(initial)
    );

    expect(loadAccounts(localStorage)).toMatchObject(initial);
    expect(localStorage.getItem(ACCOUNTS_STORAGE_KEY)).not.toBeNull();
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
