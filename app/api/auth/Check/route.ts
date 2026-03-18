import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("reviewshub_session")?.value;
  
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  
  return NextResponse.json({ success: true });
}