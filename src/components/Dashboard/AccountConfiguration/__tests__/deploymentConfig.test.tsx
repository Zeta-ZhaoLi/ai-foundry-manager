import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import { AccountCard } from '../AccountCard';
import { RegionCard } from '../RegionCard';
import type {
  LocalAccount,
  LocalRegion,
} from '../../../../hooks/useLocalAzureAccounts';

describe('deployment configuration contract', () => {
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
    const resourceNameLabel = getByText('Resource Name');
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
    expect(getByDisplayValue('1000')).toBeTruthy();

    fireEvent.click(
      getByRole('button', { name: /复制部署代码|Copy deployment code/i })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    const json = JSON.parse(copied) as any;
    expect(json.parameters.resourceName.defaultValue).toBe(
      'my-account-resource'
    );
    expect(json.parameters.location.defaultValue).toBe('eastus2');
  });

  it('syncs version and capacity when deploymentName matches same-model template entry', () => {
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
    expect(getByDisplayValue('1000')).toBeTruthy();
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

    fireEvent.click(
      getByRole('button', { name: /复制部署代码|Copy deployment code/i })
    );

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
    expect(getByDisplayValue('1000')).toBeTruthy();
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

    fireEvent.click(
      getByRole('button', { name: /复制部署代码|Copy deployment code/i })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
    const copied = onCopy.mock.calls[0][0] as string;
    const json = JSON.parse(copied) as any;
    expect(json.variables.modelDeployments).toHaveLength(1);
    expect(json.variables.modelDeployments[0].deploymentName).toBe(
      'gpt-5.1-2025-11-13'
    );
  });

  it('editing Foundry project endpoint cross-fills other endpoint fields', () => {
    const RegionHarness = () => {
      const [region, setRegion] = useState<LocalRegion>({
        id: 'reg-1',
        name: 'eastus2',
        modelsText: '',
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

    const resourceNameLabel = getByText('Resource Name');
    const resourceNameInput = resourceNameLabel.parentElement?.querySelector(
      'input'
    ) as HTMLInputElement;
    expect(resourceNameInput.value).toBe('***');
    expect(resourceNameInput.disabled).toBe(true);

    expect(queryAllByTitle(i18n.t('common.copy')).length).toBe(0);
    expect(queryAllByTitle(i18n.t('common.show')).length).toBe(0);
    expect(queryAllByTitle(i18n.t('common.hide')).length).toBe(0);
  });
});
