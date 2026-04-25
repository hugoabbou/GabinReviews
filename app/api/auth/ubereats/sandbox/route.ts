import { NextResponse } from "next/server";

export async function GET() {
  const url = new URL("https://sandbox-login.uber.com/oauth/v2/authorize");
  url.searchParams.set("client_id",     process.env.UBER_SANDBOX_CLIENT_ID!);
  url.searchParams.set("redirect_uri",  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ubereats/sandbox/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope",         "eats.pos_provisioning eats.order");
  return NextResponse.redirect(url.toString());
}
