import { NextResponse } from "next/server";

const SANDBOX_API = "https://test-api.uber.com";

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

// Known sandbox order IDs from Uber docs / portal
const KNOWN_SANDBOX_ORDER_IDS = [
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "00000000-0000-0000-0000-000000000001",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  // If ?order_id=xxx is passed, skip OAuth and test that order ID directly
  const directOrderId = searchParams.get("order_id");

  let token: string;

  if (directOrderId) {
    // Use client_credentials token for direct order ID test
    const tokenRes = await fetch("https://sandbox-login.uber.com/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.UBER_SANDBOX_CLIENT_ID!,
        client_secret: process.env.UBER_SANDBOX_CLIENT_SECRET!,
        grant_type:    "client_credentials",
        scope:         "eats.order eats.store eats.store.orders.read eats.store.orders.cancel",
      }),
    });
    const td = await tokenRes.json();
    token = td.access_token;
    const results: Record<string, unknown> = { token_type: "client_credentials", scopes: td.scope };
    results["get_order_details"] = await apiCall(token, "GET",  `/v2/eats/order/${directOrderId}`);
    results["accept_order"]      = await apiCall(token, "POST", `/v2/eats/orders/${directOrderId}/accept_pos_order`, {});
    results["mark_order_ready"]  = await apiCall(token, "POST", `/v2/eats/orders/${directOrderId}/ready_for_pickup`, {});
    results["deny_order"]        = await apiCall(token, "POST", `/v2/eats/orders/${directOrderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["cancel_order"]      = await apiCall(token, "POST", `/v2/eats/orders/${directOrderId}/cancel`, { reason: "STORE_CLOSED" });
    return NextResponse.json(results, { status: 200 });
  }

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
  token = tokenData.access_token;
  if (!token) return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 400 });

  const results: Record<string, unknown> = { token_ok: true, scopes: tokenData.scope };

  // Get stores
  const storesR  = await apiCall(token, "GET", "/v1/eats/stores");
  const storeList = (storesR.data as { stores?: { store_id: string }[] })?.stores ?? [];
  results["get_stores"] = { status: storesR.status, count: storeList.length };

  // Diagnostic: probe management endpoints with a dummy UUID
  // 404 = scope OK (order not found), 401/403 = wrong scope
  const dummy = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  results["scope_probe_get_order"]    = await apiCall(token, "GET",  `/v2/eats/order/${dummy}`);
  results["scope_probe_accept"]       = await apiCall(token, "POST", `/v2/eats/orders/${dummy}/accept_pos_order`, {});
  results["scope_probe_ready"]        = await apiCall(token, "POST", `/v2/eats/orders/${dummy}/ready_for_pickup`, {});
  results["scope_probe_deny"]         = await apiCall(token, "POST", `/v2/eats/orders/${dummy}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
  results["scope_probe_cancel"]       = await apiCall(token, "POST", `/v2/eats/orders/${dummy}/cancel`, { reason: "STORE_CLOSED" });

  // Also try a few known sandbox UUIDs
  for (const knownId of KNOWN_SANDBOX_ORDER_IDS) {
    results[`known_order_${knownId.slice(0, 8)}`] = await apiCall(token, "GET", `/v2/eats/order/${knownId}`);
  }

  // Try fetching orders list via different paths
  for (const storeId of storeList.map(s => s.store_id)) {
    results[`store_orders_${storeId.slice(0, 8)}`]   = await apiCall(token, "GET", `/v1/eats/stores/${storeId}/orders`);
    results[`store_created_${storeId.slice(0, 8)}`]  = await apiCall(token, "GET", `/v1/eats/stores/${storeId}/created-orders`);
  }

  return NextResponse.json(results, { status: 200 });
}
