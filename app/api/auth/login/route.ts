import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const usersEnv = process.env.ADMIN_USERS;
    if (!usersEnv) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const validUser = usersEnv.split(",").some((entry: string) => {
      const [u, p] = entry.trim().split(":");
      return u === username && p === password;
    });

    if (!validUser) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("reviewshub_session", "active", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
