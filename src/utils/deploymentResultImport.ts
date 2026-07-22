export const DEPLOYMENT_RESULT_JSON_BEGIN =
  'AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN';
export const DEPLOYMENT_RESULT_JSON_END =
  'AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END';

export interface DeploymentResultRegion {
  region: string;
  resourceName?: string;
  foundryProjectEndpoint?: string;
  openaiEndpoint?: string;
  aiServicesEndpoint?: string;
  apiKey?: string;
}

export interface DeploymentResultPayload {
  subscriptionId?: string;
  regions: DeploymentResultRegion[];
}

export interface ParsedDeploymentResult {
  subscriptionId?: string;
  regions: DeploymentResultRegion[];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeRegion(value: unknown): DeploymentResultRegion | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const region = asString(raw.region) || asString(raw.location);
  if (!region) return null;

  return {
    region,
    resourceName: asString(raw.resourceName),
    foundryProjectEndpoint: asString(raw.foundryProjectEndpoint),
    openaiEndpoint: asString(raw.openaiEndpoint),
    aiServicesEndpoint: asString(raw.aiServicesEndpoint),
    apiKey: asString(raw.apiKey) || asString(raw.key1),
  };
}

function normalizePayload(value: unknown): DeploymentResultPayload | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const regions = Array.isArray(raw.regions)
    ? raw.regions
        .map((region) => normalizeRegion(region))
        .filter((region): region is DeploymentResultRegion => Boolean(region))
    : [];

  if (regions.length === 0) return null;
  return {
    subscriptionId: asString(raw.subscriptionId),
    regions,
  };
}

function mergePayloads(payloads: DeploymentResultPayload[]): ParsedDeploymentResult {
  const subscriptionId = payloads.find((payload) => payload.subscriptionId)
    ?.subscriptionId;
  const regionMap = new Map<string, DeploymentResultRegion>();

  for (const payload of payloads) {
    for (const region of payload.regions) {
      const key = [
        region.resourceName?.toLowerCase(),
        region.foundryProjectEndpoint?.toLowerCase(),
        region.openaiEndpoint?.toLowerCase(),
        region.region.toLowerCase(),
      ]
        .filter(Boolean)
        .join('|');
      const existing = regionMap.get(key) || { region: region.region };
      regionMap.set(key, { ...existing, ...region });
    }
  }

  return {
    subscriptionId,
    regions: Array.from(regionMap.values()),
  };
}

function parseJsonBlocks(text: string): DeploymentResultPayload[] {
  const escapedBegin = DEPLOYMENT_RESULT_JSON_BEGIN.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
  const escapedEnd = DEPLOYMENT_RESULT_JSON_END.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
  const pattern = new RegExp(`${escapedBegin}\\s*([\\s\\S]*?)\\s*${escapedEnd}`, 'g');
  const payloads: DeploymentResultPayload[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    try {
      const normalized = normalizePayload(JSON.parse(match[1]));
      if (normalized) payloads.push(normalized);
    } catch {
      // Ignore malformed blocks and let the caller decide if fallback applies.
    }
  }

  return payloads;
}

function parseLabeledValue(line: string, label: string): string | undefined {
  const pattern = new RegExp(`^\\s*${label}\\s*:\\s*(.*)$`, 'i');
  const match = line.match(pattern);
  return match ? asString(match[1]) : undefined;
}

function parseHumanSummary(text: string): DeploymentResultPayload | null {
  const lines = text.split(/\r?\n/);
  const subscriptionId =
    lines.map((line) => parseLabeledValue(line, 'Subscription ID')).find(Boolean) ||
    undefined;
  const regions: DeploymentResultRegion[] = [];
  let current: Partial<DeploymentResultRegion> = {};

  const flush = () => {
    if (current.region) {
      regions.push({
        region: current.region,
        resourceName: current.resourceName,
        foundryProjectEndpoint: current.foundryProjectEndpoint,
        openaiEndpoint: current.openaiEndpoint,
        aiServicesEndpoint: current.aiServicesEndpoint,
        apiKey: current.apiKey,
      });
    }
    current = {};
  };

  for (const line of lines) {
    const region = parseLabeledValue(line, 'Region');
    if (region) {
      flush();
      current.region = region;
      continue;
    }

    current.resourceName =
      parseLabeledValue(line, 'Resource name') || current.resourceName;
    current.foundryProjectEndpoint =
      parseLabeledValue(line, 'Foundry endpoint') ||
      current.foundryProjectEndpoint;
    current.openaiEndpoint =
      parseLabeledValue(line, 'OpenAI endpoint') || current.openaiEndpoint;
    current.aiServicesEndpoint =
      parseLabeledValue(line, 'AI Services endpoint') ||
      current.aiServicesEndpoint;
    current.apiKey =
      parseLabeledValue(line, 'Account key') ||
      parseLabeledValue(line, 'Key1') ||
      current.apiKey;
  }
  flush();

  if (regions.length === 0) return null;
  return { subscriptionId, regions };
}

export function parseDeploymentResultText(text: string): ParsedDeploymentResult {
  const jsonPayloads = parseJsonBlocks(text);
  if (jsonPayloads.length > 0) {
    return mergePayloads(jsonPayloads);
  }

  const fallback = parseHumanSummary(text);
  if (fallback) {
    return mergePayloads([fallback]);
  }

  throw new Error('No deployment result data found');
}
