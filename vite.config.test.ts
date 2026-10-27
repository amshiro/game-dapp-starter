import { resolveConfig } from "vite";
import { expect, test } from "vitest";

// Resolves the real dev config, including vinext's injected optimizer excludes.
test("client pre-bundles pino instead of leaving a bare browser import", async () => {
  const config = await resolveConfig({}, "serve", "development");
  const clientExclude = config.environments.client.optimizeDeps.exclude ?? [];

  expect(clientExclude).not.toContain("pino");
  // The rest of vinext's server-external defaults are left untouched.
  expect(clientExclude).toContain("pino-pretty");
}, 60_000);
