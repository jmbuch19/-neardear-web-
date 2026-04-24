import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendSosReceivedSms } from '@/lib/sms'

const schema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  area: z.string().min(1, 'Area is required'),
  description: z.string().min(1, 'Description is required').max(500),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { phone, area, description } = parsed.data

  // Optional: link to logged-in user
  const session = await auth()
  const userId = session?.user?.id ?? null

  // For anonymous SOS (no authenticated user), generate a one-time poll token
  // so only the creator can check status without guessing IDs.
  const pollToken = userId ? null : crypto.randomBytes(32).toString('hex')

  // Create the SosRequest
  const sosRequest = await prisma.sosRequest.create({
    data: {
      phone,
      area,
      description,
      city: 'Ahmedabad',
      status: 'SEARCHING',
      userId,
      pollToken,
    },
  })

  // SMS confirmation to requester — fire-and-forget
  sendSosReceivedSms(phone, area).catch(console.error)

  // Find available companions in Ahmedabad
  const companions = await prisma.providerProfile.findMany({
    where: {
      city: 'Ahmedabad',
      accountStatus: 'ACTIVE',
      availableNow: true,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { reliabilityScore: 'desc' },
    take: 5,
  })

  if (companions.length > 0) {
    // Notify companions
    await prisma.notification.createMany({
      data: companions.map((c) => ({
        userId: c.userId,
        channel: 'IN_APP' as const,
        title: 'SOS — Someone needs help now',
        body: `${area}: ${description.slice(0, 120)}`,
        data: { sosRequestId: sosRequest.id, phone },
      })),
    })

    // Update SosRequest — companions notified
    await prisma.sosRequest.update({
      where: { id: sosRequest.id },
      data: {
        companionNotifiedAt: new Date(),
        status: 'SEARCHING',
      },
    })
  } else {
    // No companions available — alert admin
    // Find an admin user to send the notification to
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    await prisma.sosRequest.update({
      where: { id: sosRequest.id },
      data: {
        status: 'ADMIN_ALERTED',
        adminAlertedAt: new Date(),
      },
    })

    if (adminUser) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          channel: 'IN_APP',
          title: '🚨 SOS — No companions available',
          body: `Phone: ${phone} | Area: ${area} | ${description.slice(0, 120)}`,
          data: { sosRequestId: sosRequest.id },
        },
      })
    }
  }

  return NextResponse.json({
    sosId: sosRequest.id,
    // pollToken is only present for anonymous SOS — clients must persist it
    // to call /api/sos/[id]/status for status polling.
    ...(pollToken ? { pollToken } : {}),
  })
}
