import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'
import { sendPaymentConfirmedSms } from '@/lib/sms'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, sessionId } =
    body as Record<string, unknown>

  if (
    typeof razorpayOrderId !== 'string' ||
    typeof razorpayPaymentId !== 'string' ||
    typeof razorpaySignature !== 'string' ||
    typeof sessionId !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(razorpaySignature)
  const signaturesMatch =
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  if (!signaturesMatch) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({ where: { sessionId } })
  if (!payment) {
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
  }

  if (payment.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Enforce that the submitted order ID matches what we created for this session
  if (payment.razorpayOrderId !== razorpayOrderId) {
    return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 })
  }

  // Idempotency guard: reject if already captured to prevent double-processing
  if (payment.status === 'CAPTURED') {
    return NextResponse.json({ error: 'Payment already captured' }, { status: 409 })
  }

  const dbSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      companion: { include: { user: true } },
      request: { include: { user: true } },
    },
  })

  if (!dbSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Update payment, session, request atomically
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'CAPTURED',
        capturedAt: new Date(),
      },
    }),
    prisma.session.update({
      where: { id: sessionId },
      data: { status: 'SCHEDULED' },
    }),
    prisma.request.update({
      where: { id: payment.requestId },
      data: { status: 'PAYMENT_COMPLETE' },
    }),
  ])

  // Create earning record
  await prisma.earning.upsert({
    where: { sessionId },
    update: {},
    create: {
      providerProfileId: dbSession.companionId,
      sessionId,
      paymentId: payment.id,
      amount: payment.companionShare,
      status: 'PENDING',
    },
  })

  // Send emails (non-fatal)
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const companionFirstName = dbSession.companion.legalName.split(' ')[0]
    const scheduledDate = dbSession.scheduledDate
      ? new Intl.DateTimeFormat('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(dbSession.scheduledDate)
      : 'the scheduled date'
    const scheduledTime = dbSession.scheduledTime ?? ''

    // Email to family
    if (dbSession.request.user?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: dbSession.request.user.email,
        subject: `Payment confirmed — ${companionFirstName} will visit on ${scheduledDate}`,
        html: `
          <div style="font-family: DM Sans, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1C2B3A; font-family: Georgia, serif;">Payment Confirmed</h2>
            <p style="color: #374151;">Your session with <strong>${dbSession.companion.legalName}</strong> has been confirmed.</p>
            <div style="background: #FEF8F0; border-left: 4px solid #E07B2F; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #1C2B3A; font-weight: 600;">${companionFirstName} will visit on ${scheduledDate}${scheduledTime ? ` at ${scheduledTime}` : ''}</p>
              <p style="margin: 8px 0 0; color: #6B7280; font-size: 14px;">Location: ${dbSession.serviceCity}</p>
            </div>
            <p style="color: #6B7280; font-size: 14px;">You will receive a notification the moment ${companionFirstName} checks in at your parent's door.</p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">NearDear.in · Someone near. Someone dear.</p>
          </div>
        `,
      })
    }

    // Email to companion
    if (dbSession.companion.user?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: dbSession.companion.user.email,
        subject: `Session confirmed — please prepare for ${scheduledDate}`,
        html: `
          <div style="font-family: DM Sans, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1C2B3A; font-family: Georgia, serif;">Session Confirmed</h2>
            <p style="color: #374151;">A family has confirmed their session with you.</p>
            <div style="background: #F0FAF4; border-left: 4px solid #4A8C6F; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #1C2B3A; font-weight: 600;">Date: ${scheduledDate}${scheduledTime ? ` at ${scheduledTime}` : ''}</p>
              <p style="margin: 8px 0 0; color: #1C2B3A;">City: ${dbSession.serviceCity}</p>
            </div>
            <p style="color: #374151; font-size: 14px;">Please check in on the app when you arrive. The family will be notified immediately.</p>
            <p style="color: #6B7280; font-size: 13px; border-top: 1px solid #E5E7EB; padding-top: 12px; margin-top: 16px;">Reminder: Always be on time. Introduce yourself clearly. Submit your session note within 2 hours of completing the visit.</p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">NearDear.in · Someone near. Someone dear.</p>
          </div>
        `,
      })
    }
  } catch (emailError) {
    console.error('[PAYMENT VERIFY] Email send failed:', emailError)
  }

  // SMS — fire-and-forget
  if (dbSession.request.user?.phone) {
    const amountLabel = `₹${Math.round(payment.amount / 100)}`
    const dateLabel = dbSession.scheduledDate
      ? dbSession.scheduledDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : ''
    sendPaymentConfirmedSms(
      dbSession.request.user.phone,
      amountLabel,
      dbSession.companion.legalName,
      dateLabel
    ).catch(console.error)
  }

  // Audit log (non-fatal)
  try {
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: AuditAction.PAYMENT_CAPTURED,
        entityType: 'payment',
        entityId: payment.id,
        metadata: {
          razorpayPaymentId,
          sessionId,
          amount: payment.amount,
          companionShare: payment.companionShare,
          platformFee: payment.platformFee,
        },
      },
    })
  } catch (auditError) {
    console.error('[PAYMENT VERIFY] Audit log failed:', auditError)
  }

  return NextResponse.json({ success: true, sessionId })
}
