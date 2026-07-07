import { NextRequest, NextResponse } from "next/server";

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profile = searchParams.get("profile");
    const fileType = searchParams.get("file_type");

    if (!profile || !fileType) {
      return NextResponse.json(
        { error: "Missing profile or file_type query parameters" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CORE_ENGINE_URL}/file-content?profile=${profile}&file_type=${fileType}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `File content engine error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("File content GET Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, file_type, content } = await req.json();

    if (!profile || !file_type || content === undefined) {
      return NextResponse.json(
        { error: "Missing profile, file_type or content in body" },
        { status: 400 }
      );
    }

    const response = await fetch(`${CORE_ENGINE_URL}/file-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile, file_type, content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `File save engine error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("File content POST Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
