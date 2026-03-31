import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_uber_code`);
  }

  const tokenRes = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.UBER_CLIENT_ID!,
      client_secret: process.env.UBER_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/auth/ubereats/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_uber_token`);
  }

  const response = NextResponse.redirect(`${BASE_URL}/?ubereats_token=${tokenData.access_token}`);

  if (tokenData.refresh_token) {
    try {
      const store = getStore("ubereats-tokens");
      await store.set("refresh_token", tokenData.refresh_token);
    } catch {}
  }

  return response;
}
