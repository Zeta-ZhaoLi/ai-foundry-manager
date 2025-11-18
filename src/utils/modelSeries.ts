// 模型系列归类 & 文本导出工具

export type ExportFormat = 'comma' | 'lines';

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

