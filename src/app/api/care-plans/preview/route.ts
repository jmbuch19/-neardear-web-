import { NextRequest, NextResponse } from 'next/server'
import { calculatePlan } from '@/lib/carePlan'
import { PlanFrequency, PlanDuration, PlanBilling } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const feeParam = searchParams.get('fee')
  const frequency = searchParams.get('frequency')
  const duration = searchParams.get('duration')
  const billing = searchParams.get('billing')

  if (!feeParam || !frequency || !duration || !billing) {
    return NextResponse.json(
      { error: 'Missing required query params: fee, frequency, duration, billing' },
      { status: 400 }
    )
  }

  const fee = Number(feeParam)
  if (!Number.isFinite(fee) || fee <= 0) {
    return NextResponse.json({ error: 'fee must be a positive number' }, { status: 400 })
  }

  if (!Object.values(PlanFrequency).includes(frequency as PlanFrequency)) {
    return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
  }
  if (!Object.values(PlanDuration).includes(duration as PlanDuration)) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }
  if (!Object.values(PlanBilling).includes(billing as PlanBilling)) {
    return NextResponse.json({ error: 'Invalid billing' }, { status: 400 })
  }

  const result = calculatePlan(fee, frequency, duration, billing)
  return NextResponse.json(result)
}
