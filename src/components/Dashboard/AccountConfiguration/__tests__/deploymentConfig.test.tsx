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
  it('shows Resource Name and hides Subscription ID/Resource Group in account deployment config', () => {
    const account: LocalAccount = {
      id: 'acct-1',
      name: 'Account 1',
      note: '',
      enabled: true,
      regions: [],
    };

    const { queryByText, getByText } = render(
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
          onUpdateDeployment={vi.fn()}
        />
      </I18nextProvider>
    );

    const quotaLabel = getByText(/Quota|额度/i);
    const resourceNameLabel = getByText('Resource Name');
    expect(resourceNameLabel).toBeTruthy();
    expect(
      quotaLabel.compareDocumentPosition(resourceNameLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(queryByText('Subscription ID')).toBeNull();
    expect(queryByText('Resource Group')).toBeNull();
    expect(queryByText('Azure Deployment Config')).toBeNull();
  });

  it('uses account resourceName and template defaults for model rows', () => {
    const region: LocalRegion = {
      id: 'reg-1',
      name: 'eastus2',
      modelsText: 'gpt-5',
      deployment: {},
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
          accountDeployment={{ resourceName: 'my-account-resource' }}
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
          accountDeployment={{ resourceName: 'my-account-resource' }}
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
});
