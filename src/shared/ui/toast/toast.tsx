"use client";

import { Toaster, toast } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      duration={3000}
      theme="light"
      richColors
      toastOptions={{ style: { fontFamily: "inherit" } }}
    />
  );
}

export function showSuccessToast(message: string, id?: string) {
  return toast.success(message, { id, duration: 3000 });
}

export function showErrorToast(message: string) {
  return toast.error(message, { duration: 3000 });
}
