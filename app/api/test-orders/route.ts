import { NextResponse } from "next/server";

const STORE_ID = process.env.UBER_STORE_IDS?.split(",")[0]?.trim() || "";

async function getUberToken(scope: string): Promise<{ token?: string; error?: string }> {
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID!,
      client_secret: process.env.UBER_CLIENT_SECRET!,
      grant_type: "client_credentials",
      scope,
    }),
  });
  const data = await res.json();
  if (!data.access_token) return { error: data.error_description || JSON.stringify(data) };
  return { token: data.access_token };
}

export async function GET() {
  // 1. Try token with eats.order scope
  const { token, error: tokenError } = await getUberToken("eats.store eats.report eats.order");
  if (!token) {
    return NextResponse.json({ step: "token", error: tokenError });
  }

  // 2. Try orders endpoint
  const ordersRes = await fetch(
    `https://api.uber.com/v2/eats/stores/${STORE_ID}/orders`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const ordersData = await ordersRes.json();

  return NextResponse.json({
    storeId: STORE_ID,
    ordersStatus: ordersRes.status,
    ordersData,
  });
}
