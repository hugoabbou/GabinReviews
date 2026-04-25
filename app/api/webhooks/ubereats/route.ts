import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";


function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  console.log("CSV headers:", headers.join(", "));
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

async function getToken(sandbox: boolean): Promise<{ token: string; apiBase: string } | null> {
  const clientId     = sandbox ? process.env.UBER_SANDBOX_CLIENT_ID!     : process.env.UBER_CLIENT_ID!;
  const clientSecret = sandbox ? process.env.UBER_SANDBOX_CLIENT_SECRET! : process.env.UBER_CLIENT_SECRET!;
  const authUrl      = sandbox ? "https://sandbox-login.uber.com/oauth/v2/token" : "https://auth.uber.com/oauth/v2/token";
  const apiBase      = sandbox ? "https://test-api.uber.com"                     : "https://api.uber.com";

  try {
    const res  = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    "client_credentials",
        scope:         "eats.order eats.store eats.store.orders.read",
      }),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    return { token: data.access_token, apiBase };
  } catch {
    return null;
  }
}

async function fetchOrderDetails(orderId: string): Promise<void> {
  // Try sandbox first (test phase), then production
  const isSandbox = !!(process.env.UBER_SANDBOX_CLIENT_ID || process.env.UBER_SANDBOX_MODE === "true");
  const creds = await getToken(isSandbox) ?? await getToken(!isSandbox);
  if (!creds) { console.error("No Uber token available for order details fetch"); return; }

  const res = await fetch(`${creds.apiBase}/v2/eats/order/${orderId}`, {
    headers: { Authorization: `Bearer ${creds.token}` },
  });
  const data = await res.json();
  console.log("Get Order Details status:", res.status, "order_id:", orderId, JSON.stringify(data).slice(0, 300));

  try {
    const orderStore = getStore("ubereats-orders");
    await orderStore.set(orderId, JSON.stringify({
      order_id:    orderId,
      status:      "pending",
      received_at: new Date().toISOString(),
      details:     data,
    }));
  } catch {}
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Uber Eats webhook event_type:", body.event_type, "body:", JSON.stringify(body).slice(0, 500));

    // Order notification — new order incoming
    if (
      body.event_type === "eats.order.scheduled"   ||
      body.event_type === "eats.order.notification" ||
      body.event_type === "orders.notification"
    ) {
      const orderId = body.order_id || body.meta?.resource_id;
      console.log("Order notification received, order_id:", orderId);
      if (orderId) {
        // Must be awaited — serverless functions terminate at return, fire-and-forget would never complete
        try { await fetchOrderDetails(orderId); } catch (e) { console.error("fetchOrderDetails error:", e); }
      }
    }

    // Order cancelled
    if (
      body.event_type === "eats.order.cancelled" ||
      body.event_type === "eats.order.cancel"    ||
      body.event_type === "orders.cancel"
    ) {
      const orderId = body.order_id || body.meta?.resource_id;
      console.log("Order cancelled, order_id:", orderId);
      try {
        if (orderId) {
          const orderStore = getStore("ubereats-orders");
          await orderStore.set(orderId, JSON.stringify({ order_id: orderId, status: "cancelled", cancelled_at: new Date().toISOString() }));
        }
      } catch {}
    }

    // Report ready
    if (body.event_type === "eats.report.success" && body.report_metadata?.sections?.length) {
      const jobId = body.job_id;

      let storeId = "";
      try {
        const jobStore = getStore("ubereats-jobs");
        storeId = await jobStore.get(jobId, { type: "text" }) || "";
      } catch {}

      for (const section of body.report_metadata.sections) {
        const csvRes  = await fetch(section.download_url);
        const csvText = await csvRes.text();
        const rows    = parseCSV(csvText);
        console.log(`Parsed ${rows.length} rows, store: ${storeId}, sample:`, JSON.stringify(rows[0]));

        if (rows.length > 0) {
          const reviewStore = getStore("ubereats-reviews");
          const key = storeId || section.section_id;
          await reviewStore.set(key, JSON.stringify(rows));
        }
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
