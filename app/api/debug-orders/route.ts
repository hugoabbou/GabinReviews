import { NextResponse } from "next/server";
import { getStore, listStores } from "@netlify/blobs";

export async function GET() {
  try {
    const orderStore = getStore("ubereats-orders");
    const { blobs } = await orderStore.list();
    const orders = await Promise.all(
      blobs.map(async (b) => {
        const data = await orderStore.get(b.key, { type: "text" });
        return { key: b.key, data: data ? JSON.parse(data) : null };
      })
    );
    return NextResponse.json({ count: orders.length, orders });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
