import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CarePlanActions from '@/components/CarePlanActions'
import CarePlanSessionList from '@/components/CarePlanSessionList'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Scheduled', color: '#1A6B7A', bg: '#E0F2F7' },
  COMPLETED: { label: 'Completed', color: '#4A8C6F', bg: '#F0FAF4' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
  NO_SHOW: { label: 'No show', color: '#E85D4A', bg: '#FEF2F2' },
}

export default async function CarePlanDetailPage({ params, searchParams }: PageProps) {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const { id } = await params
  const { payment } = await searchParams

  const plan = await prisma.carePlan.findUnique({
    where: { id },
    include: {
      planSessions: { orderBy: { scheduledDate: 'asc' } },
      planPayments: { orderBy: { cycleNumber: 'asc' } },
      providerProfile: { select: { legalName: true, selfieUrl: true, trustLevel: true } },
    },
  })

  if (!plan) redirect('/dashboard')
  if (plan.userId !== authSession.user.id) redirect('/dashboard')

  // Fetch service category name separately (no direct relation on CarePlan)
  const serviceCategory = await prisma.serviceCategory.findUnique({
    where: { id: plan.serviceCategoryId },
    select: { name: true },
  })
  const serviceName = serviceCategory?.name ?? 'Care Service'

  const companion = plan.providerProfile
  const firstName = companion.legalName.split(' ')[0]

  const trustLabels: Record<string, string> = {
    LEVEL_0: 'New Companion',
    LEVEL_1: 'Field Verified',
    LEVEL_2: 'Home Trusted',
    LEVEL_3: 'Senior Companion',
  }

  const upcomingSessionsList = plan.planSessions.filter((s) => s.status === 'SCHEDULED')
  const nextSession = upcomingSessionsList[0] ?? null
  const upcomingSessions = upcomingSessionsList.slice(0, 4)

  const totalSavingsSoFar = plan.sessionsCompleted * (plan.regularPricePerVisit - plan.planPricePerVisit)
  const totalSavings = plan.totalSavings

  const progressPct = plan.totalSessions > 0
    ? Math.round((plan.sessionsCompleted / plan.totalSessions) * 100)
    : 0

  // totalDiscountPercent = discountPercent + upfrontExtraDiscount
  const totalDiscountPercent = plan.discountPercent + plan.upfrontExtraDiscount

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Active Care Plan', color: '#4A8C6F', bg: '#F0FAF4' },
    PAUSED: { label: 'Paused', color: '#E07B2F', bg: '#FFF7F0' },
    CANCELLED: { label: 'Cancelled', color: '#E85D4A', bg: '#FEF2F2' },
    COMPLETED: { label: 'Completed', color: '#1A6B7A', bg: '#E0F2F7' },
    DRAFT: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
    EXPIRED: { label: 'Expired', color: '#6B7280', bg: '#F3F4F6' },
  }

  const planStatusConfig = statusConfig[plan.status] ?? statusConfig['ACTIVE']

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Payment success banner */}
        {payment === 'success' && (
          <div style={{
            background: '#F0FAF4', borderRadius: 12, border: '1px solid #4A8C6F33',
            padding: '14px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: '#4A8C6F',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#4A8C6F', margin: 0 }}>
              Payment confirmed! Your care plan is now active.
            </p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              background: planStatusConfig.bg, color: planStatusConfig.color,
              borderRadius: 9999, padding: '4px 12px',
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {plan.status === 'ACTIVE' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {planStatusConfig.label}
            </div>
          </div>

          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 26, color: '#1C2B3A',
            marginBottom: 4, lineHeight: 1.3,
          }}>
            {serviceName}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15, margin: 0 }}>
            with {companion.legalName}
          </p>
        </div>

        {/* Companion card */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8',
          padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: '#4A8C6F',
              color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 17, flexShrink: 0,
            }}>
              {companion.legalName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16, color: '#1C2B3A', margin: 0 }}>
                {companion.legalName}
              </p>
              <span style={{
                background: '#1A6B7A', color: '#FFFFFF',
                borderRadius: 9999, padding: '2px 8px',
                fontSize: 11, fontWeight: 600, display: 'inline-block', marginTop: 4,
              }}>
                {trustLabels[companion.trustLevel] ?? 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8',
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1C2B3A' }}>Progress</span>
            <span style={{ fontSize: 14, color: '#6B7280', fontFamily: 'DM Mono, monospace' }}>
              {plan.sessionsCompleted} / {plan.totalSessions} visits
            </span>
          </div>
          <div style={{
            height: 8, background: '#F3F4F6', borderRadius: 9999, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: '#4A8C6F', borderRadius: 9999,
              width: `${progressPct}%`, transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, marginBottom: 0 }}>
            {plan.sessionsRemaining} visits remaining
          </p>
        </div>

        {/* Next visit */}
        {nextSession && (
          <div style={{
            background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #E07B2F40',
            padding: 20, marginBottom: 20,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
              letterSpacing: '0.08em', color: '#E07B2F', marginBottom: 8,
            }}>
              Next visit
            </p>
            <p style={{ fontWeight: 600, fontSize: 16, color: '#1C2B3A', margin: 0 }}>
              {formatFullDate(nextSession.scheduledDate)}
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
              {firstName} · {nextSession.scheduledTime}
            </p>
          </div>
        )}

        {/* Savings tracker */}
        <div style={{
          background: '#F0FAF4', borderRadius: 16, border: '1px solid #4A8C6F33',
          padding: 20, marginBottom: 20,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
            letterSpacing: '0.08em', color: '#4A8C6F', marginBottom: 12,
          }}>
            Savings tracker
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginBottom: 2 }}>Saved so far</p>
              <p style={{
                fontSize: 20, fontWeight: 700, color: '#4A8C6F',
                fontFamily: 'DM Mono, monospace', margin: 0,
              }}>
                ₹{totalSavingsSoFar.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginBottom: 2 }}>Total plan savings</p>
              <p style={{
                fontSize: 20, fontWeight: 700, color: '#4A8C6F',
                fontFamily: 'DM Mono, monospace', margin: 0,
              }}>
                ₹{totalSavings.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming visits table */}
        {upcomingSessions.length > 0 && (
          <div style={{
            background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8',
            padding: 20, marginBottom: 20,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
              letterSpacing: '0.08em', color: '#1A6B7A', marginBottom: 16,
            }}>
              Upcoming visits
            </p>
            {upcomingSessions.map((s, i) => {
              const conf = STATUS_LABEL[s.status] ?? STATUS_LABEL['SCHEDULED']
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: i < upcomingSessions.length - 1 ? 12 : 0,
                    marginBottom: i < upcomingSessions.length - 1 ? 12 : 0,
                    borderBottom: i < upcomingSessions.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#1C2B3A', margin: 0 }}>
                      {formatDate(s.scheduledDate)}
                    </p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>
                      {s.scheduledTime}
                    </p>
                  </div>
                  <span style={{
                    background: conf.bg, color: conf.color,
                    borderRadius: 9999, padding: '3px 10px',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {conf.label}
                  </span>
                </div>
              )
            })}

            {/* Client component for "view all" toggle */}
            <CarePlanSessionList
              sessions={plan.planSessions
                .filter((s) => s.status === 'SCHEDULED')
                .slice(4)
                .map((s) => ({
                  id: s.id,
                  scheduledDate: s.scheduledDate.toISOString(),
                  scheduledTime: s.scheduledTime,
                  status: s.status,
                }))}
              totalRemaining={plan.sessionsRemaining}
            />
          </div>
        )}

        {/* Billing section */}
        {plan.billing === 'MONTHLY' && plan.nextBillingDate && (
          <div style={{
            background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8',
            padding: 20, marginBottom: 20,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
              letterSpacing: '0.08em', color: '#1A6B7A', marginBottom: 12,
            }}>
              Billing
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>Monthly amount</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1C2B3A', fontFamily: 'DM Mono, monospace' }}>
                ₹{(plan.monthlyAmount ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>Next billing date</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1C2B3A' }}>
                {formatFullDate(plan.nextBillingDate)}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {plan.status === 'ACTIVE' && (
          <CarePlanActions planId={plan.id} />
        )}

        {/* Plan details footer */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E8E0D8' }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.7, textAlign: 'center' as const }}>
            Plan started {plan.startDate ? formatFullDate(plan.startDate) : ''}
            {plan.endDate && ` · Ends ${formatFullDate(plan.endDate)}`}
            {' · '}{totalDiscountPercent}% discount applied
          </p>
        </div>

      </div>
    </div>
  )
}
