import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import manifest from "./font-subsets.json";

const root = new URL("../../", import.meta.url);
const source = "fonts/harmonyos-sans/HarmonyOS_Sans_SC.woff2";
const css = readFileSync(new URL("./font-faces.css", import.meta.url), "utf8");

describe("font subset delivery", () => {
  it("retains the source and verifies every generated asset", () => {
    expect(
      createHash("sha256")
        .update(readFileSync(new URL(`public/${source}`, root)))
        .digest("hex"),
    ).toBe(manifest.sourceSha256);
    for (const chunk of manifest.chunks) {
      const bytes = readFileSync(
        new URL(`public/fonts/harmonyos-sans/subsets/${chunk.file}`, root),
      );
      expect(bytes.toString("ascii", 0, 4)).toBe("wOF2");
      expect(bytes.length).toBe(chunk.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        chunk.sha256,
      );
      expect(css).toContain(`/fonts/harmonyos-sans/subsets/${chunk.file}`);
    }
  });

  it("keeps all 29,508 original mappings in disjoint subsets", () => {
    const points = manifest.chunks.flatMap((chunk) => chunk.codepoints);
    const coverage = new Set(points);
    expect(coverage.size).toBe(29508);
    expect(points.length).toBe(29508);
    for (let cp = 0x4e00; cp <= 0x9fff; cp++) {
      expect(coverage.has(cp)).toBe(true);
    }
  });

  it("keeps all locale text in the small primary subsets", () => {
    const primary = new Set(
      manifest.chunks.slice(0, 2).flatMap((chunk) => chunk.codepoints),
    );
    function check(value: unknown): void {
      if (typeof value === "string") {
        for (const char of value)
          expect(primary.has(char.codePointAt(0)!)).toBe(true);
      } else if (value && typeof value === "object") {
        for (const item of Object.values(value)) check(item);
      }
    }
    for (const owner of ["app", "src"]) {
      const directory = new URL(`${owner}/`, root);
      for (const file of readdirSync(directory, { recursive: true })) {
        if (
          typeof file !== "string" ||
          !/(?:^|\/)_?locales\/[^/]+\.json$/.test(file)
        )
          continue;
        check(
          JSON.parse(
            readFileSync(`${fileURLToPath(directory)}${file}`, "utf8"),
          ),
        );
      }
    }
    // A regression budget, not a prediction of total page transfer size.
    expect(
      manifest.chunks.slice(0, 2).reduce((sum, c) => sum + c.bytes, 0),
    ).toBeLessThan(500_000);
  });

  it("does not force the full font or every subset into the initial load", () => {
    const layout = readFileSync(new URL("app/layout.tsx", root), "utf8");
    const entry = readFileSync(new URL("./fonts.css", import.meta.url), "utf8");
    expect(layout).not.toContain('as="font"');
    expect(entry).toContain('@import "./font-faces.css"');
    expect(css).not.toContain(source);
    expect(css.match(/unicode-range:/g)?.length).toBe(manifest.chunks.length);
    expect(css.match(/font-weight: 40 900/g)?.length).toBe(
      manifest.chunks.length,
    );
  });
});
