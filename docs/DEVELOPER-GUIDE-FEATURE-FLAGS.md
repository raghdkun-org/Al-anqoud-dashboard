# Feature Flags Developer Guide

> **For Developers and AI Agents**: This document explains how to use and extend the feature flags system in B-Dashboard.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Using Feature Flags](#using-feature-flags)
- [Adding New Features](#adding-new-features)
- [Environment Variable Overrides](#environment-variable-overrides)
- [Runtime Toggles](#runtime-toggles)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The feature flags system allows developers to enable/disable features without code changes. It provides:

- **Static Configuration**: Default values in `features.config.ts`
- **Environment Overrides**: Override via `NEXT_PUBLIC_FEATURE_*` env vars
- **Runtime Toggles**: Some features can be toggled at runtime
- **Type Safety**: Full TypeScript support with autocomplete
- **Dependency Resolution**: Features can depend on other features

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              features.config.ts (Static Defaults)           │
├─────────────────────────────────────────────────────────────┤
│              Environment Variables (Build-time)             │
├─────────────────────────────────────────────────────────────┤
│              features.store.ts (Runtime State)              │
├─────────────────────────────────────────────────────────────┤
│              useFeature() / isFeatureEnabled()              │
├─────────────────────────────────────────────────────────────┤
│              <Feature> Component / withFeature()            │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Checking if a Feature is Enabled

**In React Components (Client):**
```tsx
import { useFeature, Feature } from '@/lib/config';

function MyComponent() {
  // Using hook
  const isDarkModeEnabled = useFeature('darkMode');
  
  // Using component
  return (
    <Feature name="darkMode">
      <ThemeToggle />
    </Feature>
  );
}
```

**In Non-React Code:**
```ts
import { isFeatureEnabled } from '@/lib/config';

if (isFeatureEnabled('localization')) {
  // Do something
}
```

### Disabling a Feature

Edit `lib/config/features.config.ts`:
```ts
darkMode: {
  id: "darkMode",
  name: "Dark Mode",
  // Change this to false to disable
  enabled: false,
  // ...
},
```

---

## Configuration

### Feature Configuration Options

Each feature has these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `FeatureId` | ✅ | Unique identifier |
| `name` | `string` | ✅ | Human-readable name |
| `description` | `string` | ✅ | What the feature does |
| `category` | `'core' \| 'ui' \| 'dev' \| 'experimental'` | ✅ | For organization |
| `enabled` | `boolean` | ✅ | Default enabled state |
| `dependencies` | `FeatureId[]` | ❌ | Features this depends on |
| `envOverride` | `string` | ❌ | Env var name for override |
| `runtimeToggle` | `boolean` | ❌ | Can toggle at runtime? |
| `devOnly` | `boolean` | ❌ | Only in development? |

### Current Features

| Feature ID | Category | Description |
|------------|----------|-------------|
| `localization` | core | Multi-language support (i18n) |
| `darkMode` | ui | Light/dark theme toggle |
| `themeSystem` | ui | Custom theme system v2 |
| `dashboardPersonalization` | ui | Drag-drop widgets |
| `i18nIntelligence` | dev | Translation issue detection |
| `securityMonitor` | dev | Security audit tool |
| `rtlSupport` | core | Right-to-left layouts |
| `devTools` | dev | Dev tools section |
| `userMenu` | ui | User profile dropdown |
| `sidebar` | ui | Collapsible sidebar |
| `breadcrumbs` | ui | Navigation breadcrumbs |
| `search` | ui | Global search (stub) |

---

## Using Feature Flags

### 1. `useFeature()` Hook

Check single feature in components:

```tsx
import { useFeature } from '@/lib/config';

function SidebarContent() {
  const showDevTools = useFeature('devTools');
  
  return (
    <nav>
      <MainNavItems />
      {showDevTools && <DevToolsSection />}
    </nav>
  );
}
```

### 2. `useFeatures()` Hook

Check multiple features (AND logic):

```tsx
import { useFeatures } from '@/lib/config';

function AdvancedThemeSettings() {
  // Both must be enabled
  const enabled = useFeatures(['darkMode', 'themeSystem']);
  
  if (!enabled) return null;
  
  return <ThemeCustomizer />;
}
```

### 3. `<Feature>` Component

Declarative conditional rendering:

```tsx
import { Feature } from '@/lib/config';

function Topbar() {
  return (
    <header>
      {/* Simple check */}
      <Feature name="breadcrumbs">
        <Breadcrumbs />
      </Feature>
      
      {/* With fallback */}
      <Feature name="search" fallback={<div />}>
        <SearchInput />
      </Feature>
      
      {/* Multiple features required */}
      <Feature require={['darkMode', 'themeSystem']}>
        <ThemeToggle />
      </Feature>
    </header>
  );
}
```

### 4. `withFeature()` HOC

Wrap components with feature gates:

```tsx
import { withFeature } from '@/lib/config';

const ThemeToggle = () => <button>Toggle</button>;

// Export wrapped component
export default withFeature('darkMode')(ThemeToggle);
```

### 5. `isFeatureEnabled()` Function

For non-React contexts:

```ts
import { isFeatureEnabled } from '@/lib/config';

// In a utility function
export function getLocalePrefix() {
  if (!isFeatureEnabled('localization')) {
    return 'en'; // Default locale only
  }
  return getCurrentLocale();
}
```

### 6. `getFeatureDetails()` Function

Get detailed information:

```ts
import { getFeatureDetails } from '@/lib/config';

const details = getFeatureDetails('darkMode');
console.log(details);
// {
//   enabled: true,
//   source: 'config', // or 'env', 'runtime', 'dependency', 'devOnly'
//   config: { id: 'darkMode', name: '...', ... },
//   disabledBy: undefined // or the dependency that disabled it
// }
```

---

## Adding New Features

### Step 1: Add the Feature ID

Edit `lib/config/features.types.ts`:

```ts
export const FEATURE_IDS = [
  "localization",
  "darkMode",
  // ... existing features
  "myNewFeature", // Add your new feature ID here
] as const;
```

### Step 2: Add the Configuration

Edit `lib/config/features.config.ts`:

```ts
export const featuresConfig: FeaturesConfig = {
  // ... existing features
  
  /**
   * My New Feature
   *
   * Description of what this feature does.
   *
   * Affects:
   * - Component X
   * - Component Y
   */
  myNewFeature: {
    id: "myNewFeature",
    name: "My New Feature",
    description: "Detailed description of the feature",
    category: "ui", // or 'core', 'dev', 'experimental'
    enabled: true, // default state
    envOverride: "NEXT_PUBLIC_FEATURE_MY_NEW_FEATURE",
    runtimeToggle: false, // true if can toggle at runtime
    dependencies: [], // other feature IDs this depends on
    devOnly: false, // true if only in development
  },
};
```

### Step 3: Use in Components

```tsx
import { Feature, useFeature } from '@/lib/config';

// Option 1: Feature component
<Feature name="myNewFeature">
  <MyNewComponent />
</Feature>

// Option 2: Hook
const isEnabled = useFeature('myNewFeature');
if (isEnabled) {
  // ...
}
```

### Step 4: Document the Feature

Update the features table in this document and in `TASKS-FEATURE-FLAGS.md`.

---

## Environment Variable Overrides

Override features at build/deploy time without changing code. All feature flags are pre-configured in `.env.example` and `.env.local`.

### Available Environment Variables

| Variable | Feature | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_FEATURE_LOCALIZATION` | Multi-language support | `true` |
| `NEXT_PUBLIC_FEATURE_DARK_MODE` | Dark/light mode toggle | `true` |
| `NEXT_PUBLIC_FEATURE_THEME_SYSTEM` | Custom theme system | `true` |
| `NEXT_PUBLIC_FEATURE_DASHBOARD_PERSONALIZATION` | Widget dashboard | `true` |
| `NEXT_PUBLIC_FEATURE_RTL_SUPPORT` | Right-to-left support | `true` |
| `NEXT_PUBLIC_FEATURE_I18N_INTELLIGENCE` | i18n dev tools | `true` |
| `NEXT_PUBLIC_FEATURE_SECURITY_MONITOR` | Security dev tools | `true` |
| `NEXT_PUBLIC_FEATURE_DEV_TOOLS` | Dev tools section | `true` |
| `NEXT_PUBLIC_FEATURE_USER_MENU` | User dropdown menu | `true` |
| `NEXT_PUBLIC_FEATURE_SIDEBAR` | Collapsible sidebar | `true` |
| `NEXT_PUBLIC_FEATURE_BREADCRUMBS` | Breadcrumb navigation | `true` |
| `NEXT_PUBLIC_FEATURE_SEARCH` | Global search | `true` |

### Usage Examples

```bash
# .env.local or .env.production
NEXT_PUBLIC_FEATURE_DARK_MODE=false
NEXT_PUBLIC_FEATURE_LOCALIZATION=true
NEXT_PUBLIC_FEATURE_DEV_TOOLS=false
```

### Override Priority

1. **devOnly check** - If `devOnly: true` and not in development, disabled
2. **Dependencies** - If any dependency is disabled, feature is disabled
3. **Runtime override** - If `runtimeToggle: true` and user toggled
4. **Environment variable** - If env var is set
5. **Config default** - The `enabled` value in config

---

## Runtime Toggles

Some features can be toggled by users at runtime:

```tsx
import { useFeatureToggle } from '@/lib/config';

function DevToolsSwitch() {
  const { enabled, toggle, canToggle, reset } = useFeatureToggle('devTools');
  
  if (!canToggle) return null;
  
  return (
    <div>
      <Switch checked={enabled} onCheckedChange={toggle} />
      <button onClick={reset}>Reset to default</button>
    </div>
  );
}
```

### Features with Runtime Toggle

| Feature | Runtime Toggle |
|---------|---------------|
| `darkMode` | ✅ |
| `devTools` | ✅ |
| `i18nIntelligence` | ✅ |
| `securityMonitor` | ✅ |
| `userMenu` | ✅ |
| `breadcrumbs` | ✅ |
| `search` | ✅ |

---

## Best Practices

### 1. Use Consistent Patterns

```tsx
// ✅ Good - Use Feature component for visibility
<Feature name="darkMode">
  <ThemeToggle />
</Feature>

// ❌ Avoid - Inconsistent inline checks
{someCondition && isDarkModeEnabled && <ThemeToggle />}
```

### 2. Handle Dependencies Correctly

```ts
// ✅ Good - Declare dependency in config
myFeature: {
  dependencies: ['themeSystem'],
  // ...
}

// ❌ Avoid - Manual dependency checks in code
if (useFeature('themeSystem') && useFeature('myFeature')) {
  // ...
}
```

### 3. Use devOnly for Development Features

```ts
// ✅ Good - Auto-disabled in production
devTools: {
  devOnly: true,
  // ...
}

// ❌ Avoid - Manual NODE_ENV checks
if (process.env.NODE_ENV === 'development' && useFeature('devTools')) {
  // ...
}
```

### 4. Provide Fallbacks

```tsx
// ✅ Good - Graceful degradation
<Feature name="sidebar" fallback={<MinimalNav />}>
  <Sidebar />
</Feature>

// ❌ Avoid - Broken UI when feature disabled
<Feature name="sidebar">
  <Sidebar /> {/* No nav if sidebar disabled! */}
</Feature>
```

### 5. Keep Features Granular

```ts
// ✅ Good - Specific features
'darkMode'     // Just dark mode
'themeSystem'  // Just custom themes

// ❌ Avoid - Catch-all features
'allThemeStuff'  // Too broad
```

---

## Troubleshooting

### Feature is disabled but should be enabled

1. Check if it has `devOnly: true` and you're in production
2. Check if any dependency is disabled
3. Check environment variables
4. Check runtime overrides in localStorage (`feature-flags-storage`)

### Feature changes don't take effect

1. For static config changes, restart the dev server
2. For runtime toggles, check if `runtimeToggle: true`
3. Clear localStorage: `localStorage.removeItem('feature-flags-storage')`

### TypeScript errors for new feature

Ensure you added the feature ID to `FEATURE_IDS` in `features.types.ts` first.

### Hydration mismatch

Use `useFeature()` hook in client components, not `isFeatureEnabled()` during render.

---

## API Reference

### Types

```ts
import type {
  FeatureId,         // Union of all feature IDs
  FeatureConfig,     // Configuration object
  FeaturesConfig,    // All configs
  FeatureDetails,    // Resolution result
} from '@/lib/config';
```

### Hooks

```ts
import {
  useFeature,        // (id) => boolean
  useFeatures,       // (ids[]) => boolean (AND)
  useFeatureDetails, // (id) => FeatureDetails
  useFeatureToggle,  // (id) => { enabled, toggle, reset, canToggle }
  useAllFeatures,    // () => FeatureDetails[]
} from '@/lib/config';
```

### Functions

```ts
import {
  isFeatureEnabled,    // (id) => boolean
  getFeatureDetails,   // (id) => FeatureDetails
  areFeaturesEnabled,  // (ids[]) => boolean (AND)
  isAnyFeatureEnabled, // (ids[]) => boolean (OR)
} from '@/lib/config';
```

### Components

```tsx
import { Feature, withFeature, withFeatures } from '@/lib/config';

<Feature name="featureId" fallback={<Fallback />}>
  {children}
</Feature>

<Feature require={['feature1', 'feature2']}>
  {children}
</Feature>
```

---

## File Structure

```
lib/config/
├── index.ts              # Main exports
├── features.types.ts     # TypeScript types
├── features.config.ts    # Configuration (edit this!)
├── features.store.ts     # Zustand store
├── features.hooks.ts     # React hooks
├── features.schema.ts    # Zod validation
└── Feature.tsx           # React components
```

---

## Related Documentation

- [PLAN-FEATURE-FLAGS.md](./PLAN-FEATURE-FLAGS.md) - Implementation plan
- [TASKS-FEATURE-FLAGS.md](./TASKS-FEATURE-FLAGS.md) - Task checklist
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - General developer guide
