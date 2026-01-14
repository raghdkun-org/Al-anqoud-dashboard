/**
 * Feature Flags Hooks
 *
 * React hooks for checking feature flags in components.
 *
 * @module lib/config/features.hooks
 */

"use client";

import { useSyncExternalStore, useCallback } from "react";
import {
  useFeaturesStore,
  isFeatureEnabled,
  getFeatureDetails,
  areFeaturesEnabled,
} from "./features.store";
import { featuresConfig } from "./features.config";
import type { FeatureId, FeatureDetails, FeaturesConfig } from "./features.types";

/**
 * Hook to check if a single feature is enabled
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const isDarkModeEnabled = useFeature('darkMode');
 *
 *   if (!isDarkModeEnabled) return null;
 *
 *   return <Button>Toggle Theme</Button>;
 * }
 * ```
 */
export function useFeature(featureId: FeatureId): boolean {
  const overrides = useFeaturesStore((state) => state.overrides);

  // Re-compute when overrides change
  return useSyncExternalStore(
    useFeaturesStore.subscribe,
    () => isFeatureEnabled(featureId),
    () => isFeatureEnabled(featureId)
  );
}

/**
 * Hook to check multiple features (AND logic)
 *
 * @example
 * ```tsx
 * function AdvancedSettings() {
 *   const enabled = useFeatures(['darkMode', 'themeSystem']);
 *
 *   if (!enabled) return <SimpleSettings />;
 *
 *   return <AdvancedSettingsPanel />;
 * }
 * ```
 */
export function useFeatures(featureIds: FeatureId[]): boolean {
  return useSyncExternalStore(
    useFeaturesStore.subscribe,
    () => areFeaturesEnabled(featureIds),
    () => areFeaturesEnabled(featureIds)
  );
}

/**
 * Hook to get detailed feature information
 *
 * @example
 * ```tsx
 * function FeatureDebugInfo({ featureId }: { featureId: FeatureId }) {
 *   const { enabled, source, config, disabledBy } = useFeatureDetails(featureId);
 *
 *   return (
 *     <div>
 *       <p>{config.name}: {enabled ? 'On' : 'Off'}</p>
 *       <p>Source: {source}</p>
 *       {disabledBy && <p>Disabled by: {disabledBy}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureDetails(featureId: FeatureId): FeatureDetails {
  return useSyncExternalStore(
    useFeaturesStore.subscribe,
    () => getFeatureDetails(featureId),
    () => getFeatureDetails(featureId)
  );
}

/**
 * Hook to get feature configuration (static, doesn't change)
 *
 * @example
 * ```tsx
 * function FeatureInfo({ featureId }: { featureId: FeatureId }) {
 *   const config = useFeatureConfig(featureId);
 *
 *   return (
 *     <div>
 *       <h3>{config.name}</h3>
 *       <p>{config.description}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureConfig(featureId: FeatureId) {
  return featuresConfig[featureId];
}

/**
 * Hook to get all feature configurations
 *
 * @example
 * ```tsx
 * function FeaturesList() {
 *   const configs = useAllFeatureConfigs();
 *
 *   return (
 *     <ul>
 *       {Object.values(configs).map(config => (
 *         <li key={config.id}>{config.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAllFeatureConfigs(): FeaturesConfig {
  return featuresConfig;
}

/**
 * Hook to toggle a runtime-toggleable feature
 *
 * @example
 * ```tsx
 * function DevToolsToggle() {
 *   const { enabled, toggle, canToggle } = useFeatureToggle('devTools');
 *
 *   if (!canToggle) return null;
 *
 *   return (
 *     <Switch checked={enabled} onCheckedChange={toggle} />
 *   );
 * }
 * ```
 */
export function useFeatureToggle(featureId: FeatureId) {
  const enabled = useFeature(featureId);
  const config = useFeatureConfig(featureId);
  const setOverride = useFeaturesStore((state) => state.setOverride);
  const clearOverride = useFeaturesStore((state) => state.clearOverride);

  const toggle = useCallback(() => {
    setOverride(featureId, !enabled);
  }, [featureId, enabled, setOverride]);

  const reset = useCallback(() => {
    clearOverride(featureId);
  }, [featureId, clearOverride]);

  return {
    enabled,
    toggle,
    reset,
    canToggle: config.runtimeToggle ?? false,
  };
}

/**
 * Hook to get all features with their current state
 *
 * @example
 * ```tsx
 * function FeaturesPanel() {
 *   const features = useAllFeatures();
 *
 *   return (
 *     <table>
 *       {features.map(f => (
 *         <tr key={f.id}>
 *           <td>{f.config.name}</td>
 *           <td>{f.enabled ? '✓' : '✗'}</td>
 *         </tr>
 *       ))}
 *     </table>
 *   );
 * }
 * ```
 */
export function useAllFeatures(): Array<FeatureDetails & { id: FeatureId }> {
  return useSyncExternalStore(
    useFeaturesStore.subscribe,
    () =>
      Object.keys(featuresConfig).map((id) => ({
        id: id as FeatureId,
        ...getFeatureDetails(id as FeatureId),
      })),
    () =>
      Object.keys(featuresConfig).map((id) => ({
        id: id as FeatureId,
        ...getFeatureDetails(id as FeatureId),
      }))
  );
}
