import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { original_bullets, job_description } = await req.json();

    // In a real application, you'd use the @google/genai SDK here.
    // For now, we mock the response to avoid needing API keys locally.
    const tailored_bullets = original_bullets.map(
      (bullet: string) => `[Tailored for Job] ${bullet}`
    );

    return NextResponse.json({ tailored_bullets });
  } catch (error: any) {
    console.error("Tailor Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
