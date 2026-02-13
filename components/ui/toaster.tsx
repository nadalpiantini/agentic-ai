"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#18181b",
          border: "1px solid #3f3f46",
          color: "#f4f4f5",
        },
      }}
    />
  );
}
