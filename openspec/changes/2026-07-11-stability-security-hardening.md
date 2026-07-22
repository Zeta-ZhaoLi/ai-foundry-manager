# Stability and Security Hardening

## Summary
Restore reliable quality gates, replace browser-fingerprint encryption with a
passphrase vault, make configuration import atomic and versioned, reduce the
initial bundle, and align project documentation with the current application.

## Motivation
The production bundle currently builds even when TypeScript and one test suite
fail. Sensitive local data is encrypted with an unstable browser fingerprint
and encryption failures can fall back to plaintext. Active configuration import
also bypasses the stale runtime schema, so malformed or corrupt data can reach
application state or be overwritten by defaults.

## Files Affected
- `src/security/` and `src/contexts/VaultContext.tsx` - Versioned Web Crypto
  vault, legacy migration, lock state, and persistence status.
- `src/schemas/account.ts` and account persistence/import code - Current
  runtime schemas, atomic migration, encrypted backup import/export.
- `src/App.tsx` and dashboard account controls - Unlock, lock, password change,
  recovery, and secure backup interactions.
- `package.json`, CI configuration, tests, and documentation - Enforced quality
  gates, supported Node version, coverage support, bundle budget, and accurate
  security documentation.

## Implementation Plan
1. Repair corrupt locale-dependent test selectors and make lint, type checking,
   tests, and Vite build mandatory verification steps.
2. Store the complete account configuration in a V2 envelope encrypted with
   PBKDF2-SHA-256 and AES-256-GCM. Keep passphrases and keys in memory only.
3. Preserve the legacy storage payload before migration. Only remove or mark it
   migrated after successful decryption, schema validation, and V2 persistence.
4. Add a versioned configuration schema and apply imports atomically after all
   parsing, decryption, migration, and validation succeeds.
5. Export passphrase-encrypted backups by default. Keep plaintext export behind
   an explicit second confirmation for recovery and interoperability.
6. Remove confirmed dead code, lazy-load locale resources, split high-risk
   modules without changing deployment output, and enforce a 500 kB chunk
   budget.
7. Add CI, the MIT license, and update README/OpenSpec project documentation.

## Compatibility and Failure Handling
- Continue reading legacy array and object backup formats.
- Retain the raw legacy accounts payload until V2 migration succeeds.
- Never replace corrupt or undecryptable user data with sample data.
- Never persist plaintext after encryption or storage failures.
- Keep Azure CLI, PowerShell, ARM template, and deployment report output stable.

## Testing
- Run `npm run verify` and `npm run test:coverage` on Node 22.12 or newer.
- Cover correct and incorrect passwords, tamper detection, password changes,
  locking, legacy migration, migration failure preservation, and plaintext
  absence in storage.
- Cover encrypted V2 backups, legacy backups, malformed data, and atomic import.
- Cover ordered asynchronous saves and visible storage failures.
- Require every emitted JavaScript chunk to remain at or below 500 kB.

## Risks/Considerations
- Users must unlock the vault after every page reload.
- Legacy data encrypted under a changed browser fingerprint may be impossible to
  recover automatically; the raw payload must remain downloadable.
- PBKDF2 work is asynchronous and persistence must prevent stale writes from
  replacing newer state.
