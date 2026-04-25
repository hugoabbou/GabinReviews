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

async function getCC(): Promise<string | null> {
  try {
    const res = await fetch(SANDBOX_AUTH, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.UBER_SANDBOX_CLIENT_ID!,
        client_secret: process.env.UBER_SANDBOX_CLIENT_SECRET!,
        grant_type:    "client_credentials",
        scope:         "eats.order eats.store eats.store.orders.read eats.store.orders.cancel",
      }),
    });
    const d = await res.json();
    return d.access_token ?? null;
  } catch { return null; }
}

const STORE_IDS = [
  "d2c06181-e71a-4ed4-b0bb-06c046a100de", // Gabin
  "e3d738e7-fb10-542b-88b4-b2d073ed5e1d", // Côté Sushi
  "823e5f0a-2a7b-5b85-95c0-7160a2cecee7", // Tokyo Crunch
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No authorization code" }, { status: 400 });

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
  const ut: string = tokenData.access_token;
  if (!ut) return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 400 });

  const cc = await getCC();
  const results: Record<string, unknown> = {};

  // ── 1. Try to find the test store via various discovery paths ─────────────
  if (cc) {
    results["discover_v2_stores"]        = await apiCall(cc, "GET", "/v2/eats/stores");
    results["discover_sandbox_stores_v2"] = await apiCall(cc, "GET", "/v2/eats/sandbox/stores");
    results["discover_test_stores"]      = await apiCall(cc, "GET", "/v1/eats/test/stores");
    results["discover_sandbox_orders"]   = await apiCall(cc, "GET", "/v1/eats/sandbox/orders");
  }

  // ── 2. Get menu items for each store (needed for proper order body) ────────
  for (const storeId of STORE_IDS) {
    const r = await apiCall(ut, "GET", `/v1/eats/stores/${storeId}/menus`);
    results[`menu_${storeId.slice(0, 8)}`] = { status: r.status, hasData: !!r.data };
  }

  // ── 3. Try sandbox order creation with different body formats ──────────────
  let orderId: string | null = null;
  for (const storeId of STORE_IDS) {
    const bodies = [
      undefined,                                                    // no body
      {},                                                           // empty object
      { store_id: storeId },
      { workflow_uuid: crypto.randomUUID() },
      { order_type: "PICK_UP" },
      { request_type: "DELIVERY" },
      { payment_method: "UBER_PAY" },
      { test: true },
    ];
    for (const body of bodies) {
      const r = await apiCall(ut, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, body);
      if (r.status === 200 || r.status === 201) {
        const id = (r.data as { order_id?: string })?.order_id ?? null;
        results[`created_order_${storeId.slice(0, 8)}`] = { status: r.status, data: r.data };
        if (id) { orderId = id; break; }
      }
    }
    if (orderId) break;

    // Also try with cc token
    if (cc) {
      const r2 = await apiCall(cc, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, {});
      if (r2.status === 200 || r2.status === 201) {
        const id = (r2.data as { order_id?: string })?.order_id ?? null;
        results[`created_order_cc_${storeId.slice(0, 8)}`] = { status: r2.status, data: r2.data };
        if (id) { orderId = id; break; }
      }
    }
  }

  // ── 4. Check created-orders ────────────────────────────────────────────────
  if (!orderId) {
    for (const storeId of STORE_IDS) {
      const t = cc ?? ut;
      const r = await apiCall(t, "GET", `/v1/eats/stores/${storeId}/created-orders`);
      const orders = (r.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`created_orders_${storeId.slice(0, 8)}`] = { status: r.status, count: orders.length };
      if (orders.length > 0 && !orderId) orderId = orders[0].order_id;
    }
  }

  results.order_found = orderId ?? "none";

  // ── 5. Call all 6 required endpoints ──────────────────────────────────────
  if (orderId) {
    results["1_get_order_details"] = cc
      ? await apiCall(cc, "GET", `/v2/eats/order/${orderId}`)
      : { skipped: "no cc token" };
    results["2_accept_order"]     = await apiCall(ut, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["3_mark_order_ready"] = await apiCall(ut, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["4_deny_order"]       = await apiCall(ut, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["5_cancel_order"]     = await apiCall(ut, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
