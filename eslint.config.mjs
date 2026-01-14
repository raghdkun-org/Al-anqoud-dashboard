import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18nIntelligencePlugin from "./lib/i18n-intelligence/eslint/plugin.ts";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // i18n Intelligence - Hardcoded String Detection
  {
    plugins: {
      "@b-dashboard/i18n-intelligence": i18nIntelligencePlugin,
    },
    rules: {
      // Warn on hardcoded strings in JSX (set to "error" for strict mode)
      "@b-dashboard/i18n-intelligence/no-hardcoded-strings": "warn",
    },
    files: ["**/*.tsx", "**/*.jsx"],
    ignores: [
      // Ignore test files and dev tools test page
      "**/test-detection/**",
      "**/test/**",
      "**/*.test.*",
      "**/*.spec.*",
      // Ignore UI components (shadcn)
      "components/ui/**",
    ],
  },
]);

export default eslintConfig;
