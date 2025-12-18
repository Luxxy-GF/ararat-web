"use client";

import type { OidcIdTokenClaims, OidcUserData } from "./oidc.d";

/**
 * Decode a JWT token without verification (for client-side use only)
 * The server has already verified the token before setting the cookie
 */
function decodeJwt(token: string): OidcIdTokenClaims | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format");
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // JWT uses base64url encoding, which is different from standard base64
    // Replace characters and add padding if needed
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    // Decode base64 to string
    const jsonString = atob(paddedBase64);

    // Parse JSON
    const claims = JSON.parse(jsonString) as OidcIdTokenClaims;

    return claims;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const rawCookieValue = parts.pop()?.split(";").shift();
    if (!rawCookieValue) {
      return null;
    }
    try {
      return decodeURIComponent(rawCookieValue);
    } catch (e) {
      console.error("Failed to decode cookie:", name, e);
      return null;
    }
  }

  return null;
}

/**
 * Read and decode the OIDC ID token cookie.
 * Returns claims without applying expiry logic so callers can decide.
 */
export function getOidcClaimsFromCookie(): OidcIdTokenClaims | null {
  const token = getCookie("oidc_id");
  if (!token) return null;
  return decodeJwt(token);
}

/**
 * Get OIDC user data from the oidc_id cookie
 * Returns null if cookie doesn't exist, cannot be decoded, or is expired
 */
export function getOidcUserFromCookie(): OidcUserData | null {
  const claims = getOidcClaimsFromCookie();
  if (!claims) return null;

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) {
    return null;
  }

  return {
    id: claims.sub,
    name: claims.name || claims.preferred_username || claims.email,
    email: claims.email,
    picture: claims.picture,
    preferred_username: claims.preferred_username,
  };
}

/**
 * Get the refresh token from the oidc_refresh_token cookie
 */
function getRefreshToken(): string | null {
  return getCookie("oidc_refresh_token");
}

/**
 * Fetch OIDC discovery metadata from the issuer's well-known endpoint
 */
async function getOidcDiscoveryMetadata(
  issuer: string
): Promise<Record<string, unknown> | null> {
  try {
    const discoveryUrl = new URL(
      "/.well-known/openid-configuration",
      issuer
    ).toString();
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
      console.warn(
        `Failed to fetch OIDC discovery metadata from ${discoveryUrl}`,
        response.status
      );
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Error fetching OIDC discovery metadata:", error);
    return null;
  }
}

/**
 * Attempt to refresh the OIDC session using the OIDC issuer's token endpoint.
 * Uses OIDC discovery to find the token endpoint based on the issuer from the current ID token.
 *
 * This implementation:
 * 1. Extracts the issuer from the current ID token
 * 2. Uses OIDC discovery to find the token endpoint
 * 3. Attempts to exchange the refresh token for a new ID token
 * 4. Updates the oidc_id cookie with the new token
 *
 * Note: Client credentials (client_id, client_secret) cannot be safely stored on the client.
 * This implementation assumes a public OIDC client configuration or that the OIDC provider
 * allows refresh token exchange without client credentials.
 */
export async function refreshOidcSession(): Promise<void> {
  const claims = getOidcClaimsFromCookie();
  if (!claims) {
    throw new Error("No OIDC token available to refresh");
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No OIDC refresh token available");
  }

  // Get the issuer from the token claims
  const issuer = claims.iss;
  if (!issuer) {
    throw new Error("No issuer found in OIDC token");
  }

  // Fetch OIDC discovery metadata to find the token endpoint
  const metadata = await getOidcDiscoveryMetadata(issuer);
  if (!metadata || !metadata.token_endpoint) {
    throw new Error(
      "Failed to get token endpoint from OIDC discovery metadata"
    );
  }

  const tokenEndpoint = metadata.token_endpoint as string;

  // Attempt to exchange the refresh token for a new ID token
  // This uses the refresh_token grant type per OIDC specification
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      // Note: client_id may be required by some providers
      // If this fails with "invalid_client", you may need to configure
      // the OIDC provider as a public client or adjust the request
    }).toString(),
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to refresh OIDC token: ${response.status} ${response.statusText}`
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const tokenData = (await response.json()) as Record<string, unknown>;
  const newIdToken = tokenData.id_token as string | undefined;
  const newRefreshToken =
    (tokenData.refresh_token as string | undefined) || refreshToken;

  if (!newIdToken) {
    throw new Error("No id_token in OIDC token refresh response");
  }

  // Update the ID token cookie
  // Note: We can only set non-httpOnly cookies from JavaScript
  // Ensure the OIDC login flow sets cookies appropriately
  document.cookie = `oidc_id=${encodeURIComponent(newIdToken)}; path=/; SameSite=Lax; Secure`;

  // Update the refresh token cookie if we got a new one
  if (newRefreshToken) {
    document.cookie = `oidc_refresh_token=${encodeURIComponent(newRefreshToken)}; path=/; SameSite=Lax; Secure`;
  }
}
