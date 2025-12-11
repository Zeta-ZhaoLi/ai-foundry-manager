import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

// ================== Types ==================

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  icon?: React.ReactNode;
  conditions: FilterCondition[];
  isBuiltIn?: boolean;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
}

export interface FilterBarProps {
  /** 搜索关键字 */
  searchValue: string;
  /** 搜索变更回调 */
  onSearchChange: (value: string) => void;
  /** 搜索占位符 */
  searchPlaceholder?: string;
  /** 当前激活的预设 ID */
  activePresetId?: string | null;
  /** 预设列表 */
  presets?: FilterPreset[];
  /** 预设变更回调 */
  onPresetChange?: (presetId: string | null) => void;
  /** 快速筛选标签 */
  quickFilters?: QuickFilter[];
  /** 当前激活的快速筛选 */
  activeQuickFilters?: string[];
  /** 快速筛选变更回调 */
  onQuickFilterChange?: (filterId: string) => void;
  /** 显示结果计数 */
  resultCount?: number;
  /** 总计数 */
  totalCount?: number;
  /** 自定义操作区域 */
  actions?: React.ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md';
  /** 类名 */
  className?: string;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

// ================== Icons ==================

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

const ClearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
    />
  </svg>
);

// ================== FilterBar Component ==================

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  activePresetId,
  presets = [],
  onPresetChange,
  quickFilters = [],
  activeQuickFilters = [],
  onQuickFilterChange,
  resultCount,
  totalCount,
  actions,
  size = 'md',
  className,
}) => {
  const { t } = useTranslation();
  const [isPresetOpen, setIsPresetOpen] = useState(false);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handlePresetSelect = useCallback(
    (presetId: string | null) => {
      onPresetChange?.(presetId);
      setIsPresetOpen(false);
    },
    [onPresetChange]
  );

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId),
    [presets, activePresetId]
  );

  const hasActiveFilters = searchValue || activePresetId || activeQuickFilters.length > 0;

  const sizeClasses = {
    sm: {
      input: 'h-7 text-xs px-7',
      icon: 'w-3.5 h-3.5',
      button: 'px-2 py-1 text-xs',
      chip: 'px-2 py-0.5 text-xs',
    },
    md: {
      input: 'h-9 text-sm px-9',
      icon: 'w-4 h-4',
      button: 'px-3 py-1.5 text-sm',
      chip: 'px-2.5 py-1 text-xs',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Main filter row */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <SearchIcon
            className={clsx(
              'absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground',
              sizes.icon
            )}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || t('accounts.searchPlaceholder')}
            className={clsx(
              'w-full rounded-lg border border-gray-700 bg-background text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors',
              sizes.input
            )}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={clsx(
                'absolute right-2.5 top-1/2 -translate-y-1/2',
                'text-muted-foreground hover:text-foreground transition-colors'
              )}
            >
              <ClearIcon className={sizes.icon} />
            </button>
          )}
        </div>

        {/* Preset selector */}
        {presets.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPresetOpen(!isPresetOpen)}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg border',
                'transition-colors',
                activePreset
                  ? 'border-cyan-600 bg-cyan-900/30 text-cyan-300'
                  : 'border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:border-gray-600',
                sizes.button
              )}
            >
              <FilterIcon className={sizes.icon} />
              <span>{activePreset?.name || t('filterBar.presets', '预设')}</span>
            </button>

            {isPresetOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPresetOpen(false)}
                />
                <div
                  className={clsx(
                    'absolute right-0 top-full mt-1 z-50',
                    'min-w-[160px] py-1 rounded-lg border border-gray-700 bg-gray-900 shadow-xl'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(null)}
                    className={clsx(
                      'w-full px-3 py-1.5 text-left text-sm',
                      'hover:bg-gray-800 transition-colors',
                      !activePresetId ? 'text-cyan-400' : 'text-gray-300'
                    )}
                  >
                    {t('filterBar.allItems', '全部')}
                  </button>
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={clsx(
                        'w-full px-3 py-1.5 text-left text-sm flex items-center gap-2',
                        'hover:bg-gray-800 transition-colors',
                        activePresetId === preset.id ? 'text-cyan-400' : 'text-gray-300'
                      )}
                    >
                      {preset.icon}
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Custom actions */}
        {actions}
      </div>

      {/* Quick filters row */}
      {quickFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {quickFilters.map((filter) => {
            const isActive = activeQuickFilters.includes(filter.id);
            const colorClasses = {
              default: isActive
                ? 'border-gray-500 bg-gray-700 text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-600',
              primary: isActive
                ? 'border-cyan-500 bg-cyan-900/50 text-cyan-300'
                : 'border-gray-700 text-gray-400 hover:border-cyan-700',
              success: isActive
                ? 'border-green-500 bg-green-900/50 text-green-300'
                : 'border-gray-700 text-gray-400 hover:border-green-700',
              warning: isActive
                ? 'border-yellow-500 bg-yellow-900/50 text-yellow-300'
                : 'border-gray-700 text-gray-400 hover:border-yellow-700',
              danger: isActive
                ? 'border-red-500 bg-red-900/50 text-red-300'
                : 'border-gray-700 text-gray-400 hover:border-red-700',
            };

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onQuickFilterChange?.(filter.id)}
                className={clsx(
                  'flex items-center gap-1 rounded-full border transition-colors',
                  colorClasses[filter.color || 'default'],
                  sizes.chip
                )}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {(resultCount !== undefined || hasActiveFilters) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {resultCount !== undefined && totalCount !== undefined ? (
              t('accessibility.filterResults', { count: resultCount }) +
              (resultCount !== totalCount ? ` / ${totalCount}` : '')
            ) : hasActiveFilters ? (
              t('filterBar.filtersApplied', '已应用筛选')
            ) : null}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onPresetChange?.(null);
                activeQuickFilters.forEach((id) => onQuickFilterChange?.(id));
              }}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {t('emptyState.clearFilters', '清除筛选')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

FilterBar.displayName = 'FilterBar';

// ================== useFilterPresets Hook ==================

export interface UseFilterPresetsOptions {
  storageKey?: string;
  builtInPresets?: FilterPreset[];
}

export interface UseFilterPresetsReturn {
  presets: FilterPreset[];
  activePresetId: string | null;
  setActivePresetId: (id: string | null) => void;
  addPreset: (preset: Omit<FilterPreset, 'id'>) => void;
  removePreset: (id: string) => void;
  updatePreset: (id: string, updates: Partial<FilterPreset>) => void;
}

export const useFilterPresets = (
  options: UseFilterPresetsOptions = {}
): UseFilterPresetsReturn => {
  const { storageKey, builtInPresets = [] } = options;

  const [customPresets, setCustomPresets] = useState<FilterPreset[]>(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load filter presets:', error);
      }
    }
    return [];
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const presets = useMemo(
    () => [...builtInPresets.map((p) => ({ ...p, isBuiltIn: true })), ...customPresets],
    [builtInPresets, customPresets]
  );

  const savePresets = useCallback(
    (newPresets: FilterPreset[]) => {
      setCustomPresets(newPresets);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newPresets));
        } catch (error) {
          console.error('Failed to save filter presets:', error);
        }
      }
    },
    [storageKey]
  );

  const addPreset = useCallback(
    (preset: Omit<FilterPreset, 'id'>) => {
      const newPreset: FilterPreset = {
        ...preset,
        id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      savePresets([...customPresets, newPreset]);
    },
    [customPresets, savePresets]
  );

  const removePreset = useCallback(
    (id: string) => {
      savePresets(customPresets.filter((p) => p.id !== id));
      if (activePresetId === id) {
        setActivePresetId(null);
      }
    },
    [customPresets, savePresets, activePresetId]
  );

  const updatePreset = useCallback(
    (id: string, updates: Partial<FilterPreset>) => {
      savePresets(customPresets.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    [customPresets, savePresets]
  );

  return {
    presets,
    activePresetId,
    setActivePresetId,
    addPreset,
    removePreset,
    updatePreset,
  };
};

// ================== useQuickFilters Hook ==================

export interface UseQuickFiltersReturn {
  activeFilters: string[];
  toggleFilter: (id: string) => void;
  setFilters: (ids: string[]) => void;
  clearFilters: () => void;
  isActive: (id: string) => boolean;
}

export const useQuickFilters = (initialFilters: string[] = []): UseQuickFiltersReturn => {
  const [activeFilters, setActiveFilters] = useState<string[]>(initialFilters);

  const toggleFilter = useCallback((id: string) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const setFilters = useCallback((ids: string[]) => {
    setActiveFilters(ids);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  const isActive = useCallback((id: string) => activeFilters.includes(id), [activeFilters]);

  return {
    activeFilters,
    toggleFilter,
    setFilters,
    clearFilters,
    isActive,
  };
};

// ================== Filter utilities ==================

export const applyFilter = <T extends Record<string, unknown>>(
  item: T,
  condition: FilterCondition
): boolean => {
  const value = item[condition.field];

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'contains':
      return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(condition.value).toLowerCase());
    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(condition.value).toLowerCase());
    case 'gt':
      return Number(value) > Number(condition.value);
    case 'lt':
      return Number(value) < Number(condition.value);
    case 'gte':
      return Number(value) >= Number(condition.value);
    case 'lte':
      return Number(value) <= Number(condition.value);
    default:
      return true;
  }
};

export const applyFilters = <T extends Record<string, unknown>>(
  items: T[],
  conditions: FilterCondition[],
  mode: 'and' | 'or' = 'and'
): T[] => {
  if (conditions.length === 0) return items;

  return items.filter((item) => {
    if (mode === 'and') {
      return conditions.every((condition) => applyFilter(item, condition));
    } else {
      return conditions.some((condition) => applyFilter(item, condition));
    }
  });
};
