/**
 * Feature Flags Configuration System
 *
 * Central export for the feature flags system.
 * Import from this file for all feature flag needs.
 *
 * @module lib/config
 *
 * @example
 * ```tsx
 * // In a component
 * import { useFeature, Feature } from '@/lib/config';
 *
 * function MyComponent() {
 *   const isDarkModeEnabled = useFeature('darkMode');
 *
 *   return (
 *     <Feature name="themeSystem">
 *       <ThemeSettings />
 *     </Feature>
 *   );
 * }
 * ```
 *
 * @example
 * ```ts
 * // In a utility file (non-React)
 * import { isFeatureEnabled, getFeatureDetails } from '@/lib/config';
 *
 * if (isFeatureEnabled('localization')) {
 *   // Do something
 * }
 * ```
 */

// Types
export type {
  FeatureId,
  FeatureConfig,
  FeaturesConfig,
  FeatureCategory,
  FeatureDetails,
  FeaturesRuntimeState,
  FeatureProps,
  FeatureContextValue,
} from "./features.types";

export { FEATURE_IDS } from "./features.types";

// Configuration
export {
  featuresConfig,
  getFeatureConfig,
  getAllFeatureConfigs,
  getFeaturesByCategory,
} from "./features.config";

// Store (for non-React usage)
export {
  useFeaturesStore,
  isFeatureEnabled,
  getFeatureDetails,
  areFeaturesEnabled,
  isAnyFeatureEnabled,
} from "./features.store";

// Hooks (for React components)
export {
  useFeature,
  useFeatures,
  useFeatureDetails,
  useFeatureConfig,
  useAllFeatureConfigs,
  useFeatureToggle,
  useAllFeatures,
} from "./features.hooks";

// Components
export { Feature, withFeature, withFeatures } from "./Feature";

// Schema (for validation)
export {
  featureConfigSchema,
  featuresConfigSchema,
  validateFeatureConfig,
  validateFeaturesConfig,
} from "./features.schema";
