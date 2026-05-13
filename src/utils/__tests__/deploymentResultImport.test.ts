import { describe, expect, it } from 'vitest';

import {
  DEPLOYMENT_RESULT_JSON_BEGIN,
  DEPLOYMENT_RESULT_JSON_END,
  parseDeploymentResultText,
} from '../deploymentResultImport';

describe('deploymentResultImport', () => {
  it('parses a marked JSON deployment result block', () => {
    const text = `
${DEPLOYMENT_RESULT_JSON_BEGIN}
{"subscriptionId":"sub-1","regions":[{"region":"eastus2","resourceName":"acct-east","apiKey":"key-east"}]}
${DEPLOYMENT_RESULT_JSON_END}
`;

    expect(parseDeploymentResultText(text)).toEqual({
      subscriptionId: 'sub-1',
      regions: [
        {
          region: 'eastus2',
          resourceName: 'acct-east',
          apiKey: 'key-east',
        },
      ],
    });
  });

  it('merges multiple marked JSON blocks', () => {
    const text = `
${DEPLOYMENT_RESULT_JSON_BEGIN}
{"subscriptionId":"sub-1","regions":[{"region":"eastus2","resourceName":"acct-east","apiKey":"key-east"}]}
${DEPLOYMENT_RESULT_JSON_END}
${DEPLOYMENT_RESULT_JSON_BEGIN}
{"subscriptionId":"sub-1","regions":[{"region":"swedencentral","resourceName":"acct-sweden","apiKey":"key-sweden"}]}
${DEPLOYMENT_RESULT_JSON_END}
`;

    const parsed = parseDeploymentResultText(text);

    expect(parsed.subscriptionId).toBe('sub-1');
    expect(parsed.regions).toHaveLength(2);
    expect(parsed.regions.map((region) => region.apiKey)).toEqual([
      'key-east',
      'key-sweden',
    ]);
  });

  it('falls back to human-readable account summaries', () => {
    const parsed = parseDeploymentResultText(`
Account access summary
Subscription ID:  sub-1
Region:           eastus2
Resource name:    acct-east
Foundry endpoint: https://acct-east.services.ai.azure.com/api/projects/project
OpenAI endpoint:  https://acct-east.openai.azure.com
Key1:             key-east
`);

    expect(parsed.subscriptionId).toBe('sub-1');
    expect(parsed.regions[0]).toMatchObject({
      region: 'eastus2',
      resourceName: 'acct-east',
      apiKey: 'key-east',
    });
  });

  it('rejects unrelated text', () => {
    expect(() => parseDeploymentResultText('hello world')).toThrow(
      'No deployment result data found'
    );
  });
});
