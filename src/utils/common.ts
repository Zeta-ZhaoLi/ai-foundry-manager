/**
 * 解析模型文本为数组
 * 支持逗号、空格、换行等分隔符
 */
export function parseModels(text: string): string[] {
  if (!text) return [];
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export interface MasterModelDirectoryParseResult {
  /** Groups separated by blank lines, with duplicates removed globally by first appearance */
  groups: string[][];
  /** Groups -> lines -> models (lines preserved for rendering; duplicates removed globally) */
  groupLines: string[][][];
  /** Flattened unique model list ordered by first appearance */
  allModels: string[];
}

/**
 * 从区域模型列表计算：已部署模型（去重，按首次出现顺序）。
 * regionsModels: 每个区域一个模型数组（建议已是 parseModels 的结果）。
 */
export function computeDeployedModels(regionsModels: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const regionModels of regionsModels) {
    for (const raw of regionModels) {
      const model = (raw || '').trim();
      if (!model) continue;
      if (seen.has(model)) continue;
      seen.add(model);
      out.push(model);
    }
  }

  return out;
}

/**
 * 计算每个模型被多少个区域部署。
 * 同一个区域内重复出现的模型只计 1 次。
 */
export function computeModelRegionCounts(
  regionsModels: string[][]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const regionModels of regionsModels) {
    const regionSet = new Set(
      regionModels.map((m) => (m || '').trim()).filter(Boolean)
    );

    for (const model of regionSet) {
      counts[model] = (counts[model] || 0) + 1;
    }
  }

  return counts;
}

/**
 * 按全局模型目录排序：
 * - 目录内的模型按目录顺序排列
 * - 不在目录内的模型追加到末尾（字典序）
 * - 去重：保留首次出现
 */
export function orderModelsByMaster(
  models: string[],
  masterModels: string[]
): string[] {
  const index = new Map<string, number>();
  masterModels.forEach((m, i) => index.set(m, i));

  const seen = new Set<string>();
  const inMaster: string[] = [];
  const extra: string[] = [];

  for (const raw of models) {
    const m = (raw || '').trim();
    if (!m) continue;
    if (seen.has(m)) continue;
    seen.add(m);
    if (index.has(m)) inMaster.push(m);
    else extra.push(m);
  }

  inMaster.sort((a, b) => index.get(a)! - index.get(b)!);
  extra.sort((a, b) => a.localeCompare(b));

  return [...inMaster, ...extra];
}

/**
 * 解析全局模型目录：
 * - 空行分组（中间隔一行空的视为不同组）
 * - 组内支持逗号/空格/换行/Tab 分隔
 * - 全局去重：同一模型仅保留首次出现的位置
 */
export function parseMasterModelDirectory(
  text: string
): MasterModelDirectoryParseResult {
  if (!text || !text.trim())
    return { groups: [], groupLines: [], allModels: [] };

  const normalized = text.replace(/\r\n/g, '\n');
  const blocks = normalized.split(/\n\s*\n+/g);

  const seen = new Set<string>();
  const allModels: string[] = [];
  const groups: string[][] = [];
  const groupLines: string[][][] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const group: string[] = [];
    const linesOut: string[][] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      const tokens = trimmedLine.match(/[^\s,]+/g) || [];
      const lineModels: string[] = [];

      for (const raw of tokens) {
        const model = raw.trim();
        if (!model) continue;
        if (seen.has(model)) continue;
        seen.add(model);
        allModels.push(model);
        group.push(model);
        lineModels.push(model);
      }

      if (lineModels.length > 0) {
        linesOut.push(lineModels);
      }
    }

    if (group.length > 0) {
      groups.push(group);
      groupLines.push(linesOut);
    }
  }

  return { groups, groupLines, allModels };
}

/**
 * 延迟执行函数 (用于性能优化)
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): (...args: TArgs) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: TArgs) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证 Azure OpenAI Endpoint
 */
export function isValidAzureEndpoint(endpoint: string): boolean {
  if (!endpoint) return false;
  return (
    isValidUrl(endpoint) &&
    (endpoint.includes('openai.azure.com') || endpoint.includes('azure'))
  );
}

/**
 * 验证 API Key 格式
 */
