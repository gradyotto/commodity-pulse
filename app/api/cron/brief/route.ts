import { fetchAllCommodities, fetchAllShipping } from "@/lib/fred";
import { generateAndCacheBrief } from "@/lib/briefGeneration";

export const maxDuration = 300; // 5 min — Claude with thinking can be slow

export async function GET(req: Request) {
  // Vercel sends Authorization: Bearer {CRON_SECRET} for cron jobs.
  // Reject any other caller so this endpoint can't be abused.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const [commodities, shipping] = await Promise.all([
      fetchAllCommodities(),
      fetchAllShipping(),
    ]);

    if (commodities.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No commodity data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    await generateAndCacheBrief(commodities, shipping);

    return new Response(
      JSON.stringify({ ok: true, generatedAt: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/brief] Error:", message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
