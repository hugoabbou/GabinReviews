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

  const results: Record<string, unknown> = { user_token_ok: true, user_scopes: tokenData.scope };

  // Client credentials token — for read endpoints (eats.order, eats.store.orders.read)
  const ccToken = await getClientCredToken();
  results["cc_token_ok"] = !!ccToken;

  // Get stores with user token
  const storesR   = await apiCall(userToken, "GET", "/v1/eats/stores");
  const storeList = (storesR.data as { stores?: { store_id: string }[] })?.stores ?? [];
  results["get_stores"] = { status: storesR.status, count: storeList.length };

  // Search for any existing order across all available listing paths
  let orderId: string | null = null;

  if (ccToken) {
    for (const store of storeList) {
      const sid = store.store_id;

      // Primary: created-orders (new orders awaiting POS acknowledgement)
      const r1 = await apiCall(ccToken, "GET", `/v1/eats/stores/${sid}/created-orders`);
      const created = (r1.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`created_orders_${sid.slice(0, 8)}`] = { status: r1.status, count: created.length };
      if (created.length > 0 && !orderId) orderId = created[0].order_id;

      // Try past orders endpoint
      const r2 = await apiCall(ccToken, "GET", `/v1/eats/stores/${sid}/orders`);
      const past = (r2.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`orders_${sid.slice(0, 8)}`] = { status: r2.status, count: past.length, data: r2.data };
      if (past.length > 0 && !orderId) orderId = past[0].order_id;
    }

    // Try top-level order listing
    const topOrders = await apiCall(ccToken, "GET", "/v1/eats/orders");
    results["top_level_orders"] = { status: topOrders.status, data: topOrders.data };

    // Try provisioning endpoint — register our client as POS for Tokyo Crunch (no current POS)
    const tokyoCrunch = "823e5f0a-2a7b-5b85-95c0-7160a2cecee7";
    const provR = await apiCall(userToken, "POST", `/v1/eats/stores/${tokyoCrunch}/pos_provisioning`, {});
    results["provision_tokyo_crunch"] = { status: provR.status, data: provR.data };

    const provR2 = await apiCall(userToken, "PUT", `/v1/eats/stores/${tokyoCrunch}/pos_provisioning`, {});
    results["provision_tokyo_crunch_put"] = { status: provR2.status, data: provR2.data };
  }

  results.order_found = orderId ?? "none";

  if (orderId) {
    // GET order details: client_credentials has eats.order
    if (ccToken) {
      results["get_order_details"] = await apiCall(ccToken, "GET", `/v2/eats/order/${orderId}`);
    }
    // Management: user token has eats.pos_provisioning (returns 404 not 401 — scope correct)
    results["accept_order"]     = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["mark_order_ready"] = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["deny_order"]       = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["cancel_order"]     = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
