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

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  // Aggregate this month
  const thisMonthAgg = await prisma.earning.aggregate({
    where: {
      providerProfileId: provider.id,
      createdAt: { gte: startOfThisMonth },
      status: { in: ['RELEASED', 'PROCESSING', 'PAID'] },
    },
    _sum: { amount: true },
    _count: true,
  })

  // Aggregate last month
  const lastMonthAgg = await prisma.earning.aggregate({
    where: {
      providerProfileId: provider.id,
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      status: { in: ['RELEASED', 'PROCESSING', 'PAID'] },
    },
    _sum: { amount: true },
  })

  // All time
  const allTimeAgg = await prisma.earning.aggregate({
    where: {
      providerProfileId: provider.id,
      status: { in: ['RELEASED', 'PROCESSING', 'PAID'] },
    },
    _sum: { amount: true },
  })

  // Available to withdraw (RELEASED status — confirmed but not yet withdrawn)
  const availableAgg = await prisma.earning.aggregate({
    where: {
      providerProfileId: provider.id,
      status: 'RELEASED',
    },
    _sum: { amount: true },
  })

  // Pending release (PENDING — session not yet confirmed)
  const pendingAgg = await prisma.earning.aggregate({
    where: {
      providerProfileId: provider.id,
      status: 'PENDING',
    },
    _sum: { amount: true },
  })

  // Recent earnings (last 50)
  const recentEarnings = await prisma.earning.findMany({
    where: { providerProfileId: provider.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      session: {
        select: {
          scheduledDate: true,
          scheduledTime: true,
          request: {
            select: {
              requestServices: {
                include: { serviceCategory: { select: { name: true } } },
                take: 1,
              },
              elderProfile: {
                select: { name: true, city: true },
              },
            },
          },
        },
      },
    },
  })

  const earningsPercent = parseInt(process.env.COMPANION_EARNINGS_PERCENT ?? '80', 10)

  return NextResponse.json({
    thisMonth: thisMonthAgg._sum.amount ?? 0,
    lastMonth: lastMonthAgg._sum.amount ?? 0,
    allTime: allTimeAgg._sum.amount ?? 0,
    earningsPercent,
    sessionsThisMonth: thisMonthAgg._count,
    availableToWithdraw: availableAgg._sum.amount ?? 0,
    pendingRelease: pendingAgg._sum.amount ?? 0,
    recentEarnings,
  })
}
