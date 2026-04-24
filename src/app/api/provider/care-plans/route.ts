import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  const allPlans = await prisma.carePlan.findMany({
    where: { providerProfileId: provider.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
      elderProfile: {
        select: { id: true, name: true, city: true, ageRange: true },
      },
      planSessions: {
        orderBy: { scheduledDate: 'asc' },
        take: 1,
      },
    },
  })

  const enriched = allPlans.map((plan) => {
    // Next session: first SCHEDULED plan session in the future
    const upcomingSession = plan.planSessions.find(
      (ps) => new Date(ps.scheduledDate) >= new Date() && ps.status === 'SCHEDULED'
    )

    return {
      id: plan.id,
      status: plan.status,
      frequency: plan.frequency,
      duration: plan.duration,
      billing: plan.billing,
      totalSessions: plan.totalSessions,
      sessionsCompleted: plan.sessionsCompleted,
      sessionsRemaining: plan.sessionsRemaining,
      planPricePerVisit: plan.planPricePerVisit,
      startDate: plan.startDate,
      endDate: plan.endDate,
      createdAt: plan.createdAt,
      user: plan.user,
      elderProfile: plan.elderProfile,
      serviceCategoryId: plan.serviceCategoryId,
      nextSession: upcomingSession
        ? { scheduledDate: upcomingSession.scheduledDate, scheduledTime: upcomingSession.scheduledTime }
        : null,
      guaranteedIncome: plan.sessionsRemaining * plan.planPricePerVisit,
    }
  })

  const active = enriched.filter((p) => ['ACTIVE', 'PAUSED'].includes(p.status))
  const past = enriched.filter((p) => ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(p.status))

  return NextResponse.json({ active, past })
}
