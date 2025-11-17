import React, { useMemo, useState } from 'react';
import { NewApiClient } from '../api/newApiClient';
import { defaultConfig, NewApiConfig } from '../config';
import { useAzureChannels } from '../hooks/useAzureChannels';
import { buildCopyString } from '../utils/modelSeries';

function createClient(config: NewApiConfig) {
  return new NewApiClient(config);
}

export const AzureModelsDashboard: React.FC = () => {
  const [config, setConfig] = useState<NewApiConfig>(defaultConfig);
  const client = useMemo(
    () => createClient(config),
    [config.baseUrl, config.adminToken],
  );

  const {
    channels,
    accountSummaries,
    globalSeriesSummary,
    loadingChannels,
    loadingModels,
    error,
    loadAllModels,
  } = useAzureChannels(client);

  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    if (!navigator.clipboard) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyMessage('已复制到剪贴板');
      } catch {
        setCopyMessage('复制失败，请手动选择文本');
      }
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => setCopyMessage('已复制到剪贴板'))
      .catch(() => setCopyMessage('复制失败，请手动选择文本'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section
        style={{
          padding: 12,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#fafafa',
          maxWidth: 640,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>连接配置</h2>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
          指向你的 new-api 管理面板地址，并提供管理员 Token
          （如果开启了 Token 鉴权）。也可以只用 Cookie 登录状态，留空 Token。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13 }}>
            new-api 地址：
            <input
              style={{ width: '100%', padding: 6, marginTop: 4 }}
              value={config.baseUrl}
              onChange={(e) =>
                setConfig((c) => ({ ...c, baseUrl: e.target.value }))
              }
              placeholder='http://localhost:3000'
            />
          </label>
          <label style={{ fontSize: 13 }}>
            管理员 Token（可选）：
            <input
              style={{ width: '100%', padding: 6, marginTop: 4 }}
              value={config.adminToken}
              onChange={(e) =>
                setConfig((c) => ({ ...c, adminToken: e.target.value }))
              }
              placeholder='从 new-api 后台生成的 Bearer Token'
            />
          </label>
        </div>
      </section>

      <section
        style={{
          padding: 12,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Azure 渠道概览</h2>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              当前从 new-api 加载的 Azure 渠道数量：{channels.length}（type = 3）
            </div>
          </div>
          <button
            disabled={loadingChannels || loadingModels || channels.length === 0}
            onClick={() => loadAllModels()}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              cursor:
                loadingChannels || loadingModels || channels.length === 0
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {loadingModels ? '正在获取模型列表…' : '获取所有渠道模型列表'}
          </button>
        </div>
        {error && (
          <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>
            错误：{error}
          </div>
        )}
        {copyMessage && (
          <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 8 }}>
            {copyMessage}
          </div>
        )}
      </section>

      {accountSummaries.length > 0 && (
        <section
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>按账号聚合</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accountSummaries.map((acc) => {
              const copyStr = buildCopyString(acc.allModels);
              return (
                <div
                  key={acc.accountKey}
                  style={{
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>
                        账号：{acc.accountKey}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        区域数：{Object.keys(acc.regions).length}，模型总数：
                        {acc.allModels.length}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(copyStr)}
                      disabled={acc.allModels.length === 0}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1px solid #4b5563',
                        background: '#fff',
                        cursor:
                          acc.allModels.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                      }}
                    >
                      复制该账号所有模型（带逗号）
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      marginBottom: 4,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: 120,
                      overflowY: 'auto',
                    }}
                  >
                    {copyStr}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {Object.entries(acc.regions).map(([region, info]) => (
                      <div key={region} style={{ marginBottom: 4 }}>
                        <div style={{ fontWeight: 500 }}>
                          区域：{region}（{info.models.length}）
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#4b5563',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                          }}
                        >
                          {buildCopyString(info.models)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {globalSeriesSummary.allModels.length > 0 && (
        <section
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>全局模型汇总</h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              全部 Azure 渠道总模型数：
              {globalSeriesSummary.allModels.length}
            </div>
            <button
              onClick={() =>
                handleCopy(buildCopyString(globalSeriesSummary.allModels))
              }
              disabled={globalSeriesSummary.allModels.length === 0}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: '1px solid #4b5563',
                background: '#fff',
                cursor:
                  globalSeriesSummary.allModels.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: 13,
              }}
            >
              复制全部模型列表（带逗号）
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#4b5563',
              marginBottom: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 120,
              overflowY: 'auto',
            }}
          >
            {buildCopyString(globalSeriesSummary.allModels)}
          </div>
          <div style={{ fontSize: 13 }}>
            {Object.entries(globalSeriesSummary.bySeries).map(
              ([series, models]) => (
                <div
                  key={series}
                  style={{
                    marginBottom: 6,
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: 4,
                  }}
                >
                  <div style={{ fontWeight: 500 }}>
                    系列：{series}（{models.length}）
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {buildCopyString(models)}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
};

