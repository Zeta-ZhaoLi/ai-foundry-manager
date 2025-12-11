import { useEffect, useCallback, useMemo } from 'react';

export type KeyboardShortcut = {
  /** 按键（不区分大小写） */
  key: string;
  /** 是否需要 Ctrl/Cmd 键 */
  ctrl?: boolean;
  /** 是否需要 Shift 键 */
  shift?: boolean;
  /** 是否需要 Alt 键 */
  alt?: boolean;
  /** 是否需要 Meta 键 */
  meta?: boolean;
  /** 快捷键处理函数 */
  handler: (event: KeyboardEvent) => void;
  /** 快捷键描述 */
  description?: string;
  /** 快捷键分类 */
  category?: 'navigation' | 'action' | 'settings' | 'general';
  /** 是否在输入框中也生效 */
  enableInInput?: boolean;
};

/** 检测是否为 Mac 系统 */
export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/** 获取修饰键符号 */
export const getModifierSymbol = (modifier: 'ctrl' | 'shift' | 'alt' | 'meta'): string => {
  if (isMac) {
    switch (modifier) {
      case 'ctrl': return '⌃';
      case 'shift': return '⇧';
      case 'alt': return '⌥';
      case 'meta': return '⌘';
    }
  }
  switch (modifier) {
    case 'ctrl': return 'Ctrl';
    case 'shift': return 'Shift';
    case 'alt': return 'Alt';
    case 'meta': return 'Win';
  }
};

/** 格式化快捷键显示 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(getModifierSymbol('ctrl'));
  if (shortcut.alt) parts.push(getModifierSymbol('alt'));
  if (shortcut.shift) parts.push(getModifierSymbol('shift'));
  if (shortcut.meta) parts.push(getModifierSymbol('meta'));

  // 特殊按键格式化
  let keyDisplay = shortcut.key.toUpperCase();
  switch (shortcut.key.toLowerCase()) {
    case 'escape': keyDisplay = 'Esc'; break;
    case 'enter': keyDisplay = '↵'; break;
    case 'arrowup': keyDisplay = '↑'; break;
    case 'arrowdown': keyDisplay = '↓'; break;
    case 'arrowleft': keyDisplay = '←'; break;
    case 'arrowright': keyDisplay = '→'; break;
    case ' ': keyDisplay = 'Space'; break;
  }

  parts.push(keyDisplay);

  return isMac ? parts.join('') : parts.join('+');
};

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const isInputElement =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable;

      for (const shortcut of shortcuts) {
        // 如果在输入框中且该快捷键未启用输入框模式，跳过
        if (isInputElement && !shortcut.enableInInput) {
          // 但允许 Escape 键在任何地方生效
          if (shortcut.key.toLowerCase() !== 'escape') {
            continue;
          }
        }

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // 支持 Ctrl/Cmd 兼容 (在 Mac 上 ctrl 自动匹配 metaKey)
        let ctrlMatch: boolean;
        if (shortcut.ctrl) {
          ctrlMatch = isMac ? event.metaKey : event.ctrlKey;
        } else {
          ctrlMatch = isMac ? !event.metaKey : !event.ctrlKey;
        }

        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && (shortcut.ctrl ? true : metaMatch)) {
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 返回格式化后的快捷键列表，便于显示帮助
  const formattedShortcuts = useMemo(() => {
    return shortcuts
      .filter((s) => s.description)
      .map((s) => ({
        ...s,
        formatted: formatShortcut(s),
      }));
  }, [shortcuts]);

  return { formattedShortcuts };
};
