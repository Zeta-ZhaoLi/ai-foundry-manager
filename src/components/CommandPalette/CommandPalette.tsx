import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export interface Command {
  id: string;
  label: string;
  /** 用于搜索匹配的关键词 */
  keywords?: string[];
  /** 图标组件 */
  icon?: React.ReactNode;
  /** 快捷键提示 */
  shortcut?: string;
  /** 执行动作 */
  action: () => void;
  /** 分类 */
  category: 'navigation' | 'action' | 'settings';
  /** 是否禁用 */
  disabled?: boolean;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
}

// 搜索图标
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

// 模糊搜索函数
const fuzzyMatch = (text: string, query: string): boolean => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // 精确包含
  if (lowerText.includes(lowerQuery)) return true;

  // 模糊匹配：查询中的每个字符按顺序出现在文本中
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
};

// 高亮匹配文本
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="font-medium text-cyan-700 dark:text-cyan-400">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  commands,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 筛选命令
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands.filter((c) => !c.disabled);

    return commands
      .filter((c) => !c.disabled)
      .filter((c) => {
        // 匹配标签
        if (fuzzyMatch(c.label, query)) return true;
        // 匹配关键词
        if (c.keywords?.some((k) => fuzzyMatch(k, query))) return true;
        return false;
      });
  }, [commands, query]);

  // 按分类分组
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      action: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // 扁平化列表用于键盘导航
  const flatCommands = useMemo(() => {
    return [
      ...groupedCommands.navigation,
      ...groupedCommands.action,
      ...groupedCommands.settings,
    ];
  }, [groupedCommands]);

  // 重置状态
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // 聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // 重置选中索引当筛选结果变化时
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current && flatCommands.length > 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, flatCommands.length]);

  // 执行命令
  const executeCommand = useCallback(
    (command: Command) => {
      onOpenChange(false);
      // 延迟执行，让面板先关闭
      setTimeout(() => command.action(), 100);
    },
    [onOpenChange]
  );

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            executeCommand(flatCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [flatCommands, selectedIndex, executeCommand, onOpenChange]
  );

  // 分类标签
  const categoryLabels: Record<string, string> = {
    navigation: t('shortcuts.navigation'),
    action: t('shortcuts.action'),
    settings: t('shortcuts.settings'),
  };

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 命令面板 */}
      <div
        className={clsx(
          'relative w-[calc(100%_-_2rem)] max-w-lg',
          'rounded-md border border-border bg-background shadow-2xl',
          'overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('commandPalette.title')}
      >
        {/* 搜索输入框 */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <SearchIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className={clsx(
              'flex-1 bg-transparent border-none outline-none',
              'text-foreground placeholder:text-muted-foreground',
              'text-sm'
            )}
            aria-label={t('commandPalette.searchLabel')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <kbd className="hidden rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
            Esc
          </kbd>
        </div>

        {/* 命令列表 */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2"
          role="listbox"
        >
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('commandPalette.noResults')}
            </div>
          ) : (
            <>
              {/* 按分类渲染 */}
              {Object.entries(groupedCommands).map(([category, cmds]) => {
                if (cmds.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {categoryLabels[category]}
                    </div>
                    {cmds.map((cmd) => {
                      const index = flatCommands.indexOf(cmd);
                      const isSelected = index === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          data-index={index}
                          type="button"
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                            'transition-colors',
                            isSelected
                              ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                              : 'text-foreground hover:bg-muted'
                          )}
                          role="option"
                          aria-selected={isSelected}
                        >
                          {/* 图标 */}
                          {cmd.icon && (
                            <span className="h-5 w-5 flex-shrink-0 text-muted-foreground">
                              {cmd.icon}
                            </span>
                          )}

                          {/* 标签 */}
                          <span className="flex-1 text-sm truncate">
                            {highlightMatch(cmd.label, query)}
                          </span>

                          {/* 快捷键 */}
                          {cmd.shortcut && (
                            <kbd className="flex-shrink-0 rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* 底部提示 */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
                ↑
              </kbd>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
                ↓
              </kbd>
              {t('commandPalette.navigate')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
                ↵
              </kbd>
              {t('commandPalette.execute')}
            </span>
          </div>
          <span className="hidden sm:inline">{t('commandPalette.hint')}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

CommandPalette.displayName = 'CommandPalette';
