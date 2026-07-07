import { NextRequest, NextResponse } from "next/server";

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${CORE_ENGINE_URL}/profiles`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Profiles engine error: ${errorText}` },
        { status: response.status }
      );
    }

    const profiles = await response.json();
    return NextResponse.json(profiles, { status: 200 });
  } catch (error: any) {
    console.error("Profiles Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
