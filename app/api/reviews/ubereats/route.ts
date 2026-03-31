import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const accessToken = req.headers.get("x-ubereats-token");

  if (!accessToken) {
    return NextResponse.json({ error: "Non connecté à Uber Eats" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  // List stores for the authenticated merchant
  if (!storeId) {
    const res = await fetch("https://api.uber.com/v2/eats/stores", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return NextResponse.json(await res.json());
  }

  // Fetch eater feedback (reviews) for a specific store
  const res = await fetch(
    `https://api.uber.com/v2/eats/stores/${storeId}/eater_feedbacks`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return NextResponse.json(await res.json());
}
