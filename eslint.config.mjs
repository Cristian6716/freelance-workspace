import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // TypeScript safety
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Don't allow console.log in committed code; warn allows console.warn/error.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Sicurezza: vietare eval, new Function, document.write
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      // React
      "react/jsx-key": "error",
      "react/no-danger": "error",
      "react/self-closing-comp": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/types/database.types.ts",
  ]),
]);

export default eslintConfig;
