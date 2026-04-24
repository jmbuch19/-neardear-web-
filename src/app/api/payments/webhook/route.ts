import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendRefundSms } from '@/lib/sms'

// Razorpay calls this — no auth, but signature verified on every request
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-razorpay-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  const signaturesMatch =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  if (!signaturesMatch) {
    return new Response('Invalid signature', { status: 400 })
  }

  let event: { event: string; payload: Record<string, unknown> }
  try {
    event = JSON.parse(body) as typeof event
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Always return 200 so Razorpay doesn't retry forever
  // Process events best-effort
  try {
    await handleEvent(event)
  } catch (err) {
    console.error('[WEBHOOK] Handler failed:', event.event, err)
  }

  return new Response('OK', { status: 200 })
}

async function handleEvent(event: { event: string; payload: Record<string, unknown> }) {
  const eventName = event.event

  if (eventName === 'payment.captured') {
    const paymentEntity = (event.payload as { payment?: { entity?: { order_id?: string; id?: string } } })
      ?.payment?.entity
    const orderId = paymentEntity?.order_id
    const razorpayPaymentId = paymentEntity?.id

    if (!orderId) return

    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } })
    if (!payment) return

    // Only update if not already captured (verify route may have already done this)
    if (payment.status !== 'CAPTURED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          razorpayPaymentId: razorpayPaymentId ?? payment.razorpayPaymentId,
          capturedAt: new Date(),
        },
      })
    }
  }

  if (eventName === 'payment.failed') {
    const paymentEntity = (event.payload as { payment?: { entity?: { order_id?: string } } })
      ?.payment?.entity
    const orderId = paymentEntity?.order_id
    if (!orderId) return

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { session: { include: { request: { include: { user: true } } } } },
    })
    if (!payment) return

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    })

    // Notify family (non-fatal)
    try {
      const userEmail = payment.session?.request?.user?.email
      if (userEmail) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: userEmail,
          subject: 'Payment failed — please try again',
          html: `
            <div style="font-family: DM Sans, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1C2B3A;">Payment was not successful</h2>
              <p style="color: #374151;">Your payment could not be processed. Your session is still reserved — please try again.</p>
              <a href="${process.env.PLATFORM_URL}/session/${payment.sessionId}"
                style="display: inline-block; background: #E07B2F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
                Retry Payment →
              </a>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">NearDear.in · Someone near. Someone dear.</p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.error('[WEBHOOK] Failed email on payment.failed:', emailErr)
    }
  }

  if (eventName === 'refund.created') {
    const refundEntity = (event.payload as { refund?: { entity?: { payment_id?: string; amount?: number } } })
      ?.refund?.entity
    const razorpayPaymentId = refundEntity?.payment_id
    if (!razorpayPaymentId) return

    const payment = await prisma.payment.findUnique({
      where: { razorpayPaymentId },
      include: {
        earning: true,
        session: {
          include: {
            companion: { include: { user: true } },
            request: { include: { user: { select: { phone: true } } } },
          },
        },
      },
    })
    if (!payment) return

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refundEntity?.amount ? Math.round(refundEntity.amount / 100) : undefined,
      },
    })

    if (payment.earning) {
      await prisma.earning.update({
        where: { id: payment.earning.id },
        data: { status: 'CANCELLED' },
      })
    }

    // SMS to family user — fire-and-forget
    const familyPhone = payment.session?.request?.user?.phone
    const refundAmountRupees = refundEntity?.amount ? Math.round(refundEntity.amount / 100) : 0
    if (familyPhone && refundAmountRupees > 0) {
      sendRefundSms(familyPhone, String(refundAmountRupees)).catch(console.error)
    }

    // Notify companion (non-fatal)
    try {
      const companionEmail = payment.session?.companion?.user?.email
      if (companionEmail) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: companionEmail,
          subject: 'Session refunded',
          html: `
            <div style="font-family: DM Sans, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1C2B3A;">This session has been refunded</h2>
              <p style="color: #374151;">The payment for your upcoming session has been refunded to the family.</p>
              <p style="color: #6B7280; font-size: 14px;">If you have any questions, please contact support@neardear.in.</p>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">NearDear.in · Someone near. Someone dear.</p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.error('[WEBHOOK] Failed email on refund.created:', emailErr)
    }
  }
}
