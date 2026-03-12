export interface ArmModelDeployment {
  deploymentName: string;
  modelName: string;
  version: string;
  modelFormat: string;
  capacity: number;
}

export interface ArmTemplateInput {
  resourceName: string;
  projectName: string;
  location: string;
  modelDeployments: ArmModelDeployment[];
}

export interface ArmTemplateValidation {
  valid: boolean;
  errors: string[];
}

export interface TemplateModelDeploymentDefaults {
  deploymentName: string;
  version: string;
  modelFormat: string;
  capacity: number;
}

export interface TemplateModelDeploymentEntry
  extends TemplateModelDeploymentDefaults {
  modelName: string;
}

export interface TemplateModelDeploymentLookups {
  defaultsByModelName: ReadonlyMap<
    string,
    readonly TemplateModelDeploymentEntry[]
  >;
  entryByDeploymentName: ReadonlyMap<string, TemplateModelDeploymentEntry>;
}

export const ARM_TEMPLATE_SCHEMA =
  'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#';

export const AZURE_OPENAI_ACCOUNT_API_VERSION = '2024-10-01';
export const AZURE_DEPLOYMENT_RESOURCE_API_VERSION = '2021-04-01';
export const AZURE_FOUNDRY_PROJECT_API_VERSION = '2025-09-01';

export const DEFAULT_OPENAI_ACCOUNT_SKU = 'S0';
export const DEFAULT_DEPLOYMENT_SKU = 'GlobalStandard';

// NOTE: template lives at repo root and is treated as canonical.
// It is imported at build time and used as a read-only base template.
import foundryTemplateJson from '../../Azure-AI-Founryd-Deployment-Template.json';

const DEFAULT_DEPLOYMENT_CAPACITY = 1000;
const DEFAULT_MODEL_FORMAT = 'OpenAI';

function toTemplateModelDeploymentEntry(
  item: any
): TemplateModelDeploymentEntry | undefined {
  const modelName =
    typeof item?.modelName === 'string' ? item.modelName.trim() : '';
  const deploymentName =
    typeof item?.deploymentName === 'string' ? item.deploymentName.trim() : '';
  const version = typeof item?.version === 'string' ? item.version.trim() : '';
  const modelFormat =
    typeof item?.modelFormat === 'string' ? item.modelFormat.trim() : '';
  const capacity = item?.capacity;

  if (!modelName || !deploymentName || !version || !modelFormat) {
    return undefined;
  }
  if (!Number.isInteger(capacity) || capacity <= 0) return undefined;

  return {
    modelName,
    deploymentName,
    version,
    modelFormat,
    capacity,
  };
}

export function buildTemplateModelDeploymentLookups(
  items: unknown
): TemplateModelDeploymentLookups {
  const defaultsByModelName = new Map<string, TemplateModelDeploymentEntry[]>();
  const entryByDeploymentName = new Map<string, TemplateModelDeploymentEntry>();
  if (!Array.isArray(items)) {
    return {
      defaultsByModelName,
      entryByDeploymentName,
    };
  }

  for (const raw of items) {
    const entry = toTemplateModelDeploymentEntry(raw);
    if (!entry) continue;

    if (!defaultsByModelName.has(entry.modelName)) {
      defaultsByModelName.set(entry.modelName, []);
    }
    defaultsByModelName.get(entry.modelName)?.push(entry);

    if (!entryByDeploymentName.has(entry.deploymentName)) {
      entryByDeploymentName.set(entry.deploymentName, entry);
    }
  }

  return {
    defaultsByModelName,
    entryByDeploymentName,
  };
}

export function getTemplateModelDeploymentLookups(): TemplateModelDeploymentLookups {
  const items = (foundryTemplateJson as any)?.variables?.modelDeployments;
  return buildTemplateModelDeploymentLookups(items);
}

export function getTemplateModelDeploymentEntriesByModelNameMap(): ReadonlyMap<
  string,
  readonly TemplateModelDeploymentEntry[]
> {
  return getTemplateModelDeploymentLookups().defaultsByModelName;
}

export function getTemplateModelDeploymentByDeploymentNameMap(): ReadonlyMap<
  string,
  TemplateModelDeploymentEntry
> {
  return getTemplateModelDeploymentLookups().entryByDeploymentName;
}

export function getTemplateModelDeploymentDefaultsMap(): ReadonlyMap<
  string,
  TemplateModelDeploymentDefaults
> {
  const defaults = new Map<string, TemplateModelDeploymentDefaults>();
  const byModelName = getTemplateModelDeploymentEntriesByModelNameMap();
  for (const [modelName, entries] of byModelName.entries()) {
    const first = entries[0];
    if (!first) continue;
    defaults.set(modelName, {
      deploymentName: first.deploymentName,
      version: first.version,
      modelFormat: first.modelFormat,
      capacity: first.capacity,
    });
  }

  return defaults;
}

