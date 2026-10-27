import { buildApiUrl, type QueryParams } from "./api-url";
import {
  AbortedError,
  HttpError,
  InvalidResponseError,
  NetworkError,
} from "./errors";

export type RequestBody =
  | Readonly<{ json: unknown }>
  /** `application/x-www-form-urlencoded`; values are sent exactly as given. */
  | Readonly<{ form: Readonly<Record<string, string>> }>;

export type RequestJsonOptions = Readonly<{
  baseUrl: string;
  path: string;
  method: "GET" | "POST";
  query?: QueryParams;
  body?: RequestBody;
  headers?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
}>;

/**
 * Browser- and Worker-safe JSON request. It reads no environment and holds no
 * credentials; it never retries, so a POST is sent at most once. Returns the
 * parsed body as `unknown`: envelopes and DTOs belong to the service and owner.
 */
export async function requestJson(
  options: RequestJsonOptions,
): Promise<unknown> {
  const { path, method, body, signal } = options;
  const url = buildApiUrl(options.baseUrl, path, options.query);
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");

  let payload: string | URLSearchParams | undefined;
  if (body && "json" in body) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(body.json);
  } else if (body) {
    payload = new URLSearchParams(body.form);
  }

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: payload, signal });
  } catch (error) {
    if (signal?.aborted) {
      throw new AbortedError(`Request to ${path} was aborted`, path, {
        cause: error,
      });
    }
    throw new NetworkError(`Request to ${path} failed`, path, {
      cause: error,
    });
  }

  if (response.redirected) {
    throw new InvalidResponseError(`Unexpected redirect from ${path}`, path);
  }
  if (!response.ok) throw new HttpError(response.status, path);

  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    if (signal?.aborted) {
      throw new AbortedError(`Request to ${path} was aborted`, path, {
        cause: error,
      });
    }
    throw new NetworkError(`Reading response from ${path} failed`, path, {
      cause: error,
    });
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidResponseError(`Response from ${path} is not JSON`, path);
  }
}
