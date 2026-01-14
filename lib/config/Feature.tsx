/**
 * Feature Gate Component
 *
 * A component for conditionally rendering content based on feature flags.
 *
 * @module lib/config/Feature
 */

"use client";

import type { ReactNode } from "react";
import { useFeature, useFeatures } from "./features.hooks";
import type { FeatureId } from "./features.types";

interface FeatureProps {
  /**
   * Single feature to check.
   * Use this for simple single-feature gates.
   */
  name?: FeatureId;

  /**
   * Multiple features required (AND logic).
   * All features must be enabled for children to render.
   */
  require?: FeatureId[];

  /**
   * Content to render when feature(s) are disabled.
   * If not provided, nothing is rendered when disabled.
   */
  fallback?: ReactNode;

  /**
   * Content to render when feature(s) are enabled.
   */
  children: ReactNode;
}

/**
 * Feature Gate Component
 *
 * Conditionally renders children based on feature flag state.
 *
 * @example
 * ```tsx
 * // Single feature check
 * <Feature name="darkMode">
 *   <ThemeToggle />
 * </Feature>
 *
 * // With fallback content
 * <Feature name="sidebar" fallback={<MinimalNav />}>
 *   <Sidebar />
 * </Feature>
 *
 * // Multiple features required (AND)
 * <Feature require={['darkMode', 'themeSystem']}>
 *   <AdvancedThemeSettings />
 * </Feature>
 * ```
 */
export function Feature({
  name,
  require,
  fallback = null,
  children,
}: FeatureProps) {
  // Handle single feature check
  const singleEnabled = name ? useFeature(name) : true;

  // Handle multiple features check (AND logic)
  const multipleEnabled = require ? useFeatures(require) : true;

  // Both conditions must be true (if both are specified)
  const isEnabled = singleEnabled && multipleEnabled;

  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Higher-order component for feature gating
 *
 * @example
 * ```tsx
 * const ProtectedComponent = withFeature('darkMode')(ThemeToggle);
 * const WithFallback = withFeature('sidebar', <MinimalNav />)(Sidebar);
 * ```
 */
export function withFeature<P extends object>(
  featureId: FeatureId,
  Fallback?: React.ComponentType<P>
) {
  return function WithFeatureHOC(WrappedComponent: React.ComponentType<P>) {
    function FeatureGatedComponent(props: P) {
      return (
        <Feature
          name={featureId}
          fallback={Fallback ? <Fallback {...props} /> : null}
        >
          <WrappedComponent {...props} />
        </Feature>
      );
    }

    FeatureGatedComponent.displayName = `withFeature(${featureId})(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return FeatureGatedComponent;
  };
}

/**
 * Higher-order component for multiple feature gating (AND logic)
 *
 * @example
 * ```tsx
 * const Protected = withFeatures(['darkMode', 'themeSystem'])(AdvancedSettings);
 * ```
 */
export function withFeatures<P extends object>(
  featureIds: FeatureId[],
  Fallback?: React.ComponentType<P>
) {
  return function WithFeaturesHOC(WrappedComponent: React.ComponentType<P>) {
    function FeaturesGatedComponent(props: P) {
      return (
        <Feature
          require={featureIds}
          fallback={Fallback ? <Fallback {...props} /> : null}
        >
          <WrappedComponent {...props} />
        </Feature>
      );
    }

    FeaturesGatedComponent.displayName = `withFeatures([${featureIds.join(", ")}])(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return FeaturesGatedComponent;
  };
}
