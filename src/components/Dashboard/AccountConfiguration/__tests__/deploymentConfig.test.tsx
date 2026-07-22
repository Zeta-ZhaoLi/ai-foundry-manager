import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import { AccountCard } from '../AccountCard';
import {
  AccountsSection,
  getCollapsibleDisabledAccountGroups,
} from '../AccountsSection';
import { DefaultRegionModelTemplatePanel } from '../DefaultRegionModelTemplatePanel';
import { RegionCard } from '../RegionCard';
import type {
  DefaultRegionModelTemplateConfig,
  GeneratedRegionIdentityBundle,
  LocalAccount,
  LocalRegion,
} from '../../../../hooks/useLocalAzureAccounts';

const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock('../../../../hooks/useToast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('deployment configuration contract', () => {
  beforeEach(() => {
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('groups only runs of three disabled accounts with the same account ID prefix', () => {
    const makeAccount = (
      accountId: string,
      enabled: boolean
    ): LocalAccount => ({
      id: `internal-${accountId}`,
      accountId,
      tier: accountId.startsWith('A') ? 'premium' : 'standard',
      name: accountId,
      enabled,
      note: '',
      regions: [],
    });

    const accounts = [
      makeAccount('A001', false),
      makeAccount('A002', false),
      makeAccount('A003', false),
      makeAccount('B001', false),
      makeAccount('B002', false),
      makeAccount('B003', true),
      makeAccount('B004', false),
      makeAccount('B005', false),
      makeAccount('B006', false),
    ].map((account, originalIndex) => ({ account, originalIndex }));

    expect(
      getCollapsibleDisabledAccountGroups(accounts).map((group) => ({
        prefix: group.prefix,
        start: group.startAccountId,
        end: group.endAccountId,
        count: group.accounts.length,
      }))
    ).toEqual([
      { prefix: 'A', start: 'A001', end: 'A003', count: 3 },
      { prefix: 'B', start: 'B004', end: 'B006', count: 3 },
    ]);
  });

  it('replaces a disabled account run with one persistent expandable range row', () => {
    const accounts: LocalAccount[] = Array.from({ length: 4 }, (_, index) => ({
      id: `acct-${index + 170}`,
      accountId: `B${index + 170}`,
      name: `user${index + 170}@example.com`,
      enabled: false,
      note: '',
      tier: 'standard',
      regions: [],
    }));
    const renderSection = () => (
      <I18nextProvider i18n={i18n}>
        <AccountsSection
          accounts={accounts}
          defaultRegionModelTemplate={{ enabled: true, regions: [] }}
          masterGroups={[]}
          masterGroupLines={[]}
          masterModels={[]}
          filteredModels={[]}
          modelFilterInput=""
          onFilterChange={vi.fn()}
          onAddAccount={vi.fn()}
          onUpdateDefaultRegionModelTemplateEnabled={vi.fn()}
          onAddDefaultRegionModelTemplateRegion={vi.fn()}
          onDeleteDefaultRegionModelTemplateRegion={vi.fn()}
          onUpdateDefaultRegionModelTemplateRegionName={vi.fn()}
          onUpdateDefaultRegionModelTemplateRegionEnabled={vi.fn()}
          onUpdateDefaultRegionModelTemplateRegionModelsText={vi.fn()}
          onReorderDefaultRegionModelTemplateRegions={vi.fn()}
          onExportConfig={vi.fn()}
          onUpdateAccountName={vi.fn()}
          onUpdateAccountSubscriptionId={vi.fn()}
          onUpdateAccountNote={vi.fn()}
          onUpdateAccountEnabled={vi.fn()}
          onUpdateAccountTier={vi.fn()}
          onUpdateAccountQuota={vi.fn()}
          onDeleteAccount={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    const { getByRole, getByText, queryByText, rerender } =
      render(renderSection());

    const collapsedRangeRow = getByRole('button', {
      name: /B170 - B173.*展开/,
    });
    expect(collapsedRangeRow.textContent?.replace(/\s/g, '')).toBe(
      'B170-B173展开'
    );
    expect(queryByText('user170@example.com')).toBeNull();

    fireEvent.click(collapsedRangeRow);
    expect(getByText('user170@example.com')).toBeTruthy();
    expect(getByText('user173@example.com')).toBeTruthy();

    rerender(renderSection());
    expect(getByText('user170@example.com')).toBeTruthy();

    fireEvent.click(getByRole('button', { name: /B170 - B173.*收起/ }));
    expect(queryByText('user170@example.com')).toBeNull();
  });

  it('imports deployment result text from paste UI', async () => {
    const onImportDeploymentResult = vi.fn(() => ({
      success: true,
      updatedAccounts: 1,
      updatedRegions: 1,
      addedRegions: 0,
    }));

    const { getByText, getByPlaceholderText } = render(
      <I18nextProvider i18n={i18n}>
        <AccountsSection
          accounts={[]}
          defaultRegionModelTemplate={{ enabled: true, regions: [] }}
          masterGroups={[]}
          masterGroupLines={[]}
          masterModels={[]}
          filteredModels={[]}
          modelFilterInput=""
          onFilterChange={vi.fn()}
          onAddAccount={vi.fn()}
          onUpdateDefaultRegionModelTemplateEnabled={vi.fn()}
          onAddDefaultRegionModelTemplateRegion={vi.fn()}
          onDeleteDefaultRegionModelTemplateRegion={vi.fn()}
          onUpdateDefaultRegionModelTemplateRegionName={vi.fn()}
          onUpdateDefaultRegionModelTemplateRegionEnabled={vi.fn()}
          onUpdateDefaultRegionModelTemplateRegionModelsText={vi.fn()}
          onReorderDefaultRegionModelTemplateRegions={vi.fn()}
          onExportConfig={vi.fn()}
          onImportDeploymentResult={onImportDeploymentResult}
          onUpdateAccountName={vi.fn()}
          onUpdateAccountSubscriptionId={vi.fn()}
          onUpdateAccountNote={vi.fn()}
          onUpdateAccountEnabled={vi.fn()}
          onUpdateAccountTier={vi.fn()}
          onUpdateAccountQuota={vi.fn()}
          onDeleteAccount={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(getByText('导入部署结果'));
    fireEvent.change(
      getByPlaceholderText(
        '在这里粘贴 foundry-deployment-result txt 完整内容...'
      ),
      { target: { value: 'deployment-result-content' } }
    );
    fireEvent.click(getByText('导入粘贴内容'));

    expect(onImportDeploymentResult).toHaveBeenCalledWith(
      'deployment-result-content'
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      '部署结果已导入：更新 1 个账号、1 个区域，新增 0 个区域'
    );
  });

  it('hides account-level Resource Name and legacy deployment fields', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      regions: [],
    };

    const { queryByText } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[]}
          masterGroupLines={[]}
          masterModels={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    expect(queryByText('Resource Name')).toBeNull();
    expect(queryByText('Subscription ID')).toBeNull();
    expect(queryByText('Resource Group')).toBeNull();
    expect(queryByText('Azure Deployment Config')).toBeNull();
  });

  it('keeps account actions visible when a disabled account is collapsed', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      accountId: 'B001',
      name: 'Account 1',
      note: '',
      enabled: false,
      includeInStats: true,
      tier: 'standard',
      quota: '1000',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: '',
        },
      ],
    };
    const onUpdateEnabled = vi.fn();

    const { getByText, getByLabelText, queryByText } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[]}
          masterGroupLines={[]}
          masterModels={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={onUpdateEnabled}
          onUpdateIncludeInStats={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    expect(getByText(i18n.t('accounts.deleteAccount'))).toBeTruthy();
    expect(getByText(i18n.t('accounts.includeInStats'))).toBeTruthy();
    const enableModels = getByLabelText(
      i18n.t('accounts.enableModels')
    ) as HTMLInputElement;
    expect(enableModels.checked).toBe(false);
    expect(getByText(i18n.t('accounts.expand'))).toBeTruthy();
    expect(queryByText(i18n.t('regions.regionList'))).toBeNull();

    fireEvent.click(enableModels);
    expect(onUpdateEnabled).toHaveBeenCalledWith(true);
    expect(getByText(i18n.t('accounts.collapse'))).toBeTruthy();
    expect(getByText(i18n.t('regions.regionList'))).toBeTruthy();
  });

  it('copies Azure CLI deployment code for all models in all regions from the account region header', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'user@example.com',
      note: '',
      enabled: true,
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroupName: 'rg-first',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'first-resource' },
        },
        {
          id: 'reg-2',
          name: 'swedencentral',
          modelsText: 'gpt-5.1',
          deployment: { resourceName: 'second-resource' },
          enabled: false,
        },
      ],
    };
    const onCopy = vi.fn();

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5', 'gpt-5.1-2025-11-13']]}
          masterGroupLines={[[['gpt-5', 'gpt-5.1-2025-11-13']]]}
          masterModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          filteredModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain('# Prepare eastus2');
    expect(copied).toContain('# Deploy eastus2');
    expect(copied).not.toContain('# Prepare swedencentral');
    expect(copied).not.toContain('# Deploy swedencentral');
    expect(copied.match(/RESOURCE_GROUP="rg-first"/g)).toHaveLength(2);
    expect(copied).toContain('ACCOUNT_NAME="first-resource"');
    expect(copied).toContain('ACCOUNT_EMAIL="user@example.com"');
    expect(copied).toContain(
      'foundry-deployment-result-${report_account}-${SUBSCRIPTION_ID}-${REPORT_TIMESTAMP}.txt'
    );
    expect(copied).not.toContain('ACCOUNT_NAME="second-resource"');
    expect(copied).toContain('ACCOUNT_LOCATION="eastus2"');
    expect(copied).toMatch(
      /"gpt-5\.1-2025-11-13\|OpenAI\|gpt-5\.1\|2025-11-13\|\d+"/
    );
  });

  it('copies Azure CLI deployment code for selected models in all regions', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroupName: 'rg-first',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5,gpt-5.1-2025-11-13',
          deployment: {
            resourceName: 'first-resource',
            models: { 'gpt-5': { enabled: false } },
          },
        },
        {
          id: 'reg-2',
          name: 'swedencentral',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'second-resource' },
        },
      ],
    };
    const onCopy = vi.fn();

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5', 'gpt-5.1-2025-11-13']]}
          masterGroupLines={[[['gpt-5', 'gpt-5.1-2025-11-13']]]}
          masterModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          filteredModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeploySelected'
        )}`,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain('# Prepare eastus2');
    expect(copied).toContain('# Prepare swedencentral');
    expect(copied).toContain('# Deploy eastus2');
    expect(copied).toContain('# Deploy swedencentral');
    expect(copied.match(/RESOURCE_GROUP="rg-first"/g)).toHaveLength(4);
    expect(copied.indexOf('# Prepare swedencentral')).toBeLessThan(
      copied.indexOf('# Deploy eastus2')
    );
    expect(copied).toContain('ACCOUNT_NAME="first-resource"');
    expect(copied).toContain('ACCOUNT_NAME="second-resource"');
    expect(copied).toContain('ACCOUNT_LOCATION="eastus2"');
    expect(copied).toContain('ACCOUNT_LOCATION="swedencentral"');
    expect(copied).toMatch(
      /"gpt-5\.1-2025-11-13\|OpenAI\|gpt-5\.1\|2025-11-13\|\d+"/
    );
    expect(copied).toMatch(
      /"gpt-5-2025-08-07\|OpenAI\|gpt-5\|2025-08-07\|\d+"/
    );
  });

  it('generates and saves the account resource group from the first region resource identity', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: '',
          deployment: { resourceName: 'first-resource' },
        },
      ],
    };
    const onUpdateResourceGroupName = vi.fn();

    const { getByText } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[]}
          masterGroupLines={[]}
          masterModels={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateResourceGroupName={onUpdateResourceGroupName}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(getByText(i18n.t('accounts.generateResourceGroupName')));

    expect(onUpdateResourceGroupName).toHaveBeenCalledWith('rg-first');
    expect(toastSuccess).toHaveBeenCalledWith(
      i18n.t('accounts.resourceGroupGenerated')
    );
  });

  it('keeps account-level deployment exports pinned to the saved resource group after disabling the first region', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroupName: 'rg-pinned',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'first-resource' },
          enabled: false,
        },
        {
          id: 'reg-2',
          name: 'swedencentral',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'second-resource' },
        },
      ],
    };
    const onCopy = vi.fn();

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          masterModels={['gpt-5']}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).not.toContain('ACCOUNT_NAME="first-resource"');
    expect(copied).toContain('ACCOUNT_NAME="second-resource"');
    expect(copied.match(/RESOURCE_GROUP="rg-pinned"/g)).toHaveLength(2);
  });

  it('blocks account-level deployment export when account resource group is empty', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'first-resource' },
        },
      ],
    };
    const onCopy = vi.fn();

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          masterModels={['gpt-5']}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    expect(onCopy).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      i18n.t('regions.deployMissingResourceGroupName')
    );
  });

  it('lets account-level Azure CLI export skip existing deployments', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'user@example.com',
      note: '',
      enabled: true,
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroupName: 'rg-first',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'first-resource' },
        },
      ],
    };
    const onCopy = vi.fn();

    const { getAllByLabelText, getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          masterModels={['gpt-5']}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    const overwriteCheckbox = getAllByLabelText(
      i18n.t('regions.azureCliOverwriteExisting')
    )[0] as HTMLInputElement;
    expect(overwriteCheckbox.checked).toBe(false);
    fireEvent.click(overwriteCheckbox);
    expect(overwriteCheckbox.checked).toBe(true);
    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain(
      'OVERWRITE_EXISTING="${OVERWRITE_EXISTING:-true}"'
    );
  });

  it('imports Service Principal JSON and uses it for account-level deployment without subscriptionId', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      subscriptionId: '',
      resourceGroupName: 'rg-first',
      servicePrincipal: {
        appId: 'app-id',
        displayName: 'azure-cli',
        password: 'secret',
        tenant: 'tenant-id',
      },
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'first-resource' },
        },
      ],
    };
    const onUpdateServicePrincipal = vi.fn();
    const onCopy = vi.fn();

    const { getByRole, getByPlaceholderText, getByText } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          masterModels={['gpt-5']}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateSubscriptionId={vi.fn()}
          onUpdateServicePrincipal={onUpdateServicePrincipal}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    expect(getByText(/azure-cli \/ app-id \/ tenant-id/)).toBeTruthy();
    fireEvent.click(getByText(i18n.t('accounts.copyServicePrincipalCode')));
    expect(onCopy).toHaveBeenCalledWith(
      [
        'SUBSCRIPTION_ID=$(az account show --query id -o tsv)',
        '',
        'az ad sp create-for-rbac \\',
        '  --name ai-foundry-manager-deploy \\',
        '  --role Contributor \\',
        '  --scopes /subscriptions/$SUBSCRIPTION_ID',
      ].join('\n'),
      i18n.t('accounts.copyServicePrincipalCode')
    );
    onCopy.mockClear();
    fireEvent.change(
      getByPlaceholderText(i18n.t('accounts.servicePrincipalJsonPlaceholder')),
      {
        target: {
          value: JSON.stringify({
            appId: 'new-app',
            password: 'new-secret',
            tenant: 'new-tenant',
          }),
        },
      }
    );
    fireEvent.click(getByText(i18n.t('accounts.importServicePrincipal')));
    expect(onUpdateServicePrincipal).toHaveBeenCalledWith({
      appId: 'new-app',
      displayName: undefined,
      password: 'new-secret',
      tenant: 'new-tenant',
    });

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain('az login --service-principal');
    expect(copied).toContain('SP_APP_ID="app-id"');
    expect(copied).toContain('az account list --query');
    expect(copied).toContain('az cognitiveservices account keys list');
  });

  it('copies account-level deployment code without subscriptionId or Service Principal for runtime discovery', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      subscriptionId: '',
      resourceGroupName: 'rg-first',
      regions: [
        {
          id: 'reg-1',
          name: 'eastus2',
          modelsText: 'gpt-5',
          deployment: { resourceName: 'first-resource' },
        },
      ],
    };
    const onCopy = vi.fn();

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          masterModels={['gpt-5']}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployAllRegionsCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain('CONFIGURED_SUBSCRIPTION_ID=""');
    expect(copied).toContain('az account list --query');
    expect(toastError).not.toHaveBeenCalledWith(
      i18n.t('regions.deployMissingSubscriptionId')
    );
  });

  it('hides Service Principal details in privacy mode', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      servicePrincipal: {
        appId: 'app-id',
        displayName: 'azure-cli',
        password: 'secret',
        tenant: 'tenant-id',
      },
      regions: [],
    };

    const { getByText, queryByText } = render(
      <I18nextProvider i18n={i18n}>
        <AccountCard
          account={account}
          privacyMode
          masterGroups={[]}
          masterGroupLines={[]}
          masterModels={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateNote={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionModelsText={vi.fn()}
          onUpdateRegionOpenaiEndpoint={vi.fn()}
          onUpdateRegionAnthropicEndpoint={vi.fn()}
          onUpdateRegionApiKey={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    expect(
      getByText(i18n.t('accounts.servicePrincipalConfigured'))
    ).toBeTruthy();
    expect(queryByText('app-id')).toBeNull();
    expect(queryByText('tenant-id')).toBeNull();
  });

  it('shows region Resource Name after API Key and supports manual editing', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: '',
      deployment: { resourceName: '' },
    };
    const onUpdateDeployment = vi.fn();

    const { getByText } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateDeployment={onUpdateDeployment}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    const apiKeyLabel = getByText('API Key');
    const resourceNameLabel = getByText(i18n.t('accounts.resourceName'));
    expect(
      apiKeyLabel.compareDocumentPosition(resourceNameLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    const input = resourceNameLabel.parentElement?.querySelector('input');
    expect(input).toBeTruthy();
    fireEvent.change(input as HTMLInputElement, {
      target: { value: 'my-region-resource' },
    });
    expect(onUpdateDeployment).toHaveBeenCalledWith({
      resourceName: 'my-region-resource',
    });
  });

  it('shows auto-generate action beside region Resource Name', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: '',
      deployment: { resourceName: '' },
    };

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="jessicabarrios060193@gmail.com"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateAiServicesEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateDeployment={vi.fn()}
          onApplyGeneratedIdentity={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    expect(
      getByRole('button', { name: i18n.t('regions.autoGenerate') })
    ).toBeTruthy();
  });

  it('auto-generates resource name and four endpoints from account email', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: '',
        deployment: { resourceName: '' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="jessicabarrios060193@gmail.com"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateAiServicesEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={(apiKey) =>
            setRegion((prev) => ({ ...prev, apiKey }))
          }
          onUpdateDeployment={(patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: { ...prev.deployment, ...patch },
            }))
          }
          onApplyGeneratedIdentity={(bundle: GeneratedRegionIdentityBundle) =>
            setRegion((prev) => ({
              ...prev,
              foundryProjectEndpoint: bundle.foundryProjectEndpoint,
              openaiEndpoint: bundle.openaiEndpoint,
              aiServicesEndpoint: bundle.aiServicesEndpoint,
              anthropicEndpoint: bundle.anthropicEndpoint,
              deployment: {
                ...prev.deployment,
                resourceName: bundle.resourceName,
              },
              inputSources: {
                ...prev.inputSources,
                resourceName: 'generated',
                foundryProjectEndpoint: 'generated',
                openaiEndpoint: 'generated',
                aiServicesEndpoint: 'generated',
                anthropicEndpoint: 'generated',
              },
            }))
          }
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      );
    };

    const { getByRole, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: i18n.t('regions.autoGenerate') })
    );

    expect(getByDisplayValue('jessicabarrios0601-1111-resource')).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://jessicabarrios0601-1111-resource.services.ai.azure.com/api/projects/jessicabarrios060193-1111'
      )
    ).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://jessicabarrios0601-1111-resource.openai.azure.com'
      )
    ).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://jessicabarrios0601-1111-resource.cognitiveservices.azure.com'
      )
    ).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://jessicabarrios0601-1111-resource.services.ai.azure.com/anthropic'
      )
    ).toBeTruthy();
  });

  it('rejects auto-generation when account name is not an email', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: '',
      deployment: { resourceName: '' },
    };

    const { getByRole, queryByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateAiServicesEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateDeployment={vi.fn()}
          onApplyGeneratedIdentity={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: i18n.t('regions.autoGenerate') })
    );

    expect(toastError).toHaveBeenCalledWith(
      i18n.t('regions.generateRequiresEmailAccountName')
    );
    expect(queryByDisplayValue(/-resource$/)).toBeNull();
  });

  it('requires confirmation before auto-generation overwrites manual values', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: '',
        deployment: { resourceName: 'manual-resource' },
        inputSources: { resourceName: 'manual' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="jessicabarrios060193@gmail.com"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateAiServicesEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateDeployment={vi.fn()}
          onApplyGeneratedIdentity={(bundle: GeneratedRegionIdentityBundle) =>
            setRegion((prev) => ({
              ...prev,
              foundryProjectEndpoint: bundle.foundryProjectEndpoint,
              openaiEndpoint: bundle.openaiEndpoint,
              aiServicesEndpoint: bundle.aiServicesEndpoint,
              anthropicEndpoint: bundle.anthropicEndpoint,
              deployment: {
                ...prev.deployment,
                resourceName: bundle.resourceName,
              },
              inputSources: {
                ...prev.inputSources,
                resourceName: 'generated',
                foundryProjectEndpoint: 'generated',
                openaiEndpoint: 'generated',
                aiServicesEndpoint: 'generated',
                anthropicEndpoint: 'generated',
              },
            }))
          }
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      );
    };

    const { getByRole, getByDisplayValue, getByText, queryByText } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: i18n.t('regions.autoGenerate') })
    );

    expect(
      getByText(i18n.t('confirmDialog.generateRegionIdentity.title'))
    ).toBeTruthy();
    fireEvent.click(getByRole('button', { name: i18n.t('common.cancel') }));

    expect(getByDisplayValue('manual-resource')).toBeTruthy();
    expect(
      queryByText(i18n.t('confirmDialog.generateRegionIdentity.title'))
    ).toBeNull();
  });

  it('uses region resourceName and template defaults for model rows', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5',
      deployment: { resourceName: 'my-account-resource' },
    };

    const onCopy = vi.fn();
    const { getByRole, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5']}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    expect(getByDisplayValue('gpt-5-2025-08-07')).toBeTruthy();
    expect(getByDisplayValue('2025-08-07')).toBeTruthy();
    expect(getByDisplayValue('OpenAI')).toBeTruthy();
    expect(getByDisplayValue('30000')).toBeTruthy();

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    const json = JSON.parse(copied);
    expect(json.parameters.resourceName.defaultValue).toBe(
      'my-account-resource'
    );
    expect(json.parameters.projectName.defaultValue).toBe('my-account');
    expect(json.parameters.location.defaultValue).toBe('eastus2');
    expect(json.variables.modelDeployments[0].modelFormat).toBe('OpenAI');
    expect(json.resources[1].type).toBe(
      'Microsoft.CognitiveServices/accounts/projects'
    );
  });

  it('uses explicit valid Foundry project endpoint projectId during export', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5',
      foundryProjectEndpoint:
        'https://sample-1234-resource.services.ai.azure.com/api/projects/sample-custom-project',
      deployment: { resourceName: 'sample-1234-resource' },
    };

    const onCopy = vi.fn();
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5']}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    const json = JSON.parse(copied);
    expect(json.parameters.projectName.defaultValue).toBe(
      'sample-custom-project'
    );
  });

  it('copies Azure CLI code for all master models in a region', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5',
      deployment: {
        resourceName: 'my-account-resource',
        models: {
          'gpt-5': { enabled: false },
        },
      },
    };

    const onCopy = vi.fn();
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          subscriptionId="37753a40-cbd3-4042-913b-3dd5d5a56f87"
          azureCliResourceGroupName="rg-first-region"
          masterModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          masterGroups={[['gpt-5', 'gpt-5.1-2025-11-13']]}
          masterGroupLines={[[['gpt-5', 'gpt-5.1-2025-11-13']]]}
          filteredModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain('RESOURCE_GROUP="rg-first-region"');
    expect(copied).toMatch(
      /"gpt-5-2025-08-07\|OpenAI\|gpt-5\|2025-08-07\|\d+"/
    );
    expect(copied).toMatch(
      /"gpt-5\.1-2025-11-13\|OpenAI\|gpt-5\.1\|2025-11-13\|\d+"/
    );
  });

  it('copies Azure CLI code for a region without subscriptionId or Service Principal for runtime discovery', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5',
      deployment: { resourceName: 'my-account-resource' },
    };
    const onCopy = vi.fn();

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          subscriptionId=""
          azureCliResourceGroupName="rg-first-region"
          masterModels={['gpt-5']}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: `${i18n.t('regions.azureCliDeployCode')} ${i18n.t(
          'regions.azureCliDeployAll'
        )}`,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).toContain('CONFIGURED_SUBSCRIPTION_ID=""');
    expect(copied).toContain('az account list --query');
    expect(toastError).not.toHaveBeenCalledWith(
      i18n.t('regions.deployMissingSubscriptionId')
    );
  });

  it('copies Azure CLI code for selected deployment rows in a region', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5,gpt-5.1-2025-11-13',
      deployment: {
        resourceName: 'my-account-resource',
        models: {
          'gpt-5': { enabled: false },
        },
      },
    };

    const onCopy = vi.fn();
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          subscriptionId="37753a40-cbd3-4042-913b-3dd5d5a56f87"
          azureCliResourceGroupName="rg-first-region"
          masterModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          masterGroups={[['gpt-5', 'gpt-5.1-2025-11-13']]}
          masterGroupLines={[[['gpt-5', 'gpt-5.1-2025-11-13']]]}
          filteredModels={['gpt-5', 'gpt-5.1-2025-11-13']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', {
        name: /^Azure CLI (部署代码|deployment code).*选中$|^Azure CLI deployment code.*Selected$/i,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    expect(copied).not.toMatch(
      /"gpt-5-2025-08-07\|OpenAI\|gpt-5\|2025-08-07\|\d+"/
    );
    expect(copied).toMatch(
      /"gpt-5\.1-2025-11-13\|OpenAI\|gpt-5\.1\|2025-11-13\|\d+"/
    );
  });

  it('blocks export when Foundry project endpoint is non-empty but invalid', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5',
      foundryProjectEndpoint: 'https://example.com/api/projects/not-azure',
      deployment: { resourceName: 'sample-1234-resource' },
    };

    const onCopy = vi.fn();
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5']}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          filteredModels={['gpt-5']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      i18n.t('regions.deployInvalidFoundryProjectEndpoint')
    );
  });

  it('syncs version, modelFormat, and capacity when deploymentName matches same-model template entry', () => {
    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5.2',
        deployment: {
          resourceName: 'my-account-resource',
          models: {
            'gpt-5.2': {
              deploymentName: 'custom-gpt-5.2',
              version: 'old-version',
              capacity: 1,
            },
          },
        },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5.2']}
          masterGroups={[['gpt-5.2']]}
          masterGroupLines={[[['gpt-5.2']]]}
          filteredModels={['gpt-5.2']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={(openaiEndpoint) =>
            setRegion((prev) => ({ ...prev, openaiEndpoint }))
          }
          onUpdateAnthropicEndpoint={(anthropicEndpoint) =>
            setRegion((prev) => ({ ...prev, anthropicEndpoint }))
          }
          onUpdateApiKey={(apiKey) =>
            setRegion((prev) => ({ ...prev, apiKey }))
          }
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { getByRole, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    fireEvent.change(getByDisplayValue('custom-gpt-5.2'), {
      target: { value: 'gpt-5.2-2025-12-11' },
    });

    expect(getByDisplayValue('2025-12-11')).toBeTruthy();
    expect(getByDisplayValue('OpenAI')).toBeTruthy();
    expect(getByDisplayValue('10000')).toBeTruthy();
  });

  it('allows export when deploymentName includes modelName case-insensitively', () => {
    const onCopy = vi.fn();

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5.2',
        deployment: { resourceName: 'my-account-resource' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5.2']}
          masterGroups={[['gpt-5.2']]}
          masterGroupLines={[[['gpt-5.2']]]}
          filteredModels={['gpt-5.2']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { getByRole, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    fireEvent.change(getByDisplayValue('gpt-5.2-2025-12-11'), {
      target: { value: 'GPT-5.2-custom' },
    });

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('allows template deploymentName/modelName combination with case differences', () => {
    const onCopy = vi.fn();

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'DeepSeek-V3.2',
        deployment: { resourceName: 'my-account-resource' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['DeepSeek-V3.2']}
          masterGroups={[['DeepSeek-V3.2']]}
          masterGroupLines={[[['DeepSeek-V3.2']]]}
          filteredModels={['DeepSeek-V3.2']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { getByRole, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    fireEvent.change(getByDisplayValue('deepseek-v3.2-251201'), {
      target: { value: 'deepseek-v3.2-251201' },
    });

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('blocks export when deploymentName maps to a different modelName in template', () => {
    const onCopy = vi.fn();

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5.2',
        deployment: { resourceName: 'my-account-resource' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5.2']}
          masterGroups={[['gpt-5.2']]}
          masterGroupLines={[[['gpt-5.2']]]}
          filteredModels={['gpt-5.2']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { getByRole, getByDisplayValue, getByText } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    fireEvent.change(getByDisplayValue('gpt-5.2-2025-12-11'), {
      target: { value: 'gpt-5.2-codex' },
    });

    expect(getByText('gpt-5.2')).toBeTruthy();

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).not.toHaveBeenCalled();
  });

  it('redirects deploymentName-like selected model to template modelName defaults', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5.1-2025-11-13',
      deployment: { resourceName: 'my-account-resource' },
    };

    const { getByRole, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5.1-2025-11-13']}
          masterGroups={[['gpt-5.1-2025-11-13']]}
          masterGroupLines={[[['gpt-5.1-2025-11-13']]]}
          filteredModels={['gpt-5.1-2025-11-13']}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    expect(getByDisplayValue('gpt-5.1-2025-11-13')).toBeTruthy();
    expect(getByDisplayValue('2025-11-13')).toBeTruthy();
    expect(getByDisplayValue('OpenAI')).toBeTruthy();
    expect(getByDisplayValue('10000')).toBeTruthy();
  });

  it('defaults base model unchecked when both modelName and deploymentName variant are selected', () => {
    const onCopy = vi.fn();
    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5.1,gpt-5.1-2025-11-13',
        deployment: { resourceName: 'my-account-resource' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5.1', 'gpt-5.1-2025-11-13']}
          masterGroups={[['gpt-5.1', 'gpt-5.1-2025-11-13']]}
          masterGroupLines={[[['gpt-5.1', 'gpt-5.1-2025-11-13']]]}
          filteredModels={['gpt-5.1', 'gpt-5.1-2025-11-13']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { container, getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    const rowCheckboxes = Array.from(
      container.querySelectorAll('tbody input[type="checkbox"]')
    ) as HTMLInputElement[];
    expect(rowCheckboxes).toHaveLength(2);
    expect(rowCheckboxes[0].checked).toBe(false);
    expect(rowCheckboxes[1].checked).toBe(true);

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    const json = JSON.parse(copied);
    expect(json.variables.modelDeployments).toHaveLength(1);
    expect(json.variables.modelDeployments[0].deploymentName).toBe(
      'gpt-5.1-2025-11-13'
    );
    expect(json.variables.modelDeployments[0].modelFormat).toBe('OpenAI');
  });

  it('renders modelFormat column after version and allows editing', () => {
    const onCopy = vi.fn();

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5',
        deployment: { resourceName: 'my-account-resource' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5']}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          filteredModels={['gpt-5']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { getByRole, getByText, getByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    const versionHeader = getByText(i18n.t('regions.deployVersion'));
    const formatHeader = getByText(i18n.t('regions.deployModelFormat'));
    expect(
      versionHeader.compareDocumentPosition(formatHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.change(getByDisplayValue('OpenAI'), {
      target: { value: 'DeepSeek' },
    });

    expect(getByDisplayValue('DeepSeek')).toBeTruthy();

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    const json = JSON.parse(copied);
    expect(json.variables.modelDeployments[0].modelFormat).toBe('DeepSeek');
  });

  it('cycles deployment bulk checkbox as invert -> select all -> select none', () => {
    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5,gpt-5.1',
        deployment: {
          resourceName: 'my-account-resource',
          models: {
            'gpt-5': { enabled: true },
            'gpt-5.1': { enabled: false },
          },
        },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5', 'gpt-5.1']}
          masterGroups={[['gpt-5', 'gpt-5.1']]}
          masterGroupLines={[[['gpt-5', 'gpt-5.1']]]}
          filteredModels={['gpt-5', 'gpt-5.1']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { container, getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(
      getByRole('button', { name: /模型部署|Model Deployment/i })
    );

    const bulkCheckbox = getByRole('checkbox', {
      name: /选择|Select/i,
    }) as HTMLInputElement;
    const getRowCheckboxes = () =>
      Array.from(
        container.querySelectorAll('tbody input[type="checkbox"]')
      ) as HTMLInputElement[];

    let rowCheckboxes = getRowCheckboxes();
    expect(rowCheckboxes).toHaveLength(2);
    expect(rowCheckboxes[0].checked).toBe(true);
    expect(rowCheckboxes[1].checked).toBe(false);

    fireEvent.click(bulkCheckbox);
    rowCheckboxes = getRowCheckboxes();
    expect(rowCheckboxes[0].checked).toBe(false);
    expect(rowCheckboxes[1].checked).toBe(true);
    expect(bulkCheckbox.indeterminate).toBe(true);
    expect(bulkCheckbox.checked).toBe(false);

    fireEvent.click(bulkCheckbox);
    rowCheckboxes = getRowCheckboxes();
    expect(rowCheckboxes[0].checked).toBe(true);
    expect(rowCheckboxes[1].checked).toBe(true);
    expect(bulkCheckbox.checked).toBe(true);
    expect(bulkCheckbox.indeterminate).toBe(false);

    fireEvent.click(bulkCheckbox);
    rowCheckboxes = getRowCheckboxes();
    expect(rowCheckboxes[0].checked).toBe(false);
    expect(rowCheckboxes[1].checked).toBe(false);
    expect(bulkCheckbox.checked).toBe(false);
    expect(bulkCheckbox.indeterminate).toBe(false);
  });

  it('blocks export when enabled row modelFormat is empty', () => {
    const onCopy = vi.fn();

    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: 'gpt-5',
        deployment: {
          resourceName: 'my-account-resource',
          models: {
            'gpt-5': {
              modelFormat: '',
            },
          },
        },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={['gpt-5']}
          masterGroups={[['gpt-5']]}
          masterGroupLines={[[['gpt-5']]]}
          filteredModels={['gpt-5']}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={onCopy}
          onUpdateDeploymentModel={(modelName, patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                models: {
                  ...(prev.deployment?.models || {}),
                  [modelName]: {
                    ...(prev.deployment?.models?.[modelName] || {}),
                    ...patch,
                  },
                },
              },
            }))
          }
        />
      );
    };

    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.click(getByRole('button', { name: /ARM/i }));

    expect(onCopy).not.toHaveBeenCalled();
  });

  it('editing Foundry project endpoint cross-fills other endpoint fields', () => {
    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: '',
        deployment: { resourceName: '' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateFoundryProjectEndpoint={(foundryProjectEndpoint) =>
            setRegion((prev) => ({ ...prev, foundryProjectEndpoint }))
          }
          onUpdateOpenaiEndpoint={(openaiEndpoint) =>
            setRegion((prev) => ({ ...prev, openaiEndpoint }))
          }
          onUpdateAiServicesEndpoint={(aiServicesEndpoint) =>
            setRegion((prev) => ({ ...prev, aiServicesEndpoint }))
          }
          onUpdateAnthropicEndpoint={(anthropicEndpoint) =>
            setRegion((prev) => ({ ...prev, anthropicEndpoint }))
          }
          onUpdateApiKey={(apiKey) =>
            setRegion((prev) => ({ ...prev, apiKey }))
          }
          onUpdateDeployment={(patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                ...patch,
              },
            }))
          }
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      );
    };

    const { getByDisplayValue, getByPlaceholderText } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.change(
      getByPlaceholderText(
        'https://xxx.services.ai.azure.com/api/projects/xxx'
      ),
      {
        target: {
          value:
            'https://616d30b6ef130dde-1161-resource.services.ai.azure.com/api/projects/616d30b6ef130dde-1161/',
        },
      }
    );

    expect(
      getByDisplayValue(
        'https://616d30b6ef130dde-1161-resource.services.ai.azure.com/api/projects/616d30b6ef130dde-1161'
      )
    ).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://616d30b6ef130dde-1161-resource.openai.azure.com'
      )
    ).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://616d30b6ef130dde-1161-resource.cognitiveservices.azure.com'
      )
    ).toBeTruthy();
    expect(
      getByDisplayValue(
        'https://616d30b6ef130dde-1161-resource.services.ai.azure.com/anthropic'
      )
    ).toBeTruthy();
    expect(getByDisplayValue('616d30b6ef130dde-1161-resource')).toBeTruthy();
  });

  it('editing invalid Foundry project endpoint preserves existing resource name', () => {
    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: '',
        deployment: { resourceName: 'existing-resource' },
      });

      return (
        <RegionCard
          region={region}
          accountId="acct-1"
          accountName="Account 1"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={(name) => setRegion((prev) => ({ ...prev, name }))}
          onUpdateModelsText={(modelsText) =>
            setRegion((prev) => ({ ...prev, modelsText }))
          }
          onUpdateFoundryProjectEndpoint={(foundryProjectEndpoint) =>
            setRegion((prev) => ({ ...prev, foundryProjectEndpoint }))
          }
          onUpdateOpenaiEndpoint={(openaiEndpoint) =>
            setRegion((prev) => ({ ...prev, openaiEndpoint }))
          }
          onUpdateAiServicesEndpoint={(aiServicesEndpoint) =>
            setRegion((prev) => ({ ...prev, aiServicesEndpoint }))
          }
          onUpdateAnthropicEndpoint={(anthropicEndpoint) =>
            setRegion((prev) => ({ ...prev, anthropicEndpoint }))
          }
          onUpdateApiKey={(apiKey) =>
            setRegion((prev) => ({ ...prev, apiKey }))
          }
          onUpdateDeployment={(patch) =>
            setRegion((prev) => ({
              ...prev,
              deployment: {
                ...prev.deployment,
                ...patch,
              },
            }))
          }
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      );
    };

    const { getByDisplayValue, getByPlaceholderText } = render(
      <I18nextProvider i18n={i18n}>
        <RegionHarness />
      </I18nextProvider>
    );

    fireEvent.change(
      getByPlaceholderText(
        'https://xxx.services.ai.azure.com/api/projects/xxx'
      ),
      {
        target: {
          value: 'https://example.com/api/projects/test-project',
        },
      }
    );

    expect(getByDisplayValue('existing-resource')).toBeTruthy();
    expect(
      getByDisplayValue('https://example.com/api/projects/test-project')
    ).toBeTruthy();
  });

  it('locks down endpoint/api key reveal and copy in privacy mode', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: '',
      foundryProjectEndpoint:
        'https://foo.services.ai.azure.com/api/projects/foo-project',
      openaiEndpoint: 'https://foo.openai.azure.com',
      aiServicesEndpoint: 'https://foo.cognitiveservices.azure.com',
      anthropicEndpoint: 'https://foo.services.ai.azure.com/anthropic',
      apiKey: 'sk-secret-123',
      deployment: { resourceName: 'my-sensitive-resource' },
    };

    const { queryAllByTitle, getByText, getAllByDisplayValue } = render(
      <I18nextProvider i18n={i18n}>
        <RegionCard
          region={region}
          privacyMode
          accountId="acct-1"
          accountName="Account 1"
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateName={vi.fn()}
          onUpdateModelsText={vi.fn()}
          onUpdateFoundryProjectEndpoint={vi.fn()}
          onUpdateOpenaiEndpoint={vi.fn()}
          onUpdateAiServicesEndpoint={vi.fn()}
          onUpdateAnthropicEndpoint={vi.fn()}
          onUpdateApiKey={vi.fn()}
          onUpdateEnabled={vi.fn()}
          onDelete={vi.fn()}
          onCopy={vi.fn()}
          onUpdateDeploymentModel={vi.fn()}
        />
      </I18nextProvider>
    );

    expect(getAllByDisplayValue('***').length).toBeGreaterThanOrEqual(2);
    expect(getAllByDisplayValue('https://***.openai.azure.com').length).toBe(1);
    expect(
      getAllByDisplayValue('https://***.services.ai.azure.com').length
    ).toBeGreaterThan(0);

    const resourceNameLabel = getByText(i18n.t('accounts.resourceName'));
    const resourceNameInput = resourceNameLabel.parentElement?.querySelector(
      'input'
    ) as HTMLInputElement;
    expect(resourceNameInput.value).toBe('***');
    expect(resourceNameInput.disabled).toBe(true);

    expect(queryAllByTitle(i18n.t('common.copy')).length).toBe(0);
    expect(queryAllByTitle(i18n.t('common.show')).length).toBe(0);
    expect(queryAllByTitle(i18n.t('common.hide')).length).toBe(0);
  });

  it('keeps the default region model template panel collapsed until opened', () => {
    const onUpdateRegionEnabled = vi.fn();
    const template: DefaultRegionModelTemplateConfig = {
      enabled: true,
      regions: [
        { id: 'template-1', name: 'eastus2', modelsText: '', enabled: true },
        {
          id: 'template-2',
          name: 'swedencentral',
          modelsText: '',
          enabled: true,
        },
        {
          id: 'template-3',
          name: 'polandcentral',
          modelsText: '',
          enabled: true,
        },
      ],
    };

    const {
      getByText,
      queryByDisplayValue,
      getByDisplayValue,
      getAllByLabelText,
    } = render(
      <I18nextProvider i18n={i18n}>
        <DefaultRegionModelTemplatePanel
          template={template}
          masterModels={[]}
          masterGroups={[]}
          masterGroupLines={[]}
          filteredModels={[]}
          onUpdateEnabled={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionEnabled={onUpdateRegionEnabled}
          onUpdateRegionModelsText={vi.fn()}
          onReorderRegions={vi.fn()}
          onCopy={vi.fn()}
        />
      </I18nextProvider>
    );

    expect(queryByDisplayValue('eastus2')).toBeNull();

    fireEvent.click(getByText(i18n.t('accounts.defaultRegionModelTemplate')));

    expect(getByDisplayValue('eastus2')).toBeTruthy();
    expect(getByDisplayValue('swedencentral')).toBeTruthy();
    expect(getByDisplayValue('polandcentral')).toBeTruthy();
    fireEvent.click(getAllByLabelText(i18n.t('regions.enableRegion'))[0]);
    expect(onUpdateRegionEnabled).toHaveBeenCalledWith('template-1', false);
  });

  it('supports paste, select all, clear, and copy in template regions', async () => {
    const onUpdateRegionModelsText = vi.fn();
    const onCopy = vi.fn();
    const template: DefaultRegionModelTemplateConfig = {
      enabled: true,
      regions: [
        {
          id: 'template-1',
          name: 'eastus2',
          modelsText: 'gpt-4o',
          enabled: true,
        },
      ],
    };

    const readText = vi.fn().mockResolvedValue('gpt-4o-mini gpt-5');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText },
    });

    const { getByText } = render(
      <I18nextProvider i18n={i18n}>
        <DefaultRegionModelTemplatePanel
          template={template}
          masterModels={['gpt-4o', 'gpt-4o-mini', 'gpt-5']}
          masterGroups={[['gpt-4o', 'gpt-4o-mini', 'gpt-5']]}
          masterGroupLines={[[['gpt-4o', 'gpt-4o-mini', 'gpt-5']]]}
          filteredModels={['gpt-4o', 'gpt-4o-mini', 'gpt-5']}
          onUpdateEnabled={vi.fn()}
          onAddRegion={vi.fn()}
          onDeleteRegion={vi.fn()}
          onUpdateRegionName={vi.fn()}
          onUpdateRegionEnabled={vi.fn()}
          onUpdateRegionModelsText={onUpdateRegionModelsText}
          onReorderRegions={vi.fn()}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    fireEvent.click(getByText(i18n.t('accounts.defaultRegionModelTemplate')));

    fireEvent.click(getByText(i18n.t('regions.pasteModels')));
    await waitFor(() => {
      expect(onUpdateRegionModelsText).toHaveBeenCalledWith(
        'template-1',
        'gpt-4o,gpt-4o-mini,gpt-5'
      );
    });

    fireEvent.click(getByText(i18n.t('regions.selectAll')));
    expect(onUpdateRegionModelsText).toHaveBeenLastCalledWith(
      'template-1',
      'gpt-4o,gpt-4o-mini,gpt-5'
    );

    fireEvent.click(getByText(i18n.t('regions.clear')));
    expect(onUpdateRegionModelsText).toHaveBeenLastCalledWith('template-1', '');

    fireEvent.click(getByText(i18n.t('regions.copyRegionModels')));
    expect(onCopy).toHaveBeenCalledWith(
      'gpt-4o,',
      `${i18n.t('accounts.defaultRegionModelTemplate')} / eastus2`
    );
  });
});
