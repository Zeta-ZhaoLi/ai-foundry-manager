import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Dialog } from './ui/Dialog';
import { KeyboardShortcut, formatShortcut, isMac } from '../hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

// 快捷键显示组件
const ShortcutKey: React.FC<{ shortcut: KeyboardShortcut }> = ({ shortcut }) => {
  const formatted = formatShortcut(shortcut);
  const keys = isMac ? formatted.split('') : formatted.split('+');

  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={clsx(
            'inline-flex items-center justify-center',
            'min-w-[1.5rem] px-1.5 py-0.5',
            'text-xs font-medium',
            'bg-gray-800 border border-gray-700 rounded',
            'text-gray-300'
          )}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
};

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onOpenChange,
  shortcuts,
}) => {
  const { t } = useTranslation();

  // 按类别分组快捷键
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {
      action: [],
      navigation: [],
      settings: [],
      general: [],
    };

    shortcuts
      .filter((s) => s.description)
      .forEach((s) => {
        const category = s.category || 'general';
        groups[category].push(s);
      });

    return groups;
  }, [shortcuts]);

  const categoryLabels: Record<string, string> = {
    action: t('shortcuts.action', '操作'),
    navigation: t('shortcuts.navigation', '导航'),
    settings: t('shortcuts.settings', '设置'),
    general: t('shortcuts.general', '通用'),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('shortcuts.title', '键盘快捷键')}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* 平台提示 */}
        <p className="text-xs text-muted-foreground">
          {isMac
            ? t('shortcuts.macHint', '在 Mac 上，使用 ⌘ (Command) 代替 Ctrl')
            : t('shortcuts.windowsHint', '使用 Ctrl 作为修饰键')}
        </p>

        {/* 按类别显示快捷键 */}
        {Object.entries(groupedShortcuts).map(([category, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                {categoryLabels[category]}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-900/50"
                  >
                    <span className="text-sm text-gray-400">
                      {shortcut.description}
                    </span>
                    <ShortcutKey shortcut={shortcut} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 关闭提示 */}
        <p className="text-xs text-center text-muted-foreground pt-2 border-t border-gray-800">
          {t('shortcuts.closeHint', '按 Esc 或 ? 关闭此对话框')}
        </p>
      </div>
    </Dialog>
  );
};

KeyboardShortcutsHelp.displayName = 'KeyboardShortcutsHelp';
