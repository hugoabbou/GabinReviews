import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const { email, password } = JSON.parse(text);
    
    const validEmail = "hugoabbou@gmail.com";
    const validPassword = "bonjour123";
    
    if (email !== validEmail || password !== validPassword) {
      return NextResponse.json({ error: `401: got email=${email} pass=${password}` }, { status: 401 });
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.set("reviewshub_session", "active", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Erreur: " + err }, { status: 500 });
  }
}