import { getCachedBrief } from "@/lib/briefGeneration";

export async function GET() {
  const cached = await getCachedBrief();

  if (!cached) {
    // No brief has been generated yet
    return new Response(null, { status: 204 });
  }

  return new Response(cached.text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Generated-At": cached.generatedAt,
    },
  });
}
