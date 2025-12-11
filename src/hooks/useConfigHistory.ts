import { useState, useCallback, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'azure-openai-manager:config-history';
const MAX_VERSIONS = 20;

export interface ConfigVersion {
  /** 版本 ID */
  id: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 版本描述 */
  description: string;
  /** 配置数据 (JSON 字符串) */
  data: string;
  /** 数据哈希，用于检测变化 */
  hash: string;
  /** 是否为自动保存 */
  isAutoSave: boolean;
}

export interface ConfigHistoryState {
  versions: ConfigVersion[];
  currentVersionId: string | null;
}

export interface UseConfigHistoryReturn {
  /** 所有版本 */
  versions: ConfigVersion[];
  /** 当前版本 ID */
  currentVersionId: string | null;
  /** 保存新版本 */
  saveVersion: (data: unknown, description?: string, isAutoSave?: boolean) => void;
  /** 恢复到指定版本 */
  restoreVersion: (versionId: string) => unknown | null;
  /** 删除指定版本 */
  deleteVersion: (versionId: string) => void;
  /** 清空所有版本 */
  clearAllVersions: () => void;
  /** 获取版本数据 */
  getVersionData: (versionId: string) => unknown | null;
  /** 比较两个版本 */
  compareVersions: (versionId1: string, versionId2: string) => VersionDiff | null;
  /** 是否有未保存的变更 */
  hasUnsavedChanges: (currentData: unknown) => boolean;
}

export interface VersionDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

/** 生成唯一 ID */
const generateId = (): string => {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/** 简单的哈希函数 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

/** 从 localStorage 加载历史 */
const loadHistory = (): ConfigHistoryState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        versions: parsed.versions || [],
        currentVersionId: parsed.currentVersionId || null,
      };
    }
  } catch (error) {
    console.error('Failed to load config history:', error);
  }
  return { versions: [], currentVersionId: null };
};

/** 保存历史到 localStorage */
const saveHistory = (state: ConfigHistoryState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save config history:', error);
  }
};

/** 格式化时间戳 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `今天 ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${time}`;
  }

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const useConfigHistory = (): UseConfigHistoryReturn => {
  const [state, setState] = useState<ConfigHistoryState>(loadHistory);

  // 同步到 localStorage
  useEffect(() => {
    saveHistory(state);
  }, [state]);

  // 保存新版本
  const saveVersion = useCallback(
    (data: unknown, description?: string, isAutoSave = false) => {
      const dataStr = JSON.stringify(data);
      const hash = simpleHash(dataStr);

      // 检查是否与最新版本相同
      if (state.versions.length > 0) {
        const latestVersion = state.versions[0];
        if (latestVersion.hash === hash) {
          // 数据没有变化，不保存
          return;
        }
      }

      const newVersion: ConfigVersion = {
        id: generateId(),
        timestamp: Date.now(),
        description: description || (isAutoSave ? '自动保存' : '手动保存'),
        data: dataStr,
        hash,
        isAutoSave,
      };

      setState((prev) => {
        // 添加新版本到开头
        let newVersions = [newVersion, ...prev.versions];

        // 如果是自动保存，限制自动保存版本数量
        if (isAutoSave) {
          const autoSaveVersions = newVersions.filter((v) => v.isAutoSave);
          if (autoSaveVersions.length > 10) {
            // 只保留最近 10 个自动保存
            const idsToRemove = autoSaveVersions.slice(10).map((v) => v.id);
            newVersions = newVersions.filter((v) => !idsToRemove.includes(v.id));
          }
        }

        // 限制总版本数量
        if (newVersions.length > MAX_VERSIONS) {
          newVersions = newVersions.slice(0, MAX_VERSIONS);
        }

        return {
          versions: newVersions,
          currentVersionId: newVersion.id,
        };
      });
    },
    [state.versions]
  );

  // 恢复到指定版本
  const restoreVersion = useCallback(
    (versionId: string): unknown | null => {
      const version = state.versions.find((v) => v.id === versionId);
      if (!version) return null;

      try {
        const data = JSON.parse(version.data);
        setState((prev) => ({
          ...prev,
          currentVersionId: versionId,
        }));
        return data;
      } catch (error) {
        console.error('Failed to restore version:', error);
        return null;
      }
    },
    [state.versions]
  );

  // 删除指定版本
  const deleteVersion = useCallback((versionId: string) => {
    setState((prev) => ({
      ...prev,
      versions: prev.versions.filter((v) => v.id !== versionId),
      currentVersionId:
        prev.currentVersionId === versionId ? null : prev.currentVersionId,
    }));
  }, []);

  // 清空所有版本
  const clearAllVersions = useCallback(() => {
    setState({
      versions: [],
      currentVersionId: null,
    });
  }, []);

  // 获取版本数据
  const getVersionData = useCallback(
    (versionId: string): unknown | null => {
      const version = state.versions.find((v) => v.id === versionId);
      if (!version) return null;

      try {
        return JSON.parse(version.data);
      } catch {
        return null;
      }
    },
    [state.versions]
  );

  // 比较两个版本
  const compareVersions = useCallback(
    (versionId1: string, versionId2: string): VersionDiff | null => {
      const data1 = getVersionData(versionId1) as Record<string, unknown> | null;
      const data2 = getVersionData(versionId2) as Record<string, unknown> | null;

      if (!data1 || !data2) return null;

      // 简单的 key 比较
      const keys1 = new Set(Object.keys(data1));
      const keys2 = new Set(Object.keys(data2));

      const added = [...keys2].filter((k) => !keys1.has(k));
      const removed = [...keys1].filter((k) => !keys2.has(k));
      const modified = [...keys1].filter(
        (k) => keys2.has(k) && JSON.stringify(data1[k]) !== JSON.stringify(data2[k])
      );

      return { added, removed, modified };
    },
    [getVersionData]
  );

  // 检查是否有未保存的变更
  const hasUnsavedChanges = useCallback(
    (currentData: unknown): boolean => {
      if (state.versions.length === 0) return true;

      const currentHash = simpleHash(JSON.stringify(currentData));
      return state.versions[0].hash !== currentHash;
    },
    [state.versions]
  );

  return {
    versions: state.versions,
    currentVersionId: state.currentVersionId,
    saveVersion,
    restoreVersion,
    deleteVersion,
    clearAllVersions,
    getVersionData,
    compareVersions,
    hasUnsavedChanges,
  };
};
