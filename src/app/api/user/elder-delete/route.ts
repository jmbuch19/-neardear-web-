/**
 * POST /api/user/elder-delete
 * Soft-delete an elder profile.
 * Sessions/notes are kept — names anonymised on profile.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authSession = await auth()
  if (!authSession?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = authSession.user.id

  const { elderProfileId } = await req.json() as { elderProfileId: string }
  if (!elderProfileId) return NextResponse.json({ error: 'elderProfileId required' }, { status: 400 })

  const elder = await prisma.elderProfile.findUnique({
    where: { id: elderProfileId },
    select: { id: true, familyUserId: true },
  })
  if (!elder || elder.familyUserId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Soft-delete: anonymise personal details, mark inactive
  await prisma.elderProfile.update({
    where: { id: elderProfileId },
    data: {
      name: `Elder ${elderProfileId.slice(-6).toUpperCase()}`,
      phone: null,
      healthNotes: null,
      mobilityNotes: null,
      emergencyContact: 'REDACTED',
      emergencyName: 'REDACTED',
      isActive: false,
      deletedAt: new Date(),
    },
  })

  // Log the deletion request
  await prisma.dataDeletionRequest.create({
    data: {
      userId,
      requestType: 'ELDER_DELETE',
      status: 'COMPLETED',
      processedAt: new Date(),
      notes: elderProfileId,
    },
  })

  return NextResponse.json({ success: true })
}
