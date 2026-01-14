/**
 * Feature Flags Schema Validation
 *
 * Zod schemas for validating feature configurations.
 *
 * @module lib/config/features.schema
 */

import { z } from "zod";
import { FEATURE_IDS } from "./features.types";

/**
 * Schema for feature category
 */
export const featureCategorySchema = z.enum([
  "core",
  "ui",
  "dev",
  "experimental",
]);

/**
 * Schema for feature ID
 */
export const featureIdSchema = z.enum(FEATURE_IDS as unknown as [string, ...string[]]);

/**
 * Schema for a single feature configuration
 */
export const featureConfigSchema = z.object({
  id: featureIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: featureCategorySchema,
  enabled: z.boolean(),
  dependencies: z.array(featureIdSchema).optional(),
  envOverride: z
    .string()
    .regex(/^NEXT_PUBLIC_FEATURE_[A-Z_]+$/, "Must be NEXT_PUBLIC_FEATURE_* format")
    .optional(),
  runtimeToggle: z.boolean().optional(),
  devOnly: z.boolean().optional(),
});

/**
 * Schema for the complete features configuration
 */
export const featuresConfigSchema = z.record(featureIdSchema, featureConfigSchema);

/**
 * Schema for runtime overrides
 */
export const runtimeOverridesSchema = z.record(featureIdSchema, z.boolean());

/**
 * Validate a feature configuration
 */
export function validateFeatureConfig(config: unknown) {
  return featureConfigSchema.safeParse(config);
}

/**
 * Validate the complete features configuration
 */
export function validateFeaturesConfig(config: unknown) {
  return featuresConfigSchema.safeParse(config);
}
