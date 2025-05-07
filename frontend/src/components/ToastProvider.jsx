"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        className: "border border-border",
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
        },
        success: {
          style: {
            borderLeft: "4px solid var(--primary)",
          },
        },
        error: {
          style: {
            borderLeft: "4px solid var(--destructive)",
          },
        },
      }}
    />
  );
}
