/**
 * POST /api/user/deletion
 * Request account deletion or sub-actions (NOTIFICATION_CLEAR, ELDER_DELETE, DATA_EXPORT).
 *
 * Tier 1 — ACCOUNT_DELETE:
 *   Immediate: marks account SUSPENDED + sets deletionRequestedAt.
 *   Schedules anonymisation 30 days later via DataDeletionRequest.
 *
 * Tier 2 — NOTIFICATION_CLEAR: deletes all notifications immediately.
 *
 * GET /api/user/deletion
 *   Returns deletion requests for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RequestType = 'ACCOUNT_DELETE' | 'NOTIFICATION_CLEAR' | 'DATA_EXPORT'

export async function POST(req: NextRequest) {
  const authSession = await auth()
  if (!authSession?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = authSession.user.id

  const body = await req.json() as { requestType: RequestType; reason?: string }
  const { requestType, reason } = body

  const valid: RequestType[] = ['ACCOUNT_DELETE', 'NOTIFICATION_CLEAR', 'DATA_EXPORT']
  if (!valid.includes(requestType)) {
    return NextResponse.json({ error: 'Invalid requestType' }, { status: 400 })
  }

  if (requestType === 'NOTIFICATION_CLEAR') {
    await prisma.notification.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true, message: 'Notification history cleared' })
  }

  if (requestType === 'DATA_EXPORT') {
    // Create a pending export request — fulfilled by cron / manual admin action
    await prisma.dataDeletionRequest.create({
      data: {
        userId,
        requestType: 'DATA_EXPORT',
        status: 'PENDING',
        notes: 'User requested data export',
      },
    })
    return NextResponse.json({ success: true, message: 'Data export request submitted. You will be notified when ready.' })
  }

  // ACCOUNT_DELETE — Tier 1 immediate + schedule Tier 2 in 30 days
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check no active sessions (SCHEDULED / CHECKED_IN)
  const activeSessions = await prisma.session.count({
    where: {
      request: { userId },
      status: { in: ['SCHEDULED', 'CHECKED_IN'] },
    },
  })
  if (activeSessions > 0) {
    return NextResponse.json({
      error: 'You have active sessions. Please wait for them to complete before deleting your account.',
      code: 'ACTIVE_SESSIONS',
    }, { status: 409 })
  }

  // Check active care plans
  const activePlans = await prisma.carePlan.count({ where: { userId, status: 'ACTIVE' } })
  if (activePlans > 0) {
    return NextResponse.json({
      error: 'You have active care plans. Please pause or complete them before deleting your account.',
      code: 'ACTIVE_PLANS',
    }, { status: 409 })
  }

  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + 30)

  await prisma.$transaction([
    // Tier 1: Soft delete immediately
    prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'SUSPENDED',
        deletionRequestedAt: new Date(),
        deletionReason: reason ?? null,
      },
    }),
    // Schedule Tier 2: anonymisation in 30 days
    prisma.dataDeletionRequest.create({
      data: {
        userId,
        requestType: 'ACCOUNT_DELETE',
        status: 'PENDING',
        scheduledFor,
        notes: reason ?? null,
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    message: 'Account deletion initiated. Your personal data will be anonymised within 30 days.',
    scheduledFor,
  })
}

export async function GET() {
  const authSession = await auth()
  if (!authSession?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const requests = await prisma.dataDeletionRequest.findMany({
    where: { userId: authSession.user.id },
    orderBy: { requestedAt: 'desc' },
  })
  return NextResponse.json({ requests })
}
