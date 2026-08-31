import type { OAuthProvider } from "./types";

export const AUTH_SESSION_COOKIE = "cvitae_auth";
export const OAUTH_STATE_COOKIE = "cvitae_oauth_state";
export const OAUTH_RETURN_COOKIE = "cvitae_oauth_return";

export function getAuthSecret(): string | null {
  return process.env.AUTH_SECRET ?? null;
}

export function getAppOrigin(requestUrl: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const url = new URL(requestUrl);
  return url.origin;
}

export function getOAuthClientId(provider: OAuthProvider): string | null {
  if (provider === "google") {
    return process.env.GOOGLE_CLIENT_ID ?? null;
  }

  return process.env.GITHUB_CLIENT_ID ?? null;
}

export function getOAuthClientSecret(provider: OAuthProvider): string | null {
  if (provider === "google") {
    return process.env.GOOGLE_CLIENT_SECRET ?? null;
  }

  return process.env.GITHUB_CLIENT_SECRET ?? null;
}

export function getOAuthRedirectUri(origin: string, provider: OAuthProvider): string {
  return `${origin}/api/auth/callback/${provider}`;
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "github";
}

export function isOAuthConfigured(provider: OAuthProvider): boolean {
  if (!getAuthSecret()) {
    return false;
  }

  return Boolean(getOAuthClientId(provider) && getOAuthClientSecret(provider));
}

export function getOAuthSetupStatus(): {
  authSecret: boolean;
  google: boolean;
  github: boolean;
} {
  return {
    authSecret: Boolean(getAuthSecret()),
    google: isOAuthConfigured("google"),
    github: isOAuthConfigured("github"),
  };
}
