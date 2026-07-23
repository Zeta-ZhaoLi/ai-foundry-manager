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
import type { ConfigDataV2 } from '../../schemas/account';
import { encryptLegacyData } from '../../utils/encryption';

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
          password: encryptLegacyData('sp-secret'),
        },
        regions: [
          {
            id: 'reg-1',
            name: 'eastus2',
            modelsText: '',
            apiKey: encryptLegacyData('api-secret'),
          },
        ],
      },
    ]);
    localStorage.setItem(LEGACY_ACCOUNTS_STORAGE_KEY, raw);

    const accounts = loadAccounts(localStorage);
    expect(accounts[0].available).toBe(false);
    expect(accounts[0].servicePrincipal?.password).toBe('sp-secret');
    expect(accounts[0].regions[0].apiKey).toBe('api-secret');
    expect(localStorage.getItem(ACCOUNTS_STORAGE_KEY)).not.toBeNull();
    expect(
      JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]')[0]
        .available
    ).toBe(false);
    const migrated = JSON.parse(
      localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]'
    ) as ConfigDataV2['accounts'];
    expect(migrated[0].servicePrincipal?.password).toBe('sp-secret');
    expect(migrated[0].regions[0].apiKey).toBe('api-secret');
  });

  it('keeps an undecodable legacy secret stable for manual replacement', () => {
    const accounts = createInitialConfigData().accounts.map((account) => ({
      ...account,
      regions: account.regions.map((region) => ({
        ...region,
        apiKey: 'U2FsdGVkX1-invalid-encrypted-data',
      })),
    }));
    const raw = JSON.stringify(accounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, raw);

    const loaded = loadAccounts(localStorage);
    const firstStored = JSON.parse(
      localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]'
    ) as ConfigDataV2['accounts'];
    const reloaded = loadAccounts(localStorage);

    expect(loaded[0].regions[0].apiKey).toBe(
      'U2FsdGVkX1-invalid-encrypted-data'
    );
    expect(firstStored[0].regions[0].apiKey).toBe(
      'U2FsdGVkX1-invalid-encrypted-data'
    );
    expect(reloaded[0].regions[0].apiKey).toBe(
      'U2FsdGVkX1-invalid-encrypted-data'
    );
    expect(localStorage.getItem(ACCOUNTS_STORAGE_KEY)).toBe(
      JSON.stringify(reloaded)
    );
  });

  it('normalizes legacy encrypted values in imported configurations', () => {
    const current = createInitialConfigData();
    const imported = parseConfigImport(
      createConfigEnvelope({
        ...current,
        accounts: current.accounts.map((account) => ({
          ...account,
          regions: account.regions.map((region) => ({
            ...region,
            apiKey: encryptLegacyData('imported-api-key'),
          })),
        })),
      }),
      current
    );

    expect(imported.accounts[0].regions[0].apiKey).toBe('imported-api-key');
  });

  it('round-trips the account availability flag', () => {
    const accounts = createInitialConfigData().accounts.map((account) => ({
      ...account,
      available: true,
    }));
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, serializeAccounts(accounts));

    expect(loadAccounts(localStorage)[0].available).toBe(true);
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

  it('defaults missing account availability flags for older configurations', () => {
    const current = createInitialConfigData();
    const { available: _available, ...legacyAccount } = current.accounts[0];
    const parsed = parseConfigData({
      ...current,
      accounts: [legacyAccount],
    });

    expect(parsed.accounts[0].available).toBe(false);
  });
});
