import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CAREERS_INBOX = "jaydeep@neardear.in";

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    );
  }

  const { name, email, phone, message } = parsed.data;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!fromEmail || !apiKey) {
    console.error("[careers] missing RESEND_API_KEY or RESEND_FROM_EMAIL");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const phoneLine = phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : "";

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromEmail,
      to: CAREERS_INBOX,
      replyTo: email,
      subject: `New career enquiry — NearDear`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px;">
          <h2 style="color:#1A6B7A;">New career enquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          ${phoneLine}
          <p><strong>What they would bring:</strong></p>
          <p style="white-space: pre-wrap; background:#F7F3EE; padding:16px; border-radius:8px;">${escapeHtml(message)}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[careers] resend error", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
