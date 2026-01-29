# server-login-info Specification

## Purpose
TBD - created by archiving change 2025-12-21-add-account-prefixes-and-endpoint-conversion. Update Purpose after archive.
## Requirements
### Requirement: Credential Field Structure

Server credentials **SHALL** include host, username, authentication (password or SSH key), port, and optional notes.

#### Scenario: Complete Windows server fields

**Given** a Windows server credential form

**Then** the form includes the following fields:
- Host (required): IP address or hostname
- Username (required): Windows username
- Password (optional): Windows password
- Port (optional): RDP port, default 3389
- Note (optional): Free-text field for admin notes

#### Scenario: Complete Linux server fields

**Given** a Linux server credential form

**Then** the form includes the following fields:
- Host (required): IP address or hostname
- Username (required): Linux username
- Auth Method (required): Password or SSH Key toggle
- Password (optional): Linux password (shown if auth method is password)
- SSH Key (optional): Private key content (shown if auth method is SSH key)
- Port (optional): SSH port, default 22
- Note (optional): Free-text field for admin notes

---

### Requirement: Encryption for Sensitive Fields

Passwords and SSH keys **MUST** be encrypted using the existing encryption utilities before storage in localStorage.

#### Scenario: Encrypt Windows password

**Given** the user enters Windows server password "mySecretPass"

**When** the account is saved to localStorage

**Then** the password field contains an encrypted string

**And** the encrypted string is different from "mySecretPass"

**When** the account is loaded from localStorage

**Then** the password is decrypted back to "mySecretPass"

#### Scenario: Encrypt SSH key

**Given** the user enters an SSH private key

**When** the account is saved to localStorage

**Then** the sshKey field contains an encrypted string

**When** the account is loaded from localStorage

**Then** the SSH key is decrypted to the original key content

#### Scenario: Non-sensitive fields remain unencrypted

**Given** server credentials with host "10.0.1.100" and username "admin"

**When** the account is saved to localStorage

**Then** the host and username fields remain as plain text

**And** only password and sshKey fields are encrypted

---

### Requirement: Privacy Mode Compliance

Server credential fields **MUST** be hidden or masked when privacy mode is enabled.

#### Scenario: Privacy mode hides server passwords

**Given** an account with Windows server password "secret123"

**And** privacy mode is enabled

**When** the user views the account card

**Then** the password field displays "***"

**And** the actual password is not visible

#### Scenario: Privacy mode hides SSH keys

**Given** an account with Linux server SSH key

**And** privacy mode is enabled

**When** the user views the account card

**Then** the SSH key field displays "***"

**And** the actual key content is not visible

#### Scenario: Privacy mode masks hostnames

**Given** an account with server host "10.0.1.100"

**And** privacy mode is enabled

**When** the user views the account card

**Then** the host field displays "***" or "Server 1"

**And** the actual hostname is not visible

---

### Requirement: Copy to Clipboard

Server credential fields **SHALL** include a copy button for quick access.

#### Scenario: Copy password to clipboard

**Given** a password field with value "mySecurePass"

**When** the user clicks the copy button next to the password field

**Then** "mySecurePass" is copied to the clipboard

**And** a success toast notification appears: "Password copied"

#### Scenario: Copy SSH key to clipboard

**Given** an SSH key field with private key content

**When** the user clicks the copy button next to the SSH key field

**Then** the full key content is copied to the clipboard

**And** a success toast notification appears: "SSH Key copied"

---

### Requirement: Optional Fields

All server credential fields **MUST** be optional; accounts can be configured without server information.

#### Scenario: Account without server info

**Given** a new account is created

**And** the user does not enter any server credentials

**When** the account is saved

**Then** the account saves successfully

**And** windowsServer and linuxServer fields are undefined

#### Scenario: Partial server info

**Given** an account configuration card

**When** the user enters only Windows server host and username

**And** leaves password blank

**Then** the account saves successfully

**And** the password field remains undefined

---

### Requirement: Export and Import Support

Server credentials **MUST** be included in configuration export and correctly imported.

#### Scenario: Export with server credentials

**Given** an account with Windows server credentials

**When** the user exports the configuration to JSON

**Then** the exported JSON includes windowsServer object with encrypted password

**And** all other server fields are present

#### Scenario: Import with server credentials

**Given** a JSON configuration file with encrypted server credentials

**When** the user imports the configuration

**Then** the server credentials are loaded

**And** passwords and SSH keys are correctly decrypted

**And** all accounts display their server information

---

### Requirement: Data Model

Server credentials **SHALL** follow a defined TypeScript interface structure.

#### Scenario: ServerCredentials interface

**Given** the data model for server credentials

**Then** it includes the following fields:
```typescript
interface ServerCredentials {
  host: string;           // Required
  username: string;       // Required
  password?: string;      // Optional, encrypted
  sshKey?: string;        // Optional, encrypted
  port?: number;          // Optional, defaults by context
  note?: string;          // Optional
}
```

#### Scenario: LocalAccount interface extension

**Given** the LocalAccount interface

**Then** it includes the following fields:
```typescript
interface LocalAccount {
  // ... existing fields
  windowsServer?: ServerCredentials;
  linuxServer?: ServerCredentials;
}
```

### Requirement: Legacy Server Fields Are Ignored

Legacy configurations MAY contain `windowsServer` / `linuxServer` fields. The system MUST accept such input and discard these fields without error.

#### Scenario: Import legacy config with server fields

**Given** an imported config JSON contains accounts with `windowsServer` and/or `linuxServer`

**When** the user imports the configuration

**Then** the import MUST succeed

**And** the resulting in-memory and persisted accounts MUST NOT contain server login fields

