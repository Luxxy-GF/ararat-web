"use client";

import { useEffect, useState } from "react";
import type { OidcUserData } from "../_lib/oidc.d";
import { getOidcUserFromCookie } from "../_lib/oidc";

/**
 * Hook to get OIDC user data from the oidc_id cookie
 * Returns user data if available, loading state, and validation state
 */
export function useOidcUser(enabled: boolean = true) {
  const [data, setData] = useState<OidcUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsValidating(false);
      return;
    }

    // Initial load
    const userData = getOidcUserFromCookie();
    setData(userData);
    setIsLoading(false);
    setIsValidating(false);

    // Set up a timer to periodically check the cookie
    // This handles cases where the cookie is updated or expires
    const intervalId = setInterval(() => {
      setIsValidating(true);
      const userData = getOidcUserFromCookie();
      setData(userData);
      setIsValidating(false);
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [enabled]);

  return {
    data,
    isLoading,
    isValidating,
  };
}
