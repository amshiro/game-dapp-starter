export type QueryParams = Readonly<Record<string, string | undefined>>;

/**
 * Joins a trusted base URL with an endpoint path. The path is always appended
 * to the base path, never resolved against it, so it cannot replace the host
 * or drop a base path prefix.
 */
export function buildApiUrl(
  baseUrl: string,
  path: string,
  query?: QueryParams,
): URL {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    throw new Error(`API path must be an absolute path: ${path}`);
  }
  const url = new URL(baseUrl);
  if (url.search || url.hash) {
    throw new Error("API base URL must not contain a query or fragment");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}${path}`;
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.append(key, value);
  }
  return url;
}
