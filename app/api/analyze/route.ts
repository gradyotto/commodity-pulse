import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@vercel/kv";
import type { CommodityData, ShippingIndicator } from "@/types";

const client = new Anthropic();
const CACHE_TTL = 60 * 60 * 6; // 6 hours

type AnalysisTarget =
  | { type: "commodity"; data: CommodityData }
  | { type: "indicator"; data: ShippingIndicator };

async function getCached(key: string): Promise<string | null> {
  try { return await kv.get<string>(key); } catch { return null; }
}

async function setCached(key: string, value: string): Promise<void> {
  try { await kv.set(key, value, { ex: CACHE_TTL }); } catch { /* skip */ }
}

function buildPrompt(target: AnalysisTarget): string {
  if (target.type === "commodity") {
    const c = target.data;
    const hi = Math.max(...c.history.map((p) => p.value));
    const lo = Math.min(...c.history.map((p) => p.value));
    const avg = c.history.reduce((s, p) => s + p.value, 0) / c.history.length;

    return `You are a commodity analyst writing for procurement managers at domestic hardware and manufacturing companies.

Analyze ${c.name} (${c.symbol}) with this data:
- Current price: ${c.currentPrice.toFixed(2)} ${c.unit}
- Change vs prior period: ${c.changePercent > 0 ? "+" : ""}${c.changePercent.toFixed(2)}%
- Period high: ${hi.toLocaleString()} | Low: ${lo.toLocaleString()} | Avg: ${avg.toFixed(2)}
- Data frequency: ${c.frequency}
- Source: ${c.source}

Write a focused 3-paragraph analysis:
1. Current price context — where it sits relative to recent range, what the trend signals
2. What's driving the move — supply/demand factors, macro context relevant to this commodity
3. Procurement recommendation — specific action for buyers this week (buy ahead, hold, lock contracts, etc.)

Be direct and specific. Use the actual numbers. No fluff. 180–220 words total.`;
  }

  const s = target.data;
  const hi = Math.max(...s.history.map((p) => p.value));
  const lo = Math.min(...s.history.map((p) => p.value));
  const avg = s.history.reduce((sum, p) => sum + p.value, 0) / s.history.length;

  return `You are a supply chain analyst writing for procurement managers at domestic hardware and manufacturing companies.

Analyze ${s.name} with this data:
- Current value: ${s.currentValue.toFixed(2)} ${s.unit}
- Change vs prior period: ${s.changePercent > 0 ? "+" : ""}${s.changePercent.toFixed(2)}%
- Period high: ${hi.toFixed(2)} | Low: ${lo.toFixed(2)} | Avg: ${avg.toFixed(2)}
- Indicator context: ${s.description}
- Higher is ${s.higherIsBad ? "bad (cost pressure)" : "good (stronger activity)"}

Write a focused 3-paragraph analysis:
1. Current reading context — what the number means and where it sits in recent range
2. What's driving the move and what it signals for supply chain conditions
3. Operational recommendation — specific action for procurement/operations teams this week

Be direct and specific. Use actual numbers. No fluff. 180–220 words total.`;
}

export async function POST(req: Request) {
  const body = await req.json() as AnalysisTarget;
  const id = body.type === "commodity" ? body.data.id : body.data.id;
  const cacheKey = `analyze:${id}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Cache": "HIT" },
    });
  }

  const prompt = buildPrompt(body);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thinking = { type: "adaptive" } as any;

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 600,
    thinking,
    messages: [{ role: "user", content: prompt }],
  });

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    let accumulated = "";
    try {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          accumulated += event.delta.text;
          await writer.write(encoder.encode(event.delta.text));
        }
      }
      if (accumulated) await setCached(cacheKey, accumulated);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Cache": "MISS",
    },
  });
}
