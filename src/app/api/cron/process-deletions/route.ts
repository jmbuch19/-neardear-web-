import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cron: runs daily at 02:00 AM via Netlify
 * Finds DataDeletionRequests where scheduledFor <= now AND status = PENDING,
 * then anonymises the relevant user/elder data and marks them COMPLETED.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const now = new Date()

  const due = await prisma.dataDeletionRequest.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
  })

  if (due.length === 0) {
    return NextResponse.json({ processed: 0, message: 'Nothing due' })
  }

  let processed = 0
  const errors: string[] = []

  for (const req of due) {
    try {
      // Mark as PROCESSING to prevent double-runs if cron overlaps
      await prisma.dataDeletionRequest.update({
        where: { id: req.id },
        data: { status: 'PROCESSING' },
      })

      if (req.requestType === 'ACCOUNT_DELETE') {
        await anonymiseUser(req.userId)
      } else if (req.requestType === 'ELDER_DELETE') {
        // notes field stores the elderProfileId for ELDER_DELETE requests
        if (req.notes) {
          await anonymiseElder(req.notes)
        }
      } else if (req.requestType === 'NOTIFICATION_CLEAR') {
        await prisma.notification.deleteMany({ where: { userId: req.userId } })
      }
      // DATA_EXPORT is fulfilled instantly at request time — nothing to do here

      await prisma.dataDeletionRequest.update({
        where: { id: req.id },
        data: { status: 'COMPLETED', processedAt: now },
      })

      processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${req.id}: ${msg}`)
      // Reset to PENDING so it retries next run
      await prisma.dataDeletionRequest.update({
        where: { id: req.id },
        data: { status: 'PENDING' },
      }).catch(() => null)
    }
  }

  return NextResponse.json({
    processed,
    errors: errors.length > 0 ? errors : undefined,
    total: due.length,
  })
}

async function anonymiseUser(userId: string) {
  const anon = `deleted_${userId.slice(-8)}`

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Deleted User',
        phone: anon,
        email: null,
        accountStatus: 'SUSPENDED',
        deletedAt: new Date(),
        anonymisedAt: new Date(),
        consentTerms: false,
        consentData: false,
        consentNotif: false,
        consentAbuse: false,
        preferredLanguage: 'EN',
        city: 'Unknown',
        state: null,
      },
    }),
    // Also mark provider profile anonymised if present
    prisma.providerProfile.updateMany({
      where: { userId },
      data: {
        deletedAt: new Date(),
        anonymisedAt: new Date(),
        selfieUrl: null,
        addressLine1: null,
        addressLine2: null,
        pincode: null,
        addressProofUrl: null,
        aadhaarLast4: null,
        panNumber: null,
        pccUrl: null,
        whyThisWork: null,
      },
    }),
    // Hard-delete OTP tokens
    prisma.otpToken.deleteMany({ where: { userId } }),
  ])
}

async function anonymiseElder(elderProfileId: string) {
  await prisma.elderProfile.update({
    where: { id: elderProfileId },
    data: {
      name: 'Deleted Elder',
      phone: null,
      healthNotes: null,
      mobilityNotes: null,
      emergencyContact: 'REDACTED',
      emergencyName: 'REDACTED',
      deletedAt: new Date(),
      isActive: false,
    },
  })
}
