import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalAzureAccounts } from '../useLocalAzureAccounts';

const STORAGE_KEY = 'ai-foundry-manager:accounts';

describe('useLocalAzureAccounts resourceName migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes the default region model template enabled with three empty regions', async () => {
    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    expect(result.current.defaultRegionModelTemplate.enabled).toBe(true);
    expect(
      result.current.defaultRegionModelTemplate.regions.map((region) => ({
        name: region.name,
        modelsText: region.modelsText,
      }))
    ).toEqual([
      { name: 'eastus2', modelsText: '' },
      { name: 'swedencentral', modelsText: '' },
      { name: 'polandcentral', modelsText: '' },
    ]);
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

  it('creates new accounts from the latest enabled template order and model lists', async () => {
    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [eastus2, sweden] =
      result.current.defaultRegionModelTemplate.regions;

    act(() => {
      result.current.updateDefaultRegionModelTemplateRegionModelsText(
        eastus2.id,
        'gpt-4o,gpt-4o-mini'
      );
      result.current.updateDefaultRegionModelTemplateRegionModelsText(
        sweden.id,
        'gpt-5'
      );
      result.current.reorderDefaultRegionModelTemplateRegions(1, 0);
    });

    act(() => {
      result.current.addAccount();
    });

    const account = result.current.accounts.at(-1);
    expect(account?.regions.map((region) => region.name)).toEqual([
      'swedencentral',
      'eastus2',
      'polandcentral',
    ]);
    expect(account?.regions.map((region) => region.modelsText)).toEqual([
      'gpt-5',
      'gpt-4o,gpt-4o-mini',
      '',
    ]);
  });

  it('keeps template region order but clears models when the template is disabled', async () => {
    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [eastus2] = result.current.defaultRegionModelTemplate.regions;

    act(() => {
      result.current.updateDefaultRegionModelTemplateRegionModelsText(
        eastus2.id,
        'gpt-4o'
      );
      result.current.reorderDefaultRegionModelTemplateRegions(2, 0);
      result.current.updateDefaultRegionModelTemplateEnabled(false);
    });

    act(() => {
      result.current.addAccount();
    });

    const account = result.current.accounts.at(-1);
    expect(account?.regions.map((region) => region.name)).toEqual([
      'polandcentral',
      'eastus2',
      'swedencentral',
    ]);
    expect(account?.regions.every((region) => region.modelsText === '')).toBe(
      true
    );
  });

  it('creates new accounts with no regions when the template region list is empty', async () => {
    const { result } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    act(() => {
      for (const region of result.current.defaultRegionModelTemplate.regions) {
        result.current.deleteDefaultRegionModelTemplateRegion(region.id);
      }
    });

    act(() => {
      result.current.addAccount();
    });

    expect(result.current.accounts.at(-1)?.regions).toEqual([]);
  });

  it('encrypts Service Principal password at rest and decrypts on load', async () => {
    const { result, unmount } = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const accountId = result.current.accounts[0].id;
    act(() => {
      result.current.updateAccountServicePrincipal(accountId, {
        appId: 'app-id',
        displayName: 'azure-cli',
        password: 'plain-secret',
        tenant: 'tenant-id',
      });
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY) || '';
      expect(raw).toContain('azure-cli');
      expect(raw).not.toContain('plain-secret');
    });

    unmount();
    const reloaded = renderHook(() => useLocalAzureAccounts());

    await waitFor(() => {
      expect(reloaded.result.current.accounts.length).toBe(1);
    });

    expect(
      reloaded.result.current.accounts[0].servicePrincipal?.password
    ).toBe('plain-secret');
  });
});
