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

  // Fetch feedbacks for a specific store
  const res = await fetch(
    `https://api.uber.com/v2/eats/stores/${storeId}/eater_feedbacks`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return NextResponse.json(await res.json());
}
