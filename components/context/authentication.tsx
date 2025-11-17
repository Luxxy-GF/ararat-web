"use client";

import { createContext, use, useEffect } from "react";
import { ServerConfigurationContext } from "./server";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export interface AuthenticationContextData {
  isAuthenticated: boolean;
  method?: string;
  identifier?: string;
}
export const AuthenticationContext = createContext({
  data: null as AuthenticationContextData | null,
  isLoading: true,
  isValidating: true,
});
export default function AuthenticationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isValidating, isLoading, data } = use(ServerConfigurationContext);
  useEffect(() => {
    if (!isValidating) {
      if (data?.auth == "untrusted") {
        if (!pathname.startsWith("/authentication")) {
          router.replace("/authentication/login");
        }
      } else if (data?.auth == "trusted") {
        if (pathname === "/") {
          router.replace("/instances");
        }
      }
    }
  }, [data, isValidating, pathname, router]);
  return (
    <AuthenticationContext.Provider
      value={{
        data: {
          isAuthenticated: data?.auth == "trusted" ? true : false,
          method: data?.auth_user_method,
          identifier: data?.auth_user_name,
        },
        isLoading: isLoading,
        isValidating: isValidating,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
