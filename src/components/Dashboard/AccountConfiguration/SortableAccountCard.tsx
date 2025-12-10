import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { AccountCard, AccountCardProps, LocalAccount } from './AccountCard';

interface SortableAccountCardProps extends Omit<AccountCardProps, 'account'> {
  account: LocalAccount;
}

export const SortableAccountCard: React.FC<SortableAccountCardProps> = ({
  account,
  ...props
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative',
        isDragging && 'z-50 opacity-90 shadow-2xl'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={clsx(
          'absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center',
          'cursor-grab active:cursor-grabbing',
          'text-muted-foreground hover:text-foreground transition-colors',
          'rounded-l-xl'
        )}
        title="拖拽排序"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="5" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="19" r="1" fill="currentColor" />
          <circle cx="15" cy="5" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="19" r="1" fill="currentColor" />
        </svg>
      </div>

      {/* Account card with left padding for drag handle */}
      <div className="pl-6">
        <AccountCard account={account} {...props} />
      </div>
    </div>
  );
};

SortableAccountCard.displayName = 'SortableAccountCard';
