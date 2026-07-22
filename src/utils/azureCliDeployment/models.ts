import {
  getFallbackModelDeploymentDefaults,
  getTemplateModelDeploymentByDeploymentNameMap,
  getTemplateModelDeploymentEntriesByModelNameMap,
} from '../armTemplate';
import { shellDoubleQuote } from './escaping';
import type {
  AzureCliDeploymentModel,
  AzureCliDeploymentModelOverride,
  AzureCliDeploymentRow,
} from './types';

export function stringifyAzureCliModelRows(
  models: AzureCliDeploymentModel[]
): string {
  return models
    .map(
      (model) =>
        `  "${shellDoubleQuote(model.deploymentName.trim())}|${shellDoubleQuote(
          model.modelFormat.trim()
        )}|${shellDoubleQuote(model.modelName.trim())}|${shellDoubleQuote(
          model.version.trim()
        )}|${Math.max(0, Math.floor(model.capacity ?? 0))}"`
    )
    .join('\n');
}

export function resolveAzureCliDeploymentRows(
  modelNames: string[],
  overrides: Record<string, AzureCliDeploymentModelOverride> = {}
): AzureCliDeploymentRow[] {
  const templateDefaultsByModelNameMap =
    getTemplateModelDeploymentEntriesByModelNameMap();
  const templateByDeploymentNameMap =
    getTemplateModelDeploymentByDeploymentNameMap();

  const redirectedModelNames = new Set<string>();
  for (const modelName of modelNames) {
    const match = templateByDeploymentNameMap.get(modelName);
    if (match) redirectedModelNames.add(match.modelName);
  }

  return modelNames.map((modelName) => {
    const cfg = overrides[modelName] || {};
    const deploymentMatch = templateByDeploymentNameMap.get(modelName);
    const resolvedModelName = deploymentMatch?.modelName || modelName;
    const fallback = getFallbackModelDeploymentDefaults(resolvedModelName);
    const templateDefaults =
      deploymentMatch ||
      templateDefaultsByModelNameMap.get(resolvedModelName)?.[0];
    const defaultEnabled = deploymentMatch
      ? true
      : !redirectedModelNames.has(resolvedModelName);

    return {
      sourceModel: modelName,
      modelName: resolvedModelName,
      enabled: cfg.enabled ?? defaultEnabled,
      deploymentName:
        cfg.deploymentName ??
        templateDefaults?.deploymentName ??
        fallback.deploymentName,
      version: cfg.version ?? templateDefaults?.version ?? fallback.version,
      modelFormat:
        cfg.modelFormat ??
        templateDefaults?.modelFormat ??
        fallback.modelFormat,
      capacity: cfg.capacity ?? templateDefaults?.capacity ?? fallback.capacity,
    };
  });
}

export function toAzureCliDeploymentModels(
  rows: AzureCliDeploymentRow[],
  options: { includeDisabled?: boolean } = {}
): AzureCliDeploymentModel[] {
  return rows
    .filter((row) => options.includeDisabled || row.enabled !== false)
    .map((row) => ({
      deploymentName: row.deploymentName.trim(),
      modelName: row.modelName.trim(),
      version: row.version.trim(),
      modelFormat: row.modelFormat.trim(),
      capacity: row.capacity,
    }));
}
