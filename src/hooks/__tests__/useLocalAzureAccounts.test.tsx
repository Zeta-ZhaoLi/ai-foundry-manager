import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalAzureAccounts } from '../useLocalAzureAccounts';

const STORAGE_KEY = 'ai-foundry-manager:accounts';

describe('useLocalAzureAccounts resourceName migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('fans out legacy account deployment.resourceName to all regions', async () => {
    const legacy = [
      {
        id: 'acct-1',
        name: 'Account 1',
        enabled: true,
        deployment: { resourceName: 'legacy-aoai' },
        regions: [
          { id: 'reg-1', name: 'eastus2', modelsText: '' },
          { id: 'reg-2', name: 'westeurope', modelsText: '', deployment: {} },
        ],
      },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [account] = result.current.accounts;
    expect(account.regions[0].deployment?.resourceName).toBe('legacy-aoai');
    expect(account.regions[1].deployment?.resourceName).toBe('legacy-aoai');
    expect((account as any).deployment).toBeUndefined();
  });

  it('preserves explicit region resourceName while migrating missing regions', async () => {
    const mixed = [
      {
        id: 'acct-1',
        name: 'Account 1',
        enabled: true,
        deployment: { resourceName: 'legacy-aoai' },
        regions: [
          {
            id: 'reg-1',
            name: 'eastus2',
            modelsText: '',
            deployment: { resourceName: 'region-specific' },
          },
          {
            id: 'reg-2',
            name: 'westeurope',
            modelsText: '',
            deployment: { resourceName: '' },
          },
        ],
      },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mixed));

    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [account] = result.current.accounts;
    expect(account.regions[0].deployment?.resourceName).toBe('region-specific');
    expect(account.regions[1].deployment?.resourceName).toBe('legacy-aoai');
  });

  it('creates new accounts disabled with default quota and regions', async () => {
    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    act(() => {
      result.current.addAccount();
    });

    const account = result.current.accounts.at(-1);
    expect(account).toBeTruthy();
    expect(account?.enabled).toBe(false);
    expect(account?.quota).toBe('1000');
    expect(account?.regions.map((region) => region.name)).toEqual([
      'eastus2',
      'swedencentral',
      'polandcentral',
    ]);
    expect(account?.regions.every((region) => region.enabled)).toBe(true);
  });
});
