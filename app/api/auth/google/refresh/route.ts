import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

export async function POST() {
  let refreshToken: string | null = null;

  try {
    const store = getStore("google-tokens");
    refreshToken = await store.get("refresh_token", { type: "text" });
  } catch {}

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 });
  }

  return NextResponse.json({ access_token: tokenData.access_token });
}
