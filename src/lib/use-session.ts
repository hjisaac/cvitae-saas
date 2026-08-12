"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "./auth/types";

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        setSession(null);
        return;
      }

      const data = (await response.json()) as AuthSession | { user: null };
      setSession(data.user ? (data as AuthSession) : null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    session,
    loading,
    isAuthenticated: Boolean(session?.user),
    refresh,
  };
}
