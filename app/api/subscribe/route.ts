import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    return Response.json({ error: "Subscriptions not configured" }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Add to audience and send welcome email in parallel
    await Promise.all([
      resend.contacts.create({ email, audienceId, unsubscribed: false }),
      resend.emails.send({
        from: process.env.RESEND_FROM ?? "Tiber Brief <brief@tibermfg.com>",
        to: email,
        subject: "You're subscribed to the Tiber Brief",
        html: await render(WelcomeEmail({ unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}" })),
      }),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return Response.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
