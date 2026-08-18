import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "node_modules/**", "data/**", "next-env.d.ts"]),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      // Initial data loading and DOM subscriptions legitimately synchronize
      // client state in this application; the generic compiler rule flags them.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
