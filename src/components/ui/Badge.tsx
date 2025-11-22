import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variantStyles = {
    success: 'bg-green-900/50 text-green-300 border-green-800',
    warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
    danger: 'bg-red-900/50 text-red-300 border-red-800',
    info: 'bg-cyan-900/50 text-cyan-300 border-cyan-800',
    default: 'bg-gray-800/50 text-gray-300 border-gray-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
