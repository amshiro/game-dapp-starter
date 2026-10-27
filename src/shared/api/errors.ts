/**
 * Transport-level error taxonomy. Messages never contain request bodies,
 * response bodies, headers, or credentials: only the endpoint path and status.
 */
export type ApiErrorKind =
  | "network"
  | "http"
  | "invalid-response"
  | "backend-business"
  | "configuration"
  | "aborted";

export abstract class ApiError extends Error {
  abstract readonly kind: ApiErrorKind;

  constructor(
    message: string,
    /** Endpoint path without query, e.g. `/v1/ori/summary`. */
    readonly endpoint: string | undefined,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The request never produced an HTTP response (DNS, TLS, CORS, offline). */
export class NetworkError extends ApiError {
  readonly kind = "network";
}

/** The caller's AbortSignal cancelled the request. */
export class AbortedError extends ApiError {
  readonly kind = "aborted";
}

/** A response arrived with a non-2xx status. */
export class HttpError extends ApiError {
  readonly kind = "http";

  constructor(
    readonly status: number,
    endpoint: string,
  ) {
    super(`HTTP ${status} from ${endpoint}`, endpoint);
  }
}

/** A 2xx response whose body breaks the expected contract. */
export class InvalidResponseError extends ApiError {
  readonly kind = "invalid-response";
}

/** The backend answered with a business failure inside a 2xx envelope. */
export class BackendBusinessError extends ApiError {
  readonly kind = "backend-business";

  constructor(
    readonly backendCode: number,
    endpoint: string,
    /** Backend-provided text; kept out of `message` because it may echo input. */
    readonly backendMessage?: string,
  ) {
    super(`Backend error ${backendCode} from ${endpoint}`, endpoint);
  }
}

/** Required configuration is missing or invalid; the request was not sent. */
export class ConfigurationError extends ApiError {
  readonly kind = "configuration";
}
