import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const usersEnv = process.env.ADMIN_USERS;
    const jwtSecret = process.env.JWT_SECRET;
    if (!usersEnv || !jwtSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let matchedUser: string | null = null;
    for (const entry of usersEnv.split(",")) {
      const trimmed = entry.trim();
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue;
      const u = trimmed.slice(0, colonIdx);
      const hash = trimmed.slice(colonIdx + 1);
      if (u === username && await bcrypt.compare(password, hash)) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({ sub: matchedUser })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({ success: true });
    response.cookies.set("reviewshub_session", token, {
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
