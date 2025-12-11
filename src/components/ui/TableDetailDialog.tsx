import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './Dialog';

export interface TableDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const TableDetailDialog: React.FC<TableDetailDialogProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  actions,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="full"
        onClose={() => onOpenChange(false)}
        className="flex flex-col"
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 mr-8">
                {actions}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4 -mx-6 px-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

TableDetailDialog.displayName = 'TableDetailDialog';
