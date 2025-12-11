import React from 'react';
import clsx from 'clsx';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortIndicatorProps {
  /** 当前排序方向 */
  direction: SortDirection;
  /** 是否为当前排序列 */
  active?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md';
  /** 自定义类名 */
  className?: string;
}

export const SortIndicator: React.FC<SortIndicatorProps> = ({
  direction,
  active = false,
  size = 'sm',
  className,
}) => {
  const sizeStyles = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={clsx(
        'inline-flex flex-col items-center justify-center',
        sizeStyles[size],
        className
      )}
      aria-hidden="true"
    >
      {/* 向上箭头 */}
      <svg
        className={clsx(
          'w-full h-1/2 -mb-0.5 transition-colors',
          active && direction === 'asc'
            ? 'text-cyan-400'
            : 'text-gray-600'
        )}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      {/* 向下箭头 */}
      <svg
        className={clsx(
          'w-full h-1/2 -mt-0.5 transition-colors',
          active && direction === 'desc'
            ? 'text-cyan-400'
            : 'text-gray-600'
        )}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
};

// 可排序的表头组件
export interface SortableHeaderProps {
  /** 列标识 */
  column: string;
  /** 显示文本 */
  children: React.ReactNode;
  /** 当前排序列 */
  sortColumn: string | null;
  /** 当前排序方向 */
  sortDirection: SortDirection;
  /** 排序变更回调 */
  onSort: (column: string, direction: SortDirection) => void;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 自定义类名 */
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  column,
  children,
  sortColumn,
  sortDirection,
  onSort,
  align = 'left',
  className,
}) => {
  const isActive = sortColumn === column;

  const handleClick = () => {
    let newDirection: SortDirection;
    if (!isActive) {
      newDirection = 'asc';
    } else if (sortDirection === 'asc') {
      newDirection = 'desc';
    } else {
      newDirection = null;
    }
    onSort(column, newDirection);
  };

  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1 w-full',
        'hover:text-gray-200 transition-colors',
        'focus:outline-none focus:text-cyan-400',
        alignStyles[align],
        isActive && 'text-cyan-300',
        className
      )}
      aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{children}</span>
      <SortIndicator direction={sortDirection} active={isActive} />
    </button>
  );
};

SortIndicator.displayName = 'SortIndicator';
SortableHeader.displayName = 'SortableHeader';
