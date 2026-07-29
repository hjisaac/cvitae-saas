"use client";

import * as Sentry from "@sentry/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// Initialize Sentry/GlitchTip client-side if DSN is set and we are in production
if (typeof window !== "undefined") {
  (window as any).Sentry = Sentry;
  const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn && process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: dsn,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
}

export default function Providers({ children }: { children: ReactNode }) {
  // Ensure we only create the QueryClient once per session in the browser
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
