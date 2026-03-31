import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_code`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_token`);
  }

  const response = NextResponse.redirect(`${BASE_URL}/?google_token=${tokenData.access_token}`);

  if (tokenData.refresh_token) {
    // Stocke le refresh token côté serveur pour tous les utilisateurs
    try {
      const store = getStore("google-tokens");
      await store.set("refresh_token", tokenData.refresh_token);
    } catch {}
  }

  return response;
}