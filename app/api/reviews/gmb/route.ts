import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const accessToken = req.headers.get("x-google-token");

  if (!accessToken) {
    return NextResponse.json({ error: "Non connecté à Google" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId  = searchParams.get("accountId");
  const locationId = searchParams.get("locationId");

  if (!accountId) {
    const res = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return NextResponse.json(await res.json());
  }

  if (!locationId) {
    const res = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return NextResponse.json(await res.json());
  }

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return NextResponse.json(await res.json());
}