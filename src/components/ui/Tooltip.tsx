import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export interface TooltipProps {
  /** 提示内容 */
  content: React.ReactNode;
  /** 显示位置 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 显示延迟（毫秒） */
  delay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子元素 */
  children: React.ReactElement;
  /** 自定义类名 */
  className?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 300,
  disabled = false,
  children,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const gap = 8; // 间距

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - gap;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + gap;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + gap;
        break;
    }

    // 边界检测，防止超出视口
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 水平边界
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // 垂直边界
    if (top < scrollY + 8) {
      top = scrollY + 8;
    } else if (top + tooltipRect.height > scrollY + viewportHeight - 8) {
      top = scrollY + viewportHeight - tooltipRect.height - 8;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  const showTooltip = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // 计算位置
  useEffect(() => {
    if (isVisible) {
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isVisible, calculatePosition]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 克隆子元素并添加事件处理
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
  });

  const positionClasses = {
    top: 'mb-2',
    bottom: 'mt-2',
    left: 'mr-2',
    right: 'ml-2',
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-700',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-700',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-700',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-700',
  };

  const tooltipContent = isVisible && content && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={clsx(
        'fixed z-[9999] px-2.5 py-1.5 text-xs font-medium rounded-md shadow-lg',
        'bg-gray-800 dark:bg-gray-700 text-gray-100',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        positionClasses[position],
        className
      )}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
    >
      {content}
      {/* 箭头指示器 */}
      <span
        className={clsx(
          'absolute w-0 h-0 border-4',
          arrowClasses[position]
        )}
        aria-hidden="true"
      />
    </div>
  );

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
};

Tooltip.displayName = 'Tooltip';
