# Design: Account ID Prefixes, Server Login Info, and Endpoint Auto-Conversion

## Overview

This change introduces three independent but complementary features to enhance Azure account configuration management. Each feature solves a specific user pain point while maintaining the existing architecture and data flow.

## Architectural Principles

### 1. Data Immutability for IDs

**Decision**: Account IDs should be automatically managed by the system, not user-editable.

**Rationale**:
- Prevents ID conflicts and ensures uniqueness
- Simplifies implementation (no validation UI needed)
- IDs are primarily for system organization, not user interaction
- Users interact with account names, IDs are supplementary labels

**Trade-offs**:
- Less flexibility for users who want custom ID schemes
- Tier changes cause ID reassignment
- Future enhancement: Add "Lock ID" option if user demand emerges

### 2. Account-Level vs Region-Level Server Info

**Decision**: Store server credentials at account level, not region level.

**Rationale**:
- In practice, all regions within an account use the same login server
- Reduces configuration redundancy (one account = one set of servers)
- Simplifies UI and data model
- Easier to maintain and update credentials

**Trade-offs**:
- Cannot assign different servers per region
- If needed in future, can add region-level override mechanism (similar to how includeInStats works)

### 3. Bidirectional Auto-Sync with Override Detection

**Decision**: Implement smart auto-sync that respects user intent through manual override detection.

**Rationale**:
- Maximizes convenience: Most users need both endpoints and they follow a pattern
- Respects user control: Manual edits are preserved
- Fail-safe: Only syncs when target is empty or auto-generated
- Clear feedback: Visual indicators show sync status

**Trade-offs**:
- Slightly more complex state management (need override flags)
- Edge cases to handle (e.g., what if user pastes same pattern manually?)
- Requires thorough testing of sync logic

## Component Architecture

### Data Flow: Account ID Assignment

```
User Action: Create Account with Tier "Premium"
    ↓
useLocalAzureAccounts.addAccount()
    ↓
generateAccountId(accounts, tier: "premium")
    ↓
Find highest existing premium account ID (e.g., A002)
    ↓
Return next ID (A003)
    ↓
Save new account with id: "A003"
    ↓
UI displays read-only badge "A003" next to tier selector
```

**Reassignment on Tier Change**:
```
User Action: Change account tier from Premium to Standard
    ↓
useLocalAzureAccounts.updateAccountTier(accountId, "standard")
    ↓
Generate new ID for standard tier (e.g., B005)
    ↓
Update account with new tier and id
    ↓
UI shows ID change: "A003" → "B005"
```

### Data Flow: Server Credentials

```
User Input: Enter Windows server host, username, password
    ↓
AccountCard component: handleServerCredentialChange()
    ↓
useLocalAzureAccounts.updateAccountWindowsServer(accountId, credentials)
    ↓
Before save: encryptSensitiveFields(credentials)
    ↓
localStorage.setItem with encrypted password
    ↓
On load: decryptSensitiveFields(credentials)
    ↓
UI displays decrypted values (or *** in privacy mode)
```

### Data Flow: Endpoint Auto-Conversion

```
User Input: Enters OpenAI Endpoint "https://test.openai.azure.com"
    ↓
RegionCard.onUpdateOpenaiEndpoint(endpoint)
    ↓
Check: Is anthropicEndpoint empty OR not manually overridden?
    ↓
Yes: Extract resource name "test" using extractAzureResourceName()
    ↓
Generate Anthropic endpoint: "https://test.services.ai.azure.com/anthropic"
    ↓
Update region with openaiEndpoint and anthropicEndpoint
    ↓
UI shows both endpoints, with 🔄 icon on Anthropic field
    ↓
User manually edits Anthropic endpoint
    ↓
Set anthropicEndpointManualOverride = true
    ↓
Future OpenAI changes won't overwrite Anthropic endpoint
    ↓
UI shows ✏️ icon on Anthropic field
```

## State Management

### Extended LocalAccount Interface

