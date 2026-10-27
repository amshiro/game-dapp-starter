import { environmentManager } from "@tanstack/react-query";
import { expect, test } from "vitest";
import { createQueryClient, getQueryClient } from "./query-client";

test("factory calls create independent caches", () => {
  const first = createQueryClient();
  const second = createQueryClient();
  try {
    first.setQueryData(["infrastructure-test"], "first");
    expect(second).not.toBe(first);
    expect(second.getQueryData(["infrastructure-test"])).toBeUndefined();
  } finally {
    first.clear();
    second.clear();
  }
});

test("server calls cannot share cached data across requests", () => {
  expect(environmentManager.isServer()).toBe(true);
  const firstRequest = getQueryClient();
  const secondRequest = getQueryClient();
  try {
    firstRequest.setQueryData(["infrastructure-test"], "request-a");
    expect(secondRequest).not.toBe(firstRequest);
    expect(secondRequest.getQueryData(["infrastructure-test"])).toBeUndefined();
  } finally {
    firstRequest.clear();
    secondRequest.clear();
  }
});

test("browser calls reuse the cache while server calls remain isolated", () => {
  const originalIsServer = environmentManager.isServer();
  // Exercise the library's public environment API without mocking React/Next.
  environmentManager.setIsServer(() => false);
  const browserClient = getQueryClient();
  try {
    browserClient.setQueryData(["infrastructure-test"], "browser");
    expect(getQueryClient()).toBe(browserClient);
    expect(getQueryClient().getQueryData(["infrastructure-test"])).toBe(
      "browser",
    );

    environmentManager.setIsServer(() => true);
    const serverClient = getQueryClient();
    expect(serverClient).not.toBe(browserClient);
    expect(serverClient.getQueryData(["infrastructure-test"])).toBeUndefined();
    serverClient.clear();

    environmentManager.setIsServer(() => false);
    expect(getQueryClient()).toBe(browserClient);
  } finally {
    browserClient.clear();
    environmentManager.setIsServer(() => originalIsServer);
  }
});
