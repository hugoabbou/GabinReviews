import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const accessToken = req.headers.get("x-deliveroo-token");

  if (!accessToken) {
    return NextResponse.json({ error: "Non connecté à Deliveroo" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  // List restaurants for the authenticated merchant
  if (!restaurantId) {
    const res = await fetch("https://api.developers.deliveroo.com/restaurant/v1/restaurants", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    return NextResponse.json(await res.json());
  }

  // Fetch reviews for a specific restaurant
  const res = await fetch(
    `https://api.developers.deliveroo.com/restaurant/v1/restaurants/${restaurantId}/reviews`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );
  return NextResponse.json(await res.json());
}
