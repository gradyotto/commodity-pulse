import { getCachedBrief } from "@/lib/briefGeneration";

// Always hit KV — never serve a cached route response
export const dynamic = "force-dynamic";

export async function GET() {
  const cached = await getCachedBrief();

  if (!cached) {
    return new Response(null, { status: 204 });
  }

  return new Response(cached.text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Generated-At": cached.generatedAt,
    },
  });
}
