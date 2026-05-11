import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

interface SortableTemplateRegionCardProps {
  id: string;
  children: React.ReactNode;
}

export const SortableTemplateRegionCard: React.FC<
  SortableTemplateRegionCardProps
> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(isDragging && 'opacity-60')}
    >
      <div className="flex gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 px-2 rounded border border-border bg-background text-muted-foreground text-xs cursor-grab active:cursor-grabbing hover:bg-muted"
          aria-label="Drag template region"
        >
          ⋮⋮
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
};

SortableTemplateRegionCard.displayName = 'SortableTemplateRegionCard';
