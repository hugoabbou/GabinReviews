import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const BLOB_KEY = "ai-settings";

export async function GET() {
  try {
    const store = getStore("settings");
    const data = await store.get(BLOB_KEY, { type: "json" });
    return NextResponse.json(data || {});
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getStore("settings");
    await store.set(BLOB_KEY, JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
