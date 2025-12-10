import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { RegionCard, RegionCardProps, LocalRegion } from './RegionCard';

interface SortableRegionCardProps extends Omit<RegionCardProps, 'region'> {
  region: LocalRegion;
}

export const SortableRegionCard: React.FC<SortableRegionCardProps> = ({
  region,
  ...props
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: region.id });

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
        isDragging && 'z-50 opacity-90 shadow-xl'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={clsx(
          'absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center',
          'cursor-grab active:cursor-grabbing',
          'text-muted-foreground hover:text-foreground transition-colors',
          'rounded-l-lg'
        )}
        title="拖拽排序"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
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

      {/* Region card with left padding for drag handle */}
      <div className="pl-5">
        <RegionCard region={region} {...props} />
      </div>
    </div>
  );
};

SortableRegionCard.displayName = 'SortableRegionCard';
