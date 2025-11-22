import React from 'react';
import { AzureModelsDashboard } from './components/AzureModelsDashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen p-6 font-sans bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-200 flex justify-center">
      <div className="w-full max-w-7xl">
        <header className="mb-6">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Azure OpenAI 通道模型面板
            </h1>
            <span className="text-xs px-3 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-gray-400">
              Local Model Planner · Zeta
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-400 max-w-3xl">
            先在顶部维护一份总模型清单，然后通过点击为每个账号 / 区域分配可用模型，
            自动生成账号级和全局可用模型列表（每个模型名后接逗号，方便复制粘贴）。
          </p>
        </header>
        <AzureModelsDashboard />
      </div>
    </div>
  );
};

export default App;

