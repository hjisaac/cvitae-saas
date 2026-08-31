import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import {
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  getAuthSecret,
  getOAuthClientId,
  isOAuthProvider,
} from "../../../../../lib/auth/config";
import { buildOAuthAuthorizeUrl } from "../../../../../lib/auth/oauth";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

function sanitizeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/en";
  }

  return value;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  if (!isOAuthProvider(providerParam)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  if (!getAuthSecret() || !getOAuthClientId(providerParam)) {
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set("auth_error", "oauth_not_configured");
    return NextResponse.redirect(redirectUrl);
  }

  const state = randomBytes(24).toString("hex");
  const authorizeUrl = buildOAuthAuthorizeUrl(providerParam, request.url, state);
  if (!authorizeUrl) {
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set("auth_error", "oauth_not_configured");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set(OAUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
