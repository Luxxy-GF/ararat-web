"use client";
import ServerConfigurationContext from "@/app/_context/server";
import { Button } from "@/app/_components/ui/button";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { useRouter } from "next/navigation";
import React, { startTransition, use, useEffect } from "react";

function TLSButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props}>TLS</Button>;
}

export default function LoginMethodsComponent() {
  const { isLoading, data, isValidating } = use(ServerConfigurationContext);
  const [authenticating, setAuthenticating] = React.useState(false);
  const router = useRouter();
  useEffect(() => {
    if (!isValidating) {
      if (data?.auth_methods.length == 1) {
        startTransition(() => {
          setAuthenticating(true);
        });
        if (data.auth_methods[0] == "tls") {
          console.log("Redirecting to TLS auth");
          setTimeout(() => {
            router.replace("/authentication/login/tls");
          }, 1);
        }
      }
    }
  }, [data, isValidating, router]);
  return (
    <div>
      {!isLoading ? (
        data?.auth_methods.map((method) => {
          const props = {
            onClick: () => setAuthenticating(true),
            loading: authenticating,
          };
          if (method == "tls")
            return (
              <TLSButton
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
