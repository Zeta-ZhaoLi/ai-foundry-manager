// 简单的模型系列归类工具，用于按系列聚合 Azure OpenAI 模型

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

export function buildCopyString(models: string[]): string {
  // 每个模型后面加一个逗号，中间用空格分隔，方便一键复制
  return models
    .filter((m) => m && m.trim().length > 0)
    .map((m) => `${m.trim()},`)
    .join(' ');
}

