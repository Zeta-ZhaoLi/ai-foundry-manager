# Design Document: UI & Feature Enhancements

## Overview

This document captures architectural decisions and design patterns for the comprehensive improvement plan.

---

## Phase 1: UI/UX Quick Wins

### Q1: Empty State Component

**Design Decision**: Create a reusable `EmptyState` component.

```
EmptyState
├── illustration (optional SVG)
├── title
├── description
├── action button (optional)
└── secondary action (optional)
```

**Pattern**: Composition over configuration
```tsx
<EmptyState
  icon={<FolderIcon />}
  title={t('noAccounts')}
  description={t('noAccountsDesc')}
  action={<Button onClick={addAccount}>{t('addAccount')}</Button>}
/>
```

**File**: `src/components/ui/EmptyState.tsx`

---

### Q2: Skeleton Loading States

**Design Decision**: Use existing `Skeleton` component with composition patterns.

**Approach**:
1. Create skeleton variants for common patterns (card, table row, chart)
2. Use conditional rendering based on loading state
3. Match dimensions to actual content

**Files Modified**:
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`
- `src/components/Dashboard/ModelOverviewTable.tsx`
- `src/components/Dashboard/ModelStatisticsTable.tsx`

---

### Q3: Keyboard Shortcuts

**Design Decision**: Extend existing `useKeyboardShortcuts` hook.

**Shortcut Map**:
| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Export configuration |
| `Ctrl+I` / `Cmd+I` | Import configuration |
| `Escape` | Close active modal |
| `Ctrl+K` / `Cmd+K` | Open command palette (Phase 2) |
| `?` | Show shortcuts help |

**Implementation**:
```tsx
useKeyboardShortcuts({
  'ctrl+s': handleExport,
  'ctrl+i': handleImport,
  'escape': closeModal,
});
```

---

### Q7: Tooltip Component

**Design Decision**: Lightweight tooltip using CSS positioning.

**Options Considered**:
1. ~~Radix UI Tooltip~~ - Too heavy for simple tooltips
2. ~~Floating UI~~ - Good but adds dependency
3. **CSS-only with portal** - Minimal, performant ✓

**API Design**:
```tsx
<Tooltip content="Export configuration">
  <Button icon={<DownloadIcon />} />
</Tooltip>
```

**Features**:
- Positioning: top, bottom, left, right
- Delay on show (300ms default)
- Portal rendering to avoid overflow issues
- Dark/light theme aware

---

### Q8: Accessibility Enhancements

**Checklist**:
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Add `aria-live="polite"` for filter results count
- [ ] Add `role="status"` for loading states
- [ ] Add skip-to-content link
- [ ] Ensure focus visible styles
- [ ] Add keyboard navigation for tabs
- [ ] Test with screen reader

---

## Phase 2: Medium Features

### M1: Advanced Filtering System

**Architecture**:
```
FilterSystem
├── FilterBuilder (UI for creating filters)
├── FilterPresets (saved filter configurations)
├── useFilters hook (filter state management)
└── filterUtils (filter logic)
```

**State Shape**:
```typescript
interface FilterState {
  conditions: FilterCondition[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
  value: string | number | [number, number];
}
```

**Storage**: localStorage with key `'azure-openai-manager:filter-presets'`

---

### M3: Configuration Versioning

**Design Decision**: Store version history in localStorage with limits.

**Data Structure**:
```typescript
interface ConfigVersion {
  id: string;
  timestamp: number;
  description: string;
  data: LocalAccount[];
  hash: string; // For change detection
}

interface ConfigHistory {
  versions: ConfigVersion[];
  maxVersions: 20; // Limit storage
  currentVersion: string;
}
```

**Features**:
- Auto-save on significant changes (debounced)
- Manual snapshot creation
- Side-by-side diff view
- Rollback to any version
- Export specific version

**Storage Key**: `'azure-openai-manager:config-history'`

---

### M4: Notification System

**Architecture**:
```
NotificationSystem
├── NotificationProvider (context)
├── NotificationCenter (UI panel)
├── NotificationBadge (unread count)
├── useNotifications hook
└── notificationRules (trigger conditions)
```

**Notification Types**:
```typescript
type NotificationType =
  | 'quota_warning'    // 80% quota used
  | 'low_balance'      // Balance below threshold
  | 'key_expiring'     // API key expiration (if tracked)
  | 'sync_conflict'    // Import conflict
  | 'model_deprecated' // Model EOL notice
  | 'success'          // Operation success
  | 'error';           // Operation failure
```

**Storage**: localStorage for persistence, context for runtime

---

### M5: Command Palette

**Design Decision**: Custom implementation inspired by VS Code/Linear.

**Architecture**:
```
CommandPalette
├── CommandPaletteProvider (context)
├── CommandPaletteModal (UI)
├── useCommands hook (register commands)
└── commandRegistry (available commands)
```

**Command Structure**:
```typescript
interface Command {
  id: string;
  label: string;
  keywords: string[]; // For fuzzy search
  icon?: ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'action' | 'settings';
}
```

**Default Commands**:
- Go to Overview / Accounts / Models / Analysis
- Add Account / Add Region
- Import / Export Configuration
- Toggle Privacy Mode
- Toggle Theme
- Toggle Language

---

### M10: Audit Log & Undo/Redo

**Design Decision**: Command pattern for reversible operations.

**Architecture**:
```typescript
interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  target: string; // e.g., "account:abc123"
  before: unknown;
  after: unknown;
  reversible: boolean;
}

