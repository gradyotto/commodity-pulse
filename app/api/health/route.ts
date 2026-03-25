import { NextResponse } from "next/server";
import { fetchAllCommodities, fetchAllShipping } from "@/lib/fred";
import { computeHealthScore } from "@/lib/healthScore";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const [commodities, shipping] = await Promise.all([
      fetchAllCommodities(),
      fetchAllShipping(),
    ]);

    const score = computeHealthScore(commodities, shipping);

    return NextResponse.json(
      { score, fetchedAt: new Date().toISOString() },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute health score";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
