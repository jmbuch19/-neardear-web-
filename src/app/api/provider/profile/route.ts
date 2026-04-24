import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      bankAccount: true,
      interviewRecord: { select: { id: true, conductedAt: true } },
      orientationRecord: { select: { id: true, completedAt: true } },
      references: { select: { id: true, callStatus: true } },
      trustLevelHistory: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  return NextResponse.json(provider)
}

const ALLOWED_PATCH_FIELDS = new Set([
  'availableDays',
  'availableSlots',
  'serviceAreas',
  'serviceRadiusKm',
  'availableNow',
  'weeklyHours',
  'noticePeriod',
  'preferredLanguage',
])

export async function PATCH(req: NextRequest) {
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

  const body = await req.json() as Record<string, unknown>

  // Only allow whitelisted fields
  const update: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_PATCH_FIELDS.has(key)) {
      update[key] = value
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // If toggling availableNow, update timestamp
  if ('availableNow' in update) {
    update.availableNowSince = update.availableNow ? new Date() : null
  }

  const updated = await prisma.providerProfile.update({
    where: { id: provider.id },
    data: update,
  })

  return NextResponse.json(updated)
}
