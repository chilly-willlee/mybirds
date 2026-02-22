"use client";

import { SessionProvider } from "next-auth/react";
import { LocationProvider } from "@/contexts/location-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocationProvider>{children}</LocationProvider>
    </SessionProvider>
  );
}