interface UndoStack {
  past: AuditEntry[];
  future: AuditEntry[]; // For redo
  maxSize: 50;
}
```

**Supported Operations**:
- Account CRUD
- Region CRUD
- Model changes
- Configuration import
- Bulk operations

---

## Phase 3: Major Features

### L1: Multi-User Collaboration

**Architectural Options**:

| Option | Pros | Cons |
|--------|------|------|
| A. Backend Service | Full control, real-time sync | Requires server deployment |
| B. Firebase/Supabase | Quick setup, real-time built-in | Vendor lock-in, cost |
| C. Git-based (GitOps) | Version control built-in | Complex for non-technical users |

**Recommended**: Option B (Firebase/Supabase) for MVP, migrate to A for enterprise.

**Required Components**:
- Authentication (email, OAuth)
- User management
- Team/workspace management
- Real-time sync
- Permission system (owner, editor, viewer)
- Change approval workflow

---

### L2: Endpoint Health Monitoring

**Design Decision**: Client-side polling with optional backend aggregation.

**Client-Side Approach**:
```typescript
interface HealthCheck {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastChecked: number;
  errorMessage?: string;
}
```

**Polling Strategy**:
- Check every 5 minutes when tab is active
- Use `navigator.onLine` for offline detection
- Aggregate results for dashboard display

**Backend Extension** (optional):
- Centralized monitoring service
- Historical data storage
- Alert webhooks
- Status page integration

---

### L6: Mobile Application

**Options**:

| Option | Pros | Cons |
|--------|------|------|
| PWA | Single codebase, easy deployment | Limited native features |
| React Native | Native performance, shared logic | Two build targets |
| Capacitor | Web code + native wrapper | Compromise solution |

**Recommended**: Start with PWA, evaluate React Native based on user feedback.

**PWA Requirements**:
- Service worker for offline support
- App manifest for installability
- Responsive design (already good)
- Push notifications (via backend)

---

## Cross-Cutting Concerns

### State Management

**Current**: React hooks + localStorage
**Phase 2+**: Consider Zustand for complex features

```typescript
// If needed, Zustand store structure
interface AppStore {
  // UI State
  theme: Theme;
  privacyMode: boolean;

  // Data State
  accounts: LocalAccount[];
  notifications: Notification[];
  configHistory: ConfigVersion[];

  // Actions
  addAccount: (account: LocalAccount) => void;
  // ...
}
```

### Performance Budget

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size increase per phase: < 50KB gzipped

### Testing Strategy

- Phase 1: Manual testing sufficient
- Phase 2: Add unit tests for new hooks, integration tests for features
- Phase 3: Full E2E test suite required

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| TBD | CSS-only tooltips | Minimize bundle size |
| TBD | localStorage for versioning | No backend required |
| TBD | Custom command palette | Full control over UX |
| TBD | PWA over native mobile | Lower initial investment |
