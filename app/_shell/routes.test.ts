import { describe, expect, it } from "vitest";
import { isRouteActive, shellRoutes } from "./routes";

describe("shell navigation", () => {
  it("uses the confirmed Mine destination and leaves the redirect source inactive", () => {
    expect(shellRoutes[0].href).toBe("/mine");
    expect(shellRoutes.some((route) => isRouteActive("/", route.href))).toBe(
      false,
    );
  });
  it("selects only one matching route", () => {
    for (const route of shellRoutes) {
      expect(
        shellRoutes.filter((candidate) =>
          isRouteActive(route.href, candidate.href),
        ),
      ).toEqual([route]);
    }
  });
  it("matches nested paths at segment boundaries and ignores trailing slashes", () => {
    expect(isRouteActive("/stake/", "/stake")).toBe(true);
    expect(isRouteActive("/stake/history", "/stake")).toBe(true);
    expect(isRouteActive("/stakeholder", "/stake")).toBe(false);
    expect(isRouteActive("/points", "/")).toBe(false);
    expect(isRouteActive(null, "/")).toBe(false);
  });
});
