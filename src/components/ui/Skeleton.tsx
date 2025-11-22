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
