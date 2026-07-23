import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalAzureAccounts } from '../useLocalAzureAccounts';
import {
  ACCOUNTS_STORAGE_KEY,
  DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY,
  createInitialConfigData,
  normalizeAccounts,
  serializeAccounts,
} from '../../persistence/config';
import { MASTER_MODELS_STORAGE_KEY } from '../../utils/masterModelsStorage';
import type { ConfigDataV2 } from '../../schemas/account';

function renderAccountsHook(
  initialData: ConfigDataV2 = createInitialConfigData()
) {
  localStorage.setItem(
    ACCOUNTS_STORAGE_KEY,
    serializeAccounts(initialData.accounts)
  );
  localStorage.setItem(MASTER_MODELS_STORAGE_KEY, initialData.masterText);
  localStorage.setItem(
    DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY,
    JSON.stringify(initialData.defaultRegionModelTemplate)
  );
  return renderHook(() => useLocalAzureAccounts());
}

describe('useLocalAzureAccounts resourceName migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes the default region model template enabled with three empty regions', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    expect(result.current.defaultRegionModelTemplate.enabled).toBe(true);
    expect(
      result.current.defaultRegionModelTemplate.regions.map((region) => ({
        name: region.name,
        modelsText: region.modelsText,
        enabled: region.enabled,
      }))
    ).toEqual([
      { name: 'eastus2', modelsText: '', enabled: true },
      { name: 'swedencentral', modelsText: '', enabled: true },
      { name: 'polandcentral', modelsText: '', enabled: true },
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
    const initial = createInitialConfigData();
    initial.accounts = normalizeAccounts(legacy);
    const { result } = renderAccountsHook(initial);

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [account] = result.current.accounts;
    expect(account.regions[0].deployment?.resourceName).toBe('legacy-aoai');
    expect(account.regions[1].deployment?.resourceName).toBe('legacy-aoai');
    expect('deployment' in account).toBe(false);
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
    const initial = createInitialConfigData();
    initial.accounts = normalizeAccounts(mixed);
    const { result } = renderAccountsHook(initial);

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [account] = result.current.accounts;
    expect(account.regions[0].deployment?.resourceName).toBe('region-specific');
    expect(account.regions[1].deployment?.resourceName).toBe('legacy-aoai');
  });

  it('creates new accounts disabled with default quota and regions', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    act(() => {
      result.current.addAccount();
    });

    const account = result.current.accounts.at(-1);
    expect(account).toBeTruthy();
    expect(account?.available).toBe(false);
    expect(account?.enabled).toBe(false);
    expect(account?.quota).toBe('1000');
    expect(account?.resourceGroupName).toBeUndefined();
    expect(account?.regions.map((region) => region.name)).toEqual([
      'eastus2',
      'swedencentral',
      'polandcentral',
    ]);
    expect(account?.regions.every((region) => region.enabled)).toBe(true);
  });

  it('updates availability only for the selected account and persists it', async () => {
    const { result } = renderAccountsHook();

    act(() => {
      result.current.addAccount();
    });
    const [first] = result.current.accounts;

    act(() => {
      result.current.updateAccountAvailable(first.id, true);
    });

    expect(result.current.accounts[0]).toMatchObject({
      available: true,
      enabled: true,
    });
    expect(result.current.accounts[1]).toMatchObject({
      available: false,
      enabled: false,
      includeInStats: true,
    });

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]'
      ) as ConfigDataV2['accounts'];
      expect(stored[0].available).toBe(true);
      expect(stored[1].available).toBe(false);
    });
  });

  it('creates new accounts from the latest enabled template order and model lists', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const [eastus2, sweden] = result.current.defaultRegionModelTemplate.regions;

    act(() => {
      result.current.updateDefaultRegionModelTemplateRegionEnabled(
        sweden.id,
        false
      );
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
    expect(account?.regions.map((region) => region.enabled)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it('keeps template region order but clears models when the template is disabled', async () => {
    const { result } = renderAccountsHook();

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
    const { result } = renderAccountsHook();

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

  it('updates account resource group name', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const accountId = result.current.accounts[0].id;
    act(() => {
      result.current.updateAccountResourceGroupName(accountId, 'rg-custom');
    });

    expect(result.current.accounts[0].resourceGroupName).toBe('rg-custom');
  });

  it('updates Service Principal credentials in local state', async () => {
    const { result } = renderAccountsHook();

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

    expect(result.current.accounts[0].servicePrincipal?.password).toBe(
      'plain-secret'
    );
  });

  it('persists sensitive fields as plaintext and keeps them stable on reload', async () => {
    const first = renderAccountsHook();
    const accountId = first.result.current.accounts[0].id;
    const regionId = first.result.current.accounts[0].regions[0].id;

    act(() => {
      first.result.current.updateAccountServicePrincipal(accountId, {
        appId: 'app-id',
        password: 'sp-secret',
        tenant: 'tenant-id',
      });
      first.result.current.updateRegionApiKey(
        accountId,
        regionId,
        'api-secret'
      );
    });

    await waitFor(() => {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '';
      const parsed = JSON.parse(stored) as ConfigDataV2['accounts'];
      expect(parsed[0].servicePrincipal?.password).toBe('sp-secret');
      expect(parsed[0].regions[0].apiKey).toBe('api-secret');
      expect(stored).toContain('sp-secret');
      expect(stored).toContain('api-secret');
    });

    const storedBeforeReload = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    first.unmount();
    const second = renderHook(() => useLocalAzureAccounts());
    expect(second.result.current.accounts[0].servicePrincipal?.password).toBe(
      'sp-secret'
    );
    expect(second.result.current.accounts[0].regions[0].apiKey).toBe(
      'api-secret'
    );
    expect(localStorage.getItem(ACCOUNTS_STORAGE_KEY)).toBe(storedBeforeReload);
  });

  it('imports deployment result subscription ID and API keys into matched regions', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const accountId = result.current.accounts[0].id;
    const regionId = result.current.accounts[0].regions[0].id;
    act(() => {
      result.current.updateAccountAvailable(accountId, true);
      result.current.updateRegionDeployment(accountId, regionId, {
        resourceName: 'acct-east',
      });
    });

    await waitFor(() => {
      expect(
        result.current.accounts[0].regions[0].deployment?.resourceName
      ).toBe('acct-east');
    });

    act(() => {
      const importResult = result.current.importDeploymentResultText(`
AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN
{"subscriptionId":"sub-1","regions":[{"region":"eastus2","resourceName":"acct-east","apiKey":"key-east"}]}
AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END
`);
      expect(importResult.success).toBe(true);
      expect(importResult.updatedRegions).toBe(1);
    });

    expect(result.current.accounts[0].subscriptionId).toBe('sub-1');
    expect(result.current.accounts[0].available).toBe(true);
    expect(result.current.accounts[0].regions[0].apiKey).toBe('key-east');
    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]'
      ) as ConfigDataV2['accounts'];
      expect(stored[0].regions[0].apiKey).toBe('key-east');
    });
  });

  it('adds missing regions under a matched deployment result account', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const accountId = result.current.accounts[0].id;
    act(() => {
      result.current.updateAccountSubscriptionId(accountId, 'sub-1');
    });

    await waitFor(() => {
      expect(result.current.accounts[0].subscriptionId).toBe('sub-1');
    });

    act(() => {
      const importResult = result.current.importDeploymentResultText(`
AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN
{"subscriptionId":"sub-1","regions":[{"region":"newregion","resourceName":"new-resource","apiKey":"new-key"}]}
AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END
`);
      expect(importResult.success).toBe(true);
      expect(importResult.addedRegions).toBe(1);
    });

    const added = result.current.accounts[0].regions.find(
      (region) => region.name === 'newregion'
    );
    expect(added).toMatchObject({
      name: 'newregion',
      apiKey: 'new-key',
      modelsText: '',
      enabled: true,
    });
    expect(added?.deployment?.resourceName).toBeUndefined();
    expect(added?.openaiEndpoint).toBeUndefined();
  });

  it('returns an error when deployment result has no matching account', async () => {
    const { result } = renderAccountsHook();

    await waitFor(() => {
      expect(result.current.accounts.length).toBe(1);
    });

    const importResult = result.current.importDeploymentResultText(`
AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN
{"subscriptionId":"unknown-sub","regions":[{"region":"eastus2","resourceName":"unknown-resource","apiKey":"key"}]}
AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END
`);

    expect(importResult.success).toBe(false);
    expect(importResult.error).toContain('No matching account');
  });
});
