import { NextResponse } from "next/server";

const SANDBOX_AUTH = "https://sandbox-login.uber.com/oauth/v2/token";
const SANDBOX_API  = "https://test-api.uber.com";

async function getSandboxToken(): Promise<string> {
  const form = new URLSearchParams({
    client_id:     process.env.UBER_SANDBOX_CLIENT_ID!,
    client_secret: process.env.UBER_SANDBOX_CLIENT_SECRET!,
    grant_type:    "client_credentials",
    scope:         "eats.order eats.store eats.store.orders.read",
  });
  const res  = await fetch(SANDBOX_AUTH, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    form,
  });
  const data = await res.json();
  return data.access_token;
}

// GET /api/test-orders
// ?action=run-flow   → full test: fetch stores → created orders → order details
// ?order_uuid=xxx    → fetch a specific order
// (no params)        → list sandbox stores
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action    = searchParams.get("action");
  const orderUuid = searchParams.get("order_uuid");

  const token = await getSandboxToken();
  if (!token) return NextResponse.json({ error: "Could not obtain sandbox token" }, { status: 500 });

  // ── Fetch a specific order (Get Order Details) ────────────────────────────
  if (orderUuid) {
    const res  = await fetch(`${SANDBOX_API}/v2/eats/order/${orderUuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json({ order_uuid: orderUuid, status: res.status, data });
  }

  // ── Full test flow ─────────────────────────────────────────────────────────
  if (action === "run-flow") {
    const results: Record<string, unknown> = {};

    // 1. List stores
    const storesRes  = await fetch(`${SANDBOX_API}/v1/eats/stores`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const storesData = await storesRes.json();
    const stores: { store_id: string; name: string }[] = storesData.stores ?? [];
    results.stores = stores.map((s) => ({ id: s.store_id, name: s.name }));

    // 2. For each store, fetch created orders
    const allOrders: { store_id: string; order_id: string; details?: unknown; details_status?: number }[] = [];
    for (const store of stores) {
      const createdRes  = await fetch(`${SANDBOX_API}/v1/eats/stores/${store.store_id}/created-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const createdData = await createdRes.json();
      const orders: { order_id: string }[] = createdData.orders ?? [];
      for (const order of orders) {
        // 3. Get Order Details — this is the call Uber's checklist tracks
        const detailRes  = await fetch(`${SANDBOX_API}/v2/eats/order/${order.order_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detailData = await detailRes.json();
        allOrders.push({ store_id: store.store_id, order_id: order.order_id, details: detailData, details_status: detailRes.status });
      }
    }
    results.orders_fetched = allOrders.length;
    results.orders         = allOrders;
    results.instructions   = allOrders.length === 0
      ? "No test orders found yet. Register your webhook URL in the Uber developer portal for the test client, then trigger a test scenario from the portal to inject an order."
      : "Get Order Details called successfully for each order above.";

    return NextResponse.json(results);
  }

  // ── Default: list stores ───────────────────────────────────────────────────
  const storesRes  = await fetch(`${SANDBOX_API}/v1/eats/stores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const storesData = await storesRes.json();

  return NextResponse.json({
    sandbox_token: token.slice(0, 20) + "...",
    stores_status: storesRes.status,
    stores: storesData.stores?.map((s: { name: string; store_id: string }) => ({ name: s.name, store_id: s.store_id })),
    next_steps: [
      "1. Go to developer.uber.com → your test app (HgCQpYA...) → Webhooks",
      "2. Set webhook URL to: https://restaurantreviewshub.netlify.app/api/webhooks/ubereats",
      "3. Trigger a test scenario from the portal (Order Notification + Order Cancelled)",
      "4. Or call /api/test-orders?action=run-flow to manually fetch any waiting test orders",
    ],
  });
}
