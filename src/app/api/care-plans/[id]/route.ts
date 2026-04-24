import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const plan = await prisma.carePlan.findUnique({
    where: { id },
    include: {
      planSessions: { orderBy: { scheduledDate: 'asc' } },
      planPayments: { orderBy: { cycleNumber: 'asc' } },
      providerProfile: { select: { legalName: true, selfieUrl: true } },
    },
  })

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(plan)
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const plan = await prisma.carePlan.findUnique({ where: { id } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, pausedUntil, cancelReason, preferredTime } = body as {
    action: 'pause' | 'cancel' | 'update_time'
    pausedUntil?: string
    cancelReason?: string
    preferredTime?: string
  }

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 })
  }

  if (action === 'pause') {
    const updated = await prisma.carePlan.update({
      where: { id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        pausedUntil: pausedUntil ? new Date(pausedUntil) : null,
      },
    })
    return NextResponse.json(updated)
  }

  if (action === 'cancel') {
    const remainingSessions = plan.sessionsRemaining
    const refundAmount = remainingSessions * plan.planPricePerVisit
    // Companion compensation: proportional to completed sessions
    const companionCompAmount =
      plan.sessionsCompleted > 0
        ? plan.sessionsCompleted * plan.planPricePerVisit
        : 0

    const updated = await prisma.carePlan.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: cancelReason ?? null,
        refundAmount,
        companionCompAmount,
      },
    })
    return NextResponse.json(updated)
  }

  if (action === 'update_time') {
    if (!preferredTime) {
      return NextResponse.json({ error: 'preferredTime is required for update_time' }, { status: 400 })
    }
    const updated = await prisma.carePlan.update({
      where: { id },
      data: { preferredTime },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
