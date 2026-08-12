import { NextResponse } from "next/server";
import { getOAuthSetupStatus } from "../../../../lib/auth/config";

export async function GET() {
  return NextResponse.json(getOAuthSetupStatus());
}
