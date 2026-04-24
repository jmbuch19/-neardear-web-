import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

async function createRazorpayOrder(amountInPaise: number, receipt: string) {
  const keyId = process.env.RAZORPAY_KEY_ID ?? ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ''
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay order creation failed: ${text}`)
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const plan = await prisma.carePlan.findUnique({ where: { id } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Plan is not active' }, { status: 400 })
  }

  const monthlyAmount = plan.monthlyAmount ?? plan.totalPlanPrice
  const nextCycleNumber = plan.billingCycleCount + 1
  const now = new Date()

  const payment = await prisma.planPayment.create({
    data: {
      carePlanId: plan.id,
      cycleNumber: nextCycleNumber,
      amount: monthlyAmount,
      status: 'PENDING',
      dueDate: now,
    },
  })

  const razorpayOrder = await createRazorpayOrder(monthlyAmount * 100, `${plan.id}-cycle-${nextCycleNumber}`)

  await prisma.planPayment.update({
    where: { id: payment.id },
    data: { razorpayOrderId: razorpayOrder.id },
  })

  const lastBilled = plan.lastBilledDate ?? now
  await prisma.carePlan.update({
    where: { id: plan.id },
    data: {
      billingCycleCount: nextCycleNumber,
      lastBilledDate: now,
      nextBillingDate: addMonths(lastBilled, 1),
    },
  })

  return NextResponse.json({
    planId: plan.id,
    paymentId: payment.id,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: 'INR',
    cycleNumber: nextCycleNumber,
  })
}
