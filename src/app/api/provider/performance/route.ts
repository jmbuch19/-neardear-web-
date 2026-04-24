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
    select: {
      id: true,
      reliabilityScore: true,
      totalSessions: true,
      avgFeedbackScore: true,
      advanceCancellations: true,
      shortNoticeCancels: true,
      noShowCount: true,
      selfArrangedCovers: true,
    },
  })

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  const recentFeedback = await prisma.feedback.findMany({
    where: {
      session: { companionId: provider.id },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      overallScore: true,
      concernText: true,
      hasConcern: true,
      createdAt: true,
      session: {
        select: {
          scheduledDate: true,
          request: {
            select: {
              requestServices: {
                include: { serviceCategory: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  return NextResponse.json({
    reliabilityScore: provider.reliabilityScore,
    totalSessions: provider.totalSessions,
    avgFeedbackScore: provider.avgFeedbackScore,
    advanceCancellations: provider.advanceCancellations,
    shortNoticeCancels: provider.shortNoticeCancels,
    noShowCount: provider.noShowCount,
    selfArrangedCovers: provider.selfArrangedCovers,
    recentFeedback,
  })
}
