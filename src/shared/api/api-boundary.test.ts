import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

// Browser-reachable API code must not read the environment or name secrets.
const ROOTS = ["src/shared/api", "src/domains"];
const FORBIDDEN = [
  "process.env",
  "BACKEND_APP_SECRET",
  "IPFS_JWT",
  "CLOUDFLARE_API_TOKEN",
  "NEXT_PUBLIC_APP_SECRET",
];

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")
      ? [path]
      : [];
  });
}

describe("browser API boundary", () => {
  const files = ROOTS.flatMap(sources);

  test("covers the API sources", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(FORBIDDEN)("no API source references %s", (name) => {
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toContain(name);
    }
  });
});
