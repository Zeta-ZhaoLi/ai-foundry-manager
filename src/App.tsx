import React from 'react';
import { AzureModelsDashboard } from './components/AzureModelsDashboard';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background:
          'radial-gradient(circle at top, #0f172a 0, #020617 40%, #000000 100%)',
        color: '#e5e7eb',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1200 }}>
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <h1
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: 0.5,
                background:
                  'linear-gradient(120deg, #38bdf8, #a855f7, #22c55e)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Azure OpenAI 通道模型面板
            </h1>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.6)',
                backgroundColor: 'rgba(15,23,42,0.6)',
                color: '#9ca3af',
              }}
            >
              Local Model Planner · Zeta
            </span>
          </div>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: '#9ca3af',
              maxWidth: 640,
            }}
          >
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

