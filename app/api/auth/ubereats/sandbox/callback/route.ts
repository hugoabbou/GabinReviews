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

  const results: Record<string, unknown> = { token_ok: true, scopes: tokenData.scope };

  // Get stores accessible to this user — log full data to see real store IDs
  const storesR = await apiCall(token, "GET", "/v1/eats/stores");
  const storeList = (storesR.data as { stores?: { store_id: string; name?: string }[] })?.stores ?? [];
  results["get_stores"] = { status: storesR.status, stores: storeList };

  const storeIds = storeList.map(s => s.store_id);

  // Try every variant of the sandbox order creation endpoint on each store
  let orderId: string | null = null;
  let usedStoreId: string | null = null;

  for (const storeId of storeIds) {
    const paths = [
      `/v1/eats/sandbox/stores/${storeId}/orders`,
      `/v1/eats/sandbox/stores/${storeId}/order`,
      `/v2/eats/sandbox/stores/${storeId}/orders`,
      `/v1/eats/stores/${storeId}/sandbox/orders`,
    ];
    for (const path of paths) {
      const r = await apiCall(token, "POST", path, {});
      results[`create_${path.replace(/\//g, "_")}`] = { status: r.status, data: r.data };
      const id = (r.data as { order_id?: string; id?: string })?.order_id
              ?? (r.data as { order_id?: string; id?: string })?.id
              ?? null;
      if (id && (r.status === 200 || r.status === 201)) {
        orderId = id;
        usedStoreId = storeId;
        break;
      }
    }
    if (orderId) break;
  }

  results.order_found = orderId ?? "none";
  results.store_used  = usedStoreId ?? "none";

  if (orderId) {
    results["get_order_details"] = await apiCall(token, "GET",  `/v2/eats/order/${orderId}`);
    results["accept_order"]      = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["mark_order_ready"]  = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["deny_order"]        = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["cancel_order"]      = await apiCall(token, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
