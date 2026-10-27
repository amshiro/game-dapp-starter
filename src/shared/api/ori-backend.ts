import type { PublicConfig } from "../config/parse-public-config";
import { readPublicConfig } from "../config/public-config";
import {
  BackendBusinessError,
  ConfigurationError,
  InvalidResponseError,
} from "./errors";
import { requestJson } from "./request-json";

/**
 * ORI backend service contract (docs/project/api-reference), without any
 * resource knowledge.
 * - Every documented `/v1/ori/*` endpoint is an unsigned POST with no auth;
 *   the backend accepts form and JSON bodies, form is used (as ori-website).
 * - Success envelope `{ data, common }`. Failures arrive as HTTP 200
 *   `{ error_code, message, errors }` without `data` (observed in
 *   Development; not documented). No code table exists, so codes are kept
 *   as numbers and never interpreted here.
 */
const ORI_NAMESPACE = "/v1/ori";

export type OriBackendRequest = Readonly<{
  /** Resource path below `/v1/ori`, e.g. `/summary`. */
  path: string;
  form?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
  /** Injectable for tests; defaults to the build-time public config. */
  readConfig?: () => PublicConfig;
}>;

/** Sends one ORI backend request and returns the envelope's `data` as unknown. */
export async function requestOriBackend({
  path,
  form = {},
  signal,
  readConfig = readPublicConfig,
}: OriBackendRequest): Promise<unknown> {
  const endpoint = `${ORI_NAMESPACE}${path}`;
  const baseUrl = resolveBaseUrl(readConfig, endpoint);
  const body = await requestJson({
    baseUrl,
    path: endpoint,
    method: "POST",
    body: { form },
    signal,
  });
  return unwrapOriEnvelope(body, endpoint);
}

function resolveBaseUrl(readConfig: () => PublicConfig, endpoint: string) {
  let config: PublicConfig;
  try {
    config = readConfig();
  } catch (error) {
    // Parser messages name the variable only.
    throw new ConfigurationError(
      error instanceof Error ? error.message : "public config is unreadable",
      endpoint,
      { cause: error },
    );
  }
  if (config.apiBaseUrl === undefined) {
    throw new ConfigurationError(
      "NEXT_PUBLIC_API_BASE_URL is not configured",
      endpoint,
    );
  }
  return config.apiBaseUrl;
}

export function unwrapOriEnvelope(body: unknown, endpoint: string): unknown {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new InvalidResponseError(
      `Response from ${endpoint} is not an envelope`,
      endpoint,
    );
  }
  const errorCode: unknown = Reflect.get(body, "error_code");
  if (errorCode !== undefined && typeof errorCode !== "number") {
    throw new InvalidResponseError(
      `Response from ${endpoint} has a non-numeric error_code`,
      endpoint,
    );
  }
  if (typeof errorCode === "number" && errorCode !== 0) {
    const message: unknown = Reflect.get(body, "message");
    throw new BackendBusinessError(
      errorCode,
      endpoint,
      typeof message === "string" ? message : undefined,
    );
  }
  if (!Object.hasOwn(body, "data")) {
    throw new InvalidResponseError(
      `Response from ${endpoint} has no data field`,
      endpoint,
    );
  }
  return Reflect.get(body, "data");
}
