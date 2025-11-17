import React from 'react';
import { AzureModelsDashboard } from './components/AzureModelsDashboard';

const App: React.FC = () => {
  return (
    <div
      style={{
        padding: 24,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Azure OpenAI 模型管理助手
      </h1>
      <AzureModelsDashboard />
    </div>
  );
};

export default App;

