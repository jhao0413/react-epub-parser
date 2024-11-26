// app/providers.tsx
"use client";

import { NextUIProvider } from "@nextui-org/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <NextUIProvider style={{ width: "100vw", height: "100vh" }}>{children}</NextUIProvider>;
}
