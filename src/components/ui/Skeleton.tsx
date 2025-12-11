import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  ...props
}) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-800',
        variantStyles[variant],
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="border border-gray-800 rounded-xl p-4 space-y-4">
    <Skeleton variant="text" width="60%" height="1.5rem" />
    <Skeleton variant="text" width="100%" height="1rem" />
    <Skeleton variant="text" width="80%" height="1rem" />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width="80px" height="32px" />
      <Skeleton variant="rectangular" width="80px" height="32px" />
    </div>
  </div>
);

// 账号卡片骨架屏
export const SkeletonAccountCard: React.FC = () => (
  <div className="border border-gray-800 rounded-xl p-4 space-y-3">
    {/* 标题行 */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton variant="rectangular" width="20px" height="20px" />
        <Skeleton variant="text" width="150px" height="1.25rem" />
        <Skeleton variant="rectangular" width="60px" height="24px" className="rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="rectangular" width="80px" height="28px" className="rounded-full" />
        <Skeleton variant="rectangular" width="28px" height="28px" className="rounded-full" />
      </div>
    </div>
    {/* 信息行 */}
    <div className="flex items-center gap-4">
      <Skeleton variant="text" width="100px" height="0.875rem" />
      <Skeleton variant="text" width="80px" height="0.875rem" />
      <Skeleton variant="text" width="120px" height="0.875rem" />
    </div>
    {/* 区域卡片 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-800 rounded-lg p-3 space-y-2">
          <Skeleton variant="text" width="80%" height="1rem" />
          <Skeleton variant="text" width="60%" height="0.75rem" />
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} variant="rectangular" width="60px" height="24px" className="rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 表格行骨架屏
export interface SkeletonTableRowProps {
  columns?: number;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({ columns = 6 }) => (
  <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-900">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === 0 ? '40px' : i === 1 ? '150px' : '80px'}
        height="1rem"
      />
    ))}
  </div>
);

// 表格骨架屏
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 6 }) => (
  <div className="border border-gray-800 rounded-xl overflow-hidden">
    {/* 表头 */}
    <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-800 bg-gray-900/50">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === 0 ? '40px' : i === 1 ? '150px' : '80px'}
          height="0.875rem"
        />
      ))}
    </div>
    {/* 表格行 */}
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} columns={columns} />
    ))}
  </div>
);

// 图表骨架屏
export interface SkeletonChartProps {
  size?: number;
}

export const SkeletonChart: React.FC<SkeletonChartProps> = ({ size = 100 }) => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton variant="circular" width={size} height={size} />
    <div className="flex gap-2">
      <Skeleton variant="text" width="60px" height="0.75rem" />
      <Skeleton variant="text" width="40px" height="0.75rem" />
    </div>
  </div>
);

// 统计卡片骨架屏
export const SkeletonStatCard: React.FC = () => (
  <div className="border border-gray-800 rounded-xl p-3 space-y-2">
    <Skeleton variant="text" width="60%" height="0.75rem" />
    <Skeleton variant="text" width="40%" height="1.5rem" />
  </div>
);

// 仪表盘骨架屏
export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-4">
    {/* 统计卡片行 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    {/* 图表行 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-800 rounded-xl p-4">
          <Skeleton variant="text" width="60%" height="1rem" className="mb-3" />
          <SkeletonChart />
        </div>
      ))}
    </div>
    {/* 表格 */}
    <SkeletonTable rows={5} columns={6} />
  </div>
);
