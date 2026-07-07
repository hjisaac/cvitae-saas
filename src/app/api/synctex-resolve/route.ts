import { NextRequest, NextResponse } from "next/server";

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || "http://127.0.0.1:8000/synctex-resolve";

export async function POST(req: NextRequest) {
  try {
    const { page, x, y } = await req.json();

    const response = await fetch(CORE_ENGINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page, x, y }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `SyncTeX Engine error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("SyncTeX Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
