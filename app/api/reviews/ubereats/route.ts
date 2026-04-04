import { NextResponse } from "next/server";

async function getUberToken(): Promise<{ token: string | null; error?: string }> {
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
  if (!data.access_token) {
    return { token: null, error: JSON.stringify(data) };
  }
  return { token: data.access_token };
}

export async function GET(req: Request) {
  const { token, error: tokenError } = await getUberToken();
  if (!token) {
    return NextResponse.json({ error: `Token error: ${tokenError}` }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    const res = await fetch("https://api.uber.com/v2/eats/stores", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json({ ...data, _debug_status: res.status });
  }

  const res = await fetch(
    `https://api.uber.com/v2/eats/stores/${storeId}/eater_feedbacks`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return NextResponse.json({ ...data, _debug_status: res.status });
}
