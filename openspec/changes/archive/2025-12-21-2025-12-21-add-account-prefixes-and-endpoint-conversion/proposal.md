# Add Account ID Prefixes, Server Login Info, and Endpoint Auto-Conversion

## Summary

This change enhances Azure account configuration with three new capabilities:

1. **Account ID Prefixes**: Automatically assign tier-based prefixes (A001, A002... for premium accounts; B001, B002... for standard accounts) to help users systematically identify and organize accounts.

2. **Server Login Information**: Add Windows login server and Linux API server credential fields at the account level, enabling users to track which servers are used for account operations.

3. **Endpoint Auto-Conversion**: Automatically generate the corresponding Anthropic Endpoint when users input an OpenAI Endpoint (and vice versa), based on the predictable Azure resource naming pattern.

## Motivation

### Current Pain Points

1. **Account Identification**: Users manage multiple Azure accounts but lack a systematic naming convention. They rely solely on custom account names, which can be inconsistent and hard to track.

2. **Server Management**: Users operate each account from different servers (Windows for login, Linux for API calls) but have no place to document which server corresponds to which account, leading to frequent lookups in external documentation.

3. **Endpoint Redundancy**: Azure OpenAI and Anthropic endpoints follow a predictable pattern:
   - OpenAI: `https://baha-3340-resource.openai.azure.com`
   - Anthropic: `https://baha-3340-resource.services.ai.azure.com/anthropic`

   Users must manually input both endpoints for each region, which is tedious and error-prone.

### Proposed Solution

1. **Automatic Prefix Assignment**: When creating or changing an account's tier, the system automatically assigns a unique ID with the appropriate prefix (A for premium, B for standard), ensuring consistent numbering.

2. **Account-Level Server Fields**: Add Windows server (IP/hostname, username, password) and Linux server (IP/hostname, username, password/SSH key) fields to each account configuration, stored alongside quota and purchase information.

3. **Bidirectional Endpoint Sync**: When users input or modify one endpoint, automatically extract the resource name and generate the other endpoint. If users manually override the auto-generated value, stop syncing that specific field to respect user intent.

## Files Affected

### Data Model & Hooks

- `src/hooks/useLocalAzureAccounts.ts` - Add account ID prefix generation logic, server login fields to LocalAccount interface, and endpoint auto-conversion handlers
- `src/types/channel.ts` - Add server login types (ServerCredentials)

### Utilities

- `src/utils/common.ts` - Add endpoint conversion functions (`convertOpenAIToAnthropicEndpoint`, `convertAnthropicToOpenAIEndpoint`, `extractAzureResourceName`)
- `src/utils/accountIdGenerator.ts` - NEW: Account ID prefix generation logic

### UI Components

- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` - Display account ID prefix (read-only badge), add server login fields section
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` - Implement bidirectional endpoint auto-sync with manual override detection

### Internationalization

- `src/i18n/locales/zh.json` - Add Chinese translations for new fields
- `src/i18n/locales/en.json` - Add English translations for new fields

## Implementation Plan

### Phase 1: Account ID Prefix (Spec: account-id-prefix)

1. Create account ID generator utility:
   - Function to find next available number for a tier (A001, A002...)
   - Function to reassign all account IDs when tier changes
   - Ensure uniqueness across all accounts

2. Update LocalAccount interface:
   - Add `accountId?: string` field
   - Add migration logic for existing accounts

3. Update AccountCard UI:
   - Display account ID as read-only badge next to tier selector
   - Show ID in format "A001" or "B002" based on tier

4. Auto-assign IDs:
   - When adding new account, assign next available ID
   - When changing tier, reassign ID if needed
   - Preserve order within each tier

### Phase 2: Server Login Information (Spec: server-login-info)

1. Update LocalAccount interface:
   - Add `windowsServer?: ServerCredentials` field
   - Add `linuxServer?: ServerCredentials` field

2. Create ServerCredentials interface:
   ```typescript
   interface ServerCredentials {
     host: string;           // IP or hostname
     username: string;
     password?: string;      // Optional for Windows, may use SSH key for Linux
     sshKey?: string;        // Optional for Linux
     port?: number;          // Default 3389 for Windows, 22 for Linux
     note?: string;          // Optional notes
   }
   ```

3. Update AccountCard UI:
   - Add collapsible "Server Login Information" section
   - Windows server fields: Host, Username, Password, Port (default 3389)
   - Linux server fields: Host, Username, Password/SSH Key toggle, Port (default 22)
   - Hide sensitive fields in privacy mode
   - Apply encryption to password and SSH key fields

4. Update encryption:
   - Extend encryption to cover server credential fields
   - Use existing encryption utilities

