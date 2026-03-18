import { NextResponse } from "next/server";

export async function GET() {
  const clientId = "589461069272-b24getneekbuhvoecb2koi336q99jkkj.apps.googleusercontent.com";
  const redirectUri = "https://next-js-starter-bevz.bolt.host/api/auth/google/callback";

  // Voici les adresses exactes que Google attend
  const scopes = [
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid"
  ].join(" ");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return NextResponse.redirect(url.toString());
}