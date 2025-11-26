"use client";
import { Button } from "@/app/_components/ui/button";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { useServerConfiguration } from "@/app/_hooks/server";
import { useRouter } from "next/navigation";
import React, { startTransition, useEffect } from "react";

function TLSButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props}>TLS</Button>;
}

function OIDCButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props}>OpenID Connect</Button>;
}

export default function LoginMethodsComponent() {
  const { isLoading, data, isValidating } = useServerConfiguration();
  const [authenticating, setAuthenticating] = React.useState(false);
  const router = useRouter();

  // Reset authenticating state if the user navigates back
  useEffect(() => {
    if (authenticating) {
      const timeout = setTimeout(() => {
        setAuthenticating(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [authenticating]);

  useEffect(() => {
    if (!isValidating) {
      if (data?.auth_methods.length === 1) {
        startTransition(() => {
          setAuthenticating(true);
        });
        if (data.auth_methods[0] === "tls") {
          console.log("Redirecting to TLS auth");
          setTimeout(() => {
            router.replace("/authentication/login/tls");
          }, 1);
        } else if (data.auth_methods[0] === "oidc") {
          console.log("Redirecting to OIDC auth");
          setTimeout(() => {
            router.replace("/authentication/login/oidc");
          }, 1);
        }
      }
    }
  }, [data, isValidating, router]);
  return (
    <div className="flex flex-wrap gap-2">
      {!isLoading ? (
        data?.auth_methods.map((method) => {
          const props = {
            onClick: () => {
              setAuthenticating(true);
              if (method === "tls") {
                router.push("/authentication/login/tls");
              } else if (method === "oidc") {
                router.push("/authentication/login/oidc");
              }
            },
            loading: authenticating,
          };
          if (method === "tls")
            return (
              <TLSButton
                className={isValidating ? "animate-pulse" : ""}
                key={method}
                {...props}
              />
            );
          if (method === "oidc")
            return (
              <OIDCButton
                className={isValidating ? "animate-pulse" : ""}
                key={method}
                {...props}
              />
            );
          return (
            <Button
              className={isValidating ? "animate-pulse" : ""}
              key={method}
              {...props}
            >
              {method}
            </Button>
          );
        })
      ) : (
        <Skeleton className="h-8 w-full" />
      )}
    </div>
  );
}
