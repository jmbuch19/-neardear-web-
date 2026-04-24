import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CancelSessionModal from '@/components/CancelSessionModal'
import { calculatePlan } from '@/lib/carePlan'
import NearDearLogo from '@/components/NearDearLogo'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default async function SessionConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const { id } = await params

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      companion: true,
      payment: true,
      request: {
        include: {
          requestServices: { include: { serviceCategory: true } },
        },
      },
    },
  })

  if (!session) redirect('/dashboard')
  if (session.request.userId !== authSession.user.id) redirect('/dashboard')

  const firstService = session.request.requestServices[0]?.serviceCategory
  const serviceCategoryIds = session.request.requestServices.map((rs) => rs.serviceCategoryId)

  // Count prior completed sessions for this service (to know if nudge is relevant)
  const priorSessionCount = firstService
    ? await prisma.session.count({
        where: {
          id: { not: session.id },
          request: {
            userId: authSession.user.id,
            requestServices: { some: { serviceCategoryId: { in: serviceCategoryIds } } },
          },
          status: { in: ['COMPLETED', 'NOTE_SUBMITTED', 'CHECKED_OUT'] },
        },
      })
    : 0

  const companion = session.companion
  const firstName = companion.legalName.split(' ')[0]
  const scheduledDate = session.scheduledDate ? formatDate(session.scheduledDate) : null
  const scheduledTime = session.scheduledTime ?? null

  const trustLabels: Record<string, string> = {
    LEVEL_0: 'New Companion',
    LEVEL_1: 'Field Verified',
    LEVEL_2: 'Home Trusted',
    LEVEL_3: 'Senior Companion',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" aria-label="NearDear home" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <NearDearLogo width={140} variant="compact" />
          </Link>
        </div>

        {/* Confirmation badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#4A8C6F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#4A8C6F' }}>Payment confirmed</span>
        </div>

        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700,
            fontSize: 26,
            color: '#1C2B3A',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          {firstName} will visit{scheduledDate ? ` on ${scheduledDate}` : ''}
        </h1>
        <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 28 }}>
          You will receive a notification the moment {firstName} checks in at your parent&apos;s door.
        </p>

        {/* Companion card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#4A8C6F',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              {getInitials(companion.legalName)}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16, color: '#1C2B3A', margin: 0 }}>{companion.legalName}</p>
              <span
                style={{
                  background: '#1A6B7A',
                  color: '#FFFFFF',
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'inline-block',
                  marginTop: 4,
                }}
              >
                {trustLabels[companion.trustLevel] ?? 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: 24,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              color: '#1A6B7A',
              marginBottom: 16,
            }}
          >
            What happens next
          </p>

          {[
            `${firstName} has been notified`,
            scheduledDate ? `They will arrive on ${scheduledDate}${scheduledTime ? ` at ${scheduledTime}` : ''}` : 'They will arrive at the scheduled time',
            'You will receive a check-in notification',
            `You will receive a visit note after ${firstName} leaves`,
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 12 : 0 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#F0FAF4',
                  border: '1.5px solid #4A8C6F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <span style={{ fontSize: 10, color: '#4A8C6F', fontWeight: 700 }}>{i + 1}</span>
              </div>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Care plan nudge — shown if user has had prior sessions with this service */}
        {priorSessionCount >= 1 && firstService && (() => {
          const exampleCalc = calculatePlan(firstService.suggestedFeeMin, 'TWICE_WEEKLY', 'THREE_MONTHS', 'MONTHLY')
          const planUrl = `/care-plan/new?serviceId=${firstService.id}&companionId=${companion.id}&elderProfileId=`
          const freeVisitsEquiv = Math.round(exampleCalc.totalSavings / firstService.suggestedFeeMin)
          return (
            <div
              style={{
                background: '#FFF7F0',
                borderRadius: 16,
                border: '1.5px solid #E07B2F40',
                padding: 20,
                marginBottom: 20,
              }}
            >
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
                letterSpacing: '0.08em', color: '#E07B2F', marginBottom: 8,
              }}>
                Care plan available
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1C2B3A', marginBottom: 4 }}>
                You&apos;ve visited {priorSessionCount + 1} time{priorSessionCount + 1 !== 1 ? 's' : ''} — lock in a lower rate.
              </p>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 10, lineHeight: 1.5 }}>
                A care plan (twice a week, 3 months) with {firstName} could save you{' '}
                <strong style={{ color: '#4A8C6F' }}>
                  ₹{exampleCalc.totalSavings.toLocaleString('en-IN')}
                </strong>
                {' '}— that&apos;s about{' '}
                <strong style={{ color: '#4A8C6F' }}>{freeVisitsEquiv} free visits</strong>.
              </p>
              {/* Mini price comparison */}
              <div style={{
                background: '#FFFFFF', borderRadius: 10,
                border: '1px solid #E8E0D8', padding: '10px 14px', marginBottom: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>Regular ({exampleCalc.totalSessions} visits)</span>
                  <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'DM Mono, monospace', textDecoration: 'line-through' }}>
                    ₹{exampleCalc.totalRegularPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A' }}>Plan price ({exampleCalc.totalDiscountPercent}% off)</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1C2B3A', fontFamily: 'DM Mono, monospace' }}>
                    ₹{exampleCalc.totalPlanPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <Link
                href={planUrl}
                style={{
                  display: 'inline-block',
                  background: '#E07B2F', color: '#FFFFFF',
                  borderRadius: 10, padding: '10px 20px',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                }}
              >
                Create a care plan →
              </Link>
            </div>
          )
        })()}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 32 }}>
          <Link
            href={`/session/${id}`}
            style={{
              display: 'block',
              background: '#E07B2F',
              color: '#FFFFFF',
              borderRadius: 12,
              padding: '13px 0',
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center' as const,
              textDecoration: 'none',
            }}
          >
            View session details
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: 'block',
              background: '#FFFFFF',
              color: '#1C2B3A',
              borderRadius: 12,
              padding: '13px 0',
              fontWeight: 500,
              fontSize: 15,
              textAlign: 'center' as const,
              textDecoration: 'none',
              border: '1px solid #E8E0D8',
            }}
          >
            Go to dashboard
          </Link>
          {session.status !== 'CANCELLED' && (
            <CancelSessionModal
              sessionId={id}
              scheduledDate={session.scheduledDate.toISOString()}
              scheduledTime={session.scheduledTime}
              amountPaid={session.payment?.amount ?? 0}
              isPaid={session.payment?.status === 'CAPTURED'}
            />
          )}
        </div>

        {/* Cancellation policy */}
        <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.7, textAlign: 'center' as const }}>
          Cancellation policy: 48h+ before session: full refund · Under 24h: 50% refund · Same day: no refund · Companion no-show: full refund
        </p>

      </div>
    </div>
  )
}
