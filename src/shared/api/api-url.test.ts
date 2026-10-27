import { describe, expect, test } from "vitest";
import { buildApiUrl } from "./api-url";

describe("buildApiUrl", () => {
  test.each([
    "https://api.example.test",
    "https://api.example.test/",
    "https://api.example.test//",
  ])("joins %s without a double slash", (base) => {
    expect(buildApiUrl(base, "/v1/ori/summary").href).toBe(
      "https://api.example.test/v1/ori/summary",
    );
  });

  test("keeps a base path prefix instead of replacing it", () => {
    expect(
      buildApiUrl("https://api.example.test/gateway/", "/v1/ori/summary").href,
    ).toBe("https://api.example.test/gateway/v1/ori/summary");
  });

  test.each(["v1/ori/summary", "//evil.example/v1", "https://evil.example/v1"])(
    "rejects path %s that could change the target",
    (path) => {
      expect(() => buildApiUrl("https://api.example.test", path)).toThrow(
        "API path must be an absolute path",
      );
    },
  );

  test("rejects a base URL carrying a query or fragment", () => {
    expect(() =>
      buildApiUrl("https://api.example.test/?k=v", "/v1/ori/summary"),
    ).toThrow("must not contain a query or fragment");
  });

  test("encodes query values, including Unicode, and skips undefined", () => {
    const url = buildApiUrl("https://api.example.test", "/search", {
      q: "起源 & ORI",
      page: "1",
      skipped: undefined,
    });
    expect(url.search).toBe("?q=%E8%B5%B7%E6%BA%90+%26+ORI&page=1");
    expect(url.searchParams.get("q")).toBe("起源 & ORI");
  });
});
