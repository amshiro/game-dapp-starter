import { configDefaults, defineConfig } from "vitest/config";

// Unit tests run in Node, independently of the production RSC/Workers plugins.
export default defineConfig({
  test: {
    environment: "node",
    // Resolve next-i18next's extensionless `next/*` imports through Vite, as the app build does.
    server: { deps: { inline: ["next-i18next"] } },
    exclude: [
      ...configDefaults.exclude,
      "**/dist/**",
      "**/.next/**",
      "**/.vinext/**",
      "**/.cloudflare/**",
      "**/.wrangler/**",
      "**/.vitest/**",
      "**/coverage/**",
    ],
  },
});
