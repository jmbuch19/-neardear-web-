import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const plans = await prisma.carePlan.findMany({
    where: {
      status: 'ACTIVE',
      billing: 'MONTHLY',
      nextBillingDate: { lte: today },
    },
  })

  const results: Array<{ planId: string; success: boolean; error?: string }> = []

  for (const plan of plans) {
    try {
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

      const razorpayOrder = await createRazorpayOrder(
        monthlyAmount * 100,
        `${plan.id}-cycle-${nextCycleNumber}`
      )

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

      results.push({ planId: plan.id, success: true })
    } catch (err) {
      results.push({
        planId: plan.id,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const billed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    processed: plans.length,
    billed,
    failed,
    results,
  })
}
