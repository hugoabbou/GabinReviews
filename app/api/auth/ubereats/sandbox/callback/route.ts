import { NextResponse } from "next/server";

const SANDBOX_API  = "https://test-api.uber.com";
const SANDBOX_AUTH = "https://sandbox-login.uber.com/oauth/v2/token";

// Only the two stores this app manages
const STORES = [
  "d2c06181-e71a-4ed4-b0bb-06c046a100de", // Gabin Pizza
  "e3d738e7-fb10-542b-88b4-b2d073ed5e1d", // Côté Sushi
];

async function apiCall(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${SANDBOX_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function getClientCredToken(): Promise<string | null> {
  try {
    const res  = await fetch(SANDBOX_AUTH, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.UBER_SANDBOX_CLIENT_ID!,
        client_secret: process.env.UBER_SANDBOX_CLIENT_SECRET!,
        grant_type:    "client_credentials",
        scope:         "eats.order eats.store eats.store.orders.read eats.store.orders.cancel",
      }),
    });
    const data = await res.json();
    return data.access_token ?? null;
  } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No authorization code" }, { status: 400 });

  // User token (eats.pos_provisioning) — for management endpoints
  const tokenRes = await fetch(SANDBOX_AUTH, {
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
  const userToken: string = tokenData.access_token;
  if (!userToken) return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 400 });

  const results: Record<string, unknown> = { user_scopes: tokenData.scope };

  // Client credentials token — for read endpoints (has eats.order + eats.store.orders.read)
  const ccToken = await getClientCredToken();

  // Find any pending order across our two stores
  let orderId: string | null = null;
  if (ccToken) {
    for (const storeId of STORES) {
      const r      = await apiCall(ccToken, "GET", `/v1/eats/stores/${storeId}/created-orders`);
      const orders = (r.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`created_orders_${storeId.slice(0, 8)}`] = { status: r.status, count: orders.length };
      if (orders.length > 0 && !orderId) orderId = orders[0].order_id;
    }
  }

  results.order_found = orderId ?? "none — Uber must inject a test order to proceed";

  if (orderId) {
    // 1. Get Order Details — client credentials has eats.order
    results["1_get_order_details"] = ccToken
      ? await apiCall(ccToken,  "GET",  `/v2/eats/order/${orderId}`)
      : { error: "no cc token" };

    // 2–5. Management — user token has eats.pos_provisioning (scope verified: 404 not 401)
    results["2_accept_order"]     = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["3_mark_order_ready"] = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["4_deny_order"]       = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["5_cancel_order"]     = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
