import type { OAuthProvider, AuthUser } from "./types";
import {
  getAppOrigin,
  getOAuthClientId,
  getOAuthClientSecret,
  getOAuthRedirectUri,
} from "./config";

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserResponse {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

export function buildOAuthAuthorizeUrl(
  provider: OAuthProvider,
  requestUrl: string,
  state: string,
): string | null {
  const clientId = getOAuthClientId(provider);
  if (!clientId) {
    return null;
  }

  const origin = getAppOrigin(requestUrl);
  const redirectUri = getOAuthRedirectUri(origin, provider);

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForUser(
  provider: OAuthProvider,
  requestUrl: string,
  code: string,
): Promise<AuthUser | null> {
  const clientId = getOAuthClientId(provider);
  const clientSecret = getOAuthClientSecret(provider);
  if (!clientId || !clientSecret) {
    return null;
  }

  const origin = getAppOrigin(requestUrl);
  const redirectUri = getOAuthRedirectUri(origin, provider);

  if (provider === "google") {
    return exchangeGoogleCode(code, clientId, clientSecret, redirectUri);
  }

  return exchangeGitHubCode(code, clientId, clientSecret, redirectUri);
}

async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<AuthUser | null> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileResponse.ok) {
    return null;
  }

  const profile = (await profileResponse.json()) as GoogleUserResponse;
  if (!profile.sub || !profile.email) {
    return null;
  }

  return {
    id: profile.sub,
    email: profile.email,
    name: profile.name ?? profile.email,
    provider: "google",
    image: profile.picture,
  };
}

async function exchangeGitHubCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<AuthUser | null> {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return null;
  }

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!profileResponse.ok) {
    return null;
  }

  const profile = (await profileResponse.json()) as {
    id: number;
    login: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string;
  };

  let email = profile.email ?? "";
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as GitHubEmailResponse[];
      email =
        emails.find((entry) => entry.primary && entry.verified)?.email ??
        emails.find((entry) => entry.verified)?.email ??
        emails[0]?.email ??
        "";
    }
  }

  if (!email) {
    return null;
  }

  return {
    id: String(profile.id),
    email,
    name: profile.name ?? profile.login,
    provider: "github",
    image: profile.avatar_url,
  };
}

export function getSignInPath(provider: OAuthProvider, returnTo = "/en"): string {
  return `/api/auth/signin/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
}
