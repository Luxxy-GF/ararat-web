"use client";

import { useEffect, useState } from "react";
import type { OidcUserData } from "../_lib/oidc.d";
import {
  getOidcClaimsFromCookie,
  getOidcUserFromCookie,
  refreshOidcSession,
} from "../_lib/oidc";

// Polling interval for checking OIDC cookie updates (in milliseconds)
const OIDC_COOKIE_POLL_INTERVAL = 60000; // 1 minute
const OIDC_REFRESH_THRESHOLD = 60; // seconds before expiry

/**
 * Hook to get OIDC user data from the oidc_id cookie
 * Returns user data if available, loading state, and validation state
 */
export function useOidcUser(enabled: boolean = true) {
  const [data, setData] = useState<OidcUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsValidating(false);
      return;
    }

    async function ensureFreshUser() {
      setIsValidating(true);

      // Read current claims to check expiry
      const claims = getOidcClaimsFromCookie();
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = claims?.exp ? claims.exp - now : undefined;

      // Refresh if missing token, expired, or expiring soon
      if (!isRefreshing && (!claims || (expiresIn !== undefined && expiresIn <= OIDC_REFRESH_THRESHOLD))) {
        try {
          setIsRefreshing(true);
          await refreshOidcSession();
        } catch (err) {
          console.warn("OIDC refresh failed", err);
        } finally {
          setIsRefreshing(false);
        }
      }

      const freshUser = getOidcUserFromCookie();
      setData(freshUser);
      setIsLoading(false);
      setIsValidating(false);
    }

    // Initial load
    ensureFreshUser();

    // Set up a timer to periodically check the cookie
    // This handles cases where the cookie is updated or expires
    const intervalId = setInterval(() => {
      ensureFreshUser();
    }, OIDC_COOKIE_POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [enabled]);

  return {
    data,
    isLoading,
    isValidating,
  };
}
