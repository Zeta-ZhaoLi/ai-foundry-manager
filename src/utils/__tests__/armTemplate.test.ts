import { describe, it, expect } from 'vitest';
import {
  SAMPLE_ARM_TEMPLATE_INPUT,
  buildTemplateModelDeploymentLookups,
  validateArmTemplateInput,
  buildAzureOpenAiArmTemplate,
  stringifyAzureOpenAiArmTemplate,
  buildAzureOpenAiMainTemplate,
  getFallbackModelDeploymentDefaults,
  getTemplateModelDeploymentByDeploymentNameMap,
  getTemplateModelDeploymentDefaults,
  getTemplateModelDeploymentEntriesByModelNameMap,
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
    expect(template.parameters.projectName.type).toBe('String');
    expect(template.parameters.location.type).toBe('String');
    expect(Array.isArray(template.variables.modelDeployments)).toBe(true);
    expect(Array.isArray(template.resources)).toBe(true);
    expect(template.resources[0].type).toBe(
      'Microsoft.CognitiveServices/accounts'
    );
    expect(template.resources[0].kind).toBe('AIServices');
    expect(template.resources[0].properties.allowProjectManagement).toBe(true);
    expect(
      template.resources.some(
        (resource: any) =>
          resource.type === 'Microsoft.CognitiveServices/accounts/projects'
      )
    ).toBe(true);
    const projectResource = template.resources.find(
      (resource: any) =>
        resource.type === 'Microsoft.CognitiveServices/accounts/projects'
    );
    const deploymentWrapper = template.resources.find(
      (resource: any) => resource.type === 'Microsoft.Resources/deployments'
    );
    expect(projectResource.location).toBe("[parameters('location')]");
    expect(projectResource.identity).toEqual({
      type: 'SystemAssigned',
    });
    expect(projectResource.properties).toEqual({
      displayName: "[parameters('projectName')]",
      description: 'AI project',
    });
    expect(deploymentWrapper.dependsOn).toEqual([
      "[resourceId('Microsoft.CognitiveServices/accounts', parameters('resourceName'))]",
      "[resourceId('Microsoft.CognitiveServices/accounts/projects', parameters('resourceName'), parameters('projectName'))]",
    ]);
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
    expect(template.resources[0].properties.allowProjectManagement).toBe(true);
    expect(template.parameters.resourceName.defaultValue).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.resourceName
    );
    expect(template.parameters.projectName.defaultValue).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.projectName
    );
    expect(template.parameters.location.defaultValue).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.location
    );
    expect(Array.isArray(template.variables.modelDeployments)).toBe(true);
    expect(template.variables.modelDeployments.length).toBe(
      SAMPLE_ARM_TEMPLATE_INPUT.modelDeployments.length
    );
    expect(template.resources[1].type).toBe(
      'Microsoft.CognitiveServices/accounts/projects'
    );
    expect(template.resources[1].name).toBe(
      "[format('{0}/{1}', parameters('resourceName'), parameters('projectName'))]"
    );
    expect(template.resources[1].location).toBe("[parameters('location')]");
    expect(template.resources[1].identity).toEqual({
      type: 'SystemAssigned',
    });
    expect(template.resources[1].properties).toEqual({
      displayName: "[parameters('projectName')]",
      description: 'AI project',
    });
    expect(template.resources[2].type).toBe(
      'Microsoft.CognitiveServices/accounts/deployments'
    );
    expect(template.resources[2].dependsOn).toEqual([
      "[resourceId('Microsoft.CognitiveServices/accounts', parameters('resourceName'))]",
      "[resourceId('Microsoft.CognitiveServices/accounts/projects', parameters('resourceName'), parameters('projectName'))]",
    ]);
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
      modelFormat: 'OpenAI',
      capacity: 10000,
    });
  });

  it('returns fallback defaults when model is not in template', () => {
    const defaults = getTemplateModelDeploymentDefaults('not-exists-model');
    expect(defaults).toBeUndefined();
    expect(getFallbackModelDeploymentDefaults('not-exists-model')).toEqual({
      deploymentName: 'not-exists-model',
      version: '',
      modelFormat: 'OpenAI',
      capacity: 1000,
    });
  });

  it('builds template defaults map with unique model names', () => {
    const defaultsMap = getTemplateModelDeploymentDefaultsMap();
    expect(defaultsMap.size).toBeGreaterThan(0);
    expect(defaultsMap.get('gpt-5')).toEqual({
      deploymentName: 'gpt-5-2025-08-07',
      version: '2025-08-07',
      modelFormat: 'OpenAI',
      capacity: 30000,
    });
  });

  it('provides deployment-name lookup from template', () => {
    const byDeploymentName = getTemplateModelDeploymentByDeploymentNameMap();
    expect(byDeploymentName.get('gpt-5.2-codex')).toEqual({
      deploymentName: 'gpt-5.2-codex',
      modelName: 'gpt-5.2-codex',
      version: '2026-01-14',
      modelFormat: 'OpenAI',
      capacity: 10000,
    });
  });

  it('supports multiple deployment entries for one model', () => {
    const lookups = buildTemplateModelDeploymentLookups([
      {
        deploymentName: 'gpt-5-2025-08-07',
        modelName: 'gpt-5',
        version: '2025-08-07',
        modelFormat: 'OpenAI',
        capacity: 1000,
      },
      {
        deploymentName: 'gpt-5-prod',
        modelName: 'gpt-5',
        version: '2025-09-01',
        modelFormat: 'OpenAI',
        capacity: 2000,
      },
    ]);
    expect(lookups.defaultsByModelName.get('gpt-5')).toEqual([
      {
        deploymentName: 'gpt-5-2025-08-07',
        modelName: 'gpt-5',
        version: '2025-08-07',
        modelFormat: 'OpenAI',
        capacity: 1000,
      },
      {
        deploymentName: 'gpt-5-prod',
        modelName: 'gpt-5',
        version: '2025-09-01',
        modelFormat: 'OpenAI',
        capacity: 2000,
      },
    ]);
    expect(lookups.entryByDeploymentName.get('gpt-5-prod')?.modelName).toBe(
      'gpt-5'
    );
  });

  it('keeps deterministic default as first entry for each model', () => {
    const byModel = getTemplateModelDeploymentEntriesByModelNameMap();
    const first = byModel.get('gpt-5')?.[0];
    expect(first?.deploymentName).toBe('gpt-5-2025-08-07');
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
          modelFormat: 'OpenAI',
          capacity: 1,
        },
      ],
    };
    const result = validateArmTemplateInput(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('must be unique'))).toBe(true);
  });

  it('requires projectName for template generation', () => {
    const bad = {
      ...SAMPLE_ARM_TEMPLATE_INPUT,
      projectName: '',
    };

    const result = validateArmTemplateInput(bad);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('projectName is required');
  });
});
