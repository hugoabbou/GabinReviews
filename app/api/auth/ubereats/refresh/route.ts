import { NextResponse } from "next/server";

export async function POST() {
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

  if (!data.access_token) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 401 });
  }

  return NextResponse.json({ access_token: data.access_token });
}
