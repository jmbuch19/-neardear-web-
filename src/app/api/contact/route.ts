import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(200),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Message is too short').max(2000),
  honeypot: z.string().max(0).optional().or(z.literal('')),
})

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid submission' },
      { status: 400 },
    )
  }

  if (parsed.data.honeypot) {
    return NextResponse.json({ ok: true })
  }

  const { name, email, phone, message } = parsed.data
  const adminEmail = process.env.ADMIN_EMAIL
  const fromEmail = process.env.RESEND_FROM_EMAIL
  const apiKey = process.env.RESEND_API_KEY

  if (!adminEmail || !fromEmail || !apiKey) {
    console.error('[contact] missing env: ADMIN_EMAIL / RESEND_FROM_EMAIL / RESEND_API_KEY')
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  const phoneLine = phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: email,
      subject: `NearDear contact form — ${name}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A6B7A;">New contact form submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          ${phoneLine}
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background: #F7F3EE; padding: 16px; border-radius: 8px;">${escapeHtml(message)}</p>
          <hr style="margin: 24px 0; border: 0; border-top: 1px solid #E8E0D8;">
          <p style="color: #6B7C85; font-size: 12px;">Sent via neardear.in/contact</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[contact] resend error', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
