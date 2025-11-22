import { useState } from 'react';
import { useToast } from './useToast';

export const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const toast = useToast();

  const copy = async (text: string, label?: string): Promise<boolean> => {
    if (!text) {
      toast.error('没有内容可以复制');
      return false;
    }

    try {
      // 优先使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        toast.success(`已复制${label ? `：${label}` : ''}`);
        return true;
      }

      // 降级方案：使用 textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);

      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        setCopiedText(text);
        toast.success(`已复制${label ? `：${label}` : ''}`);
        return true;
      }

      throw new Error('Copy command failed');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('复制失败，请手动选择文本');
      return false;
    }
  };

  return { copy, copiedText };
};
