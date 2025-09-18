"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

// Isolated client boundary for next-auth session context.
export function SessionClientProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
