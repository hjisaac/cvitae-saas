import * as Sentry from "@sentry/nextjs";

/**
 * Centralized helper to capture exceptions via Sentry and log them cleanly.
 *
 * @param error The error object or message to report
 * @param context Optional additional metadata/context to attach to the report
 */
export function captureError(error: unknown, context?: Record<string, any>): void {
  console.error("[Error Captured]:", error, context ? context : "");

  try {
    Sentry.captureException(error, { extra: context });
  } catch {}

  try {
    if (typeof window !== "undefined" && (window as any).Sentry?.captureException) {
      (window as any).Sentry.captureException(error, { extra: context });
    }
  } catch {}
}
