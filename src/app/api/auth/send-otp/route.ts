import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  if (typeof rawPhone !== 'string') {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }

  // Strip +91 prefix if present
  const phone = rawPhone.replace(/^\+91/, '').replace(/\s/g, '')

  // Validate: must be exactly 10 digits
  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json(
      { error: 'Phone number must be 10 digits' },
      { status: 400 }
    )
  }

  // Rate limit: max 3 OTPs per phone per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await prisma.otpToken.count({
    where: {
      phone,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (recentCount >= 3) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please try again later.' },
      { status: 429 }
    )
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Find or create user (userId is required on OtpToken)
  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: {
      phone,
      name: phone,
      city: 'Unknown',
      role: 'RECEIVER',
      accountStatus: 'ACTIVE',
      preferredLanguage: 'EN',
    },
  })

  // Create OTP token
  await prisma.otpToken.create({
    data: {
      userId: user.id,
      token: otp,
      phone,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // Send OTP via MSG91 dedicated OTP API.
  // If either the API key or the template ID is missing, fall back to logging
  // the OTP so the team can still sign in while DLT approval is pending.
  if (!process.env.MSG91_API_KEY || !process.env.MSG91_OTP_TEMPLATE_ID) {
    console.log(`[SMS MOCK OTP] Phone: ${phone} OTP: ${otp}`)
  } else {
    try {
      const otpResponse = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          authkey: process.env.MSG91_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_OTP_TEMPLATE_ID,
          mobile: `91${phone}`,
          otp,
        }),
      })
      const result = await otpResponse.json() as { type?: string; message?: string }
      if (result.type !== 'success') {
        console.error('[OTP SEND FAILED]', result)
      }
    } catch (err) {
      console.error('[OTP SEND ERROR]', err)
      // Non-fatal — OTP is stored in DB; user can still verify if they have the code
    }
  }

  return NextResponse.json({ success: true, message: 'OTP sent' })
}
