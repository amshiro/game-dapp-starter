import { afterEach, describe, expect, test, vi } from "vitest";
import {
  AbortedError,
  HttpError,
  InvalidResponseError,
  NetworkError,
} from "./errors";
import { requestJson } from "./request-json";

const BASE = "https://api.example.test";

function stubFetch(impl: (url: URL, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestJson", () => {
  test("GET sends query and parses JSON", async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: true }));
    await expect(
      requestJson({
        baseUrl: BASE,
        path: "/items",
        method: "GET",
        query: { page: "2" },
      }),
    ).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/items?page=2`);
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  test("POST JSON serialises the body with a JSON content type", async () => {
    const fetchMock = stubFetch(async () => Response.json({}));
    await requestJson({
      baseUrl: BASE,
      path: "/items",
      method: "POST",
      body: { json: { a: 1 } },
    });
    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json",
    );
  });

  test("POST form sends URL-encoded values exactly as given", async () => {
    const fetchMock = stubFetch(async () => Response.json({}));
    await requestJson({
      baseUrl: BASE,
      path: "/items",
      method: "POST",
      body: { form: { page: "1", name: "起源" } },
    });
    const body = fetchMock.mock.calls[0][1].body;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(String(body)).toBe("page=1&name=%E8%B5%B7%E6%BA%90");
  });

  test("sends a POST exactly once, even when it fails", async () => {
    const fetchMock = stubFetch(async () => new Response("", { status: 503 }));
    await expect(
      requestJson({
        baseUrl: BASE,
        path: "/items",
        method: "POST",
        body: { form: {} },
      }),
    ).rejects.toBeInstanceOf(HttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test.each([400, 403, 404, 500])(
    "HTTP %s → HttpError with status",
    async (status) => {
      stubFetch(async () => new Response("secret body", { status }));
      const error = await requestJson({
        baseUrl: BASE,
        path: "/items",
        method: "GET",
      }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({ kind: "http", status, endpoint: "/items" });
      expect(String((error as Error).message)).not.toContain("secret body");
    },
  );

  test("malformed JSON → InvalidResponseError", async () => {
    stubFetch(async () => new Response("<html>", { status: 200 }));
    await expect(
      requestJson({ baseUrl: BASE, path: "/items", method: "GET" }),
    ).rejects.toBeInstanceOf(InvalidResponseError);
  });

  test("unexpected redirect → InvalidResponseError", async () => {
    stubFetch(async () => {
      const response = Response.json({});
      Object.defineProperty(response, "redirected", { value: true });
      return response;
    });
    await expect(
      requestJson({ baseUrl: BASE, path: "/items", method: "GET" }),
    ).rejects.toThrow("Unexpected redirect");
  });

  test("network failure → NetworkError with cause", async () => {
    const cause = new TypeError("fetch failed");
    stubFetch(async () => {
      throw cause;
    });
    const error = await requestJson({
      baseUrl: BASE,
      path: "/items",
      method: "GET",
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect((error as Error).cause).toBe(cause);
  });

  test("abort → AbortedError, not NetworkError", async () => {
    stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const controller = new AbortController();
    const pending = requestJson({
      baseUrl: BASE,
      path: "/items",
      method: "GET",
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(AbortedError);
  });
});
