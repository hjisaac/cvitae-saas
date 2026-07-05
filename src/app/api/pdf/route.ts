import { NextRequest, NextResponse } from "next/server";

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || "http://127.0.0.1:8080/generate-pdf";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const response = await fetch(CORE_ENGINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cv_data: data }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `PDF Engine error: ${errorText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="cvitae-resume.pdf"',
      },
    });
  } catch (error: any) {
    console.error("PDF Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
