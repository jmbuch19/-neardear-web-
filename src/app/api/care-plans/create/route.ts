import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculatePlan } from '@/lib/carePlan'
import { PlanFrequency, PlanDuration, PlanBilling } from '@prisma/client'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

const DURATION_MONTHS: Record<string, number> = {
  ONE_MONTH: 1,
  THREE_MONTHS: 3,
  SIX_MONTHS: 6,
}

const DAY_NAME_TO_JS: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

function generateSessionDates(
  frequency: string,
  preferredDays: string[],
  totalSessions: number
): Date[] {
  const dates: Date[] = []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  let targetDays: number[]

  if (frequency === 'DAILY_WEEKDAYS') {
    targetDays = [1, 2, 3, 4, 5] // Mon–Fri
  } else {
    targetDays = preferredDays
      .map((d) => DAY_NAME_TO_JS[d])
      .filter((n): n is number => n !== undefined)
  }

  if (targetDays.length === 0) {
    targetDays = [1] // fallback Monday
  }

  const cursor = new Date(tomorrow)
  let safetyLimit = totalSessions * 14 + 100

  while (dates.length < totalSessions && safetyLimit-- > 0) {
    if (targetDays.includes(cursor.getDay())) {
      dates.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
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

  const {
    providerProfileId,
    serviceCategoryId,
    elderProfileId,
    frequency,
    duration,
    billing,
    preferredDays,
    preferredTime,
  } = body as {
    providerProfileId: string
    serviceCategoryId: string
    elderProfileId?: string
    frequency: string
    duration: string
    billing: string
    preferredDays: string[]
    preferredTime?: string
  }

  if (!providerProfileId || !serviceCategoryId || !frequency || !duration || !billing) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!Object.values(PlanFrequency).includes(frequency as PlanFrequency)) {
    return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
  }
  if (!Object.values(PlanDuration).includes(duration as PlanDuration)) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }
  if (!Object.values(PlanBilling).includes(billing as PlanBilling)) {
    return NextResponse.json({ error: 'Invalid billing' }, { status: 400 })
  }

  const [service, companion] = await Promise.all([
    prisma.serviceCategory.findUnique({
      where: { id: serviceCategoryId },
      select: { id: true, suggestedFeeMin: true },
    }),
    prisma.providerProfile.findUnique({
      where: { id: providerProfileId },
      select: { id: true },
    }),
  ])

  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  if (!companion) return NextResponse.json({ error: 'Companion not found' }, { status: 404 })

  const calc = calculatePlan(service.suggestedFeeMin, frequency, duration, billing)

  const now = new Date()
  const months = DURATION_MONTHS[duration] ?? 1
  const endDate = addMonths(now, months)
  const nextBillingDate = billing === 'MONTHLY' ? addMonths(now, 1) : null

  // Create plan
  const plan = await prisma.carePlan.create({
    data: {
      userId: session.user.id,
      elderProfileId: elderProfileId ?? null,
      providerProfileId,
      serviceCategoryId,
      frequency: frequency as PlanFrequency,
      duration: duration as PlanDuration,
      billing: billing as PlanBilling,
      totalSessions: calc.totalSessions,
      sessionsCompleted: 0,
      sessionsRemaining: calc.totalSessions,
      preferredDays: preferredDays ?? [],
      preferredTime: preferredTime ?? null,
      regularPricePerVisit: calc.regularPricePerVisit,
      discountPercent: calc.discountPercent,
      planPricePerVisit: calc.planPricePerVisit,
      totalRegularPrice: calc.totalRegularPrice,
      totalPlanPrice: calc.totalPlanPrice,
      totalSavings: calc.totalSavings,
      upfrontExtraDiscount: calc.upfrontExtraDiscount,
      monthlyAmount: calc.monthlyAmount,
      nextBillingDate,
      status: 'ACTIVE',
      startDate: now,
      endDate,
      lastBilledDate: now,
      billingCycleCount: 1,
    },
  })

  // Generate PlanSession records
  const sessionDates = generateSessionDates(frequency, preferredDays ?? [], calc.totalSessions)
  const scheduledTime = preferredTime ?? 'MORNING'

  if (sessionDates.length > 0) {
    await prisma.planSession.createMany({
      data: sessionDates.map((date) => ({
        carePlanId: plan.id,
        scheduledDate: date,
        scheduledTime,
        status: 'SCHEDULED',
      })),
    })
  }

  // Create first PlanPayment
  const firstPaymentAmount =
    billing === 'MONTHLY' ? (calc.monthlyAmount ?? calc.totalPlanPrice) : calc.totalPlanPrice

  const payment = await prisma.planPayment.create({
    data: {
      carePlanId: plan.id,
      cycleNumber: 1,
      amount: firstPaymentAmount,
      status: 'PENDING',
      dueDate: now,
    },
  })

  // Create Razorpay order
  const razorpayOrder = await createRazorpayOrder(firstPaymentAmount * 100, plan.id)

  // Update payment with Razorpay order ID
  await prisma.planPayment.update({
    where: { id: payment.id },
    data: { razorpayOrderId: razorpayOrder.id },
  })

  return NextResponse.json({
    planId: plan.id,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
  })
}
