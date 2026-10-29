"use client";
import { useEffect, useRef } from "react";
import { showErrorToast, showSuccessToast } from "./toast";

/** The Feature chooses the event and copy; rerenders/Strict Mode never replay the same event. */
export function useToastFeedback(
  event:
    | Readonly<{ key: object; type: "success" | "error"; message: string }>
    | undefined,
) {
  const seen = useRef(new WeakSet<object>());
  const key = event?.key,
    type = event?.type,
    message = event?.message;
  useEffect(() => {
    if (!key || !type || !message || seen.current.has(key)) return;
    seen.current.add(key);
    if (type === "success") showSuccessToast(message);
    else showErrorToast(message);
  }, [key, type, message]);
}