export function isValidApiKey(key: string): boolean {
  // Azure OpenAI API Key 通常是 32 位十六进制字符串
  return key.length >= 32 && /^[a-zA-Z0-9]+$/.test(key);
}

/**
 * 规范化 OpenAI Endpoint
 * 去除末尾斜杠
 */
export function normalizeOpenAIEndpoint(url: string): string {
  if (!url) return url;
  // 去除末尾的斜杠
  return url.replace(/\/+$/, '');
}

/**
 * 规范化 Azure AI Services Endpoint
 * 去除末尾斜杠
 */
export function normalizeAiServicesEndpoint(url: string): string {
  if (!url) return url;
  return url.replace(/\/+$/, '');
}

/**
 * 规范化 Foundry Project Endpoint
 * 去除末尾斜杠
 */
export function normalizeFoundryProjectEndpoint(url: string): string {
  if (!url) return url;
  return url.replace(/\/+$/, '');
}

/**
 * 规范化 Anthropic Endpoint
 * 去除末尾的 /v1/messages 路径和斜杠
 */
export function normalizeAnthropicEndpoint(url: string): string {
  if (!url) return url;
  // 去除末尾的 /v1/messages（不区分大小写）
  let normalized = url.replace(/\/v1\/messages\/?$/i, '');
  // 去除末尾的斜杠
  normalized = normalized.replace(/\/+$/, '');
  return normalized;
}

export interface AzureEndpointIdentity {
  resourceName: string;
  projectId?: string;
}

export interface AzureEndpointSet {
  foundryProjectEndpoint: string;
  openaiEndpoint: string;
  aiServicesEndpoint: string;
  anthropicEndpoint: string;
}

export interface GeneratedRegionIdentityBundle extends AzureEndpointSet {
  resourceName: string;
  projectId: string;
}

export interface GenerateRegionIdentityResult {
  ok: boolean;
  bundle?: GeneratedRegionIdentityBundle;
  error?: 'invalid_account_email' | 'generation_failed';
}

export interface EffectiveFoundryProjectIdentity {
  resourceName: string;
  projectId: string;
  foundryProjectEndpoint: string;
}

export interface EffectiveFoundryProjectIdentityResult {
  ok: boolean;
  identity?: EffectiveFoundryProjectIdentity;
  error?: 'missing_resource_name' | 'invalid_foundry_project_endpoint';
}

const RESOURCE_NAME_SUFFIX = '-resource';

export function parseAzureEndpointIdentity(
  endpoint: string
): AzureEndpointIdentity | null {
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;
    const path = url.pathname.replace(/\/+$/, '');

    const openaiMatch = hostname.match(/^([^.]+)\.openai\.azure\.com$/);
    if (openaiMatch) {
      return { resourceName: openaiMatch[1] };
    }

    const aiServicesMatch = hostname.match(
      /^([^.]+)\.cognitiveservices\.azure\.com$/
    );
    if (aiServicesMatch) {
      return { resourceName: aiServicesMatch[1] };
    }

    const servicesMatch = hostname.match(/^([^.]+)\.services\.ai\.azure\.com$/);
    if (!servicesMatch) return null;

    const resourceName = servicesMatch[1];
    const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch) {
      return {
        resourceName,
        projectId: projectMatch[1],
      };
    }

    if (path === '/anthropic' || path.startsWith('/anthropic/')) {
      return { resourceName };
    }

    return null;
  } catch {
    return null;
  }
}

export function getDefaultProjectIdFromResourceName(resourceName: string): string {
  const trimmed = resourceName.trim();
  if (!trimmed) return '';
  const stripped = trimmed.endsWith(RESOURCE_NAME_SUFFIX)
    ? trimmed.slice(0, -RESOURCE_NAME_SUFFIX.length)
    : trimmed;
  return stripped || trimmed;
}

export function buildAzureEndpointSet(
  identity: AzureEndpointIdentity
): AzureEndpointSet {
  const projectId =
    identity.projectId || getDefaultProjectIdFromResourceName(identity.resourceName);
  return {
    foundryProjectEndpoint: `https://${identity.resourceName}.services.ai.azure.com/api/projects/${projectId}`,
    openaiEndpoint: `https://${identity.resourceName}.openai.azure.com`,
    aiServicesEndpoint: `https://${identity.resourceName}.cognitiveservices.azure.com`,
    anthropicEndpoint: `https://${identity.resourceName}.services.ai.azure.com/anthropic`,
  };
}

