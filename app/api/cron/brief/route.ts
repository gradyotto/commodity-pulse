import { Resend } from "resend";
import { fetchAllCommodities, fetchAllShipping } from "@/lib/fred";
import { generateAndCacheBrief, briefToHtml } from "@/lib/briefGeneration";

export const maxDuration = 300; // 5 min — Claude with thinking can be slow

async function sendBriefToSubscribers(text: string, generatedAt: string): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId || !process.env.RESEND_API_KEY) return;

  const dateStr = new Date(generatedAt).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: broadcast } = await resend.broadcasts.create({
      audienceId,
      from: process.env.RESEND_FROM ?? "Tiber Brief <brief@tibermfg.com>",
      subject: `Tiber Brief — ${dateStr}`,
      html: briefToHtml(text, generatedAt),
    });

    if (broadcast?.id) {
      await resend.broadcasts.send(broadcast.id);
      console.log(`[cron/brief] Broadcast sent: ${broadcast.id}`);
    }
  } catch (err) {
    // Don't fail the cron if email sending fails — brief is already cached
    console.error("[cron/brief] Email broadcast error:", err);
  }
}

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

    const generatedAt = new Date().toISOString();
    const text = await generateAndCacheBrief(commodities, shipping);

    // Send to email subscribers (non-blocking — cron succeeds even if this fails)
    await sendBriefToSubscribers(text, generatedAt);

    return new Response(
      JSON.stringify({ ok: true, generatedAt }),
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
