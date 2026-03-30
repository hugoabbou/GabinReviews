import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    toneExamplesGabin: (process.env.TONE_EXAMPLES_GABIN || "").replace(/\\n/g, "\n"),
    toneExamplesCoteSushi: (process.env.TONE_EXAMPLES_COTE_SUSHI || "").replace(/\\n/g, "\n"),
  });
}
