import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  getAuthSecret,
  isOAuthProvider,
} from "../../../../../lib/auth/config";
import { exchangeCodeForUser } from "../../../../../lib/auth/oauth";
import { encodeSession } from "../../../../../lib/auth/session-token";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  if (!isOAuthProvider(providerParam)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const returnTo = cookieStore.get(OAUTH_RETURN_COOKIE)?.value ?? "/en";
  const redirectUrl = new URL(returnTo, request.url);

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    redirectUrl.searchParams.set("auth_error", error);
    return clearOAuthCookies(NextResponse.redirect(redirectUrl));
  }

  const state = request.nextUrl.searchParams.get("state");
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !state || !expectedState || state !== expectedState) {
    redirectUrl.searchParams.set("auth_error", "invalid_oauth_state");
    return clearOAuthCookies(NextResponse.redirect(redirectUrl));
  }

  const secret = getAuthSecret();
  if (!secret) {
    redirectUrl.searchParams.set("auth_error", "oauth_not_configured");
    return clearOAuthCookies(NextResponse.redirect(redirectUrl));
  }

  const user = await exchangeCodeForUser(providerParam, request.url, code);
  if (!user) {
    redirectUrl.searchParams.set("auth_error", "oauth_failed");
    return clearOAuthCookies(NextResponse.redirect(redirectUrl));
  }

  const response = clearOAuthCookies(NextResponse.redirect(redirectUrl));
  response.cookies.set(AUTH_SESSION_COOKIE, encodeSession({ user }, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(OAUTH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