### Phase 3: Endpoint Auto-Conversion (Spec: endpoint-auto-conversion)

1. Create endpoint conversion utilities:
   ```typescript
   // Extract resource name from either endpoint type
   extractAzureResourceName(endpoint: string): string | null

   // Convert OpenAI endpoint to Anthropic endpoint
   convertOpenAIToAnthropicEndpoint(openaiEndpoint: string): string | null

   // Convert Anthropic endpoint to OpenAI endpoint
   convertAnthropicToOpenAIEndpoint(anthropicEndpoint: string): string | null
   ```

2. Add override tracking to LocalRegion:
   - Add `openaiEndpointManualOverride?: boolean`
   - Add `anthropicEndpointManualOverride?: boolean`

3. Update RegionCard logic:
   - On OpenAI endpoint change:
     - If Anthropic endpoint is empty or not manually overridden, auto-generate it
     - If user manually edited Anthropic endpoint before, set override flag
   - On Anthropic endpoint change:
     - If OpenAI endpoint is empty or not manually overridden, auto-generate it
     - If user manually edited OpenAI endpoint before, set override flag
   - Detect manual override: User directly edits a field that contains an auto-generated value

4. Add visual indicators:
   - Show small "🔄" icon next to auto-synced fields
   - Show "✏️" icon when user has manually overridden
   - Add tooltip explaining the sync behavior

## Testing

### Account ID Prefix

1. Create new premium account → Should get A001
2. Create new standard account → Should get B001
3. Create second premium account → Should get A002
4. Change A002 to standard → Should become B002
5. Change B001 to premium → Should become A003
6. Delete A001 → Next premium account should reuse A001
7. Import existing config without IDs → Should auto-assign IDs

### Server Login Information

1. Add Windows server credentials → Should save and encrypt password
2. Add Linux server with SSH key → Should save and encrypt SSH key
3. Enable privacy mode → Should hide all server credentials
4. Export config → Should include encrypted server credentials
5. Import config → Should decrypt server credentials correctly

### Endpoint Auto-Conversion

1. Enter OpenAI endpoint `https://test-resource.openai.azure.com` → Should auto-generate Anthropic endpoint `https://test-resource.services.ai.azure.com/anthropic`
2. Enter Anthropic endpoint first → Should auto-generate OpenAI endpoint
3. Auto-generate endpoint, then manually edit it → Should set override flag and stop auto-sync
4. Clear manually overridden field → Should resume auto-sync
5. Enter malformed endpoint → Should not break, handle gracefully
6. Enter endpoint without resource name pattern → Should skip auto-conversion

## Risks/Considerations

### Account ID Reassignment

- **Risk**: Changing tier reassigns ID, which might confuse users if they reference IDs externally
- **Mitigation**: Show clear warning when tier change will reassign ID; consider adding "Lock ID" option in future if needed

### Server Credential Security

- **Risk**: Storing server passwords in localStorage, even encrypted, is not as secure as dedicated password managers
- **Mitigation**:
  - Document security limitations in UI
  - Recommend using SSH keys over passwords for Linux
  - Privacy mode hides credentials by default
  - Consider adding "copy to clipboard only, don't store" option in future

### Endpoint Auto-Sync Complexity

- **Risk**: Bidirectional auto-sync might confuse users if both endpoints are modified
- **Mitigation**:
  - Clear visual indicators (icons) show sync status
  - Only sync when target field is empty or not manually overridden
  - Add tooltip explaining behavior
  - Test edge cases thoroughly

### Data Migration

- **Risk**: Existing accounts don't have IDs, server info, or override flags
- **Mitigation**:
  - Provide sensible defaults (auto-assign IDs, server fields optional)
  - Use optional fields (`accountId?: string`) to handle migration gracefully
  - Don't break existing configurations

## Related Specs

- [endpoint-normalization](../../specs/endpoint-normalization/spec.md) - Endpoint trailing slash/path normalization (existing)
- [account-id-prefix](./specs/account-id-prefix/spec.md) - NEW: Automatic tier-based ID prefix assignment
- [server-login-info](./specs/server-login-info/spec.md) - NEW: Server credential management
- [endpoint-auto-conversion](./specs/endpoint-auto-conversion/spec.md) - NEW: Bidirectional endpoint auto-generation

## Success Criteria

1. Account IDs are automatically assigned and displayed consistently
2. Users can document Windows and Linux server credentials for each account
3. Entering one endpoint automatically generates the other in 95%+ of cases
4. All sensitive data (passwords, SSH keys) is properly encrypted
5. Privacy mode correctly hides all new sensitive fields
6. Existing configurations migrate seamlessly without data loss
7. UI changes are intuitive with minimal learning curve
