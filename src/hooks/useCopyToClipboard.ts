import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './useToast';

export interface UseCopyToClipboardOptions {
  /** 复制成功后的重置延迟（毫秒） */
  resetDelay?: number;
  /** 是否显示 toast 通知 */
  showToast?: boolean;
}

export interface UseCopyToClipboardReturn {
  /** 执行复制操作 */
  copy: (text: string, label?: string) => Promise<boolean>;
  /** 最近复制的文本 */
  copiedText: string | null;
  /** 当前是否处于复制成功状态（用于显示反馈动画） */
  copied: boolean;
  /** 手动重置复制状态 */
  reset: () => void;
}

export const useCopyToClipboard = (
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn => {
  const { resetDelay = 2000, showToast = true } = options;

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string, label?: string): Promise<boolean> => {
      if (!text) {
        if (showToast) {
          toast.error('没有内容可以复制');
        }
        return false;
      }

      try {
        // 优先使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          setCopiedText(text);
          setCopied(true);
          if (showToast) {
            toast.success(`已复制${label ? `：${label}` : ''}`);
          }

          // 设置自动重置
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, resetDelay);

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
          setCopied(true);
          if (showToast) {
            toast.success(`已复制${label ? `：${label}` : ''}`);
          }

          // 设置自动重置
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, resetDelay);

          return true;
        }

        throw new Error('Copy command failed');
      } catch (error) {
        console.error('Failed to copy:', error);
        if (showToast) {
          toast.error('复制失败，请手动选择文本');
        }
        return false;
      }
    },
    [resetDelay, showToast, toast]
  );

  return { copy, copiedText, copied, reset };
};