export function getTemplateModelDeploymentDefaults(
  modelName: string
): TemplateModelDeploymentDefaults | undefined {
  return getTemplateModelDeploymentDefaultsMap().get(modelName);
}

export function getFallbackModelDeploymentDefaults(modelName: string): {
  deploymentName: string;
  version: string;
  modelFormat: string;
  capacity: number;
} {
  return {
    deploymentName: modelName,
    version: '',
    modelFormat: DEFAULT_MODEL_FORMAT,
    capacity: DEFAULT_DEPLOYMENT_CAPACITY,
  };
}

export function validateArmTemplateInput(
  input: ArmTemplateInput
): ArmTemplateValidation {
  const errors: string[] = [];

  if (!input.resourceName.trim()) errors.push('resourceName is required');
  if (!input.projectName.trim()) errors.push('projectName is required');
  if (!input.location.trim()) errors.push('location is required');

  const seen = new Set<string>();
  for (const d of input.modelDeployments) {
    const name = d.deploymentName.trim();
    const model = d.modelName.trim();
    const version = d.version.trim();
    const modelFormat = d.modelFormat.trim();

    if (!name) errors.push('deploymentName is required');
    if (name) {
      if (seen.has(name)) errors.push(`deploymentName must be unique: ${name}`);
      seen.add(name);
    }

    if (!model) errors.push(`modelName is required${name ? ` (${name})` : ''}`);
    if (!version) errors.push(`version is required${name ? ` (${name})` : ''}`);
    if (!modelFormat) {
      errors.push(`modelFormat is required${name ? ` (${name})` : ''}`);
    }
    if (!Number.isInteger(d.capacity) || d.capacity <= 0) {
      errors.push(
        `capacity must be a positive integer${name ? ` (${name})` : ''}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function buildFoundryProjectResource() {
  return {
    type: 'Microsoft.CognitiveServices/accounts/projects',
    apiVersion: AZURE_FOUNDRY_PROJECT_API_VERSION,
    name: "[format('{0}/{1}', parameters('resourceName'), parameters('projectName'))]",
    location: "[parameters('location')]",
    identity: {
      type: 'SystemAssigned',
    },
    dependsOn: [
      "[resourceId('Microsoft.CognitiveServices/accounts', parameters('resourceName'))]",
    ],
    properties: {
      displayName: "[parameters('projectName')]",
      description: 'AI project',
    },
  };
}

export function buildAzureOpenAiArmTemplate(input: ArmTemplateInput) {
  return {
    $schema: ARM_TEMPLATE_SCHEMA,
    contentVersion: '1.0.0.0',
    parameters: {
      resourceName: {
        defaultValue: input.resourceName,
        type: 'String',
      },
      projectName: {
        defaultValue: input.projectName,
        type: 'String',
      },
      location: {
        defaultValue: input.location,
        type: 'String',
      },
    },
    variables: {
      modelDeployments: input.modelDeployments.map((d) => ({
        deploymentName: d.deploymentName,
        modelName: d.modelName,
        version: d.version,
        modelFormat: d.modelFormat,
        capacity: d.capacity,
      })),
    },
    resources: [
      {
        type: 'Microsoft.CognitiveServices/accounts',
        apiVersion: AZURE_OPENAI_ACCOUNT_API_VERSION,
        name: "[parameters('resourceName')]",
        location: "[parameters('location')]",
        sku: {
          name: DEFAULT_OPENAI_ACCOUNT_SKU,
        },
        kind: 'OpenAI',
        properties: {
          customSubDomainName: "[parameters('resourceName')]",
          networkAcls: {
            defaultAction: 'Allow',
            virtualNetworkRules: [],
            ipRules: [],
          },
          publicNetworkAccess: 'Enabled',
        },
      },
      buildFoundryProjectResource(),
      {
        type: 'Microsoft.Resources/deployments',
        apiVersion: AZURE_DEPLOYMENT_RESOURCE_API_VERSION,
        name: "[concat('deploy_', variables('modelDeployments')[copyIndex()].deploymentName)]",
        dependsOn: [
          "[resourceId('Microsoft.CognitiveServices/accounts', parameters('resourceName'))]",
        ],
        copy: {
          name: 'modelDeploymentLoop',
          count: "[length(variables('modelDeployments'))]",
          mode: 'serial',
        },
        properties: {
          mode: 'Incremental',
          template: {
            $schema: ARM_TEMPLATE_SCHEMA,
            contentVersion: '1.0.0.0',
            resources: [
              {
                type: 'Microsoft.CognitiveServices/accounts/deployments',
                apiVersion: AZURE_OPENAI_ACCOUNT_API_VERSION,
                name: "[concat(parameters('resourceName'), '/', variables('modelDeployments')[copyIndex()].deploymentName)]",
                sku: {
                  name: DEFAULT_DEPLOYMENT_SKU,
                  capacity:
                    "[variables('modelDeployments')[copyIndex()].capacity]",
                },
                properties: {
                  model: {
                    format:
                      "[variables('modelDeployments')[copyIndex()].modelFormat]",
                    name: "[variables('modelDeployments')[copyIndex()].modelName]",
                    version:
                      "[variables('modelDeployments')[copyIndex()].version]",
                  },
                  versionUpgradeOption: 'OnceNewDefaultVersionAvailable',
                  currentCapacity:
                    "[variables('modelDeployments')[copyIndex()].capacity]",
                  raiPolicyName: 'Microsoft.Nil',
                },
              },
            ],
          },
        },
      },
    ],
  };
}

export function stringifyAzureOpenAiArmTemplate(
  input: ArmTemplateInput
): string {
  const template = buildAzureOpenAiArmTemplate(input);
  return JSON.stringify(template, null, 2);
}

export function buildAzureOpenAiMainTemplate(input: ArmTemplateInput) {
  // Deep clone to avoid mutating the imported JSON module
  const template: any = JSON.parse(JSON.stringify(foundryTemplateJson));

  template.parameters = template.parameters || {};
  template.parameters.resourceName = template.parameters.resourceName || {
    type: 'String',
  };
  template.parameters.projectName = template.parameters.projectName || {
    type: 'String',
  };
  template.parameters.location = template.parameters.location || {
    type: 'String',
  };

  template.parameters.resourceName.defaultValue = input.resourceName;
  template.parameters.projectName.defaultValue = input.projectName;
  template.parameters.location.defaultValue = input.location;

  template.variables = template.variables || {};
  template.variables.modelDeployments = input.modelDeployments.map((d) => ({
    deploymentName: d.deploymentName,
    modelName: d.modelName,
    version: d.version,
    modelFormat: d.modelFormat,
    capacity: d.capacity,
  }));

  template.resources = Array.isArray(template.resources) ? template.resources : [];
  const projectResource = buildFoundryProjectResource();
  const existingProjectIndex = template.resources.findIndex(
    (resource: any) =>
      resource?.type === 'Microsoft.CognitiveServices/accounts/projects'
  );
  if (existingProjectIndex >= 0) {
    template.resources[existingProjectIndex] = projectResource;
  } else {
    const accountIndex = template.resources.findIndex(
      (resource: any) => resource?.type === 'Microsoft.CognitiveServices/accounts'
    );
    const insertIndex = accountIndex >= 0 ? accountIndex + 1 : 0;
    template.resources.splice(insertIndex, 0, projectResource);
  }

  return template;
}

export function stringifyAzureOpenAiMainTemplate(
  input: ArmTemplateInput
): string {
  const template = buildAzureOpenAiMainTemplate(input);
  return JSON.stringify(template, null, 2);
}

export const SAMPLE_ARM_TEMPLATE_INPUT: ArmTemplateInput = {
  resourceName: 'assd655566',
  projectName: 'assd655566',
  location: 'eastus2',
  modelDeployments: [
    {
      deploymentName: 'gpt-4o-mini',
      modelName: 'gpt-4o-mini',
      version: '2024-07-18',
      modelFormat: 'OpenAI',
      capacity: 20000,
    },
    {
      deploymentName: 'gpt-image-1',
      modelName: 'gpt-image-1',
      version: '2025-04-15',
      modelFormat: 'OpenAI',
      capacity: 60,
    },
    {
      deploymentName: 'o3',
      modelName: 'o3',
      version: '2025-04-16',
      modelFormat: 'OpenAI',
      capacity: 10000,
    },
    {
      deploymentName: 'gpt-4.1',
      modelName: 'gpt-4.1',
      version: '2025-04-14',
      modelFormat: 'OpenAI',
      capacity: 5000,
    },
    {
      deploymentName: 'gpt-4o-2024-05-13',
      modelName: 'gpt-4o',
      version: '2024-05-13',
      modelFormat: 'OpenAI',
      capacity: 20000,
    },
    {
      deploymentName: 'gpt-5-chat',
      modelName: 'gpt-5-chat',
      version: '2025-08-07',
      modelFormat: 'OpenAI',
      capacity: 5000,
    },
    {
      deploymentName: 'gpt-5-mini',
      modelName: 'gpt-5-mini',
      version: '2025-08-07',
      modelFormat: 'OpenAI',
      capacity: 10000,
    },
    {
      deploymentName: 'gpt-5-nano',
      modelName: 'gpt-5-nano',
      version: '2025-08-07',
      modelFormat: 'OpenAI',
      capacity: 1000,
    },
    {
      deploymentName: 'gpt-5',
      modelName: 'gpt-5',
      version: '2025-08-07',
      modelFormat: 'OpenAI',
      capacity: 10000,
    },
  ],
};
