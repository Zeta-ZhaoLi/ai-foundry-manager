import { describe, it, expect } from 'vitest';
import {
  SAMPLE_ARM_TEMPLATE_INPUT,
  validateArmTemplateInput,
  buildAzureOpenAiArmTemplate,
  stringifyAzureOpenAiArmTemplate,
  buildAzureOpenAiMainTemplate,
  getFallbackModelDeploymentDefaults,
  getTemplateModelDeploymentDefaults,
  getTemplateModelDeploymentDefaultsMap,
  stringifyAzureOpenAiMainTemplate,
} from '../armTemplate';

describe('armTemplate', () => {
  it('validates the sample input', () => {
    const result = validateArmTemplateInput(SAMPLE_ARM_TEMPLATE_INPUT);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('builds an ARM template with expected top-level fields', () => {
    const template = buildAzureOpenAiArmTemplate(
      SAMPLE_ARM_TEMPLATE_INPUT
    ) as any;
    expect(template.$schema).toContain('deploymentTemplate');
    expect(template.parameters.resourceName.type).toBe('String');
    expect(template.parameters.location.type).toBe('String');
    expect(Array.isArray(template.variables.modelDeployments)).toBe(true);
    expect(Array.isArray(template.resources)).toBe(true);
    expect(template.resources[0].type).toBe(
      'Microsoft.CognitiveServices/accounts'
    );
  });

  it('stringifies to valid JSON', () => {
    const json = stringifyAzureOpenAiArmTemplate(SAMPLE_ARM_TEMPLATE_INPUT);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('builds mainTemplate-based ARM template with expected substitutions', () => {
    const template = buildAzureOpenAiMainTemplate(
      SAMPLE_ARM_TEMPLATE_INPUT
    ) as any;
    expect(template.kind).toBeUndefined();
    expect(template.resources[0].kind).toBe('AIServices');
    expect(template.parameters.resourceName.defaultValue).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.resourceName
    );
    expect(template.parameters.location.defaultValue).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.location
    );
    expect(Array.isArray(template.variables.modelDeployments)).toBe(true);
    expect(template.variables.modelDeployments.length).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.modelDeployments.length
    );
  });

  it('stringifies mainTemplate-based template to valid JSON', () => {
    const json = stringifyAzureOpenAiMainTemplate(SAMPLE_ARM_TEMPLATE_INPUT);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('resolves template defaults by modelName', () => {
    const defaults = getTemplateModelDeploymentDefaults('gpt-5.2-codex');
    expect(defaults).toEqual({
      deploymentName: 'gpt-5.2-codex',
      version: '2026-01-14',
      capacity: 1000,
    });
  });

  it('returns fallback defaults when model is not in template', () => {
    const defaults = getTemplateModelDeploymentDefaults('not-exists-model');
    expect(defaults).toBeUndefined();
    expect(getFallbackModelDeploymentDefaults('not-exists-model')).toEqual({
      deploymentName: 'not-exists-model',
      version: '',
      capacity: 1000,
    });
  });

  it('builds template defaults map with unique model names', () => {
    const defaultsMap = getTemplateModelDeploymentDefaultsMap();
    expect(defaultsMap.size).toBeGreaterThan(0);
    expect(defaultsMap.get('gpt-5')).toEqual({
      deploymentName: 'gpt-5-2025-08-07',
      version: '2025-08-07',
      capacity: 1000,
    });
  });

  it('rejects duplicate deployment names', () => {
    const bad = {
      ...SAMPLE_ARM_TEMPLATE_INPUT,
      modelDeployments: [
        ...SAMPLE_ARM_TEMPLATE_INPUT.modelDeployments,
        {
          deploymentName:
            SAMPLE_ARM_TEMPLATE_INPUT.modelDeployments[0].deploymentName,
          modelName: 'x',
          version: '2020-01-01',
          capacity: 1,
        },
      ],
    };
    const result = validateArmTemplateInput(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('must be unique'))).toBe(true);
  });
});
