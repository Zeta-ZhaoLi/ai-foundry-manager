# Design: DeploymentName/ModelName Matching Relaxation

## Context

Deployment export validation currently enforces a case-sensitive substring rule:

- `deploymentName` must include `modelName` exactly.

This fails valid operational naming patterns where model casing differs but identity is unchanged.

## Goals

- Accept case-insensitive model inclusion in `deploymentName`.
- Accept explicit template pairs when `(deploymentName, modelName)` identity matches case-insensitively.
- Preserve existing safety against template-driven model drift.

## Non-Goals

- Introducing synonym/alias dictionaries for model names.
- Normalizing punctuation/spacing beyond case-folding.

## Validation Rules (Target)

For each active deployment row:

1. `deploymentName` must be non-empty.
2. Row is valid if either:
   - `deploymentName` contains `modelName` case-insensitively, OR
   - template lookup by `deploymentName` exists and template `modelName` equals row `modelName` case-insensitively.
3. If template lookup exists and template `modelName` differs from row `modelName` (case-insensitive), block export with mismatch error.
4. Keep existing uniqueness/version/capacity checks unchanged.

## Test Strategy

- Add case where `deploymentName=deepseek-v3.2-251201` and `modelName=DeepSeek-V3.2` passes.
- Add case where template pair exists and should pass even if strict-case substring would fail.
- Keep case where template maps to different model and export is blocked.
