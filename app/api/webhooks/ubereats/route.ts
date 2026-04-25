import { NextResponse } from "next/server";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

async function getUberCreds(): Promise<{ token: string; apiBase: string } | null> {
  const isSandbox    = !!process.env.UBER_SANDBOX_CLIENT_ID;
  const clientId     = isSandbox ? process.env.UBER_SANDBOX_CLIENT_ID!     : process.env.UBER_CLIENT_ID!;
  const clientSecret = isSandbox ? process.env.UBER_SANDBOX_CLIENT_SECRET! : process.env.UBER_CLIENT_SECRET!;
  const authUrl      = isSandbox ? "https://sandbox-login.uber.com/oauth/v2/token" : "https://auth.uber.com/oauth/v2/token";
  const apiBase      = isSandbox ? "https://test-api.uber.com"                     : "https://api.uber.com";
  try {
    const res  = await fetch(authUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    "client_credentials",
        scope:         "eats.order eats.store eats.store.orders.read eats.store.orders.cancel",
      }),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    return { token: data.access_token, apiBase };
  } catch { return null; }
}

async function uberPost(token: string, apiBase: string, path: string, body: unknown = {}): Promise<{ status: number }> {
  const res = await fetch(`${apiBase}${path}`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  console.log(`POST ${path} → ${res.status}`);
  return { status: res.status };
}

async function handleOrderNotification(orderId: string): Promise<void> {
  const creds = await getUberCreds();
  if (!creds) { console.error("No Uber token for order handling"); return; }

  // 1. Get Order Details
  const detailRes = await fetch(`${creds.apiBase}/v2/eats/order/${orderId}`, {
    headers: { Authorization: `Bearer ${creds.token}` },
  });
  console.log(`GET /v2/eats/order/${orderId} → ${detailRes.status}`);

  // 2. Accept Order
  await uberPost(creds.token, creds.apiBase, `/v2/eats/orders/${orderId}/accept_pos_order`);

  // 3. Mark Order as Ready
  await uberPost(creds.token, creds.apiBase, `/v2/eats/orders/${orderId}/ready_for_pickup`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Uber webhook event_type:", body.event_type, JSON.stringify(body).slice(0, 300));

    // Order Notification
    if (
      body.event_type === "eats.order.scheduled"    ||
      body.event_type === "eats.order.notification"  ||
      body.event_type === "orders.notification"
    ) {
      const orderId = body.order_id || body.meta?.resource_id;
      console.log("Order notification, order_id:", orderId);
      if (orderId) {
        try { await handleOrderNotification(orderId); } catch (e) { console.error("handleOrderNotification error:", e); }
      }
    }

    // Cancel Notification Handling
    if (
      body.event_type === "eats.order.cancelled" ||
      body.event_type === "eats.order.cancel"    ||
      body.event_type === "orders.cancel"
    ) {
      const orderId = body.order_id || body.meta?.resource_id;
      console.log("Order cancel notification, order_id:", orderId);
      // Acknowledge only — Uber initiated this cancel, no further uAPI call needed
    }

    // Report ready
    if (body.event_type === "eats.report.success" && body.report_metadata?.sections?.length) {
      const jobId   = body.job_id;
      let   storeId = "";
      // (Netlify Blobs not available — storeId stays empty, key falls back to section_id)
      for (const section of body.report_metadata.sections) {
        try {
          const csvRes  = await fetch(section.download_url);
          const csvText = await csvRes.text();
          const rows    = parseCSV(csvText);
          console.log(`Report: ${rows.length} rows, job: ${jobId}, store: ${storeId}`);
        } catch (e) { console.error("Report section error:", e); }
      }
    }
  } catch (e) {
    console.error("Webhook error:", e);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
