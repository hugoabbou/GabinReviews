import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-uber-signature");
    const signingKey = process.env.UBER_WEBHOOK_SIGNING_KEY;

    if (signingKey && signature) {
      const expected = createHmac("sha256", signingKey).update(body).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log("Uber Eats webhook received:", JSON.stringify(data));
  } catch (e) {
    console.error("Webhook error:", e);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
