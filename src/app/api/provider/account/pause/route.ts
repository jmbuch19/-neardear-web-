import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
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

  if (provider.accountStatus === 'PAUSED') {
    return NextResponse.json({ error: 'Account is already paused' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.providerProfile.update({
      where: { id: provider.id },
      data: { accountStatus: 'PAUSED', availableNow: false },
    }),
    prisma.providerStatusChange.create({
      data: {
        providerProfileId: provider.id,
        fromStatus: provider.accountStatus,
        toStatus: 'PAUSED',
        initiatedBy: session.user.id,
        reason: 'Self-paused by companion',
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
