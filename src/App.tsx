import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, {
  LANG_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  changeAppLanguage,
  type SupportedLanguage,
} from './i18n';
import { useTheme, Theme } from './contexts/ThemeContext';
import { AzureModelsDashboard } from './components/AzureModelsDashboard';
import { CommandPalette, Command } from './components/CommandPalette';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
  isMac,
} from './hooks/useKeyboardShortcuts';

// GitHub SVG Icon
const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// Eye Icon (visible)
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Eye Off Icon (hidden)
const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Sun Icon (light mode)
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon Icon (dark mode)
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Globe Icon (language)
const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// 命令面板图标
const CommandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

const App: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [privacyMode, setPrivacyMode] = useState(false);
  const normalizeLang = useCallback((lang: string): SupportedLanguage => {
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
      ? (lang as SupportedLanguage)
      : 'zh';
  }, []);

  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() =>
    normalizeLang(i18n.language)
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const toHtmlLang = useCallback((lang: SupportedLanguage): string => {
    if (lang === 'zh') return 'zh-CN';
    return lang;
  }, []);

  const setLanguage = useCallback(
    (newLang: SupportedLanguage) => {
      void changeAppLanguage(newLang);
      setCurrentLang(newLang);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, newLang);
      } catch {
        // ignore
      }
      document.documentElement.lang = toHtmlLang(newLang);
    },
    [toHtmlLang]
  );

  useEffect(() => {
    document.documentElement.lang = toHtmlLang(currentLang);
  }, [currentLang, toHtmlLang]);

  // 语言切换（循环）
  const cycleLanguage = useCallback(() => {
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    setLanguage(SUPPORTED_LANGUAGES[nextIndex]);
  }, [currentLang, setLanguage]);

  // 主题切换循环: dark -> light -> system -> dark
  const cycleTheme = useCallback(() => {
    const themeOrder: Theme[] = ['dark', 'light', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [theme, setTheme]);

  // 隐私模式切换
  const togglePrivacy = useCallback(() => {
    setPrivacyMode((prev) => !prev);
  }, []);

  // 获取主题图标
  const getThemeIcon = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />;
    }
    return theme === 'dark' ? <MoonIcon /> : <SunIcon />;
  };

  // 命令列表
  const commands: Command[] = useMemo(
    () => [
      // 设置类
      {
        id: 'toggle-theme',
        label: t('commandPalette.toggleTheme'),
        keywords: ['theme', 'dark', 'light', '主题', '深色', '浅色'],
        action: cycleTheme,
        category: 'settings',
        shortcut: isMac ? '⌘T' : 'Ctrl+T',
      },
      {
        id: 'toggle-privacy',
        label: t('commandPalette.togglePrivacy'),
        keywords: ['privacy', 'hide', 'show', '隐私', '隐藏', '显示'],
        action: togglePrivacy,
        category: 'settings',
        shortcut: isMac ? '⌘P' : 'Ctrl+P',
      },
      {
        id: 'toggle-language',
        label: t('commandPalette.toggleLanguage'),
        keywords: [
          'language',
          'chinese',
          'english',
          'japanese',
          'french',
          'german',
          'spanish',
          'portuguese',
          'korean',
          '语言',
          '中文',
          '英文',
          '日文',
          '法文',
          '德文',
          '西班牙语',
          '葡萄牙语',
          '韩文',
        ],
        action: cycleLanguage,
        category: 'settings',
      },
      {
        id: 'show-shortcuts',
        label: t('commandPalette.showShortcuts'),
        keywords: ['shortcut', 'keyboard', 'help', '快捷键', '帮助'],
        action: () => setShortcutsHelpOpen(true),
        category: 'settings',
        shortcut: '?',
      },
    ],
    [t, cycleTheme, togglePrivacy, cycleLanguage]
  );

  // 键盘快捷键
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'k',
        ctrl: true,
        handler: () => setCommandPaletteOpen(true),
        description: t('commandPalette.openPalette'),
        category: 'general',
      },
      {
        key: 'Escape',
        handler: () => {
          setCommandPaletteOpen(false);
          setShortcutsHelpOpen(false);
        },
        description: t('shortcuts.closeDialog'),
        category: 'general',
        enableInInput: true,
      },
      {
        key: '?',
        handler: () => setShortcutsHelpOpen((prev) => !prev),
        description: t('shortcuts.showHelp'),
        category: 'general',
      },
    ],
    [t]
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 font-sans text-foreground flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
      {/* Skip to main content link - 无障碍功能 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-md focus:outline-none"
      >
        {t('accessibility.skipToContent')}
      </a>

      <div className="w-full max-w-7xl mx-auto flex-1">
        {/* Header - 响应式布局 */}
        <header className="mb-4 md:mb-6" role="banner">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
            <nav
              className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end"
              aria-label={t('accessibility.headerNav')}
            >
              {/* 语言选择 */}
              <div
                className="px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted/80 text-xs flex items-center gap-1.5 transition-colors cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-background"
                title={t('language.select')}
              >
                <GlobeIcon />
                <select
                  value={currentLang}
                  onChange={(e) => setLanguage(normalizeLang(e.target.value))}
                  className="bg-transparent border-none outline-none text-xs text-inherit cursor-pointer"
                  aria-label={t('language.select')}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {t(`language.${lang}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 主题切换 */}
              <button
                onClick={cycleTheme}
                className="px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted/80 text-xs flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-background"
                title={t(`theme.${theme}`)}
                aria-label={
                  t('shortcuts.toggleTheme') + ': ' + t(`theme.${theme}`)
                }
              >
                {getThemeIcon()}
                <span>{t(`theme.${theme}`)}</span>
              </button>

              {/* 命令面板按钮 */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted/80 text-xs flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-background"
                title={t('commandPalette.openPalette')}
                aria-label={t('commandPalette.openPalette')}
              >
                <CommandIcon />
                <span className="hidden sm:inline">
                  {isMac ? '⌘K' : 'Ctrl+K'}
                </span>
              </button>

              {/* GitHub */}
              <a
                href="https://github.com/Zeta-ZhaoLi/ai-foundry-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted/80 text-xs flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-background"
                title="GitHub"
                aria-label={t('accessibility.githubLink')}
              >
                <GitHubIcon />
                <span className="hidden sm:inline">GitHub</span>
              </a>

              {/* 隐私模式开关 */}
              <button
                onClick={togglePrivacy}
                className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-background ${
                  privacyMode
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted/80'
                }`}
                title={
                  privacyMode ? t('privacy.showInfo') : t('privacy.hideInfo')
                }
                aria-label={
                  t('privacy.toggle') +
                  ': ' +
                  (privacyMode ? t('privacy.showInfo') : t('privacy.hideInfo'))
                }
                aria-pressed={privacyMode}
              >
                {privacyMode ? <EyeOffIcon /> : <EyeIcon />}
                <span>{t('privacy.toggle')}</span>
              </button>

              <span className="hidden text-xs px-3 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground xl:inline">
                {t('app.title')} · ZetaTechs
              </span>
            </nav>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-3xl">
            {t('app.description')}
          </p>
        </header>

        {/* Main Content */}
        <main id="main-content" role="main" tabIndex={-1}>
          <AzureModelsDashboard privacyMode={privacyMode} />
        </main>
      </div>

      {/* Footer - 项目信息 */}
      <footer
        className="mt-8 pt-4 border-t border-border text-center"
        role="contentinfo"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground">
          <span>{t('footer.copyright')}</span>
          <span
            className="hidden sm:inline text-muted-foreground/40"
            aria-hidden="true"
          >
            ·
          </span>
          <span>{t('footer.author')}</span>
          <span
            className="hidden sm:inline text-muted-foreground/40"
            aria-hidden="true"
          >
            ·
          </span>
          <a
            href="https://github.com/Zeta-ZhaoLi/ai-foundry-manager"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-background rounded"
            aria-label={t('accessibility.githubLink')}
          >
            <GitHubIcon />
            <span>GitHub</span>
          </a>
        </div>
      </footer>

      {/* 命令面板 */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        commands={commands}
      />

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default App;
