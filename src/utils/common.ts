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

/**
 * 延迟执行函数 (用于性能优化)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

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
