import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@vercel/kv";
import type { CommodityData, ShippingIndicator } from "@/types";

const client = new Anthropic();

const BRIEF_CACHE_KEY = "brief:v2"; // single JSON object { text, generatedAt }
const CACHE_TTL_SECONDS = 60 * 60 * 36; // 36h — survive a missed cron run

// ── Context builder ───────────────────────────────────────────────────────────

function formatTrend(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}% (↑ rising)`;
  if (pct < 0) return `${pct.toFixed(1)}% (↓ falling)`;
  return "flat";
}

export function buildBriefContext(
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
    if (s.id === "inv_ratio") {
      context = "(months of supply; rising = slower sales or better supply)";
    }
    lines.push(
      `${s.name}: ${s.currentValue.toFixed(1)} ${s.unit} — ${formatTrend(s.changePercent)} ${context} | as of ${s.lastUpdated}`
    );
  }

  return lines.join("\n");
}

// ── KV helpers ────────────────────────────────────────────────────────────────

export async function getCachedBrief(): Promise<{ text: string; generatedAt: string } | null> {
  try {
    const entry = await kv.get<{ text: string; generatedAt: string }>(BRIEF_CACHE_KEY);
    if (!entry?.text) return null;
    return entry;
  } catch {
    return null;
  }
}

async function setCachedBrief(text: string, generatedAt: string): Promise<void> {
  try {
    await kv.set(BRIEF_CACHE_KEY, { text, generatedAt }, { ex: CACHE_TTL_SECONDS });
  } catch {
    // KV not configured — skip silently
  }
}

// ── Generation ────────────────────────────────────────────────────────────────

export async function generateAndCacheBrief(
  commodities: CommodityData[],
  shipping: ShippingIndicator[]
): Promise<string> {
  const context = buildBriefContext(commodities, shipping);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemPrompt = `You are a senior supply chain analyst who writes the daily "Tiber Brief" — a concise, authoritative market intelligence report for procurement managers, operations directors, and executives at domestic hardware and manufacturing companies.

Your audience buys raw materials (metals, plastics, energy) in volume. They care about:
- How price changes affect their COGS and margins
- Whether to accelerate purchases (buy ahead) or hold
- Supply chain disruptions, lead-time risks, and logistics costs
- Actionable intelligence they can act on this week

Tone: direct, professional, data-driven. No fluff. Use specific numbers.`;

  const userPrompt = `Today is ${today}. Write the daily Tiber Brief using the market data below.

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
2-3 items to monitor this week. Short bullets only.

---

MARKET DATA:
${context}

Keep the total brief to 450–650 words. Be specific — cite actual price numbers from the data.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thinking = { type: "adaptive" } as any;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1500,
    thinking,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const generatedAt = new Date().toISOString();
  await setCachedBrief(text, generatedAt);
  return text;
}
