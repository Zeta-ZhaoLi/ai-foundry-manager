import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { LocalRegion } from '../../../schemas/account';

function maskEndpoint(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    if (parts.length >= 2) {
      parts[0] = '***';
    }
    return `${parsed.protocol}//${parts.join('.')}`;
  } catch {
    return '***';
  }
}

export interface RegionEndpointSectionProps {
  region: LocalRegion;
  privacyMode: boolean;
  onFoundryProjectEndpointChange: (endpoint: string) => void;
  onOpenAIEndpointChange: (endpoint: string) => void;
  onAiServicesEndpointChange: (endpoint: string) => void;
  onAnthropicEndpointChange: (endpoint: string) => void;
  onCopy: (text: string, label: string) => void;
}

export function RegionEndpointSection({
  region,
  privacyMode,
  onFoundryProjectEndpointChange,
  onOpenAIEndpointChange,
  onAiServicesEndpointChange,
  onAnthropicEndpointChange,
  onCopy,
}: RegionEndpointSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 pl-7">
      <div className="min-w-0">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('regions.foundryProjectEndpoint')}
        </label>
        <div className="flex items-center gap-1">
          <input
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-gray-700 bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={
              privacyMode
                ? maskEndpoint(region.foundryProjectEndpoint || '')
                : region.foundryProjectEndpoint || ''
            }
            onChange={(e) => onFoundryProjectEndpointChange(e.target.value)}
            placeholder="https://xxx.services.ai.azure.com/api/projects/xxx"
            disabled={privacyMode}
          />
          {!privacyMode && region.foundryProjectEndpoint && (
            <button
              type="button"
              onClick={() =>
                onCopy(
                  region.foundryProjectEndpoint || '',
                  'Foundry Project Endpoint'
                )
              }
              className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={t('common.copy')}
            >
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
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('regions.openaiEndpoint')}
        </label>
        <div className="flex items-center gap-1">
          <input
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-gray-700 bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={
              privacyMode
                ? maskEndpoint(region.openaiEndpoint || '')
                : region.openaiEndpoint || ''
            }
            onChange={(e) => onOpenAIEndpointChange(e.target.value)}
            placeholder="https://xxx.openai.azure.com"
            disabled={privacyMode}
          />
          {!privacyMode && region.openaiEndpoint && (
            <button
              type="button"
              onClick={() =>
                onCopy(region.openaiEndpoint || '', 'OpenAI Endpoint')
              }
              className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={t('common.copy')}
            >
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
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('regions.aiServicesEndpoint')}
        </label>
        <div className="flex items-center gap-1">
          <input
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-gray-700 bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={
              privacyMode
                ? maskEndpoint(region.aiServicesEndpoint || '')
                : region.aiServicesEndpoint || ''
            }
            onChange={(e) => onAiServicesEndpointChange(e.target.value)}
            placeholder="https://xxx.cognitiveservices.azure.com"
            disabled={privacyMode}
          />
          {!privacyMode && region.aiServicesEndpoint && (
            <button
              type="button"
              onClick={() =>
                onCopy(
                  region.aiServicesEndpoint || '',
                  'Azure AI Services Endpoint'
                )
              }
              className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={t('common.copy')}
            >
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
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('regions.anthropicEndpoint')}
        </label>
        <div className="flex items-center gap-1">
          <input
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-gray-700 bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={
              privacyMode
                ? maskEndpoint(region.anthropicEndpoint || '')
                : region.anthropicEndpoint || ''
            }
            onChange={(e) => onAnthropicEndpointChange(e.target.value)}
            placeholder="https://xxx.services.ai.azure.com/anthropic"
            disabled={privacyMode}
          />
          {!privacyMode && region.anthropicEndpoint && (
            <button
              type="button"
              onClick={() =>
                onCopy(region.anthropicEndpoint || '', 'Anthropic Endpoint')
              }
              className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={t('common.copy')}
            >
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
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
