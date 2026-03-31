import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.DELIVEROO_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/deliveroo/callback`;

  const url = new URL("https://api.developers.deliveroo.com/oauth2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "restaurant.read");

  return NextResponse.redirect(url.toString());
}
