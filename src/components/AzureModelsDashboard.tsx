import React, { useEffect, useMemo, useState } from 'react';
import { useLocalAzureAccounts } from '../hooks/useLocalAzureAccounts';
import { buildCopyString } from '../utils/modelSeries';

const MASTER_STORAGE_KEY = 'azure-openai-manager:master-models';

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
    updateAccountEnabled,
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
  } = useLocalAzureAccounts();

  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [lastCopiedLabel, setLastCopiedLabel] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState<string>('');
  const [collapsedMaster, setCollapsedMaster] = useState<boolean>(true);
  const [collapsedAccountRegions, setCollapsedAccountRegions] = useState<
    Record<string, boolean>
  >({});
  const [collapsedSeries, setCollapsedSeries] = useState<Record<string, boolean>>(
    {},
  );

  const [masterText, setMasterText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(MASTER_STORAGE_KEY) || '';
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

  const masterModels = useMemo(
    () => parseModels(masterText).sort(),
    [masterText],
  );
  const filteredModels = useMemo(() => {
    const keyword = modelFilter.trim().toLowerCase();
    if (!keyword) {
      return masterModels;
    }
    return masterModels.filter((m) => m.toLowerCase().includes(keyword));
  }, [masterModels, modelFilter]);

  // 仅对启用账号进行统计
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.enabled !== false),
    [accounts],
  );

  // 概览统计与覆盖度数据（只统计启用账号）
  const totalAccounts = activeAccounts.length;
  const allRegions = useMemo(
    () =>
      activeAccounts.flatMap((acct) =>
        acct.regions.map((reg) => ({
          accountId: acct.id,
          accountName: acct.name,
          regionId: reg.id,
          regionName: reg.name,
          models: parseModels(reg.modelsText),
        })),
      ),
    [accounts],
  );
  const totalRegions = allRegions.length;
  const regionsWithModels = allRegions.filter((r) => r.models.length > 0).length;
  const totalMasterModels = masterModels.length;
  const totalUsedModels = globalSeriesSummary.allModels.length;
  const avgModelsPerRegion =
    totalRegions === 0
      ? 0
      : Math.round(
          (allRegions.reduce((sum, r) => sum + r.models.length, 0) /
            totalRegions) *
            10,
        ) / 10;

  const regionCoverage = useMemo(() => {
    if (totalMasterModels === 0) return [];
    const masterSet = new Set(masterModels);
    return allRegions
      .map((r) => {
        const used = r.models.filter((m) => masterSet.has(m));
        const pct =
          totalMasterModels === 0
            ? 0
            : Math.round((used.length / totalMasterModels) * 100);
        return {
          key: `${r.accountId}-${r.regionId}`,
          label: `${r.accountName || r.accountId} / ${r.regionName || '未命名'}`,
          usedCount: used.length,
          pct,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [allRegions, masterModels, totalMasterModels]);

  const modelCoverage = useMemo(() => {
    if (masterModels.length === 0 || totalRegions === 0) return [];
    const counts: Record<string, number> = {};
    for (const r of allRegions) {
      const set = new Set(r.models);
      for (const m of masterModels) {
        if (set.has(m)) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    }
    return masterModels
      .map((m) => {
        const c = counts[m] || 0;
        const pct = Math.round((c / totalRegions) * 100);
        return { model: m, count: c, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [allRegions, masterModels, totalRegions]);

  const unusedModelsCount = useMemo(
    () => (totalMasterModels > 0 ? totalMasterModels - totalUsedModels : 0),
    [totalMasterModels, totalUsedModels],
  );

  const singleRegionModelsCount = useMemo(() => {
    if (modelCoverage.length === 0) return 0;
    return modelCoverage.filter((m) => m.count === 1).length;
  }, [modelCoverage]);

  const toggleSeriesCollapse = (series: string) => {
    setCollapsedSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    const successMessage = `已复制：${label}`;
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
        setCopyMessage(successMessage);
        setLastCopiedLabel(label);
      } catch {
        setCopyMessage('复制失败，请手动选择文本');
      }
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyMessage(successMessage);
        setLastCopiedLabel(label);
      })
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

  const selectAllForRegion = (accountId: string, regionId: string) => {
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
            'radial-gradient(circle at top left, #0b1120, #020617 55%, #000 100%)',
          color: '#e5e7eb',
          boxShadow: '0 20px 45px -30px rgba(15,23,42,0.9)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: collapsedMaster ? 0 : 8,
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setCollapsedMaster((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: '#e5e7eb',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 16,
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: 12,
              }}
            >
              {collapsedMaster ? '▶' : '▼'}
            </span>
            <span>全局模型目录</span>
          </button>
          {!collapsedMaster && (
            <span
              style={{
                fontSize: 12,
                color: '#9ca3af',
                whiteSpace: 'nowrap',
              }}
            >
              已解析模型：{masterModels.length}
            </span>
          )}
        </div>
        {!collapsedMaster && (
          <>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
              在此一次性维护所有可能用到的模型（使用逗号、空格或换行分隔）。下方账号 / 区域的模型都通过点击选择，不再重复输入。
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
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: '#9ca3af',
              }}
            >
              <span>已解析模型数：{masterModels.length}</span>
              {masterModels.length > 0 && (
                <button
                  onClick={() =>
                    handleCopy(buildCopyString(masterModels), '全局模型目录')
                  }
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: '1px solid #38bdf8',
                    backgroundColor: '#0f172a',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                  }}
                >
                  复制目录列表（带逗号）
                </button>
              )}
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
                      border: '1px solid rgba(148,163,184,0.5)',
                      fontSize: 12,
                      background:
                        'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(129,140,248,0.18))',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* 概览仪表盘 + 覆盖度图 */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #1f2937',
          backgroundColor: '#020617',
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>可视化概览</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {/* 概要统计 */}
          <div
            style={{
              flex: '1 1 260px',
              borderRadius: 10,
              border: '1px solid #1f2937',
              padding: 12,
              backgroundColor: '#020617',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>账号数</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {totalAccounts}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>区域数</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {totalRegions}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  有配置模型的区域
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {regionsWithModels}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  每区域平均模型数
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {avgModelsPerRegion}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  全局目录模型数
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {totalMasterModels}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  实际使用模型数
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {totalUsedModels}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  未使用模型数
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {unusedModelsCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  仅 1 区域使用的模型
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {singleRegionModelsCount}
                </div>
              </div>
            </div>
          </div>

          {/* 区域覆盖度 */}
          <div
            style={{
              flex: '1 1 320px',
              borderRadius: 10,
              border: '1px solid #1f2937',
              padding: 12,
              backgroundColor: '#020617',
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
              <div style={{ fontSize: 13, color: '#e5e7eb' }}>
                区域覆盖度（模型占比）
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                各区域覆盖全局目录的比例
              </div>
            </div>
            {regionCoverage.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                暂无区域或全局目录为空，无法计算覆盖度。
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {regionCoverage.slice(0, 10).map((r) => (
                  <div
                    key={r.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 180,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#e5e7eb',
                      }}
                      title={r.label}
                    >
                      {r.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: '#020617',
                        borderRadius: 999,
                        border: '1px solid #1f2937',
                        overflow: 'hidden',
                        height: 8,
                      }}
                    >
                      <div
                        style={{
                          width: `${r.pct}%`,
                          height: '100%',
                          background:
                            'linear-gradient(90deg, #0ea5e9, #22c55e)',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 72,
                        textAlign: 'right',
                        color: '#9ca3af',
                      }}
                    >
                      {r.usedCount}/{totalMasterModels} · {r.pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 模型覆盖度 */}
          <div
            style={{
              flex: '1 1 320px',
              borderRadius: 10,
              border: '1px solid #1f2937',
              padding: 12,
              backgroundColor: '#020617',
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
              <div style={{ fontSize: 13, color: '#e5e7eb' }}>
                模型覆盖度（区域占比）
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                每个模型在多少个区域启用
              </div>
            </div>
            {modelCoverage.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                暂无区域或全局目录为空，无法计算覆盖度。
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {modelCoverage.slice(0, 10).map((m) => (
                  <div
                    key={m.model}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 140,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#e5e7eb',
                      }}
                      title={m.model}
                    >
                      {m.model}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: '#020617',
                        borderRadius: 999,
                        border: '1px solid #1f2937',
                        overflow: 'hidden',
                        height: 8,
                      }}
                    >
                      <div
                        style={{
                          width: `${m.pct}%`,
                          height: '100%',
                          background:
                            'linear-gradient(90deg, #a855f7, #22c55e)',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 76,
                        textAlign: 'right',
                        color: '#9ca3af',
                      }}
                    >
                      {m.count}/{totalRegions} · {m.pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 本地账号 & 区域配置 */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #1f2937',
          backgroundColor: '#020617',
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
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              为每个账号添加区域，并通过点击选择可用模型。所有配置存储在浏览器 localStorage 中。
            </div>
          </div>
          <button
            onClick={addAccount}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid #0ea5e9',
              background:
                'linear-gradient(135deg, rgba(14,165,233,0.9), rgba(52,211,153,0.9))',
              color: '#f9fafb',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            + 新增账号
          </button>
        </div>

        <div
          style={{
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          <span>模型搜索：</span>
          <input
            style={{
              flex: 1,
              minWidth: 0,
              padding: 4,
              borderRadius: 999,
              border: '1px solid #374151',
              backgroundColor: '#020617',
              color: '#e5e7eb',
              fontSize: 12,
            }}
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            placeholder="按模型关键字过滤，例如：gpt-4o"
          />
          {modelFilter && (
            <button
              onClick={() => setModelFilter('')}
              style={{
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid #4b5563',
                backgroundColor: '#020617',
                color: '#e5e7eb',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              清除
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map((acct) => (
            <div
              key={acct.id}
              style={{
                borderRadius: 10,
                border: '1px solid #1f2937',
                padding: 12,
                background:
                  'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))',
                boxShadow: '0 18px 40px -30px rgba(15,23,42,0.8)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13 }}>
                    账号名称：
                    <input
                      style={{
                        width: '100%',
                        padding: 6,
                        marginTop: 4,
                        borderRadius: 8,
                        border: '1px solid #374151',
                        backgroundColor: '#020617',
                        color: '#e5e7eb',
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
                        border: '1px solid #374151',
                        backgroundColor: '#020617',
                        color: '#e5e7eb',
                        fontSize: 13,
                      }}
                      value={acct.note || ''}
                      onChange={(e) =>
                        updateAccountNote(acct.id, e.target.value)
                      }
                      placeholder="例如：租户 ID、订阅 ID 等"
                    />
                  </label>
                </div>
                <button
                  onClick={() => deleteAccount(acct.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #7f1d1d',
                    backgroundColor: '#451a1a',
                    color: '#fecaca',
                    cursor: 'pointer',
                    fontSize: 12,
                    height: 32,
                    whiteSpace: 'nowrap',
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
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedAccountRegions((prev) => ({
                        ...prev,
                        [acct.id]: !prev[acct.id],
                      }))
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: '#e5e7eb',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 14,
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: 12,
                      }}
                    >
                      {collapsedAccountRegions[acct.id] ?? true ? '▶' : '▼'}
                    </span>
                    <span>区域列表</span>
                  </button>
                  <button
                    onClick={() => addRegion(acct.id)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: '1px solid #0ea5e9',
                      backgroundColor: '#0b1120',
                      color: '#bae6fd',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    + 新增区域
                  </button>
                </div>
                {!(collapsedAccountRegions[acct.id] ?? true) && (
                  <>
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
                      {acct.regions.map((reg) => {
                        const selectedSet = new Set(
                          parseModels(reg.modelsText),
                        );
                        const regionModels = Array.from(selectedSet).sort();
                        return (
                          <div
                            key={reg.id}
                            style={{
                              borderRadius: 8,
                              border: '1px solid #1f2937',
                              padding: 8,
                              backgroundColor: '#020617',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                                gap: 8,
                              }}
                            >
                              <label
                                style={{
                                  fontSize: 13,
                                  flex: 1,
                                }}
                              >
                                区域名称：
                                <input
                                  style={{
                                    width: '100%',
                                    padding: 5,
                                    marginTop: 4,
                                    borderRadius: 8,
                                    border: '1px solid #374151',
                                    backgroundColor: '#020617',
                                    color: '#e5e7eb',
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
                                    border: '1px solid #14532d',
                                    backgroundColor: '#022c22',
                                    color: '#bbf7d0',
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
                                    border: '1px solid #7f1d1d',
                                    backgroundColor: '#451a1a',
                                    color: '#fecaca',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                  }}
                                >
                                  清空
                                </button>
                                <button
                                  onClick={() => deleteRegion(acct.id, reg.id)}
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    border: '1px solid #7f1d1d',
                                    backgroundColor: 'transparent',
                                    color: '#fecaca',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                  }}
                                >
                                  删除区域
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: '#9ca3af',
                                marginBottom: 4,
                              }}
                            >
                              模型（点击切换选中状态）：
                            </div>
                            {masterModels.length === 0 ? (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#6b7280',
                                  marginTop: 4,
                                }}
                              >
                                请先在顶部配置“全局模型目录”，然后再为区域点选模型。
                              </div>
                            ) : filteredModels.length === 0 ? (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#6b7280',
                                  marginTop: 4,
                                }}
                              >
                                当前搜索条件下没有匹配的模型。
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
                                {filteredModels.map((model) => {
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
                                          : '1px solid #4b5563',
                                        background: selected
                                          ? 'linear-gradient(135deg, #0ea5e9, #22c55e)'
                                          : '#020617',
                                        color: selected
                                          ? '#f9fafb'
                                          : '#e5e7eb',
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

                            {regionModels.length > 0 && (
                              <div
                                style={{
                                  marginTop: 6,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: 12,
                                  color: '#9ca3af',
                                }}
                              >
                                <span>
                                  已选模型数：{regionModels.length}
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopy(
                                      buildCopyString(regionModels),
                                      `账号 ${acct.name || acct.id} / 区域 ${
                                        reg.name || '未命名'
                                      }`,
                                    )
                                  }
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    border: '1px solid #4b5563',
                                    backgroundColor: '#020617',
                                    color: '#e5e7eb',
                                    cursor: 'pointer',
                                  }}
                                >
                                  复制本区域模型
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {copyMessage && (
          <div
            style={{
              color: '#22c55e',
              fontSize: 13,
              marginTop: 8,
            }}
          >
            {copyMessage}
            {lastCopiedLabel && `（${lastCopiedLabel}）`}
          </div>
        )}
      </section>

      {/* 按账号聚合 */}
      {accountSummaries.length > 0 && (
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #1f2937',
            backgroundColor: '#020617',
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
                    border: '1px solid #1f2937',
                    padding: 10,
                    backgroundColor: '#020617',
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
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        区域数：{Object.keys(acc.regions).length}，模型总数：
                        {acc.allModels.length}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          copyStr,
                          `账号 ${acc.accountKey} 的模型列表`,
                        )
                      }
                      disabled={acc.allModels.length === 0}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: '1px solid #4b5563',
                        backgroundColor: '#020617',
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
                      color: '#e5e7eb',
                      marginBottom: 4,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: 120,
                      overflowY: 'auto',
                    }}
                  >
                    {copyStr}
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
            border: '1px solid #1f2937',
            backgroundColor: '#020617',
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
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              全部账号总模型数：{globalSeriesSummary.allModels.length}
            </div>
            <button
              onClick={() =>
                handleCopy(
                  buildCopyString(globalSeriesSummary.allModels),
                  '全局可用模型列表',
                )
              }
              disabled={globalSeriesSummary.allModels.length === 0}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid #4b5563',
                backgroundColor: '#020617',
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
              color: '#e5e7eb',
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
            {Object.entries(globalSeriesSummary.bySeries)
              .sort(([a], [b]) => a.localeCompare(b, 'en'))
              .map(([series, models]) => {
                const collapsed = collapsedSeries[series] ?? false;
                return (
                  <div
                    key={series}
                    style={{
                      marginBottom: 6,
                      borderTop: '1px solid #1f2937',
                      paddingTop: 4,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSeriesCollapse(series)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: '#e5e7eb',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 14,
                          textAlign: 'center',
                          color: '#9ca3af',
                        }}
                      >
                        {collapsed ? '▶' : '▼'}
                      </span>
                      <span>
                        系列：{series}
                        <span
                          style={{
                            color: '#9ca3af',
                            marginLeft: 4,
                          }}
                        >
                          （{models.length}）
                        </span>
                      </span>
                    </button>
                    {!collapsed && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#e5e7eb',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          marginTop: 4,
                        }}
                      >
                        {buildCopyString(models)}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
};
