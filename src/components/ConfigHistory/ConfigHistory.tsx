import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ConfigVersion, formatTimestamp } from '../../hooks/useConfigHistory';

export interface ConfigHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: ConfigVersion[];
  currentVersionId: string | null;
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onClearAll: () => void;
  onSaveManual: () => void;
}

// 时钟图标
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// 恢复图标
const RestoreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

// 删除图标
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

export const ConfigHistory: React.FC<ConfigHistoryProps> = ({
  open,
  onOpenChange,
  versions,
  currentVersionId,
  onRestore,
  onDelete,
  onClearAll,
  onSaveManual,
}) => {
  const { t } = useTranslation();
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleRestore = (versionId: string) => {
    setConfirmRestore(versionId);
  };

  const handleDelete = (versionId: string) => {
    setConfirmDelete(versionId);
  };

  const executeRestore = () => {
    if (confirmRestore) {
      onRestore(confirmRestore);
      setConfirmRestore(null);
      onOpenChange(false);
    }
  };

  const executeDelete = () => {
    if (confirmDelete) {
      onDelete(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const executeClearAll = () => {
    onClearAll();
    setConfirmClearAll(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('configHistory.title', '配置版本历史')}
      >
        <div className="space-y-4">
          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t('configHistory.description', '查看和恢复之前的配置版本')}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onSaveManual}>
                {t('configHistory.saveNow', '立即保存')}
              </Button>
              {versions.length > 0 && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirmClearAll(true)}
                >
                  {t('configHistory.clearAll', '清空历史')}
                </Button>
              )}
            </div>
          </div>

          {/* 版本列表 */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {versions.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p>{t('configHistory.noVersions', '暂无历史版本')}</p>
                <p className="text-xs mt-1">
                  {t('configHistory.noVersionsHint', '配置变更时会自动保存')}
                </p>
              </div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg border',
                    'transition-colors',
                    currentVersionId === version.id
                      ? 'border-cyan-700 bg-cyan-900/20'
                      : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800/50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {version.description}
                      </span>
                      {version.isAutoSave && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                          {t('configHistory.autoSave', '自动')}
                        </span>
                      )}
                      {currentVersionId === version.id && (
                        <span className="px-1.5 py-0.5 text-xs bg-cyan-700 text-cyan-200 rounded">
                          {t('configHistory.current', '当前')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <ClockIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(version.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-cyan-400 transition-colors"
                      title={t('configHistory.restore', '恢复')}
                      disabled={currentVersionId === version.id}
                    >
                      <RestoreIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(version.id)}
                      className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                      title={t('configHistory.delete', '删除')}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 提示 */}
          <p className="text-xs text-gray-500 text-center">
            {t('configHistory.hint', '最多保留 20 个版本，自动保存最多 10 个')}
          </p>
        </div>
      </Dialog>

      {/* 恢复确认对话框 */}
      <ConfirmDialog
        open={confirmRestore !== null}
        onOpenChange={() => setConfirmRestore(null)}
        title={t('configHistory.confirmRestore', '确认恢复')}
        description={t(
          'configHistory.confirmRestoreDesc',
          '恢复此版本将覆盖当前配置，此操作无法撤销。确定要继续吗？'
        )}
        confirmText={t('configHistory.restore', '恢复')}
        cancelText={t('common.cancel', '取消')}
        variant="warning"
        onConfirm={executeRestore}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={() => setConfirmDelete(null)}
        title={t('configHistory.confirmDelete', '确认删除')}
        description={t(
          'configHistory.confirmDeleteDesc',
          '确定要删除此版本吗？此操作无法撤销。'
        )}
        confirmText={t('common.delete', '删除')}
        cancelText={t('common.cancel', '取消')}
        variant="danger"
        onConfirm={executeDelete}
      />

      {/* 清空确认对话框 */}
      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title={t('configHistory.confirmClearAll', '确认清空')}
        description={t(
          'configHistory.confirmClearAllDesc',
          '确定要清空所有历史版本吗？此操作无法撤销。'
        )}
        confirmText={t('configHistory.clearAll', '清空历史')}
        cancelText={t('common.cancel', '取消')}
        variant="danger"
        onConfirm={executeClearAll}
      />
    </>
  );
};

ConfigHistory.displayName = 'ConfigHistory';
