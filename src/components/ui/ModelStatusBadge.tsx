import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

// ================== Types ==================

export type ModelStatus = 'stable' | 'new' | 'deprecated' | 'preview' | 'legacy';

export interface ModelStatusInfo {
  status: ModelStatus;
  label: string;
  description?: string;
  date?: string;
  replacementModel?: string;
}

export interface ModelStatusBadgeProps {
  status: ModelStatus;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

// ================== Status Configuration ==================

const statusConfig: Record<
  ModelStatus,
  {
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  stable: {
    bgClass: 'bg-green-900/50',
    textClass: 'text-green-400',
    borderClass: 'border-green-700',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  new: {
    bgClass: 'bg-cyan-900/50',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-700',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  deprecated: {
    bgClass: 'bg-red-900/50',
    textClass: 'text-red-400',
    borderClass: 'border-red-700',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  preview: {
    bgClass: 'bg-purple-900/50',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-700',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.8.8a9.062 9.062 0 01-3.94 2.226M5.5 16l.8.8a9.061 9.061 0 004.94 2.226m0 0a2.25 2.25 0 002.52 0m-2.52 0l-.7-.7m3.22.7l.7-.7" />
      </svg>
    ),
  },
  legacy: {
    bgClass: 'bg-yellow-900/50',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-700',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

// ================== ModelStatusBadge ==================

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  className,
}) => {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    xs: {
      badge: 'px-1 py-0.5 text-[10px]',
      icon: 'w-2.5 h-2.5',
    },
    sm: {
      badge: 'px-1.5 py-0.5 text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      badge: 'px-2 py-1 text-sm',
      icon: 'w-3.5 h-3.5',
    },
  };

  const sizes = sizeClasses[size];
  const labelKey = `modelStatus.${status}`;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizes.badge,
        className
      )}
    >
      {showIcon && <Icon className={sizes.icon} />}
      <span>{t(labelKey, status)}</span>
    </span>
  );
};

ModelStatusBadge.displayName = 'ModelStatusBadge';

// ================== Model Status Detection Utilities ==================

/** 模型状态检测规则（可配置） */
export interface ModelStatusRule {
  pattern: RegExp;
  status: ModelStatus;
  priority: number;
}

/** 默认模型状态检测规则 */
export const defaultModelStatusRules: ModelStatusRule[] = [
  // Deprecated patterns
  { pattern: /gpt-3\.5-turbo-0301/i, status: 'deprecated', priority: 100 },
  { pattern: /gpt-3\.5-turbo-0613/i, status: 'deprecated', priority: 100 },
  { pattern: /gpt-4-0314/i, status: 'deprecated', priority: 100 },
  { pattern: /gpt-4-0613/i, status: 'deprecated', priority: 100 },
  { pattern: /gpt-4-32k-0314/i, status: 'deprecated', priority: 100 },
  { pattern: /text-davinci/i, status: 'deprecated', priority: 100 },
  { pattern: /code-davinci/i, status: 'deprecated', priority: 100 },

  // Preview patterns
  { pattern: /preview/i, status: 'preview', priority: 90 },
  { pattern: /beta/i, status: 'preview', priority: 90 },

  // New/Latest patterns
  { pattern: /gpt-4o(?!-mini)/i, status: 'new', priority: 80 },
  { pattern: /o1-/i, status: 'new', priority: 80 },
  { pattern: /claude-3/i, status: 'new', priority: 80 },
  { pattern: /sora/i, status: 'new', priority: 80 },
  { pattern: /-turbo-\d{4}$/i, status: 'stable', priority: 70 },

  // Legacy patterns
  { pattern: /gpt-3\.5/i, status: 'legacy', priority: 60 },
  { pattern: /davinci/i, status: 'legacy', priority: 60 },
  { pattern: /curie/i, status: 'legacy', priority: 60 },
  { pattern: /babbage/i, status: 'legacy', priority: 60 },
  { pattern: /ada(?!-)/i, status: 'legacy', priority: 60 },
];

/** 检测模型状态 */
export const detectModelStatus = (
  modelId: string,
  rules: ModelStatusRule[] = defaultModelStatusRules
): ModelStatus => {
  // Sort rules by priority (higher first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.pattern.test(modelId)) {
      return rule.status;
    }
  }

  // Default to stable if no rules match
  return 'stable';
};

/** 模型状态信息 */
export const getModelStatusInfo = (
  modelId: string,
  rules?: ModelStatusRule[]
): ModelStatusInfo => {
  const status = detectModelStatus(modelId, rules);

  const statusLabels: Record<ModelStatus, string> = {
    stable: 'Stable',
    new: 'New',
    deprecated: 'Deprecated',
    preview: 'Preview',
    legacy: 'Legacy',
  };

  return {
    status,
    label: statusLabels[status],
  };
};

// ================== useModelStatus Hook ==================

export interface UseModelStatusOptions {
  customRules?: ModelStatusRule[];
}

export interface UseModelStatusReturn {
  getStatus: (modelId: string) => ModelStatus;
  getStatusInfo: (modelId: string) => ModelStatusInfo;
  isDeprecated: (modelId: string) => boolean;
  isNew: (modelId: string) => boolean;
  isPreview: (modelId: string) => boolean;
  isLegacy: (modelId: string) => boolean;
  filterByStatus: (modelIds: string[], status: ModelStatus) => string[];
  groupByStatus: (modelIds: string[]) => Record<ModelStatus, string[]>;
}

export const useModelStatus = (options: UseModelStatusOptions = {}): UseModelStatusReturn => {
  const { customRules } = options;
  const rules = customRules || defaultModelStatusRules;

  const getStatus = (modelId: string): ModelStatus => {
    return detectModelStatus(modelId, rules);
  };

  const getStatusInfo = (modelId: string): ModelStatusInfo => {
    return getModelStatusInfo(modelId, rules);
  };

  const isDeprecated = (modelId: string): boolean => {
    return getStatus(modelId) === 'deprecated';
  };

  const isNew = (modelId: string): boolean => {
    return getStatus(modelId) === 'new';
  };

  const isPreview = (modelId: string): boolean => {
    return getStatus(modelId) === 'preview';
  };

  const isLegacy = (modelId: string): boolean => {
    return getStatus(modelId) === 'legacy';
  };

  const filterByStatus = (modelIds: string[], status: ModelStatus): string[] => {
    return modelIds.filter((id) => getStatus(id) === status);
  };

  const groupByStatus = (modelIds: string[]): Record<ModelStatus, string[]> => {
    const groups: Record<ModelStatus, string[]> = {
      stable: [],
      new: [],
      deprecated: [],
      preview: [],
      legacy: [],
    };

    modelIds.forEach((id) => {
      const status = getStatus(id);
      groups[status].push(id);
    });

    return groups;
  };

  return {
    getStatus,
    getStatusInfo,
    isDeprecated,
    isNew,
    isPreview,
    isLegacy,
    filterByStatus,
    groupByStatus,
  };
};
