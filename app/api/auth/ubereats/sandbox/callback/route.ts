import { NextResponse } from "next/server";

const SANDBOX_API  = "https://test-api.uber.com";
const SANDBOX_AUTH = "https://sandbox-login.uber.com/oauth/v2/token";

const STORES: Record<string, string> = {
  "d2c06181-e71a-4ed4-b0bb-06c046a100de": "Gabin Pizza",
  "e3d738e7-fb10-542b-88b4-b2d073ed5e1d": "Cote Sushi",
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

async function getClientCredToken(): Promise<string | null> {
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
    return data.access_token ?? null;
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

  const ccToken = await getClientCredToken();
  const results: Record<string, unknown> = { user_scopes: tokenData.scope, cc_token_ok: !!ccToken };

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ubereats`;
  const provisionBody = { webhook_url: webhookUrl };

  // Step 1: Try to provision our app as POS for each store (various endpoint patterns)
  for (const [storeId, name] of Object.entries(STORES)) {
    const key = name.replace(" ", "_");
    const attempts: Record<string, unknown> = {};

    for (const [label, path, body] of [
      ["POST v2 pos_provisioning", `/v2/eats/stores/${storeId}/pos_provisioning`,  provisionBody],
      ["POST v1 pos_provisioning", `/v1/eats/stores/${storeId}/pos_provisioning`,  provisionBody],
      ["PUT  v2 pos_provisioning", `/v2/eats/stores/${storeId}/pos_provisioning`,  provisionBody],
      ["POST v1 pos_data",         `/v1/eats/stores/${storeId}/pos_data`,           provisionBody],
      ["PUT  v1 pos_data",         `/v1/eats/stores/${storeId}/pos_data`,           provisionBody],
      ["POST v1 pos",              `/v1/eats/stores/${storeId}/pos`,                provisionBody],
      ["POST v2 integration",      `/v2/eats/stores/${storeId}/integration`,        provisionBody],
    ] as [string, string, unknown][]) {
      const method = label.startsWith("PUT") ? "PUT" : "POST";
      const r = await apiCall(userToken, method, path, body);
      attempts[label] = { status: r.status, data: r.data };
      if (r.status === 200 || r.status === 201 || r.status === 204) break;
    }

    results[`provision_${key}`] = attempts;
  }

  // Step 2: Try to create sandbox test orders now (after provisioning attempt)
  let orderId: string | null = null;
  for (const [storeId, name] of Object.entries(STORES)) {
    const r = await apiCall(userToken, "POST", `/v1/eats/sandbox/stores/${storeId}/orders`, {});
    results[`sandbox_create_${name.replace(" ", "_")}`] = { status: r.status, data: r.data };
    const id = (r.data as { order_id?: string; id?: string })?.order_id
            ?? (r.data as { order_id?: string; id?: string })?.id
            ?? null;
    if (id && (r.status === 200 || r.status === 201) && !orderId) orderId = id;
  }

  // Step 3: Check created-orders with cc token
  if (!orderId && ccToken) {
    for (const storeId of Object.keys(STORES)) {
      const r      = await apiCall(ccToken, "GET", `/v1/eats/stores/${storeId}/created-orders`);
      const orders = (r.data as { orders?: { order_id: string }[] })?.orders ?? [];
      results[`created_orders_${storeId.slice(0, 8)}`] = { status: r.status, count: orders.length };
      if (orders.length > 0 && !orderId) orderId = orders[0].order_id;
    }
  }

  results.order_found = orderId ?? "none";

  if (orderId) {
    results["1_get_order_details"] = ccToken
      ? await apiCall(ccToken,   "GET",  `/v2/eats/order/${orderId}`)
      : { skipped: "no cc token" };
    results["2_accept_order"]      = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/accept_pos_order`, {});
    results["3_mark_order_ready"]  = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/ready_for_pickup`, {});
    results["4_deny_order"]        = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/deny_pos_order`, { reason: "ITEM_UNAVAILABLE", invalid_items: [] });
    results["5_cancel_order"]      = await apiCall(userToken, "POST", `/v2/eats/orders/${orderId}/cancel`, { reason: "STORE_CLOSED" });
  }

  return NextResponse.json(results, { status: 200 });
}
