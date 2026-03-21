import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@vercel/kv";
import type { CommodityData, ShippingIndicator } from "@/types";

const client = new Anthropic();

const CACHE_KEY = "brief:latest";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTrend(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}% (↑ rising)`;
  if (pct < 0) return `${pct.toFixed(1)}% (↓ falling)`;
  return "flat";
}

function buildContext(
  commodities: CommodityData[],
  shipping: ShippingIndicator[]
): string {
  const lines: string[] = [
    "=== RAW MATERIAL PRICES (latest period vs. prior period) ===",
  ];

  for (const c of commodities) {
    lines.push(
      `${c.name} (${c.symbol}): ${c.currentPrice.toFixed(2)} ${c.unit} — ${formatTrend(c.changePercent)} | as of ${c.lastUpdated}`
    );
  }

  lines.push("");
  lines.push("=== SUPPLY CHAIN & LOGISTICS INDICATORS ===");

  for (const s of shipping) {
    let context = "";
    if (s.id === "ism_pmi") {
      context =
        s.currentValue >= 50
          ? "(above 50 = manufacturing expansion)"
          : "(below 50 = manufacturing contraction)";
    } else if (s.id === "inv_ratio") {
      context = "(months of supply; rising = slower sales or better supply)";
    }
    lines.push(
      `${s.name}: ${s.currentValue.toFixed(1)} ${s.unit} — ${formatTrend(s.changePercent)} ${context} | as of ${s.lastUpdated}`
    );
  }

  return lines.join("\n");
}

// ── KV cache helpers (gracefully skip if KV is not configured) ───────────────

async function getCached(): Promise<string | null> {
  try {
    return await kv.get<string>(CACHE_KEY);
  } catch {
    return null; // KV not configured in this environment
  }
}

async function setCached(text: string): Promise<void> {
  try {
    await kv.set(CACHE_KEY, text, { ex: CACHE_TTL_SECONDS });
  } catch {
    // KV not configured — skip silently
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── Cache check ──────────────────────────────────────────────────────────
  const cached = await getCached();

  if (cached) {
    // Return the cached brief instantly. The client-side reader handles
    // both streamed and non-streamed responses identically.
    return new Response(cached, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Cache": "HIT",
        "X-Generated-At": new Date().toISOString(), // approximate
      },
    });
  }

  // ── Cache miss — generate with Claude ────────────────────────────────────
  const body = (await req.json()) as {
    commodities: CommodityData[];
    shipping: ShippingIndicator[];
  };

  const context = buildContext(body.commodities, body.shipping);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemPrompt = `You are a senior supply chain analyst who writes the weekly "Tiber Brief" — a concise, authoritative market intelligence report for procurement managers, operations directors, and executives at domestic hardware and manufacturing companies.

Your audience buys raw materials (metals, plastics, energy) in volume. They care about:
- How price changes affect their COGS and margins
- Whether to accelerate purchases (buy ahead) or hold
- Supply chain disruptions, lead-time risks, and logistics costs
- Actionable intelligence they can act on this week

Tone: direct, professional, data-driven. No fluff. Use specific numbers.`;

  const userPrompt = `Today is ${today}. Write the weekly Tiber Brief using the market data below.

Structure the brief exactly as follows (use these Markdown headers):

## 🏭 Market Pulse
2-3 sentence executive summary. Overall supply chain health this week (Stable / Cautious / Volatile). Single most important thing procurement managers need to know.

## 🔩 Materials Market
For each commodity with significant movement (>2% change), write 2-3 sentences: current price, direction, why it matters for manufacturers, and what to do. Group minor movers together in one sentence.

## 🚢 Logistics & Freight
2-3 sentences covering freight costs and supplier lead times. Flag any warning signs.

## 📋 Procurement Playbook
3-5 specific, actionable bullet points for this week. Examples: "Lock in Q2 copper contracts now — price climbing toward 12-month high" or "Hold steel inventory; PPI trending down."

## ⚠️ Watch List
2-3 items to monitor next week. Short bullets only.

---

MARKET DATA:
${context}

Keep the total brief to 450–650 words. Be specific — cite actual price numbers from the data.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thinking = { type: "adaptive" } as any;

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1500,
    thinking,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const generatedAt = new Date().toISOString();
  const encoder = new TextEncoder();

  // Stream to client while simultaneously accumulating for KV storage.
  // We use a TransformStream so both operations happen concurrently.
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  // Fire-and-forget: stream chunks to client, accumulate, then cache
  (async () => {
    let accumulated = "";
    try {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const text = event.delta.text;
          accumulated += text;
          await writer.write(encoder.encode(text));
        }
      }
      // Save the complete brief to KV after streaming finishes
      if (accumulated) {
        await setCached(accumulated);
      }
    } catch (err) {
      console.error("Brief generation error:", err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Cache": "MISS",
      "X-Generated-At": generatedAt,
    },
  });
}
