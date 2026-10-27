import { beforeEach, expect, it, vi } from "vitest";
const { readCookies } = vi.hoisted(() => ({ readCookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: readCookies }));
import { getRequestLocale } from "./request-locale";
beforeEach(() => readCookies.mockReset());
it("resolves each request separately without retaining the previous cookie", async () => {
  readCookies
    .mockResolvedValueOnce({ get: () => ({ value: "zh-CN" }) })
    .mockResolvedValueOnce({ get: () => ({ value: "en" }) })
    .mockResolvedValueOnce({ get: () => undefined });
  expect(
    await Promise.all([
      getRequestLocale(),
      getRequestLocale(),
      getRequestLocale(),
    ]),
  ).toEqual(["zh-CN", "en", "en"]);
});
