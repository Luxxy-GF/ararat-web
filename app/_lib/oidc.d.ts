// Standard OIDC ID Token claims
// https://openid.net/specs/openid-connect-core-1_0.html#IDToken
export interface OidcIdTokenClaims {
  // Required claims
  iss: string; // Issuer Identifier
  sub: string; // Subject Identifier (unique user ID)
  aud: string | string[]; // Audience(s)
  exp: number; // Expiration time (Unix timestamp)
  iat: number; // Issued at time (Unix timestamp)

  // Optional standard claims
  auth_time?: number; // Time when authentication occurred
  nonce?: string; // String value used to associate session
  acr?: string; // Authentication Context Class Reference
  amr?: string[]; // Authentication Methods References
  azp?: string; // Authorized party

  // Standard profile claims
  name?: string; // Full name
  given_name?: string; // Given name(s) or first name(s)
  family_name?: string; // Surname(s) or last name(s)
  middle_name?: string; // Middle name(s)
  nickname?: string; // Casual name
  preferred_username?: string; // Shorthand name
  profile?: string; // Profile page URL
  picture?: string; // Profile picture URL
  website?: string; // Web page or blog URL
  email?: string; // Email address
  email_verified?: boolean; // True if email verified
  gender?: string; // Gender
  birthdate?: string; // Birthday
  zoneinfo?: string; // Time zone
  locale?: string; // Locale
  phone_number?: string; // Phone number
  phone_number_verified?: boolean; // True if phone verified
  address?: {
    formatted?: string;
    street_address?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  updated_at?: number; // Time profile was last updated

  // Allow additional custom claims
  [key: string]: unknown;
}

export interface OidcUserData {
  id: string; // Subject (sub claim)
  name?: string; // Display name
  email?: string;
  picture?: string;
  preferred_username?: string;
  // Add other fields as needed
}
