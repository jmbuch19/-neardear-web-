import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const sosRequest = await prisma.sosRequest.findUnique({ where: { id } })
  if (!sosRequest) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Two valid auth paths:
  //  1. Authenticated user who owns the SOS (or an admin)
  //  2. Anonymous SOS: ?token= query param that matches the stored pollToken

  const session = await auth()

  if (session?.user?.id) {
    // Authenticated path — enforce ownership
    if (sosRequest.userId && sosRequest.userId !== session.user.id) {
      const actor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      if (actor?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    // Authenticated user with no userId on the SOS: allow (e.g. admin browsing)
  } else {
    // Unauthenticated path — require a valid pollToken
    const providedToken = req.nextUrl.searchParams.get('token')
    if (
      !providedToken ||
      !sosRequest.pollToken ||
      !crypto.timingSafeEqual(
        Buffer.from(providedToken),
        Buffer.from(sosRequest.pollToken),
      )
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let companionName: string | undefined

  if (sosRequest.status === 'COMPANION_FOUND' && sosRequest.assignedCompanionId) {
    const companion = await prisma.providerProfile.findUnique({
      where: { id: sosRequest.assignedCompanionId },
      select: { legalName: true },
    })
    companionName = companion?.legalName ?? undefined
  }

  return NextResponse.json({
    status: sosRequest.status,
    area: sosRequest.area,
    companionName,
    updatedAt: sosRequest.updatedAt,
  })
}
