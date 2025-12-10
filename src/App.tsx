import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { LANG_STORAGE_KEY } from './i18n';
import { useTheme, Theme } from './contexts/ThemeContext';
import { AzureModelsDashboard } from './components/AzureModelsDashboard';

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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Eye Off Icon (hidden)
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// Sun Icon (light mode)
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

// Moon Icon (dark mode)
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// Globe Icon (language)
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const App: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  // 语言切换
  const toggleLanguage = () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  };

  // 主题切换循环: dark -> light -> system -> dark
  const cycleTheme = () => {
    const themeOrder: Theme[] = ['dark', 'light', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  // 获取主题图标
  const getThemeIcon = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />;
    }
    return theme === 'dark' ? <MoonIcon /> : <SunIcon />;
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 font-sans bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-200 flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex-1">
        {/* Header - 响应式布局 */}
        <header className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* 语言切换 */}
              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-gray-400 hover:bg-gray-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={t('language.toggle')}
              >
                <GlobeIcon />
                <span>{currentLang === 'zh' ? '中' : 'EN'}</span>
              </button>

              {/* 主题切换 */}
              <button
                onClick={cycleTheme}
                className="px-2.5 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-gray-400 hover:bg-gray-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={t(`theme.${theme}`)}
              >
                {getThemeIcon()}
                <span>{t(`theme.${theme}`)}</span>
              </button>

              {/* 隐私模式开关 */}
              <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  privacyMode
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:bg-gray-800'
                }`}
                title={privacyMode ? t('privacy.showInfo') : t('privacy.hideInfo')}
              >
                {privacyMode ? <EyeOffIcon /> : <EyeIcon />}
                <span>{t('privacy.toggle')}</span>
              </button>

              <span className="text-xs px-3 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-gray-400 hidden sm:inline">
                AI Foundry Manager · ZetaTechs
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-3xl">
            {t('app.description')}
          </p>
        </header>

        {/* Main Content */}
        <AzureModelsDashboard privacyMode={privacyMode} />
      </div>

      {/* Footer - 项目信息 */}
      <footer className="mt-8 pt-4 border-t border-gray-800 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-500">
          <span>{t('footer.copyright')}</span>
          <span className="hidden sm:inline text-gray-700">·</span>
          <span>{t('footer.author')}</span>
          <span className="hidden sm:inline text-gray-700">·</span>
          <a
            href="https://github.com/Zeta-ZhaoLi/ai-foundry-manager"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
          >
            <GitHubIcon />
            <span>GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
