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
  const data = await res.json();
  // Log first review to inspect field names
  if (data.reviews?.length) console.log("REVIEW SAMPLE:", JSON.stringify(data.reviews[0]));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const accessToken = req.headers.get("x-google-token");
  if (!accessToken) {
    return NextResponse.json({ error: "Non connecté à Google" }, { status: 401 });
  }

  const { accountId, locationId, reviewId, reply } = await req.json();

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: reply }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}