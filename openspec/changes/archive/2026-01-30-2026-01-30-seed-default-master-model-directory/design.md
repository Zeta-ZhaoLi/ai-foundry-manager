# Design Notes

## Where the Default Lives

The seed text is large and must preserve formatting exactly. To keep `src/components/AzureModelsDashboard.tsx` readable, store the seed string in a dedicated module (single exported constant) and import it where masterText is initialized.

## Seeding Rules (Null vs Empty)

The current code uses truthiness checks (`if (!data)` / `return data || ''`), which treat `''` as missing.

For this change, seeding MUST distinguish:

- `null` (key missing): seed default
- `''` (key exists but user cleared): preserve empty string

This avoids re-populating the directory for users who intentionally cleared it.

## Migration Order

Initialization order should remain:

1. Read `ai-foundry-manager:master-models`
2. If missing, try `azure-openai-manager:master-models` and migrate
3. If still missing, seed the default text
