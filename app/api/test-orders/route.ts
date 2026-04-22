import { NextResponse } from "next/server";

const SANDBOX_CLIENT_ID     = "HgCQpYAtiO2DqfoiVQZHLSFN5ipH8GsE";
const SANDBOX_CLIENT_SECRET = "qxrdpKK8LJj6nJdP8I-f31r7mGaKL17P0wcURXQq";
const SANDBOX_BASE          = "https://sandbox-api.uber.com";
const PROD_STORE_ID         = process.env.UBER_STORE_IDS?.split(",")[0]?.trim() || "";

async function getSandboxToken(): Promise<{ token?: string; error?: string; raw?: unknown }> {
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SANDBOX_CLIENT_ID,
      client_secret: SANDBOX_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "eats.order",
    }),
  });
  const data = await res.json();
  if (!data.access_token) return { error: data.error_description || data.error, raw: data };
  return { token: data.access_token };
}

export async function GET() {
  const { token, error: tokenError, raw } = await getSandboxToken();
  if (!token) {
    return NextResponse.json({ step: "token", error: tokenError, raw });
  }

  // Test 1: list orders for the real store in sandbox
  const storeOrdersRes = await fetch(
    `${SANDBOX_BASE}/v2/eats/stores/${PROD_STORE_ID}/orders`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const storeOrdersData = await storeOrdersRes.json();

  // Test 2: generic orders endpoint
  const ordersRes = await fetch(
    `${SANDBOX_BASE}/v1/eats/orders`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const ordersData = await ordersRes.json();

  return NextResponse.json({
    sandboxToken: token.slice(0, 20) + "...",
    storeOrders: { status: storeOrdersRes.status, data: storeOrdersData },
    orders:      { status: ordersRes.status,       data: ordersData },
  });
}
