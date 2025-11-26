"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/_components/ui/alert";
import { InfoIcon } from "lucide-react";
import AlreadyAuthenticated from "../../_components/alreadyAuthenticated";

export default function OidcLogin() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if this is a redirect back from OIDC provider
    // by checking if we just became authenticated
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("code") || urlParams.has("error")) {
      // The server handles the OIDC callback, so if we're here with these params,
      // the authentication should have been handled already.
      // The AuthenticationProvider will redirect to the dashboard if authenticated.
    }
  }, []);

  function handleOidcLogin() {
    setIsRedirecting(true);
    // Redirect to the Incus OIDC login endpoint
    // The server will handle the OIDC flow and redirect back
    window.location.href = "/1.0/oidc/login";
  }

  return (
    <>
      <AlreadyAuthenticated />
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>OpenID Connect</AlertTitle>
        <AlertDescription>
          You will be redirected to your identity provider to authenticate.
          After successful authentication, you will be returned to this
          application.
        </AlertDescription>
      </Alert>
      <Button onClick={handleOidcLogin} loading={isRedirecting} className="w-full">
        {isRedirecting ? "Redirecting..." : "Login with OpenID Connect"}
      </Button>
    </>
  );
}
