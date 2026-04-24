import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authSession = await auth()
  if (!authSession?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = authSession.user.id

  const [user, elderProfiles, sessionCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, phone: true, email: true,
        city: true, role: true, createdAt: true,
      },
    }),
    prisma.elderProfile.findMany({
      where: { familyUserId: userId },
      select: { id: true, name: true, city: true, isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.session.count({ where: { request: { userId } } }),
  ])

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...user, elderProfiles, sessionCount })
}
