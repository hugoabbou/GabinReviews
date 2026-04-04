import { NextResponse } from "next/server";

async function getUberToken(): Promise<string | null> {
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID!,
      client_secret: process.env.UBER_CLIENT_SECRET!,
      grant_type: "client_credentials",
      scope: "eats.store eats.report",
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function GET(req: Request) {
  const token = await getUberToken();
  if (!token) {
    return NextResponse.json({ error: "Impossible d'obtenir un token Uber Eats" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  // List stores: return configured store IDs from env var
  if (!storeId) {
    const storeIds = (process.env.UBER_STORE_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const stores = storeIds.map((id) => ({ id, name: id }));
    return NextResponse.json({ stores });
  }

  // Try multiple known endpoint formats
  const endpoints = [
    `https://api.uber.com/v1/eats/stores/${storeId}/eater_feedbacks`,
    `https://api.uber.com/v2/eats/stores/${storeId}/eater_feedbacks`,
    `https://api.uber.com/v1/eats/stores/${storeId}/feedbacks`,
  ];

  for (const url of endpoints) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await res.text();
    console.log(`Uber [${res.status}] ${url} → ${text.slice(0, 200)}`);
    if (res.status === 200 && text) {
      try { return NextResponse.json(JSON.parse(text)); } catch {}
    }
  }

  return NextResponse.json({ feedbacks: [], eater_feedbacks: [], _debug: "all endpoints returned 404" });
}
