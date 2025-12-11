import { useState, useCallback, useEffect, useMemo } from 'react';

// ================== Types ==================

export type AuditAction =
  | 'account:create'
  | 'account:update'
  | 'account:delete'
  | 'account:enable'
  | 'account:disable'
  | 'region:create'
  | 'region:update'
  | 'region:delete'
  | 'region:enable'
  | 'region:disable'
  | 'models:update'
  | 'models:add'
  | 'models:remove'
  | 'config:import'
  | 'config:export'
  | 'config:restore'
  | 'masterModels:update';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  targetType: 'account' | 'region' | 'model' | 'config' | 'masterModels';
  targetId?: string;
  targetName?: string;
  description: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

export interface AuditLogState {
  entries: AuditLogEntry[];
  undoStack: AuditLogEntry[];
  redoStack: AuditLogEntry[];
}

export interface UseAuditLogOptions {
  storageKey?: string;
  maxEntries?: number;
  maxUndoStack?: number;
  enabled?: boolean;
}

export interface UseAuditLogReturn {
  /** 所有日志条目 */
  entries: AuditLogEntry[];
  /** 可撤销操作 */
  undoStack: AuditLogEntry[];
  /** 可重做操作 */
  redoStack: AuditLogEntry[];
  /** 记录操作 */
  log: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  /** 撤销 */
  undo: () => AuditLogEntry | null;
  /** 重做 */
  redo: () => AuditLogEntry | null;
  /** 是否可撤销 */
  canUndo: boolean;
  /** 是否可重做 */
  canRedo: boolean;
  /** 清空日志 */
  clearLog: () => void;
  /** 获取最近 N 条日志 */
  getRecentEntries: (count: number) => AuditLogEntry[];
  /** 按类型筛选 */
  filterByType: (type: AuditLogEntry['targetType']) => AuditLogEntry[];
  /** 按时间范围筛选 */
  filterByTimeRange: (startTime: number, endTime: number) => AuditLogEntry[];
  /** 按操作筛选 */
  filterByAction: (action: AuditAction) => AuditLogEntry[];
}

// ================== Storage Key ==================

const DEFAULT_STORAGE_KEY = 'azure-openai-manager:audit-log';
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_MAX_UNDO_STACK = 20;

// ================== Helpers ==================

const generateId = (): string => {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const loadState = (storageKey: string): AuditLogState => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load audit log:', error);
  }
  return { entries: [], undoStack: [], redoStack: [] };
};

const saveState = (storageKey: string, state: AuditLogState): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
};

// ================== Hook ==================

export const useAuditLog = (options: UseAuditLogOptions = {}): UseAuditLogReturn => {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    maxEntries = DEFAULT_MAX_ENTRIES,
    maxUndoStack = DEFAULT_MAX_UNDO_STACK,
    enabled = true,
  } = options;

  const [state, setState] = useState<AuditLogState>(() => loadState(storageKey));

  // 同步到 localStorage
  useEffect(() => {
    if (enabled) {
      saveState(storageKey, state);
    }
  }, [state, storageKey, enabled]);

  // 记录操作
  const log = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
      if (!enabled) return;

      const newEntry: AuditLogEntry = {
        ...entry,
        id: generateId(),
        timestamp: Date.now(),
      };

      setState((prev) => {
        // 添加到日志
        let newEntries = [newEntry, ...prev.entries];
        if (newEntries.length > maxEntries) {
          newEntries = newEntries.slice(0, maxEntries);
        }

        // 添加到撤销栈（如果有 previousValue）
        let newUndoStack = prev.undoStack;
        if (entry.previousValue !== undefined) {
          newUndoStack = [newEntry, ...prev.undoStack];
          if (newUndoStack.length > maxUndoStack) {
            newUndoStack = newUndoStack.slice(0, maxUndoStack);
          }
        }

        // 清空重做栈
        return {
          entries: newEntries,
          undoStack: newUndoStack,
          redoStack: [],
        };
      });
    },
    [enabled, maxEntries, maxUndoStack]
  );

  // 撤销
  const undo = useCallback((): AuditLogEntry | null => {
    if (state.undoStack.length === 0) return null;

    const entry = state.undoStack[0];
    setState((prev) => ({
      ...prev,
      undoStack: prev.undoStack.slice(1),
      redoStack: [entry, ...prev.redoStack].slice(0, maxUndoStack),
    }));

    return entry;
  }, [state.undoStack, maxUndoStack]);

  // 重做
  const redo = useCallback((): AuditLogEntry | null => {
    if (state.redoStack.length === 0) return null;

    const entry = state.redoStack[0];
    setState((prev) => ({
      ...prev,
      redoStack: prev.redoStack.slice(1),
      undoStack: [entry, ...prev.undoStack].slice(0, maxUndoStack),
    }));

    return entry;
  }, [state.redoStack, maxUndoStack]);

  // 清空日志
  const clearLog = useCallback(() => {
    setState({ entries: [], undoStack: [], redoStack: [] });
  }, []);

  // 获取最近 N 条
  const getRecentEntries = useCallback(
    (count: number): AuditLogEntry[] => {
      return state.entries.slice(0, count);
    },
    [state.entries]
  );

  // 按类型筛选
  const filterByType = useCallback(
    (type: AuditLogEntry['targetType']): AuditLogEntry[] => {
      return state.entries.filter((e) => e.targetType === type);
    },
    [state.entries]
  );

  // 按时间范围筛选
  const filterByTimeRange = useCallback(
    (startTime: number, endTime: number): AuditLogEntry[] => {
      return state.entries.filter(
        (e) => e.timestamp >= startTime && e.timestamp <= endTime
      );
    },
    [state.entries]
  );

  // 按操作筛选
  const filterByAction = useCallback(
    (action: AuditAction): AuditLogEntry[] => {
      return state.entries.filter((e) => e.action === action);
    },
    [state.entries]
  );

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  return {
    entries: state.entries,
    undoStack: state.undoStack,
    redoStack: state.redoStack,
    log,
    undo,
    redo,
    canUndo,
    canRedo,
    clearLog,
    getRecentEntries,
    filterByType,
    filterByTimeRange,
    filterByAction,
  };
};

// ================== Audit Log Viewer Component ==================

export const formatAuditAction = (action: AuditAction): string => {
  const actionLabels: Record<AuditAction, string> = {
    'account:create': '创建账号',
    'account:update': '更新账号',
    'account:delete': '删除账号',
    'account:enable': '启用账号',
    'account:disable': '禁用账号',
    'region:create': '创建区域',
    'region:update': '更新区域',
    'region:delete': '删除区域',
    'region:enable': '启用区域',
    'region:disable': '禁用区域',
    'models:update': '更新模型',
    'models:add': '添加模型',
    'models:remove': '移除模型',
    'config:import': '导入配置',
    'config:export': '导出配置',
    'config:restore': '恢复配置',
    'masterModels:update': '更新全局模型',
  };
  return actionLabels[action] || action;
};

export const formatAuditTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于 1 分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }

  // 小于 1 小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} 分钟前`;
  }

  // 小于 24 小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} 小时前`;
  }

  // 小于 7 天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} 天前`;
  }

  // 其他情况显示完整日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
