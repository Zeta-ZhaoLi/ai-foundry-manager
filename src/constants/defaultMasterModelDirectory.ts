import defaultMasterModelDirectoryText from './defaultMasterModelDirectory.txt?raw';

function normalizeDirectoryText(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

// 手动维护默认支持模型时，请编辑同目录下的 defaultMasterModelDirectory.txt
export const DEFAULT_MASTER_MODEL_DIRECTORY_TEXT = normalizeDirectoryText(
  defaultMasterModelDirectoryText
);
