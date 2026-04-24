import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const filter = searchParams.get('filter') ?? 'ALL'

  // Build a keyword filter from the notification title/body based on type buckets
  const keywordMap: Record<string, string[]> = {
    REQUESTS:  ['request', 'booking', 'match', 'session', 'scheduled'],
    EARNINGS:  ['earning', 'payment', 'paid', 'withdraw', 'bonus', 'released'],
    ACCOUNT:   ['account', 'profile', 'verification', 'level', 'trust'],
    WARNINGS:  ['warning', 'concern', 'flag', 'alert', 'suspend'],
  }

  const keywordFilter = filter !== 'ALL' && keywordMap[filter]
    ? {
        OR: keywordMap[filter].map((kw) => ({
          OR: [
            { title: { contains: kw, mode: 'insensitive' as const } },
            { body:  { contains: kw, mode: 'insensitive' as const } },
          ],
        })),
      }
    : {}

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...keywordFilter,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        ...keywordFilter,
      },
    }),
  ])

  return NextResponse.json({
    notifications,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { ids?: string[] }
  const ids = body.ids ?? []

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session.user.id, // safety: can only mark own notifications
    },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
