import { NextResponse } from "next/server";
import { fetchAllCommodities } from "@/lib/fred";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const commodities = await fetchAllCommodities();
    return NextResponse.json({ commodities, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch commodities";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
