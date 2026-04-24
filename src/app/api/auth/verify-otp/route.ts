import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rawPhone = (body as Record<string, unknown>).phone
  const otp = (body as Record<string, unknown>).otp

  if (typeof rawPhone !== 'string' || typeof otp !== 'string') {
    return NextResponse.json(
      { error: 'Phone and OTP are required' },
      { status: 400 }
    )
  }

  // Strip +91 prefix if present
  const phone = rawPhone.replace(/^\+91/, '').replace(/\s/g, '')

  // Find the most recent active (non-expired, non-used) OTP for this phone.
  // We look up by phone first (not token) so we can check the DB-backed
  // attempt counter before revealing whether the token matched.
  const activeToken = await prisma.otpToken.findFirst({
    where: { phone, expiresAt: { gt: new Date() }, usedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!activeToken) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP' },
      { status: 401 }
    )
  }

  // Durable throttle: max 5 failed attempts per OTP token (persists across cold starts)
  if (activeToken.failedAttempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Please request a new OTP.' },
      { status: 429 }
    )
  }

  // Verify token value
  if (activeToken.token !== otp) {
    await prisma.otpToken.update({
      where: { id: activeToken.id },
      data: { failedAttempts: { increment: 1 } },
    })
    return NextResponse.json(
      { error: 'Invalid or expired OTP' },
      { status: 401 }
    )
  }

  // Mark token as used
  await prisma.otpToken.update({
    where: { id: activeToken.id },
    data: { usedAt: new Date() },
  })

  // Find or create user and update lastLoginAt
  const user = await prisma.user.upsert({
    where: { phone },
    update: { lastLoginAt: new Date() },
    create: {
      phone,
      name: phone,
      city: 'Unknown',
      role: 'RECEIVER',
      accountStatus: 'ACTIVE',
      preferredLanguage: 'EN',
    },
  })

  return NextResponse.json({
    success: true,
    userId: user.id,
    role: user.role,
  })
}
