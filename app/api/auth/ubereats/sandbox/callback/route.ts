import { NextResponse } from "next/server";

const SANDBOX_API  = "https://test-api.uber.com";
const SANDBOX_AUTH = "https://sandbox-login.uber.com/oauth/v2/token";

const STORES: Record<string, string> = {
  "d2c06181-e71a-4ed4-b0bb-06c046a100de": "Gabin",
  "e3d738e7-fb10-542b-88b4-b2d073ed5e1d": "CoteSushi",
};

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

  const cc = await getClientCredToken();
  const results: Record<string, unknown> = {
    user_scopes: tokenData.scope,
    cc_scopes:   cc?.scope ?? null,
  };

  const webhookUrl    = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ubereats`;
  const provisionBody = {
    integration_enabled: true,
    webhook_url:         webhookUrl,
    pos_type:            "CUSTOM",
  };

  // Try provisioning with CLIENT CREDENTIALS token (app acting as itself)
  if (cc) {
    for (const [storeId, name] of Object.entries(STORES)) {
      results[`provision_cc_${name}`] = await apiCall(cc.token, "POST", `/v1/eats/stores/${storeId}/pos_data`, provisionBody);
      if ((results[`provision_cc_${name}`] as { status: number }).status !== 200) {
        results[`provision_cc_put_${name}`] = await apiCall(cc.token, "PUT", `/v1/eats/stores/${storeId}/pos_data`, provisionBody);
      }
    }
  }

  // Also try with user token (different body formats)
  for (const [storeId, name] of Object.entries(STORES)) {
    results[`provision_user_${name}`] = await apiCall(userToken, "POST", `/v1/eats/stores/${storeId}/pos_data`, provisionBody);
    results[`provision_user_patch_${name}`] = await apiCall(userToken, "PATCH", `/v1/eats/stores/${storeId}/pos_data`, { integration_enabled: true, webhook_url: webhookUrl });
  }

  // Now try sandbox order creation
  let orderId: string | null = null;
  for (const [storeId, name] of Object.entries(STORES)) {
    const r  = await apiCall(userToken, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, {});
    results[`sandbox_order_user_${name}`] = { status: r.status, data: r.data };
    const id = (r.data as { order_id?: string })?.order_id ?? null;
    if (id && !orderId) orderId = id;

    if (!orderId && cc) {
      const r2 = await apiCall(cc.token, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, {});
      results[`sandbox_order_cc_${name}`] = { status: r2.status, data: r2.data };
      const id2 = (r2.data as { order_id?: string })?.order_id ?? null;
      if (id2) orderId = id2;
    }
  }

  // Check created-orders with cc token
  if (!orderId && cc) {
    for (const storeId of Object.keys(STORES)) {
      const r      = await apiCall(cc.token, "GET", `/v1/eats/stores/${storeId}/created-orders`);
      const orders = (r.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`created_orders_${storeId.slice(0, 8)}`] = { status: r.status, count: orders.length, data: r.data };
      if (orders.length > 0 && !orderId) orderId = orders[0].order_id;
    }
  }

  results.order_found = orderId ?? "none";

  if (orderId) {
    results["1_get_order_details"] = cc
      ? await apiCall(cc.token,  "GET",  `/v2/eats/order/${orderId}`)
      : { skipped: "no cc token" };
    results["2_accept_order"]      = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["3_mark_order_ready"]  = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["4_deny_order"]        = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["5_cancel_order"]      = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
