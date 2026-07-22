# Improvement History

## 2026-07 Stability and Security Hardening

- Added a passphrase-protected Web Crypto vault using PBKDF2-SHA-256 and
  AES-256-GCM.
- Added authenticated, password-protected configuration backups and retained
  plaintext export only as an explicitly confirmed recovery action.
- Added versioned Zod schemas, atomic configuration import, and guarded legacy
  migration with raw-data preservation.
- Added vault lock, password change, save status, corrupt-data recovery, and
  latest-write-wins persistence behavior.
- Restored zero-warning lint, full TypeScript checking, complete test execution,
  coverage support, CI, and a 500 kB JavaScript chunk budget.
- Removed unused import, notification, configuration client, and summary code.
- Added lazy locale loading, stable React form IDs, Node 22.12 requirements, and
  current project/security documentation.

The detailed design, compatibility boundaries, and verification requirements
are recorded in
`openspec/changes/2026-07-11-stability-security-hardening.md`.
