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
  /** Flattened unique model list ordered by first appearance */
  allModels: string[];
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
  if (!text || !text.trim()) return { groups: [], allModels: [] };

  const normalized = text.replace(/\r\n/g, '\n');
  const blocks = normalized.split(/\n\s*\n+/g);

  const seen = new Set<string>();
  const allModels: string[] = [];
  const groups: string[][] = [];

  for (const block of blocks) {
    const tokens = block.match(/[^\s,]+/g) || [];
    const group: string[] = [];

    for (const raw of tokens) {
      const model = raw.trim();
      if (!model) continue;
      if (seen.has(model)) continue;
      seen.add(model);
      allModels.push(model);
      group.push(model);
    }

    if (group.length > 0) {
      groups.push(group);
    }
  }

  return { groups, allModels };
}

/**
 * 延迟执行函数 (用于性能优化)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
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

/**
 * 从 Azure Endpoint 提取资源名称
 * 支持 OpenAI 和 Anthropic 两种格式
 */
export function extractAzureResourceName(endpoint: string): string | null {
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;

    // Pattern 1: xxx.openai.azure.com
    const openaiMatch = hostname.match(/^([^.]+)\.openai\.azure\.com$/);
    if (openaiMatch) return openaiMatch[1];

    // Pattern 2: xxx.services.ai.azure.com
    const anthropicMatch = hostname.match(
      /^([^.]+)\.services\.ai\.azure\.com$/
    );
    if (anthropicMatch) return anthropicMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * 将 OpenAI Endpoint 转换为 Anthropic Endpoint
 */
export function convertOpenAIToAnthropicEndpoint(
  openaiEndpoint: string
): string | null {
  const resourceName = extractAzureResourceName(openaiEndpoint);
  if (!resourceName) return null;

  return `https://${resourceName}.services.ai.azure.com/anthropic`;
}

/**
 * 将 Anthropic Endpoint 转换为 OpenAI Endpoint
 */
export function convertAnthropicToOpenAIEndpoint(
  anthropicEndpoint: string
): string | null {
  const resourceName = extractAzureResourceName(anthropicEndpoint);
  if (!resourceName) return null;

  return `https://${resourceName}.openai.azure.com`;
}
