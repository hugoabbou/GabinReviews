import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.UBER_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ubereats/callback`;

  const url = new URL("https://auth.uber.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "eats.store eats.report");

  return NextResponse.redirect(url.toString());
}
