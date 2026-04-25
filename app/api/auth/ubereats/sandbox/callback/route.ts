import { NextResponse } from "next/server";

const SANDBOX_API  = "https://test-api.uber.com";
const SANDBOX_AUTH = "https://sandbox-login.uber.com/oauth/v2/token";

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

  // Exchange code for user-scoped token
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

  const results: Record<string, unknown> = { token_ok: true, scopes: tokenData.scope };

  // Get stores accessible to this user
  const storesR   = await apiCall(userToken, "GET", "/v1/eats/stores");
  const storeList = (storesR.data as { stores?: { store_id: string }[] })?.stores ?? [];
  results["get_stores"] = { status: storesR.status, count: storeList.length };

  // Get client_credentials token — has eats.order scope for GET order details
  const ccToken = await getClientCredToken();
  results["cc_token_ok"] = !!ccToken;

  // Find created orders using client_credentials token (has eats.store.orders.read)
  let orderId: string | null = null;
  if (ccToken) {
    for (const store of storeList) {
      const r      = await apiCall(ccToken, "GET", `/v1/eats/stores/${store.store_id}/created-orders`);
      const orders = (r.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`created_orders_${store.store_id.slice(0, 8)}`] = { status: r.status, count: orders.length };
      if (orders.length > 0 && !orderId) orderId = orders[0].order_id;
    }
  }

  results.order_found = orderId ?? "none";

  if (orderId) {
    // GET order details: use client_credentials token (has eats.order)
    if (ccToken) {
      results["get_order_details"] = await apiCall(ccToken, "GET", `/v2/eats/order/${orderId}`);
    }
    // Management endpoints: use user token (has eats.pos_provisioning, or eats.order if granted)
    const mgmtToken = userToken;
    results["accept_order"]     = await apiCall(mgmtToken, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["mark_order_ready"] = await apiCall(mgmtToken, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["deny_order"]       = await apiCall(mgmtToken, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["cancel_order"]     = await apiCall(mgmtToken, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  } else {
    // No orders yet — confirm scope status with dummy probe
    const dummy = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    results["scope_check_get_order"] = await apiCall(userToken, "GET",  `/v2/eats/order/${dummy}`);
    results["scope_check_accept"]    = await apiCall(userToken, "POST", `/v2/eats/orders/${dummy}/accept_pos_order`, {});
  }

  return NextResponse.json(results, { status: 200 });
}
