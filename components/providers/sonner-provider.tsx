"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      theme="light"
      toastOptions={{
        classNames: {
          toast: "group toast font-sans !rounded-xl !bg-white",
          description: "!text-gray-500 !text-[12px]",
          actionButton: "!bg-primary !text-white !rounded-lg !px-3 !py-1.5 !text-[12px]",
          cancelButton: "!bg-gray-100 !text-gray-600 !rounded-lg !px-3 !py-1.5 !text-[12px]",
        },
      }}
    />
  );
}
