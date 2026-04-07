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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Uber Eats webhook event_type:", body.event_type);

    if (body.event_type === "eats.report.success" && body.report_metadata?.sections?.length) {
      const jobId = body.job_id;

      // Look up store_id from job_id mapping
      let storeId = "";
      try {
        const jobStore = getStore("ubereats-jobs");
        storeId = await jobStore.get(jobId, { type: "text" }) || "";
      } catch {}

      for (const section of body.report_metadata.sections) {
        const csvRes = await fetch(section.download_url);
        const csvText = await csvRes.text();
        const rows = parseCSV(csvText);
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
