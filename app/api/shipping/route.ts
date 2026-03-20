import { NextResponse } from "next/server";
import { fetchAllShipping } from "@/lib/fred";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const shipping = await fetchAllShipping();
    return NextResponse.json({ shipping, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch shipping data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
