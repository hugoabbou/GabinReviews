import { NextResponse } from "next/server";

async function getUberToken(): Promise<string | null> {
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID!,
      client_secret: process.env.UBER_CLIENT_SECRET!,
      grant_type: "client_credentials",
      scope: "eats.store eats.report",
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function GET(req: Request) {
  const token = await getUberToken();
  if (!token) {
    return NextResponse.json({ error: "Impossible d'obtenir un token Uber Eats" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  // List stores: return configured store IDs from env var
  if (!storeId) {
    const storeIds = (process.env.UBER_STORE_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const stores = storeIds.map((id) => ({ id, name: id }));
    return NextResponse.json({ stores });
  }

  // Try async report API with different report_type values
  const reportTypes = [
    "EATER_FEEDBACK",
    "CUSTOMER_FEEDBACK",
    "FEEDBACK",
    "EATER_REVIEW",
    "STORE_FEEDBACK",
  ];

  for (const reportType of reportTypes) {
    const body = {
      report_type: reportType,
      store_uuids: [storeId],
      start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
    };

    const res = await fetch("https://api.uber.com/v1/eats/report", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log(`Uber report [${res.status}] type=${reportType} → ${text.slice(0, 300)}`);

    if (res.status === 200 || res.status === 201 || res.status === 202) {
      try {
        const data = JSON.parse(text);
        // Report job created — return job info so we can poll later
        return NextResponse.json({ _report_job: data, _report_type: reportType, feedbacks: [], eater_feedbacks: [] });
      } catch {}
    }
  }

  return NextResponse.json({ feedbacks: [], eater_feedbacks: [], _debug: "all report types failed" });
}