```typescript
interface LocalAccount {
  // Existing fields...
  id: string;
  name: string;
  tier?: AccountTier;
  quota?: AccountQuota;
  // ... other existing fields

  // NEW: Account ID Prefix
  accountId?: string;  // e.g., "A001", "B003"

  // NEW: Server Login Information
  windowsServer?: ServerCredentials;
  linuxServer?: ServerCredentials;
}

interface ServerCredentials {
  host: string;           // IP or hostname
  username: string;
  password?: string;      // Encrypted before storage
  sshKey?: string;        // For Linux, encrypted before storage
  port?: number;          // Default 3389 for Windows, 22 for Linux
  note?: string;          // Optional admin notes
}
```

### Extended LocalRegion Interface

```typescript
interface LocalRegion {
  // Existing fields...
  id: string;
  name: string;
  openaiEndpoint?: string;
  anthropicEndpoint?: string;
  // ... other existing fields

  // NEW: Override tracking for auto-sync
  openaiEndpointManualOverride?: boolean;
  anthropicEndpointManualOverride?: boolean;
}
```

## Implementation Details

### Account ID Generation Algorithm

```typescript
function generateAccountId(accounts: LocalAccount[], tier: AccountTier): string {
  const prefix = tier === 'premium' ? 'A' : 'B';

  // Find all accounts with the same tier
  const sameTierAccounts = accounts.filter(a => a.tier === tier);

  // Extract numeric parts from existing IDs
  const existingNumbers = sameTierAccounts
    .map(a => a.accountId)
    .filter(id => id && id.startsWith(prefix))
    .map(id => parseInt(id.slice(1), 10))
    .filter(n => !isNaN(n));

  // Find next available number (starting from 1)
  let nextNumber = 1;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  // Format with leading zeros (e.g., A001, A002)
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}
```

**Reuse Logic**: If A001 is deleted, the next premium account reuses A001 (lowest available number).

### Endpoint Resource Name Extraction

```typescript
function extractAzureResourceName(endpoint: string): string | null {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;

    // Pattern 1: xxx.openai.azure.com
    const openaiMatch = hostname.match(/^([^.]+)\.openai\.azure\.com$/);
    if (openaiMatch) return openaiMatch[1];

    // Pattern 2: xxx.services.ai.azure.com
    const anthropicMatch = hostname.match(/^([^.]+)\.services\.ai\.azure\.com$/);
    if (anthropicMatch) return anthropicMatch[1];

    return null;
  } catch {
    return null;
  }
}
```

### Endpoint Conversion Functions

```typescript
function convertOpenAIToAnthropicEndpoint(openaiEndpoint: string): string | null {
  const resourceName = extractAzureResourceName(openaiEndpoint);
  if (!resourceName) return null;

  return `https://${resourceName}.services.ai.azure.com/anthropic`;
}

function convertAnthropicToOpenAIEndpoint(anthropicEndpoint: string): string | null {
  const resourceName = extractAzureResourceName(anthropicEndpoint);
  if (!resourceName) return null;

  return `https://${resourceName}.openai.azure.com`;
}
```

### Manual Override Detection

**Strategy**: Track whether a field was auto-generated. If user modifies an auto-generated field, set override flag.

```typescript
// In RegionCard component
const handleOpenAIEndpointChange = (newValue: string) => {
  // Update OpenAI endpoint
  onUpdateOpenaiEndpoint(newValue);

  // Check if we should auto-generate Anthropic endpoint
  const shouldAutoGenerate =
    !region.anthropicEndpoint ||  // Empty
    !region.anthropicEndpointManualOverride;  // Not manually overridden

  if (shouldAutoGenerate) {
    const generated = convertOpenAIToAnthropicEndpoint(newValue);
    if (generated) {
      onUpdateAnthropicEndpoint(generated);
      // Don't set override flag - this is auto-generated
    }
  }
};

