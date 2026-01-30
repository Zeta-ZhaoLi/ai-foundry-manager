# Seed Default Global Model Directory

## Why

The app currently initializes the Global Model Directory (`ai-foundry-manager:master-models`) as empty on first run. The user wants a curated, pre-filled master directory so a new install has an immediately useful model set and grouping layout.

## What Changes

When there is no existing Global Model Directory stored in localStorage, the app will initialize it with the provided default text (preserving commas and blank lines exactly).

Key behaviors:

- Do NOT overwrite existing user data.
- Continue supporting legacy migration from `azure-openai-manager:master-models`.
- Preserve the exact default string (including blank lines, trailing commas, and the `,,` empty token) because parsing/grouping and copy output depend on authored formatting.

## Assumption / Clarification Needed

The request wrapped the list in `[...]`. Confirmed: the outer `[` and `]` are only for quoting and MUST NOT be included in the stored directory text.

## Default Global Model Directory Seed Text

The following text is the canonical default seed (copy/pasted verbatim, with newlines and commas preserved):

```text
gpt-4o,gpt-4o-2024-05-13,gpt-4o-2024-08-06,gpt-4o-2024-11-20,gpt-4o-mini,gpt-4o-mini-2024-07-18,
gpt-4.1,gpt-4.1-2025-04-14,gpt-4.1-mini,gpt-4.1-mini-2025-04-14,gpt-4.1-nano,gpt-4.1-nano-2025-04-14,
gpt-5,gpt-5-2025-08-07,gpt-5-mini,gpt-5-mini-2025-08-07,gpt-5-nano,gpt-5-nano-2025-08-07,
gpt-5.1,gpt-5.1-2025-11-13,gpt-5.2,gpt-5.2-2025-12-11,
gpt-5-chat-latest,,gpt-5.1-chat-latest,gpt-5.2-chat-latest,
gpt-5-pro,gpt-5-pro-2025-10-06,gpt-5.2-pro,gpt-5.2-pro-2025-12-11,

gpt-5-codex,gpt-5.1-codex,gpt-5.1-codex-max,gpt-5.1-codex-mini,gpt-5.2-codex,codex-mini-latest,

o1-mini,o1-mini-2024-09-12,o1,o1-2024-12-17,
o3,o3-2025-04-16,o3-mini,o3-mini-2025-01-31,o3-pro,o3-pro-2025-06-10,
o3-deep-research-2025-06-26,o3-deep-research,
o4-mini,o4-mini-2025-04-16,

gpt-audio,gpt-audio-2025-08-28,gpt-audio-mini,gpt-audio-mini-2025-10-06,gpt-audio-mini-2025-12-15,
gpt-4o-audio-preview,gpt-4o-audio-preview-2024-10-01,gpt-4o-audio-preview-2024-12-17,
gpt-4o-mini-audio-preview,gpt-4o-mini-audio-preview-2024-12-17,gpt-audio-mini-2025-12-15,
gpt-realtime,gpt-realtime-2025-08-28,gpt-realtime-mini,gpt-realtime-mini-2025-10-06,gpt-realtime-mini-2025-12-15,
gpt-4o-realtime-preview,gpt-4o-realtime-preview-2024-12-17,gpt-4o-realtime-preview-2024-10-01,gpt-4o-mini-realtime-preview,gpt-4o-mini-realtime-preview-2024-12-17,
gpt-4o-search-preview-2025-03-11,gpt-4o-search-preview,gpt-4o-mini-search-preview,gpt-4o-mini-search-preview-2025-03-11,
gpt-4o-transcribe,gpt-4o-mini-transcribe,gpt-4o-mini-transcribe-2025-03-20,gpt-4o-mini-transcribe-2025-12-15,gpt-4o-transcribe-diarize,
gpt-4o-mini-tts,gpt-4o-mini-tts-2025-03-20,gpt-4o-mini-tts-2025-12-15,
whisper-1,tts-1,tts-1-1106,tts-1-hd,tts-1-hd-1106,

dall-e-2,dall-e-3,gpt-image-1,gpt-image-1-mini,gpt-image-1.5,chatgpt-image-latest,
text-embedding-ada-002,text-embedding-3-small,text-embedding-3-large,

sora-2,sora-2-pro,

gpt-oss-120b,gpt-oss-20b,
kimi-k2-thinking,
deepseek-chat,deepseek-reasoner,deepseek-v3.2-speciale,deepseek-v3.2-251201,deepseek-v3.2-251201-thinking,deepseek-v3.1-terminus,deepseek-v3.1-terminus-thinking,
flux-kontext-pro,flux-2-pro,

claude-haiku-4-5-20251001,claude-sonnet-4-5-20250929,claude-opus-4-1-20250805,claude-opus-4-5-20251101,
```

## Out of Scope

- Changing parsing rules (blank-line grouping, tokenization, de-duplication)
- Any UI changes beyond initial default content
- README/spec refactors beyond what is required to describe the new default behavior
