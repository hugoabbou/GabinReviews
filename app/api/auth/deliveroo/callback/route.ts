import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_deliveroo_code`);
  }

  const tokenRes = await fetch("https://api.developers.deliveroo.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.DELIVEROO_CLIENT_ID!,
      client_secret: process.env.DELIVEROO_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/auth/deliveroo/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_deliveroo_token`);
  }

  const response = NextResponse.redirect(`${BASE_URL}/?deliveroo_token=${tokenData.access_token}`);

  if (tokenData.refresh_token) {
    try {
      const store = getStore("deliveroo-tokens");
      await store.set("refresh_token", tokenData.refresh_token);
    } catch {}
  }

  return response;
}
