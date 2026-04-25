import { NextResponse } from "next/server";

const SANDBOX_API = "https://test-api.uber.com";
const STORES = [
  "d2c06181-e71a-4ed4-b0bb-06c046a100de",
  "e3d738e7-fb10-542b-88b4-b2d073ed5e1d",
  "823e5f0a-2a7b-5b85-95c0-7160a2cecee7",
];

async function apiCall(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${SANDBOX_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No authorization code" }, { status: 400 });

  // Exchange code for user-scoped token
  const tokenRes = await fetch("https://sandbox-login.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.UBER_SANDBOX_CLIENT_ID!,
      client_secret: process.env.UBER_SANDBOX_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ubereats/sandbox/callback`,
      grant_type:    "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  const token: string = tokenData.access_token;
  if (!token) return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 400 });

  // Find created orders across all stores
  const results: Record<string, unknown> = { token_ok: true, scopes: tokenData.scope };
  let orderId: string | null = null;

  for (const storeId of STORES) {
    const r = await apiCall(token, "GET", `/v1/eats/stores/${storeId}/created-orders`);
    results[`created_orders_${storeId.slice(0, 8)}`] = { status: r.status, orders: (r.data as { orders?: unknown[] })?.orders?.length ?? 0 };
    const orders = (r.data as { orders?: { order_id: string }[] })?.orders ?? [];
    if (orders.length > 0 && !orderId) orderId = orders[0].order_id;
  }

  results.order_found = orderId ?? "none";

  if (orderId) {
    results["get_order_details"]   = await apiCall(token, "GET",  `/v2/eats/order/${orderId}`);
    results["accept_order"]        = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["mark_order_ready"]    = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["cancel_order"]        = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
    results["deny_order_note"]     = "Deny Order skipped — cannot deny an already accepted order";
  }

  return NextResponse.json(results, { status: 200 });
}
