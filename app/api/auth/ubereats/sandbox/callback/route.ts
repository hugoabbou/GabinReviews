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

async function getClientCredToken(): Promise<{ token: string; scope: string } | null> {
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
    const data = await res.json();
    if (!data.access_token) return null;
    return { token: data.access_token, scope: data.scope };
  } catch { return null; }
}

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
  const userToken: string = tokenData.access_token;
  if (!userToken) return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 400 });

  const cc = await getClientCredToken();
  const results: Record<string, unknown> = { user_scopes: tokenData.scope };

  // Stores visible to user token (restaurant owner context)
  const userStoresR = await apiCall(userToken, "GET", "/v1/eats/stores");
  results["user_stores"] = userStoresR.data;

  // Stores visible to cc token (app context) — may reveal sandbox test stores
  if (cc) {
    const ccStoresR = await apiCall(cc.token, "GET", "/v1/eats/stores");
    results["cc_stores"] = ccStoresR.data;

    // Also try sandbox-specific store listing
    results["sandbox_stores"] = await apiCall(cc.token, "GET", "/v1/eats/sandbox/stores");
  }

  // Get all unique store IDs from both contexts
  const userStoreIds: string[] = ((userStoresR.data as { stores?: { store_id: string }[] })?.stores ?? []).map(s => s.store_id);
  const ccStoreIds: string[]   = cc ? (((await apiCall(cc.token, "GET", "/v1/eats/stores")).data as { stores?: { store_id: string }[] })?.stores ?? []).map(s => s.store_id) : [];
  const allIds = Array.from(new Set([...userStoreIds, ...ccStoreIds]));

  // Try sandbox order creation on every store with both tokens
  let orderId: string | null = null;
  for (const storeId of allIds) {
    const r1 = await apiCall(userToken, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, {});
    results[`create_user_${storeId.slice(0, 8)}`] = { status: r1.status, data: r1.data };
    const id1 = (r1.data as { order_id?: string })?.order_id ?? null;
    if (id1 && !orderId) orderId = id1;

    if (!orderId && cc) {
      const r2 = await apiCall(cc.token, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, {});
      results[`create_cc_${storeId.slice(0, 8)}`] = { status: r2.status, data: r2.data };
      const id2 = (r2.data as { order_id?: string })?.order_id ?? null;
      if (id2) orderId = id2;
    }
  }

  results.order_found = orderId ?? "none";

  if (orderId && cc) {
    results["1_get_order_details"] = await apiCall(cc.token,   "GET",  `/v2/eats/order/${orderId}`);
    results["2_accept_order"]      = await apiCall(userToken,  "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["3_mark_order_ready"]  = await apiCall(userToken,  "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["4_deny_order"]        = await apiCall(userToken,  "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["5_cancel_order"]      = await apiCall(userToken,  "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
