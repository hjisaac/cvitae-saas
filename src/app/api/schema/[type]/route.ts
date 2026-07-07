import { NextRequest, NextResponse } from "next/server";

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (type !== "selector" && type !== "variant") {
      return NextResponse.json({ error: "Invalid schema type" }, { status: 400 });
    }

    const response = await fetch(`${CORE_ENGINE_URL}/schema/${type}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Schema engine error: ${errorText}` },
        { status: response.status }
      );
    }

    const schema = await response.json();
    return NextResponse.json(schema, { status: 200 });
  } catch (error: any) {
    console.error("Schema API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