const handleAnthropicEndpointChange = (newValue: string) => {
  // Update Anthropic endpoint
  onUpdateAnthropicEndpoint(newValue);

  // If there's an auto-generated value and user is changing it, set override flag
  if (region.anthropicEndpoint && !region.anthropicEndpointManualOverride) {
    // Check if new value differs from what would be auto-generated
    const autoGenerated = convertOpenAIToAnthropicEndpoint(region.openaiEndpoint || '');
    if (newValue !== autoGenerated) {
      onUpdateAnthropicEndpointManualOverride(true);
    }
  }

  // Also try reverse conversion for OpenAI if not overridden
  if (!region.openaiEndpointManualOverride) {
    const generated = convertAnthropicToOpenAIEndpoint(newValue);
    if (generated) {
      onUpdateOpenaiEndpoint(generated);
    }
  }
};
```

## Security Considerations

### Server Credential Encryption

**Approach**: Extend existing encryption utilities to cover server credentials.

```typescript
// In useLocalAzureAccounts.ts
const encryptAccounts = useCallback((accounts: LocalAccount[]): LocalAccount[] => {
  return accounts.map((acct) => ({
    ...acct,
    regions: acct.regions.map((reg) => ({
      ...reg,
      apiKey: reg.apiKey ? encryptData(reg.apiKey) : reg.apiKey,
    })),
    // NEW: Encrypt server credentials
    windowsServer: acct.windowsServer ? {
      ...acct.windowsServer,
      password: acct.windowsServer.password
        ? encryptData(acct.windowsServer.password)
        : undefined,
    } : undefined,
    linuxServer: acct.linuxServer ? {
      ...acct.linuxServer,
      password: acct.linuxServer.password
        ? encryptData(acct.linuxServer.password)
        : undefined,
      sshKey: acct.linuxServer.sshKey
        ? encryptData(acct.linuxServer.sshKey)
        : undefined,
    } : undefined,
  }));
}, []);
```

**Limitations**:
- localStorage encryption provides obfuscation, not cryptographic security
- Keys are stored in client code, accessible via browser developer tools
- Suitable for preventing casual observation, not for secure storage
- Recommend documenting these limitations in UI with a warning icon

### Privacy Mode

All new sensitive fields must be hidden in privacy mode:
- Server passwords → Show as "***"
- SSH keys → Show as "***"
- Server hostnames → Show as "***" (or "Server 1", "Server 2")
- Server usernames → Show as "***"

## UI/UX Design

### Account ID Display

**Location**: Next to tier selector in AccountCard

**Appearance**: Read-only badge with tier-appropriate color
- Premium (A001): Gold/yellow badge
- Standard (B001): Silver/gray badge

**Example**:
```
[⭐ Premium] [A001] Account Name Input
```

### Server Login Information Section

**Location**: After quota/purchase information in AccountCard, before regions

**Layout**: Collapsible section titled "Server Login Information" (🖥️ icon)

**Structure**:
```
🖥️ Server Login Information  [▼ Collapse]

  Windows Server (Login)
  ├─ Host: [input] Port: [input:3389]
  ├─ Username: [input]
  └─ Password: [input:password] [👁️ Show/Hide] [📋 Copy]

  Linux Server (API)
  ├─ Host: [input] Port: [input:22]
  ├─ Username: [input]
  └─ Auth: [Password/SSH Key toggle]
      └─ [input:password/textarea] [👁️ Show/Hide] [📋 Copy]
