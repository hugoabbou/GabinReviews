import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

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
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    const storeIds = (process.env.UBER_STORE_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    return NextResponse.json({ stores: storeIds.map((id) => ({ id, name: id })) });
  }

  const token = await getUberToken();
  if (!token) {
    return NextResponse.json({ error: "Impossible d'obtenir un token Uber Eats" }, { status: 401 });
  }

  // Trigger async report and store job→store mapping
  const body = {
    report_type: "CUSTOMER_AND_DELIVERY_FEEDBACK_REPORT",
    store_uuids: [storeId],
    start_date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  };

  const reportRes = await fetch("https://api.uber.com/v1/eats/report", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (reportRes.ok) {
    const reportData = await reportRes.json();
    const jobId = reportData.workflow_id;
    if (jobId) {
      try {
        const jobStore = getStore("ubereats-jobs");
        await jobStore.set(jobId, storeId);
      } catch {}
    }
  }

  // Return cached reviews from previous webhook
  try {
    const reviewStore = getStore("ubereats-reviews");
    const cached = await reviewStore.get(storeId, { type: "text" });
    if (cached) {
      return NextResponse.json({ eater_feedbacks: JSON.parse(cached) });
    }
  } catch {}

  return NextResponse.json({ eater_feedbacks: [] });
}
