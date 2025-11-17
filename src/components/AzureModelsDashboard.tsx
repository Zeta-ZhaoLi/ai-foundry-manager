import React, { useEffect, useMemo, useState } from 'react';
import { useLocalAzureAccounts } from '../hooks/useLocalAzureAccounts';
import { buildCopyString } from '../utils/modelSeries';

const MASTER_STORAGE_KEY = 'azure-openai-manager:master-models';

// 解析模型字符串，支持逗号 / 空格 / 换行分隔，并去重
const parseModels = (text: string): string[] => {
  if (!text) return [];
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

export const AzureModelsDashboard: React.FC = () => {
  const {
    accounts,
    accountSummaries,
    globalSeriesSummary,
    addAccount,
    updateAccountName,
    updateAccountNote,
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
  } = useLocalAzureAccounts();

  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // 全局模型目录（手动输入一次，逗号分隔）
  const [masterText, setMasterText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const saved = window.localStorage.getItem(MASTER_STORAGE_KEY);
      return saved || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(MASTER_STORAGE_KEY, masterText);
    } catch {
      // ignore
    }
  }, [masterText]);

  const masterModels = useMemo(() => parseModels(masterText).sort(), [masterText]);

  const handleCopy = (text: string) => {
    if (!text) return;
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

  const toggleRegionModel = (
    accountId: string,
    regionId: string,
    currentModelsText: string,
    modelId: string,
  ) => {
    const current = parseModels(currentModelsText);
    const set = new Set(current);
    if (set.has(modelId)) {
      set.delete(modelId);
    } else {
      set.add(modelId);
    }
    const next = Array.from(set).sort().join(',');
    updateRegionModelsText(accountId, regionId, next);
  };

  const selectAllForRegion = (
    accountId: string,
    regionId: string,
  ) => {
    if (masterModels.length === 0) return;
    const text = masterModels.join(',');
    updateRegionModelsText(accountId, regionId, text);
  };

  const clearRegionModels = (accountId: string, regionId: string) => {
    updateRegionModelsText(accountId, regionId, '');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* 全局模型目录 */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #1f2937',
          background:
            'radial-gradient(circle at top left, #0f172a, #020617 55%, #000 100%)',
          color: '#e5e7eb',
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>全局模型目录</h2>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
          在这里一次性输入你所有可能用到的模型，使用 <code>,</code>、空格或换行分隔。
          下面所有账号/区域都会从这份目录中点选模型，无需重复输入。
        </p>
        <textarea
          style={{
            width: '100%',
            minHeight: 80,
            padding: 8,
            borderRadius: 8,
            border: '1px solid #4b5563',
            backgroundColor: '#020617',
            color: '#e5e7eb',
            fontSize: 13,
            resize: 'vertical',
          }}
          value={masterText}
          onChange={(e) => setMasterText(e.target.value)}
          placeholder="例如：gpt-4o, gpt-4o-mini, gpt-4.1, gpt-35-turbo, o1-mini ..."
        />
        <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>
          已解析模型数：{masterModels.length}
        </div>
        {masterModels.length > 0 && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {masterModels.map((m) => (
              <span
                key={m}
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid #4b5563',
                  fontSize: 12,
                  background:
                    'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(129,140,248,0.12))',
                }}
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 本地账号 & 区域配置 */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
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
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>本地 Azure 账号配置</h2>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              为每个账号添加区域，然后在区域下点击选择可用模型。所有数据会保存在浏览器
              localStorage 中。
            </div>
          </div>
          <button
            onClick={addAccount}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid #0ea5e9',
              background:
                'linear-gradient(135deg, #0ea5e9, #22c55e)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            + 新增账号
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map((acct) => (
            <div
              key={acct.id}
              style={{
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: 12,
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 10px 25px -15px rgba(15,23,42,0.4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1, marginRight: 8 }}>
                  <label style={{ fontSize: 13 }}>
                    账号名称：
                    <input
                      style={{
                        width: '100%',
                        padding: 6,
                        marginTop: 4,
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                      }}
                      value={acct.name}
                      onChange={(e) =>
                        updateAccountName(acct.id, e.target.value)
                      }
                      placeholder="例如：Prod-Subscription-AzureOpenAI"
                    />
                  </label>
                  <label
                    style={{
                      fontSize: 13,
                      display: 'block',
                      marginTop: 6,
                    }}
                  >
                    备注（可选）：
                    <input
                      style={{
                        width: '100%',
                        padding: 6,
                        marginTop: 4,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}
                      value={acct.note || ''}
                      onChange={(e) =>
                        updateAccountNote(acct.id, e.target.value)
                      }
                      placeholder="例如：租户 ID、订阅 ID、联系人等"
                    />
                  </label>
                </div>
                <button
                  onClick={() => deleteAccount(acct.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    cursor: 'pointer',
                    fontSize: 12,
                    height: 32,
                  }}
                >
                  删除账号
                </button>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>区域列表</div>
                  <button
                    onClick={() => addRegion(acct.id)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: '1px solid #0ea5e9',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    + 新增区域
                  </button>
                </div>
                {acct.regions.length === 0 && (
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    暂无区域，请点击“新增区域”开始配置。
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {acct.regions.map((reg) => {
                    const selectedSet = new Set(parseModels(reg.modelsText));
                    return (
                      <div
                        key={reg.id}
                        style={{
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          padding: 8,
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 6,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 13,
                              flex: 1,
                              marginRight: 8,
                            }}
                          >
                            区域名称：
                            <input
                              style={{
                                width: '100%',
                                padding: 5,
                                marginTop: 4,
                                borderRadius: 8,
                                border: '1px solid #d1d5db',
                                fontSize: 13,
                              }}
                              value={reg.name}
                              onChange={(e) =>
                                updateRegionName(
                                  acct.id,
                                  reg.id,
                                  e.target.value,
                                )
                              }
                              placeholder="例如：eastus、swedencentral"
                            />
                          </label>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <button
                              onClick={() =>
                                selectAllForRegion(acct.id, reg.id)
                              }
                              style={{
                                padding: '3px 8px',
                                borderRadius: 999,
                                border: '1px solid #bbf7d0',
                                backgroundColor: '#ecfdf5',
                                color: '#166534',
                                cursor: 'pointer',
                                fontSize: 11,
                              }}
                            >
                              全选
                            </button>
                            <button
                              onClick={() =>
                                clearRegionModels(acct.id, reg.id)
                              }
                              style={{
                                padding: '3px 8px',
                                borderRadius: 999,
                                border: '1px solid #fee2e2',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                cursor: 'pointer',
                                fontSize: 11,
                              }}
                            >
                              清空
                            </button>
                            <button
                              onClick={() =>
                                deleteRegion(acct.id, reg.id)
                              }
                              style={{
                                padding: '3px 8px',
                                borderRadius: 999,
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                cursor: 'pointer',
                                fontSize: 11,
                              }}
                            >
                              删除区域
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          模型选择（点击切换选中状态）：
                        </div>
                        {masterModels.length === 0 ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#9ca3af',
                              marginTop: 4,
                            }}
                          >
                            请先在页面顶部配置“全局模型目录”，然后再为区域点选模型。
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: 6,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            {masterModels.map((model) => {
                              const selected = selectedSet.has(model);
                              return (
                                <button
                                  key={model}
                                  type="button"
                                  onClick={() =>
                                    toggleRegionModel(
                                      acct.id,
                                      reg.id,
                                      reg.modelsText,
                                      model,
                                    )
                                  }
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 999,
                                    border: selected
                                      ? '1px solid #0ea5e9'
                                      : '1px solid #d1d5db',
                                    background: selected
                                      ? 'linear-gradient(135deg, #0ea5e9, #22c55e)'
                                      : '#ffffff',
                                    color: selected ? '#ffffff' : '#111827',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {model}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {copyMessage && (
          <div style={{ color: '#16a34a', fontSize: 13, marginTop: 8 }}>
            {copyMessage}
          </div>
        )}
      </section>

      {/* 按账号聚合 */}
      {accountSummaries.length > 0 && (
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
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
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    padding: 10,
                    backgroundColor: '#f9fafb',
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
                        borderRadius: 999,
                        border: '1px solid #4b5563',
                        backgroundColor: '#ffffff',
                        cursor:
                          acc.allModels.length === 0
                            ? 'not-allowed'
                            : 'pointer',
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

      {/* 全局汇总 */}
      {globalSeriesSummary.allModels.length > 0 && (
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
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
              全部账号总模型数：{globalSeriesSummary.allModels.length}
            </div>
            <button
              onClick={() =>
                handleCopy(buildCopyString(globalSeriesSummary.allModels))
              }
              disabled={globalSeriesSummary.allModels.length === 0}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid #4b5563',
                backgroundColor: '#ffffff',
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

