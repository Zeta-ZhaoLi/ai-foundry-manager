import React, { useState } from 'react';
import { useLocalAzureAccounts } from '../hooks/useLocalAzureAccounts';
import { buildCopyString } from '../utils/modelSeries';

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
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>
              本地 Azure 账号配置
            </h2>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              在这里手动维护 Azure 账号、区域和模型列表，数据保存在浏览器
              localStorage 中。
            </div>
          </div>
          <button
            onClick={addAccount}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #16a34a',
              background: '#16a34a',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            新增账号
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map((acct) => (
            <div
              key={acct.id}
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
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1, marginRight: 8 }}>
                  <label style={{ fontSize: 13 }}>
                    账号名称：
                    <input
                      style={{ width: '100%', padding: 4, marginTop: 4 }}
                      value={acct.name}
                      onChange={(e) =>
                        updateAccountName(acct.id, e.target.value)
                      }
                      placeholder='例如：生产订阅-AzureOpenAI'
                    />
                  </label>
                  <label style={{ fontSize: 13, display: 'block', marginTop: 6 }}>
                    备注（可选）：
                    <input
                      style={{ width: '100%', padding: 4, marginTop: 4 }}
                      value={acct.note || ''}
                      onChange={(e) =>
                        updateAccountNote(acct.id, e.target.value)
                      }
                      placeholder='例如：租户 ID、订阅 ID 等'
                    />
                  </label>
                </div>
                <button
                  onClick={() => deleteAccount(acct.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid #b91c1c',
                    background: '#fee2e2',
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
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid #2563eb',
                      background: '#2563eb',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    新增区域
                  </button>
                </div>
                {acct.regions.length === 0 && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
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
                  {acct.regions.map((reg) => (
                    <div
                      key={reg.id}
                      style={{
                        borderRadius: 4,
                        border: '1px solid #e5e7eb',
                        padding: 8,
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
                        <label style={{ fontSize: 13, flex: 1, marginRight: 8 }}>
                          区域名称：
                          <input
                            style={{
                              width: '100%',
                              padding: 4,
                              marginTop: 4,
                            }}
                            value={reg.name}
                            onChange={(e) =>
                              updateRegionName(acct.id, reg.id, e.target.value)
                            }
                            placeholder='例如：eastus、swedencentral'
                          />
                        </label>
                        <button
                          onClick={() => deleteRegion(acct.id, reg.id)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: '1px solid #b91c1c',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            cursor: 'pointer',
                            fontSize: 12,
                            height: 30,
                          }}
                        >
                          删除区域
                        </button>
                      </div>
                      <label style={{ fontSize: 13 }}>
                        模型列表（可用逗号、换行或空格分隔）：
                        <textarea
                          style={{
                            width: '100%',
                            padding: 4,
                            marginTop: 4,
                            minHeight: 60,
                            resize: 'vertical',
                          }}
                          value={reg.modelsText}
                          onChange={(e) =>
                            updateRegionModelsText(
                              acct.id,
                              reg.id,
                              e.target.value,
                            )
                          }
                          placeholder='例如：gpt-4o, gpt-4o-mini, gpt-4.1, gpt-35-turbo'
                        />
                      </label>
                    </div>
                  ))}
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
              全部账号总模型数：{globalSeriesSummary.allModels.length}
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

