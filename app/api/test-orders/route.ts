import { NextResponse } from "next/server";

const SANDBOX_CLIENT_ID     = "HgCQpYAtiO2DqfoiVQZHLSFN5ipH8GsE";
const SANDBOX_CLIENT_SECRET = "qxrdpKK8LJj6nJdP8I-f31r7mGaKL17P0wcURXQq";
const SANDBOX_AUTH          = "https://sandbox-login.uber.com/oauth/v2/token";
const SANDBOX_API           = "https://test-api.uber.com";

async function getSandboxToken(): Promise<string> {
  const form = new FormData();
  form.append("client_id",     SANDBOX_CLIENT_ID);
  form.append("client_secret", SANDBOX_CLIENT_SECRET);
  form.append("grant_type",    "client_credentials");
  form.append("scope",         "eats.order eats.store eats.store.orders.read");
  const res  = await fetch(SANDBOX_AUTH, { method: "POST", body: form });
  const data = await res.json();
  return data.access_token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderUuid = searchParams.get("order_uuid");

  const token = await getSandboxToken();
  if (!token) return NextResponse.json({ error: "Could not obtain sandbox token" }, { status: 500 });

  // If an order UUID is provided, fetch its details (this is the Get Order Details call)
  if (orderUuid) {
    const res  = await fetch(`${SANDBOX_API}/v2/eats/order/${orderUuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json({ order_uuid: orderUuid, status: res.status, data });
  }

  // Otherwise list stores to confirm token works
  const storesRes  = await fetch(`${SANDBOX_API}/v1/eats/stores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const storesData = await storesRes.json();

  return NextResponse.json({
    sandbox_token: token.slice(0, 20) + "...",
    stores_status: storesRes.status,
    stores: storesData.stores?.map((s: { name: string; store_id: string }) => ({ name: s.name, store_id: s.store_id })),
    instructions: "Pass ?order_uuid=<uuid> to call Get Order Details once Uber injects a test order",
  });
}