export function deriveAzureEndpointSetFromAny(
  endpoint: string
): AzureEndpointSet | null {
  const identity = parseAzureEndpointIdentity(endpoint);
  if (!identity) return null;
  return buildAzureEndpointSet(identity);
}

/**
 * 从 Azure Endpoint 提取资源名称
 * 支持 OpenAI、AI Services、Foundry Project、Anthropic 格式
 */
export function extractAzureResourceName(endpoint: string): string | null {
  return parseAzureEndpointIdentity(endpoint)?.resourceName || null;
}

export function resolveEffectiveFoundryProjectIdentity(
  resourceName: string,
  foundryProjectEndpoint = ''
): EffectiveFoundryProjectIdentityResult {
  const normalizedResourceName = resourceName.trim();
  const normalizedEndpoint = normalizeFoundryProjectEndpoint(
    foundryProjectEndpoint
  ).trim();

  if (normalizedEndpoint) {
    const parsed = parseAzureEndpointIdentity(normalizedEndpoint);
    if (!parsed?.projectId) {
      return {
        ok: false,
        error: 'invalid_foundry_project_endpoint',
      };
    }
    return {
      ok: true,
      identity: {
        resourceName: normalizedResourceName || parsed.resourceName,
        projectId: parsed.projectId,
        foundryProjectEndpoint: normalizedEndpoint,
      },
    };
  }

  if (!normalizedResourceName) {
    return {
      ok: false,
      error: 'missing_resource_name',
    };
  }

  const projectId = getDefaultProjectIdFromResourceName(normalizedResourceName);
  return {
    ok: true,
    identity: {
      resourceName: normalizedResourceName,
      projectId,
      foundryProjectEndpoint: buildAzureEndpointSet({
        resourceName: normalizedResourceName,
        projectId,
      }).foundryProjectEndpoint,
    },
  };
}

function isValidEmailAccountName(accountName: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountName.trim());
}

function buildRandomDigits(length: number, random: () => number): string {
  return Array.from({ length }, () => Math.floor(random() * 10)).join('');
}

export function generateRegionIdentityBundleFromAccountEmail(
  accountName: string,
  existingResourceNames: string[],
  random: () => number = Math.random
): GenerateRegionIdentityResult {
  if (!isValidEmailAccountName(accountName)) {
    return { ok: false, error: 'invalid_account_email' };
  }

  const localPart = accountName.trim().split('@')[0] || '';
  const baseSeed = localPart.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!baseSeed) {
    return { ok: false, error: 'invalid_account_email' };
  }

  const suffix = '-resource';
  const randomDigitsLength = 4;
  const baseMaxLength = 32 - suffix.length - 1 - randomDigitsLength;
  const resourceBase = baseSeed.slice(0, Math.max(1, baseMaxLength));
  const existingSet = new Set(
    existingResourceNames.map((name) => name.trim()).filter(Boolean)
  );

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = buildRandomDigits(randomDigitsLength, random);
    const resourceName = `${resourceBase}-${digits}${suffix}`;
    if (existingSet.has(resourceName)) continue;

    const projectId = `${baseSeed}-${digits}`;
    return {
      ok: true,
      bundle: {
        resourceName,
        projectId,
        ...buildAzureEndpointSet({ resourceName, projectId }),
      },
    };
  }

  return { ok: false, error: 'generation_failed' };
}

/**
 * 将 OpenAI Endpoint 转换为 Anthropic Endpoint
 */
export function convertOpenAIToAnthropicEndpoint(
  openaiEndpoint: string
): string | null {
  const all = deriveAzureEndpointSetFromAny(openaiEndpoint);
  return all?.anthropicEndpoint || null;
}

/**
 * 将 Anthropic Endpoint 转换为 OpenAI Endpoint
 */
export function convertAnthropicToOpenAIEndpoint(
  anthropicEndpoint: string
): string | null {
  const all = deriveAzureEndpointSetFromAny(anthropicEndpoint);
  return all?.openaiEndpoint || null;
}
