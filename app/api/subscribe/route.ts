import { Resend } from "resend";

export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    return Response.json({ error: "Subscriptions not configured" }, { status: 503 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.contacts.create({ email, audienceId, unsubscribed: false });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return Response.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
