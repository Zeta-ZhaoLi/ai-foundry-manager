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
    success:
      'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
    warning:
      'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
    danger: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    info: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    default: 'bg-muted text-muted-foreground border-border',
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
