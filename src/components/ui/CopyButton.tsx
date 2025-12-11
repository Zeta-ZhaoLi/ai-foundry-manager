import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Tooltip } from './Tooltip';

export interface CopyButtonProps {
  /** 要复制的文本 */
  text: string;
  /** 复制标签（用于 toast） */
  label?: string;
  /** 复制成功回调 */
  onCopy?: (text: string, label?: string) => void;
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 按钮变体 */
  variant?: 'default' | 'ghost' | 'outline';
  /** 显示文本 */
  showText?: boolean;
  /** 自定义类名 */
  className?: string;
  /** Tooltip 内容 */
  tooltipContent?: string;
  /** 禁用状态 */
  disabled?: boolean;
}

// 复制图标
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
    />
  </svg>
);

// 勾选图标
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  onCopy,
  size = 'md',
  variant = 'default',
  showText = false,
  className,
  tooltipContent,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (disabled || !text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);
      onCopy?.(text, label);

      // 自动重置
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text, label, onCopy, disabled]);

  const sizeStyles = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantStyles = {
    default:
      'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-200',
    outline:
      'bg-transparent hover:bg-gray-800 text-gray-400 border border-gray-700',
  };

  const button = (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !text}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        copied && 'bg-green-900/50 border-green-700 text-green-400',
        className
      )}
      aria-label={copied ? '已复制' : (tooltipContent || '复制')}
    >
      <span className="relative">
        {/* 复制图标 - 淡出 */}
        <CopyIcon
          className={clsx(
            iconSizes[size],
            'transition-all duration-200',
            copied ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          )}
        />
        {/* 勾选图标 - 淡入 */}
        <CheckIcon
          className={clsx(
            iconSizes[size],
            'absolute inset-0 transition-all duration-200',
            copied ? 'opacity-100 scale-100 text-green-400' : 'opacity-0 scale-75'
          )}
        />
      </span>
      {showText && (
        <span className="text-xs">
          {copied ? '已复制' : '复制'}
        </span>
      )}
    </button>
  );

  // 如果有 tooltip 内容，包裹在 Tooltip 中
  if (tooltipContent && !copied) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {button}
      </Tooltip>
    );
  }

  return button;
};

CopyButton.displayName = 'CopyButton';
