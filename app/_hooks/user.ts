"use client";

import { use } from "react";
import AuthenticationContext from "@/app/_context/authentication";
import { useClientCertificate } from "./certificate";
import { useOidcUser } from "./oidc";
import type { UserContextData } from "@/app/(main)/_context/user";

interface UseUserReturn {
  data: UserContextData | null;
  isLoading: boolean;
  isValidating: boolean;
}

/**
 * Hook to get user data based on the authentication method
 * Automatically handles both TLS and OIDC authentication
 */
export function useUser(): UseUserReturn {
  const {
    isValidating: authIsValidating,
    isLoading: authIsLoading,
    data: authData,
  } = use(AuthenticationContext);

  const {
    data: tlsData,
    isValidating: tlsIsValidating,
    isLoading: tlsIsLoading,
  } = useClientCertificate(
    authData?.method === "tls" ? authData?.identifier : undefined
  );

  const {
    data: oidcData,
    isValidating: oidcIsValidating,
    isLoading: oidcIsLoading,
  } = useOidcUser(authData?.method === "oidc");

  // Determine user data based on authentication method
  let userData: UserContextData | null = null;
  let isLoading = authIsLoading;
  let isValidating = authIsValidating;

  if (authData?.method === "tls") {
    isLoading = authIsLoading || tlsIsLoading;
    isValidating = authIsValidating || tlsIsValidating;

    if (tlsData) {
      userData = {
        id: authData.identifier as string,
        name: tlsData.name,
      };
    }
  } else if (authData?.method === "oidc") {
    isLoading = authIsLoading || oidcIsLoading;
    isValidating = authIsValidating || oidcIsValidating;

    if (oidcData) {
      userData = {
        id: oidcData.id,
        name: oidcData.name,
        email: oidcData.email,
        picture: oidcData.picture,
      };
    }
  }

  return {
    data: userData,
    isLoading,
    isValidating,
  };
}
