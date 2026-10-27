export type ConnectionNotice = "cancelled" | "failed" | undefined;

/** Only inspect known codes. Never render/log SDK errors, provider objects or messages. */
export function connectionNotice(error: unknown): ConnectionNotice {
  const code =
    typeof error === "object" && error !== null
      ? "privyErrorCode" in error
        ? error.privyErrorCode
        : "code" in error
          ? error.code
          : undefined
      : error;
  return code === "exited_auth_flow" ||
    code === "exited_link_flow" ||
    code === 4001 ||
    code === "4001"
    ? "cancelled"
    : "failed";
}
