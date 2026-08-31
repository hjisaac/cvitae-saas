import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  getAuthSecret,
  isOAuthProvider,
} from "../../../../lib/auth/config";
import { decodeSession } from "../../../../lib/auth/session-token";

export async function GET() {
  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json({ user: null });
  }

  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const session = decodeSession(token, secret);
  if (!session?.user || !isOAuthProvider(session.user.provider)) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json(session);
}