```

### Endpoint Auto-Sync Indicators

**Visual Feedback**:
- 🔄 icon = Auto-synced from other endpoint
- ✏️ icon = Manually overridden by user
- Tooltip on hover explains behavior

**Example**:
```
OpenAI Endpoint: [https://test.openai.azure.com] [📋]
Anthropic Endpoint: [https://test.services.ai.azure.com/anthropic] [🔄] [📋]
                                                                    ↑ Shows this is auto-synced
```

## Testing Strategy

### Unit Tests

1. **Account ID Generation**:
   - Test sequential assignment (A001, A002, A003)
   - Test reusing deleted IDs (delete A001, next gets A001)
   - Test tier change reassignment (A002 → B003)
   - Test mixed creation order (B001, A001, B002, A002)

2. **Endpoint Conversion**:
   - Test valid OpenAI → Anthropic conversion
   - Test valid Anthropic → OpenAI conversion
   - Test malformed URLs (should return null)
   - Test non-Azure URLs (should return null)
   - Test edge cases (IP addresses, non-standard ports)

3. **Override Detection**:
   - Test auto-sync when target is empty
   - Test override flag set on manual edit
   - Test override prevents further auto-sync
   - Test clearing field resets override

### Integration Tests

1. **Account Lifecycle**:
   - Create account → Verify ID assigned
   - Change tier → Verify ID reassigned
   - Delete account → Verify ID becomes available
   - Import old config → Verify IDs auto-assigned

2. **Server Credentials**:
   - Add credentials → Verify encryption
   - Export config → Verify encrypted in JSON
   - Import config → Verify decryption
   - Privacy mode → Verify fields hidden

3. **Endpoint Sync**:
   - Enter OpenAI → Verify Anthropic generated
   - Edit Anthropic → Verify override flag
   - Change OpenAI again → Verify Anthropic unchanged
   - Clear Anthropic → Verify sync resumes

### Manual Testing Checklist

- [ ] Account ID displays correctly for all tiers
- [ ] Tier change reassigns ID as expected
- [ ] Server credential fields save and load correctly
- [ ] Privacy mode hides all server fields
- [ ] Endpoint auto-sync works in both directions
- [ ] Manual override prevents unwanted sync
- [ ] Visual indicators (🔄, ✏️) appear correctly
- [ ] Export/import preserves all new data
- [ ] No console errors or warnings
- [ ] Responsive layout works on mobile

## Migration Strategy

### Existing Data Compatibility

**Problem**: Existing accounts don't have `accountId`, server info, or override flags.

**Solution**: Graceful defaults
- `accountId`: Auto-assign on first load if missing
- `windowsServer`, `linuxServer`: Remain undefined (optional fields)
- `openaiEndpointManualOverride`, `anthropicEndpointManualOverride`: Default to false

**Migration Function** (in useLocalAzureAccounts.ts):
```typescript
function migrateAccountsToV2(accounts: LocalAccount[]): LocalAccount[] {
  return accounts.map((acct, index) => {
    // Assign account ID if missing
    if (!acct.accountId) {
      acct.accountId = generateAccountId(accounts, acct.tier || 'standard');
    }

    return acct;
  });
}
```

**Execution**: Run migration on localStorage load, before setting state.

## Performance Considerations

### ID Generation Performance

- O(n) where n = number of accounts
- Negligible for typical usage (< 100 accounts)
- No optimization needed at current scale

### Encryption Overhead

- Server credentials are small (<1KB per account)
- Encryption/decryption is synchronous but fast
- No noticeable impact on save/load times

### Endpoint Conversion

- Simple string operations and regex matching
- Executes on every keystroke in endpoint fields
- Consider debouncing if performance issues arise (unlikely)

## Future Enhancements

### Phase 2 Considerations (Not in Scope)

1. **Lock Account ID**: Allow users to prevent ID reassignment on tier change
2. **Region-Level Server Override**: Support different servers per region
3. **SSH Key File Upload**: Upload .pem/.key files instead of pasting
4. **Server Connection Test**: Button to test server connectivity
5. **Export Server List**: Generate separate CSV of all server credentials
6. **Batch Endpoint Update**: Update all regions' endpoints at once for an account

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Auto-assign IDs vs. manual entry | Ensures uniqueness, prevents conflicts | Manual entry would require validation UI |
| Account-level vs. region-level servers | Most users have one server per account | Region-level adds flexibility but complexity |
| Bidirectional auto-sync vs. one-way | Handles both entry patterns (OpenAI-first or Anthropic-first) | One-way would require users to remember which to enter first |
| Override flag vs. always auto-sync | Respects user intent for custom configurations | Always syncing would overwrite valid manual edits |
| Read-only ID badge vs. editable field | Simplifies UX and prevents validation needs | Editable field would need uniqueness checks |

## Conclusion

This design balances automation and user control across three independent features. Account IDs provide systematic organization, server credentials enable operational documentation, and endpoint auto-conversion reduces repetitive data entry. All features integrate seamlessly with the existing codebase while maintaining backwards compatibility.
