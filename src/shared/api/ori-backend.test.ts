import { afterEach, describe, expect, test, vi } from "vitest";
import { parsePublicConfig } from "../config/parse-public-config";
import {
  BackendBusinessError,
  ConfigurationError,
  InvalidResponseError,
} from "./errors";
import { requestOriBackend, unwrapOriEnvelope } from "./ori-backend";

const configured = () =>
  parsePublicConfig({
    NEXT_PUBLIC_APP_ENV: "development",
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/",
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestOriBackend", () => {
  test("is an unsigned form POST under /v1/ori", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ error_code: 0, data: [] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      requestOriBackend({
        path: "/summary",
        form: { page: "1" },
        readConfig: configured,
      }),
    ).resolves.toEqual([]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://api.example.test/v1/ori/summary");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toBe("page=1");
    const headers = new Headers(init.headers);
    expect([...headers.keys()].sort()).toEqual(["accept"]);
  });

  test("missing API base URL → ConfigurationError before any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const error = await requestOriBackend({
      path: "/summary",
      readConfig: () =>
        parsePublicConfig({ NEXT_PUBLIC_APP_ENV: "development" }),
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error).toMatchObject({
      message: "NEXT_PUBLIC_API_BASE_URL is not configured",
      endpoint: "/v1/ori/summary",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("invalid public config → ConfigurationError naming only the variable", async () => {
    const error = await requestOriBackend({
      path: "/summary",
      readConfig: () =>
        parsePublicConfig({
          NEXT_PUBLIC_APP_ENV: "development",
          NEXT_PUBLIC_API_BASE_URL: "https://user:pw-value@api.example.test",
        }),
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConfigurationError);
    expect((error as Error).message).toContain("NEXT_PUBLIC_API_BASE_URL");
    expect((error as Error).message).not.toContain("pw-value");
  });
});

describe("unwrapOriEnvelope", () => {
  const endpoint = "/v1/ori/summary";

  const common = { timestamp: 1763721938, app_name: "hotfunv3" };

  test.each([
    // Documented success envelope: `data` plus `common`, no error_code.
    [
      { data: { staking_annual_yield: { value: 0 } }, common },
      { staking_annual_yield: { value: 0 } },
    ],
    [{ data: [], common: { ...common, chain_asset_config: [] } }, []],
    [
      { data: { list: [], total: 0 }, common },
      { list: [], total: 0 },
    ],
    [{ error_code: 0, data: null }, null],
  ])("success envelope %j → data", (body, data) => {
    expect(unwrapOriEnvelope(body, endpoint)).toEqual(data);
  });

  test("observed validation failure (HTTP 200, no data) → BackendBusinessError", () => {
    const error = (() => {
      try {
        unwrapOriEnvelope(
          {
            error_code: 10400,
            message: "The page size must be an integer.",
            errors: { page_size: ["The page size must be an integer."] },
          },
          endpoint,
        );
      } catch (e) {
        return e;
      }
    })();
    expect(error).toBeInstanceOf(BackendBusinessError);
    expect(error).toMatchObject({
      kind: "backend-business",
      backendCode: 10400,
      backendMessage: "The page size must be an integer.",
      endpoint,
    });
    expect((error as Error).message).toBe(
      `Backend error 10400 from ${endpoint}`,
    );
  });

  test("a non-string backend message is not carried", () => {
    expect(() =>
      unwrapOriEnvelope({ error_code: 500, message: { nested: 1 } }, endpoint),
    ).toThrow(
      expect.objectContaining({ backendCode: 500, backendMessage: undefined }),
    );
  });

  test.each([
    null,
    [],
    "text",
    1,
    { error_code: "0", data: [] },
    { error_code: 0 },
  ])("contract violation %j → InvalidResponseError", (body) => {
    expect(() => unwrapOriEnvelope(body, endpoint)).toThrow(
      InvalidResponseError,
    );
  });
});
