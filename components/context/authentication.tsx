"use client";

import { createContext, use, useEffect } from "react";
import { ServerConfigContext } from "./serverConfig";
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
  const { isValidating, isLoading, data } = use(ServerConfigContext);
  console.log("AuthProvider:", isValidating, isLoading, data);
  useEffect(() => {
    if (!isValidating) {
      if (!pathname.startsWith("/authentication")) {
        if (data?.auth == "untrusted") {
          router.replace("/authentication/login");
        }
      }
    }
  }, [data, isValidating, pathname, router]);
  console.log(isValidating, isLoading, data);
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
