/**
 * GET /api/user/export
 * Returns a JSON data export of everything NearDear holds for the user.
 * Streams as an attachment (browser downloads it).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authSession = await auth()
  if (!authSession?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = authSession.user.id

  const [user, elderProfiles, sessions, payments, notifications, carePlans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, phone: true, email: true, city: true, state: true,
        role: true, createdAt: true, lastLoginAt: true,
        consentTerms: true, consentData: true, consentAt: true, preferredLanguage: true,
      },
    }),
    prisma.elderProfile.findMany({
      where: { familyUserId: userId },
      select: {
        id: true, name: true, city: true, ageRange: true, primaryLanguage: true,
        healthNotes: true, mobilityNotes: true, emergencyName: true,
        createdAt: true, isActive: true,
      },
    }),
    prisma.session.findMany({
      where: { request: { userId } },
      select: {
        id: true, scheduledDate: true, scheduledTime: true, serviceCity: true,
        status: true, checkedInAt: true, checkedOutAt: true, completedAt: true,
        sessionNote: { select: { whatDoneToday: true, personWellbeing: true, familyObservation: true, hasConcern: true, submittedAt: true } },
        feedback: { select: { overallScore: true, arrivedOnTime: true, wouldRequestAgain: true, hasConcern: true, concernText: true, submittedAt: true } },
        companion: { select: { legalName: true } },
        request: { select: { requestServices: { include: { serviceCategory: { select: { name: true } } } } } },
      },
      orderBy: { scheduledDate: 'desc' },
    }),
    prisma.payment.findMany({
      where: { userId },
      select: {
        id: true, amount: true, status: true, currency: true,
        razorpayPaymentId: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.findMany({
      where: { userId },
      select: { id: true, title: true, body: true, channel: true, status: true, createdAt: true, readAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.carePlan.findMany({
      where: { userId },
      select: {
        id: true, status: true, frequency: true, duration: true, billing: true,
        totalSessions: true, sessionsCompleted: true, planPricePerVisit: true,
        totalSavings: true, startDate: true, endDate: true, createdAt: true,
        providerProfile: { select: { legalName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    platform: 'NearDear.in',
    notice: 'This export contains all personal data NearDear holds for this account. Session notes and payment records may be retained longer as required by law.',
    account: user,
    elderProfiles,
    sessions: sessions.map((s) => ({
      ...s,
      companionName: s.companion.legalName,
      services: s.request.requestServices.map((rs) => rs.serviceCategory.name),
    })),
    payments,
    notifications,
    carePlans: carePlans.map((p) => ({
      ...p,
      companionName: p.providerProfile.legalName,
    })),
  }

  const filename = `neardear-data-export-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
