import React from 'react';
import { useTranslation } from 'react-i18next';
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

const App: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 font-sans bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-200 flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex-1">
        {/* Header - 响应式布局 */}
        <header className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
            <span className="text-xs px-3 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-gray-400 self-start sm:self-auto">
              AI Foundry Manager · ZetaTechs
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-3xl">
            {t('app.description')}
          </p>
        </header>

        {/* Main Content */}
        <AzureModelsDashboard />
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
