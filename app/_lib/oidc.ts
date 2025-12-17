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
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue || null;
  }

  return null;
}

/**
 * Get OIDC user data from the oidc_id cookie
 * Returns null if cookie doesn't exist or cannot be decoded
 */
export function getOidcUserFromCookie(): OidcUserData | null {
  const token = getCookie("oidc_id");

  if (!token) {
    return null;
  }

  const claims = decodeJwt(token);

  if (!claims) {
    return null;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) {
    console.warn("OIDC ID token is expired");
    return null;
  }

  // Extract relevant user data from claims
  return {
    id: claims.sub,
    name: claims.name || claims.preferred_username || claims.email,
    email: claims.email,
    picture: claims.picture,
    preferred_username: claims.preferred_username,
  };
}
