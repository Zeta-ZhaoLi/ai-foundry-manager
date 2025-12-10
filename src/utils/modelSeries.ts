// 模型系列归类 & 文本导出工具

export type ExportFormat = 'comma' | 'lines';

// 模型大类: 常规模型 (OpenAI + 其他), Sora 系列, Claude 系列
export type ModelCategory = 'standard' | 'sora' | 'claude';

export function getModelCategory(modelId: string): ModelCategory {
  const id = modelId.toLowerCase();

  // Claude 系列
  if (id.startsWith('claude')) return 'claude';

  // Sora 系列
  if (id.startsWith('sora')) return 'sora';

  // 其他都归为常规模型 (OpenAI 系列 + 其他)
  return 'standard';
}

// 按大类分组模型
export function groupModelsByCategory(models: string[]): Record<ModelCategory, string[]> {
  const result: Record<ModelCategory, string[]> = {
    standard: [],
    sora: [],
    claude: [],
  };

  for (const model of models) {
    const category = getModelCategory(model);
    result[category].push(model);
  }

  // 每组内排序
  result.standard.sort();
  result.sora.sort();
  result.claude.sort();

  return result;
}

export function getSeries(modelId: string): string {
  const id = modelId.toLowerCase();

  if (id.startsWith('gpt-4o-mini')) return 'gpt-4o-mini';
  if (id.startsWith('gpt-4o')) return 'gpt-4o';

  if (id.startsWith('gpt-4.1-mini')) return 'gpt-4.1-mini';
  if (id.startsWith('gpt-4.1')) return 'gpt-4.1';

  if (id.startsWith('gpt-35-turbo')) return 'gpt-35-turbo';

  if (id.startsWith('o1-')) return 'o1-series';
  if (id.startsWith('o3-')) return 'o3-series';

  // 其他模型直接用完整 ID 当系列名
  return modelId;
}

export function buildCopyString(
  models: string[],
  format: ExportFormat = 'comma',
): string {
  const list = models
    .filter((m) => m && m.trim().length > 0)
    .map((m) => m.trim());

  if (format === 'lines') {
    // 每行一个模型，末尾保留逗号，方便粘贴
    return list.map((m) => `${m},`).join('\n');
  }

  // 默认：每个模型后加逗号，之间用空格分隔
  return list.map((m) => `${m},`).join(' ');
}

