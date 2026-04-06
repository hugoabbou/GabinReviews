import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Uber Eats webhook received:", JSON.stringify(body));
  } catch {}
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
